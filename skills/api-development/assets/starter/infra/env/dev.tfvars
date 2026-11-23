# terraform plan -var-file=env/dev.tfvars
project_name = "<PROJECT_NAME>"
environment  = "dev"

log_level          = "debug"
log_retention_days = 30

throttling_rate_limit  = 10
throttling_burst_limit = 20

cors_allow_origins = []
