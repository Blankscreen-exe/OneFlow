import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';
import { IAiProvider } from './interfaces/ai-provider.interface';
import { ConsoleProvider } from './providers/console.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

@Module({})
export class AIModule {
  static forRoot(): DynamicModule {
    return {
      module: AIModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'AI_PROVIDER',
          useFactory: (configService: ConfigService): IAiProvider => {
            const provider =
              configService.get<string>('ai.provider') || 'console';

            switch (provider) {
              case 'openai':
                return new OpenAIProvider(configService);
              case 'anthropic':
                return new AnthropicProvider(configService);
              case 'console':
              default:
                return new ConsoleProvider();
            }
          },
          inject: [ConfigService],
        },
        AIService,
      ],
      exports: [AIService],
    };
  }
}

