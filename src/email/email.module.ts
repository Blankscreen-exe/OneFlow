import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { IEmailProvider } from './interfaces/email-provider.interface';
import { ConsoleProvider } from './providers/console.provider';
import { ResendProvider } from './providers/resend.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { SESProvider } from './providers/ses.provider';

@Module({})
export class EmailModule {
  static forRoot(): DynamicModule {
    return {
      module: EmailModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'EMAIL_PROVIDER',
          useFactory: (configService: ConfigService): IEmailProvider => {
            const provider = configService.get<string>('email.provider') || 'console';

            switch (provider) {
              case 'resend':
                return new ResendProvider(configService);
              case 'sendgrid':
                return new SendGridProvider(configService);
              case 'ses':
                return new SESProvider(configService);
              case 'console':
              default:
                return new ConsoleProvider();
            }
          },
          inject: [ConfigService],
        },
        EmailService,
      ],
      exports: [EmailService],
    };
  }
}

