import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IEmailProvider } from '../interfaces/email-provider.interface';

@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly resend: Resend;
  private readonly emailFrom: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required when using Resend provider');
    }
    this.resend = new Resend(apiKey);
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
      await this.resend.emails.send({
        from: this.emailFrom,
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send email via Resend');
    }
  }
}

