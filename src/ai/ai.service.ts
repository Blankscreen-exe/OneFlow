import { Injectable, Inject } from '@nestjs/common';
import { IAiProvider } from './interfaces/ai-provider.interface';

@Injectable()
export class AIService {
  constructor(
    @Inject('AI_PROVIDER') private readonly aiProvider: IAiProvider,
  ) {}

  async generateProposal(prompt: string): Promise<string> {
    return this.aiProvider.generateProposal(prompt);
  }
}

