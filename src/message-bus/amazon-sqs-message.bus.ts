import { RoutingMessage } from '@nestjstools/messaging';
import { IMessageBus } from '@nestjstools/messaging';
import { Injectable } from '@nestjs/common';
import { AmazonSqsChannel } from '../channel/amazon-sqs.channel';
import { SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class AmazonSqsMessageBus implements IMessageBus {
  constructor(
    private readonly channel: AmazonSqsChannel,
  ) {
  }

  async dispatch(message: RoutingMessage): Promise<object | void> {
    const command = new SendMessageCommand({
      QueueUrl: this.channel.config.queueUrl,
      MessageBody: JSON.stringify(message.message),
      MessageAttributes: {
        messagingRoutingKey: {
          DataType: "String",
          StringValue: message.messageRoutingKey,
        },
      }
    });
    await this.channel.client.send(command)
  }
}
