#!/bin/bash
source config.sh
aws lambda invoke-async --function-name $LAMBDA_CONTENTFUL_SYNC_NAME --region $AWS_REGION --invoke-args ./config.json --debug
