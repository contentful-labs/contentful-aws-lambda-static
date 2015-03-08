#!/bin/bash
source config.sh
aws lambda add-event-source --region $AWS_REGION --function-name $LAMBDA_KINESIS_RENDERING_NAME --role arn:aws:iam::$AWS_ACCOUNT_NUMBER:role/lambda-executor --event-source arn:aws:kinesis:$AWS_REGION:$AWS_ACCOUNT_NUMBER:stream/lambda-test-kinesis-stream --batch-size 100
