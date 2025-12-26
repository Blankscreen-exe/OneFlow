import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIService } from '../../ai/ai.service';
import { Proposal, ProposalStatus } from '../entities/proposal.entity';
import { Client } from '../../clients/entities/client.entity';
import { CreateProposalDto } from '../dto/create-proposal.dto';

export enum AIGenerationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Injectable()
export class AIProposalService {
  private readonly logger = new Logger(AIProposalService.name);
  private generationJobs: Map<string, { status: AIGenerationStatus; result?: any; error?: string }> = new Map();

  constructor(
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private aiService: AIService,
  ) {}

  /**
   * Generates a proposal using AI
   */
  async generateProposal(
    userId: string,
    clientId: string,
    prompt: string,
  ): Promise<{ jobId: string }> {
    // Validate client belongs to user
    const client = await this.clientsRepository.findOne({
      where: { id: clientId, userId },
    });

    if (!client) {
      throw new BadRequestException(
        'Client not found or does not belong to you',
      );
    }

    // Generate job ID
    const jobId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Mark as pending
    this.generationJobs.set(jobId, { status: AIGenerationStatus.PENDING });

    // Start async generation
    this.performGeneration(jobId, userId, clientId, prompt).catch((error) => {
      this.logger.error(`AI generation failed for job ${jobId}:`, error);
      this.generationJobs.set(jobId, {
        status: AIGenerationStatus.FAILED,
        error: error.message,
      });
    });

    return { jobId };
  }

  /**
   * Performs the actual AI generation (async)
   */
  private async performGeneration(
    jobId: string,
    userId: string,
    clientId: string,
    prompt: string,
  ): Promise<void> {
    try {
      // Build comprehensive prompt
      const fullPrompt = `Generate a professional proposal for a client. 

Client Information:
${prompt}

Please generate:
1. A compelling proposal title
2. A detailed cover letter
3. A list of services/items with descriptions
4. Professional notes

Format the response in a structured way that can be parsed.`;

      // Call AI service
      const generatedContent = await this.aiService.generateProposal(fullPrompt);

      // Store result
      this.generationJobs.set(jobId, {
        status: AIGenerationStatus.COMPLETED,
        result: {
          content: generatedContent,
          userId,
          clientId,
        },
      });

      this.logger.log(`AI generation completed for job ${jobId}`);
    } catch (error) {
      this.logger.error(`AI generation failed for job ${jobId}:`, error);
      this.generationJobs.set(jobId, {
        status: AIGenerationStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets the status of an AI generation job
   */
  getGenerationStatus(jobId: string): {
    status: AIGenerationStatus;
    result?: any;
    error?: string;
  } | null {
    return this.generationJobs.get(jobId) || null;
  }

  /**
   * Creates a proposal from completed AI generation
   */
  async createFromAI(
    jobId: string,
    userId: string,
  ): Promise<Proposal> {
    const job = this.generationJobs.get(jobId);

    if (!job) {
      throw new BadRequestException('Generation job not found');
    }

    if (job.status !== AIGenerationStatus.COMPLETED) {
      throw new BadRequestException(
        `Generation job is not completed. Status: ${job.status}`,
      );
    }

    const { result } = job;

    // Parse AI-generated content and create proposal
    // This is a simplified version - in production, you'd want more sophisticated parsing
    const proposal = this.proposalsRepository.create({
      userId: result.userId,
      clientId: result.clientId,
      title: 'AI Generated Proposal', // Would parse from content
      status: ProposalStatus.DRAFT,
      coverLetter: result.content, // Simplified - would parse properly
      notes: 'Generated using AI',
    });

    const savedProposal = await this.proposalsRepository.save(proposal);

    // Clean up job
    this.generationJobs.delete(jobId);

    return savedProposal;
  }
}

