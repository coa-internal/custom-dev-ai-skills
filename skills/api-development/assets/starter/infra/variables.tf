variable "project_name" {
  description = "Short kebab-case project name. Also used in the state key terraform/<project_name>/<environment>/."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]+(-[a-z0-9]+)*$", var.project_name))
    error_message = "project_name must be kebab-case (lowercase letters, digits, single hyphens)."
  }
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

variable "lambda_runtime" {
  description = "Lambda Node.js runtime. Use the newest LTS Lambda supports: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html"
  type        = string
  default     = "nodejs26.x"
}

variable "lambda_architecture" {
  description = "Lambda CPU architecture. arm64 is cheaper; the Web Adapter layer must match."
  type        = string
  default     = "arm64"
  validation {
    condition     = contains(["arm64", "x86_64"], var.lambda_architecture)
    error_message = "lambda_architecture must be arm64 or x86_64."
  }
}

variable "lambda_web_adapter_layer_version" {
  description = "AWS Lambda Web Adapter layer version. Check https://github.com/awslabs/aws-lambda-web-adapter for the current one."
  type        = number
  default     = 30
}

variable "lambda_package_path" {
  description = "Path to the zip built by `npm run package`, relative to this directory."
  type        = string
  default     = "../lambda.zip"
}

variable "lambda_memory_mb" {
  description = "Lambda memory in MB (also scales CPU)."
  type        = number
  default     = 512
}

variable "lambda_timeout_seconds" {
  description = "Lambda timeout. API Gateway HTTP APIs stop waiting after 30 seconds."
  type        = number
  default     = 29
}

variable "log_level" {
  description = "Application log level (pino): fatal, error, warn, info, debug, trace."
  type        = string
  default     = "info"
}

variable "log_retention_days" {
  description = "CloudWatch log retention. Check City records-retention requirements for your data."
  type        = number
  default     = 90
}

variable "throttling_rate_limit" {
  description = "Steady-state requests per second for the whole stage, shared by ALL callers."
  type        = number
  default     = 50
}

variable "throttling_burst_limit" {
  description = "Maximum burst of requests for the whole stage, shared by ALL callers."
  type        = number
  default     = 100
}

variable "cors_allow_origins" {
  description = "Browser origins allowed to call the API. Empty disables CORS. Never use [\"*\"] for IAM-protected APIs."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Extra tags for all resources."
  type        = map(string)
  default     = {}
}
