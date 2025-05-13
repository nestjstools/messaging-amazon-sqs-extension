import { AmazonSqsChannel } from '../channel/amazon-sqs.channel';
import { ConsumerMessage, IMessagingConsumer } from '@nestjstools/messaging';
import { ConsumerMessageDispatcher } from '@nestjstools/messaging';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { MessageConsumer } from '@nestjstools/messaging';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import {
  DeleteMessageCommand,
  MessageAttributeValue,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';

@Injectable()
@MessageConsumer(AmazonSqsChannel)
export class AmazonSqsMessagingConsumer implements IMessagingConsumer<AmazonSqsChannel>, OnApplicationShutdown {
  private channel?: AmazonSqsChannel = undefined;

  async consume(dispatcher: ConsumerMessageDispatcher, channel: AmazonSqsChannel): Promise<void> {
    this.channel = channel;
    const client = this.channel.client;

    async function processPollMessages() {
      const delay = (s: number) => new Promise(resolve => setTimeout(resolve, s * 1000));
      while (true) {
          const receiveParams = {
            QueueUrl: channel.config.queueUrl,
            MaxNumberOfMessages: channel.config.maxNumberOfMessages,
            WaitTimeSeconds: channel.config.waitTimeSeconds,
            VisibilityTimeout: channel.config.visibilityTimeout,
            MessageAttributeNames: ["All"],
          };

          const response = await client.send(new ReceiveMessageCommand(receiveParams));

          if (response.Messages && response.Messages.length > 0) {
            for (const message of response.Messages) {
              const attrs = message.MessageAttributes as Record<string, MessageAttributeValue>;
              const messageBody = message.Body as string;
              const routingKey = attrs.messagingRoutingKey.StringValue as string;
              dispatcher.dispatch(new ConsumerMessage(JSON.parse(messageBody), routingKey))
              const deleteParams = {
                QueueUrl: channel.config.queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              };
              await client.send(new DeleteMessageCommand(deleteParams));
            }
          }
        await delay(channel.config.waitTimeSeconds as number);
      }
    }

    processPollMessages();

    return Promise.resolve();
  }

  async onError(errored: ConsumerDispatchedMessageError, channel: AmazonSqsChannel): Promise<void> {
    return Promise.resolve();
  }

  async onApplicationShutdown(signal?: string): Promise<any> {
    if (this.channel) {
      this.channel.client.destroy();
    }
  }
}
