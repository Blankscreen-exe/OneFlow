import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from '../interfaces/email-provider.interface';

@Injectable()
export class SendGridProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridProvider.name);
  private readonly emailFrom: string;
  private sgMail: any;

  constructor(private configService: ConfigService) {
    try {
      // Dynamic import to handle optional dependency
      this.sgMail = require('@sendgrid/mail');
    } catch (error) {
      throw new Error(
        '@sendgrid/mail package is required. Install it with: npm install @sendgrid/mail',
      );
    }

    const apiKey = this.configService.get<string>('email.sendgridApiKey');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required when using SendGrid provider');
    }
    this.sgMail.setApiKey(apiKey);
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
      await this.sgMail.send({
        from: this.emailFrom,
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send email via SendGrid');
    }
  }
}

