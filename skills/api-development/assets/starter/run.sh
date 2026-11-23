#!/bin/sh
# Lambda handler script. The AWS Lambda Web Adapter layer (AWS_LAMBDA_EXEC_WRAPPER=/opt/bootstrap)
# runs this, waits for the server's readiness check, then forwards API Gateway requests to it.
exec node dist/server.js
