import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from '../interfaces/email-provider.interface';

@Injectable()
export class SESProvider implements IEmailProvider {
  private readonly logger = new Logger(SESProvider.name);
  private readonly ses: any;
  private readonly emailFrom: string;

  constructor(private configService: ConfigService) {
    try {
      // Dynamic import to handle optional dependency
      const AWS = require('aws-sdk');
      
      const accessKeyId = this.configService.get<string>('email.sesAccessKeyId');
      const secretAccessKey = this.configService.get<string>(
        'email.sesSecretAccessKey',
      );
      const region = this.configService.get<string>('email.sesRegion') || 'us-east-1';

      if (!accessKeyId || !secretAccessKey) {
        throw new Error(
          'SES_ACCESS_KEY_ID and SES_SECRET_ACCESS_KEY are required when using SES provider',
        );
      }

      this.ses = new AWS.SES({
        accessKeyId,
        secretAccessKey,
        region,
      });
    } catch (error) {
      if (error.message.includes('SES_ACCESS_KEY_ID')) {
        throw error;
      }
      throw new Error(
        'aws-sdk package is required. Install it with: npm install aws-sdk',
      );
    }

    this.emailFrom =
      this.configService.get<string>('email.from') || 'noreply@oneflow.com';
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<void> {
    try {
      const params = {
        Source: this.emailFrom,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          },
        },
      };

      await this.ses.sendEmail(params).promise();
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send email via AWS SES');
    }
  }
}

