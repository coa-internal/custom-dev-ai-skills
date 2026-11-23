# terraform plan -var-file=env/prod.tfvars
project_name = "<PROJECT_NAME>"
environment  = "prod"

log_level          = "info"
log_retention_days = 90

# Shared by ALL callers. For public APIs, ask whether CloudFront + WAF is needed in front.
throttling_rate_limit  = 50
throttling_burst_limit = 100

cors_allow_origins = []
