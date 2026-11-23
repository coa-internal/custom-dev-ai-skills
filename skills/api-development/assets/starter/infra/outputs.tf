output "api_endpoint" {
  description = "Base URL of the API."
  value       = module.api.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN, for IAM policies that grant execute-api:Invoke."
  value       = module.api.api_execution_arn
}

output "invoke_policy_arn" {
  description = "IAM policy granting invoke on the whole API. Attach to caller roles."
  value       = aws_iam_policy.invoke.arn
}

output "lambda_function_name" {
  description = "Lambda function name (for logs and alarms)."
  value       = module.lambda.lambda_function_name
}
