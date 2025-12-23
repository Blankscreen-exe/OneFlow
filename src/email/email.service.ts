import { Injectable, Inject } from '@nestjs/common';
import { IEmailProvider } from './interfaces/email-provider.interface';
import { getPasswordResetEmailTemplate } from './templates/password-reset.template';

@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_PROVIDER') private readonly emailProvider: IEmailProvider,
  ) {}

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    userName?: string,
  ): Promise<void> {
    const { subject, html, text } = getPasswordResetEmailTemplate(
      resetLink,
      userName,
    );

    await this.emailProvider.sendEmail(to, subject, html, text);
  }
}

