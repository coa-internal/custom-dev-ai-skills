locals {
  name = "${var.project_name}-${var.environment}"

  # ---------------------------------------------------------------------------------------------
  # Build the API Gateway definition from the vendor-neutral openapi.yaml.
  # For every operation we add:
  #   x-amazon-apigateway-integration  -> proxy to the Lambda function
  #   x-amazon-apigateway-auth         -> AWS_IAM when the operation's effective `security`
  #                                       includes aws_iam, otherwise NONE
  # and remove `security` / `securitySchemes`, which API Gateway doesn't need.
  # ---------------------------------------------------------------------------------------------
  spec          = yamldecode(file("${path.module}/../openapi.yaml"))
  http_methods  = ["get", "put", "post", "delete", "patch", "head", "options"]
  spec_security = try(local.spec.security, [])

  integration = {
    type                 = "aws_proxy"
    httpMethod           = "POST"
    uri                  = module.lambda.lambda_function_arn
    payloadFormatVersion = "2.0"
    connectionType       = "INTERNET"
  }

  gateway_paths = {
    for path, item in local.spec.paths : path => merge(
      { for key, value in item : key => value if !contains(local.http_methods, key) },
      {
        for method, op in item : method => merge(
          { for k, v in op : k => v if k != "security" },
          {
            "x-amazon-apigateway-integration" = local.integration
            "x-amazon-apigateway-auth" = {
              type = anytrue([
                for requirement in try(op.security, local.spec_security) : contains(keys(requirement), "aws_iam")
              ]) ? "AWS_IAM" : "NONE"
            }
          }
        ) if contains(local.http_methods, method)
      }
    )
  }

  gateway_body = jsonencode(merge(
    { for k, v in local.spec : k => v if !contains(["security", "components", "paths"], k) },
    {
      paths      = local.gateway_paths
      components = { for k, v in try(local.spec.components, {}) : k => v if k != "securitySchemes" }
    }
  ))

  web_adapter_layer = format(
    "arn:aws:lambda:%s:753240598075:layer:%s:%d",
    var.aws_region,
    var.lambda_architecture == "arm64" ? "LambdaAdapterLayerArm64" : "LambdaAdapterLayerX86",
    var.lambda_web_adapter_layer_version,
  )
}

# Lambda function running the unchanged Express server through the Lambda Web Adapter.
module "lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.13"

  function_name = local.name
  description   = "${var.project_name} API (${var.environment})"
  handler       = "run.sh"
  runtime       = var.lambda_runtime
  architectures = [var.lambda_architecture]
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  layers        = [local.web_adapter_layer]

  create_package         = false
  local_existing_package = var.lambda_package_path

  environment_variables = {
    AWS_LAMBDA_EXEC_WRAPPER      = "/opt/bootstrap"
    AWS_LWA_PORT                 = "8080"
    AWS_LWA_READINESS_CHECK_PATH = "/v1/health"
    NODE_ENV                     = "production"
    LOG_LEVEL                    = var.log_level
  }

  cloudwatch_logs_retention_in_days = var.log_retention_days
}

# HTTP API whose routes come from openapi.yaml.
module "api" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 6.1"

  name          = local.name
  description   = "${var.project_name} API (${var.environment})"
  protocol_type = "HTTP"
  body          = local.gateway_body

  create_domain_name = false

  cors_configuration = length(var.cors_allow_origins) == 0 ? null : {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["authorization", "content-type", "x-amz-date", "x-amz-security-token", "x-request-id"]
    max_age       = 3600
  }

  stage_name = "$default"
  stage_default_route_settings = {
    throttling_rate_limit  = var.throttling_rate_limit
    throttling_burst_limit = var.throttling_burst_limit
  }
}

# Allow API Gateway (this API only) to invoke the function.
resource "aws_lambda_permission" "api" {
  statement_id  = "AllowInvokeFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api.api_execution_arn}/*/*"
}

# Policy that callers' IAM roles can attach to invoke this API. Narrow the resource to specific
# routes (e.g. ".../*/GET/v1/service-requests") when callers need less than full access.
data "aws_iam_policy_document" "invoke" {
  statement {
    sid       = "InvokeApi"
    actions   = ["execute-api:Invoke"]
    resources = ["${module.api.api_execution_arn}/*/*/*"]
  }
}

resource "aws_iam_policy" "invoke" {
  name        = "${local.name}-invoke"
  description = "Allows calling the ${local.name} API with SigV4."
  policy      = data.aws_iam_policy_document.invoke.json
}
