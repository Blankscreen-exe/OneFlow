import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../interfaces/email-provider.interface';

@Injectable()
export class ConsoleProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleProvider.name);

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<void> {
    this.logger.log('=== EMAIL (Console Mode) ===');
    this.logger.log(`To: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log('--- HTML Content ---');
    this.logger.log(html);
    this.logger.log('--- Text Content ---');
    this.logger.log(text);
    this.logger.log('====================');
  }
}

