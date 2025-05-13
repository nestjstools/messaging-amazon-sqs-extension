<p align="center">
    <image src="nestjstools-logo.png" width="400">
</p>

# @nestjstools/messaging-amazon-sqs -extension

A NestJS library for managing asynchronous and synchronous messages with support for buses, handlers, channels, and consumers. This library simplifies building scalable and decoupled applications by facilitating robust message handling pipelines while ensuring flexibility and reliability.

## Installation

```bash
npm install @nestjstools/messaging @nestjstools/messaging-amazon-sqs-extension 
```

or

```bash
yarn add @nestjstools/messaging @nestjstools/messaging-amazon-sqs-extension
```
## AmazonSQS Integration: Messaging Configuration Example

---

```typescript
import { Module } from '@nestjs/common';
import { MessagingModule } from '@nestjstools/messaging';
import { SendMessageHandler } from './handlers/send-message.handler';
import { MessagerAmazonSQSExtensionModule, AmazonSQSChannelConfig } from "@nestjstools/messager-amazon-sqs-extension";

@Module({
  imports: [
    MessagerAmazonSQSExtensionModule, // Importing the SQS extension module
    MessagingModule.forRoot({
      buses: [
        {
          name: 'sqs-event.bus',
          channels: ['sqs-event'],
        },
      ],
      channels: [
        new AmazonSqsChannelConfig({
          name: 'sqs-event',
          enableConsumer: true, // Enable if you want to consume messages
          region: 'us-east-1',
          queueUrl: 'http://localhost:9324/queue/test_queue', // ElasticMQ for local development
          autoCreate: true, // Auto-create queue if it doesn't exist
          credentials: { // Optional credentials for SQS
            accessKeyId: 'x',
            secretAccessKey: 'x',
          },
          maxNumberOfMessages: 3, // optional
          visibilityTimeout: 10, // optional 
          waitTimeSeconds: 5, // Every 5 seconds consumer will pull 3 messages from queue - optional
        }),
      ],
      debug: true, // Optional: Enable debugging for Messaging operations
    }),
  ],
})
export class AppModule {}
```

## Dispatch messages via bus (example)

```typescript
import { Controller, Get } from '@nestjs/common';
import { CreateUser } from './application/command/create-user';
import { IMessageBus, MessageBus, RoutingMessage } from '@nestjstools/messaging';

@Controller()
export class AppController {
  constructor(
    @MessageBus('sqs-event.bus') private sqsMessageBus: IMessageBus,
  ) {}

  @Get('/sqs')
  createUserAsyncViaPuSubBus(): string {
    this.sqsMessageBus.dispatch(new RoutingMessage(new CreateUser('John FROM SQS'), 'my_app_command.create_user'));

    return 'Message sent';
  }
}
```

### Handler for your message

```typescript
import { CreateUser } from '../create-user';
import { IMessageBus, IMessageHandler, MessageBus, MessageHandler, RoutingMessage, DenormalizeMessage } from '@nestjstools/messaging';

@MessageHandler('my_app_command.create_user')
export class CreateUserHandler implements IMessageHandler<CreateUser>{

  handle(message: CreateUser): Promise<void> {
    console.log(message);
    // TODO Logic there
  }
}
```

---

### Key Features:

* Amazon SQS Integration: Easily send and receive messages with Amazon SQS.

* Local Development Support: Works with ElasticMQ for local development and testing.

* Automatic Queue Creation: Automatically create queues if they don’t exist (when autoCreate: true).

---

## Configuration options

### AmazonSqsChannel

#### **AmazonSqsChannelConfig**
| **Property**              | **Description**                                                                                        | **Default Value** |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |-------------------|
| **`name`**                | The name of the Amazon SQS channel (e.g., `'sqs-event'`).                                              |                   |
| **`region`**              | The AWS region for the SQS queue (e.g., `'us-east-1'`).                                                |                   |
| **`queueUrl`**            | The URL of the SQS queue (e.g., `'http://localhost:9324/queue/test_queue'`).                           |                   |
| **`credentials`**         | AWS credentials for SQS (optional).                                                                    |                   |
| **`enableConsumer`**      | Whether to enable message consumption (i.e., processing received messages).                            | `true`            |
| **`autoCreate`**          | Automatically create the queue if it doesn’t exist.                                                    | `true`            |
| **`maxNumberOfMessages`** | The maximum number of messages to retrieve from the queue in one request.                              | 1                 |
| **`visibilityTimeout`**   | The time in seconds that the message will remain invisible to other consumers after being fetched.     | 20                |
| **`waitTimeSeconds`**     | The amount of time (in seconds) for long polling. The consumer will wait up to this time for messages. | 10                |
---

## Real world working example with RabbitMQ & Redis - but might be helpful to understand how it works
https://github.com/nestjstools/messaging-rabbitmq-example
