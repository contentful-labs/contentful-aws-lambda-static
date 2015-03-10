# Contentful AWS S3 and lambda static website generator

Library to generate static websites hosted on [Amazon S3](http://aws.amazon.com/s3/)
using the [Contentful](https://www.contentful.com) sync API as source
of the content and [AWS Lambda](http://aws.amazon.com/lambda/) to generate
the static pages.
This library also uses internally [AWS Kinesis](http://aws.amazon.com/kinesis)
to distribute the page rendering workload.

## Synopsis

[Contentful](https://www.contentful.com) is a content management
platform for web applications, mobile apps and connected devices.
It allows you to create, edit & manage content in the cloud and
publish it anywhere via powerful API. Contentful offers tools
for managing editorial teams and enabling cooperation.

[Amazon S3](http://aws.amazon.com/s3) is a object storage accessible
using the HTTP protocol, it's designed for durability of
99.999999999% of objects.

[AWS Lambda](http://aws.amazon.com/lambda) is a compute service that
runs code in response to events managing automatically compute resources
necessary to run the code.

[AWS Kinesis](http://aws.amazon.com/kinesis) is a cloud-based service
for real-time processing of large, distributed data streams.

## Disclaimer

This project is at proof of concept stage and is built on a best
effort kind of approach without any guarantee of correctness,
support or reliability.

## Architecture

This project uses 2 lambda functions connected via an AWS Kinesis
stream in order to render static pages from the entities fetched
from the Contentful Delivery sync API.

The first lambda function manages the communication with the Contentful
sync api, and writes every single entity to the AWS kinesis stream.

The second lambda function reads the entities from the kinesis stream
and per each entity renders a [Dot.js](http://olado.github.io/doT/index.html)
and saves the resulting HTML on Amazon S3.

```
                   +-----------------+
                   |                 |
                   |     lambda      |
                   | contentful sync |
                   |                 |
                   +--------+--------+
                            |
                            |
                            v
                   +--------+--------+
                   |                 |
                   | kinesis stream  |
                   |                 |
                   +-----------------+
                            |
                            |
                            v
                   +-----------------+
                   |     lambda      |
                   |  HTML template  |
                   |    rendering    |
                   +-----------------+
                            |
                            |
                            v
                   +-----------------+
                   |                 |
                   |   S3 storage    |
                   |                 |
                   +-----------------+
```

## Prerequisites

To use this library is necessary to have an Amazon AWS account and
configure the following elements:

1. An S3 bucket that will be used to store the static pages and the
Synchronization status.
2. A Kinesis stream that will be used to distribute the rendering
workload.
3. An IAM role that will be used by the lambda functions. This role
should have the following permissions
  1. getObject, putObject, putObjectACL on the S3 bucket
  2. PutRecords on the kinesis stream
  3. logging permission as described in the [AWS HOWTO](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-kinesis-events-adminuser-create-test-function-create-execution-role.html)
4. A working installation of the [AWS CLI](http://aws.amazon.com/cli/)

## Configuration

Create a JSON configuration file as follows with the data of the
Contentful space that you want to generate static pages for and the
AWS entities details.
Please note that this library assumes that the source space is the
`cfexampleapi` Contentful example space, to work with other spaces is
necessary to adapt the templates in the template directory.

```json
{
  "aws": {
    "region": "us-west-2",
    "s3": {
      "bucket": "lambda-bucket-test"
    },
    "kinesis":{
      "streamName": "lambda-test-kinesis-stream"
    }
  },
  "contentful": {
    "accessToken": "b4c0n73n7fu1",
    "space": "cfexampleapi"
  }
}
```
Save the file with the name `config.json` in the root directory of this
project.

Create another file to configure the shell wrappers filling in the
appropriate AWS details

```sh
# the aws region
AWS_REGION=us-west-2
# the aws account number (used to prefix some AWS ARNs)
AWS_ACCOUNT_NUMBER=111111111111
# the name of the role that the lambda function will adopt
LAMBDA_IAM_ROLE=lambda-executor
# the name of the lambda function controlling the Contentful sync API
LAMBDA_CONTENTFUL_SYNC_NAME=contentful-sync-test
# the name of the lambda static rendering function
LAMBDA_KINESIS_RENDERING_NAME=contentful-consumer-test
```
Save the file with the name `config.sh` in the root directory of this
project.

## Installation

Install the npm dependencies.

```sh
npm install
```

Create the lambda function to handle the Contentful sync API:

```sh
./bin/upload-sync.sh
```

This will create a zip archive of the project, upload it on AWS Lambda
and it will configure the `LAMBDA_CONTENTFUL_SYNC_NAME` function.

Create the lambda function to handle the Kinesis to S3 rendering:

```sh
./bin/upload-consumer.sh
```

This will create a zip archive of the project, upload it on AWS Lambda
and it will configure the `LAMBDA_KINESIS_RENDERING_NAME` function.

Bind the `LAMBDA_KINESIS_RENDERING_NAME` function to the AWS Kinesis
stream:

```sh
./bin/add_source.sh
```

## Usage

Trigger execution of the AWS Lambda Contentful sync function

```sh
./bin/exec.sh
```

This should generate in the configured AWS S3 bucket one HTML file
per each entry or asset in the original Contentful space.
The lambda functions will log in the log section of AWS CloudWatch.

## License

Copyright (c) 2015 Contentful GmbH - Paolo Negri. See LICENSE.txt for further details.
