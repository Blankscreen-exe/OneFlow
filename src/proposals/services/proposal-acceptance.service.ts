import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal, ProposalStatus } from '../entities/proposal.entity';
import { ProposalContactMethod } from '../entities/proposal-contact-method.entity';
import { TimelineService } from '../../timeline/services/timeline.service';
import { TimelineEventType } from '../../timeline/enums/timeline-event-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';
import {
  formatProposalAcceptedEvent,
  formatProposalRejectedEvent,
} from '../../timeline/utils/event-formatter.util';
import * as crypto from 'crypto';

@Injectable()
export class ProposalAcceptanceService {
  constructor(
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
    @InjectRepository(ProposalContactMethod)
    private proposalContactMethodsRepository: Repository<ProposalContactMethod>,
    private timelineService: TimelineService,
  ) {}

  /**
   * Generates a unique acceptance token for a proposal
   */
  generateAcceptanceToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Ensures a proposal has an acceptance token, generating one if needed
   */
  async ensureAcceptanceToken(proposal: Proposal): Promise<string> {
    if (!proposal.acceptanceToken) {
      proposal.acceptanceToken = this.generateAcceptanceToken();
      await this.proposalsRepository.save(proposal);
    }
    return proposal.acceptanceToken;
  }

  /**
   * Finds a proposal by acceptance token
   */
  async findByToken(token: string): Promise<Proposal> {
    const proposal = await this.proposalsRepository.findOne({
      where: { acceptanceToken: token },
      relations: ['items', 'client', 'sentViaContacts', 'sentViaContacts.contact'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  /**
   * Validates that a proposal can be accepted
   */
  validateAcceptance(proposal: Proposal): void {
    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException(
        'Only sent proposals can be accepted',
      );
    }

    if (proposal.validUntil && new Date(proposal.validUntil) < new Date()) {
      throw new BadRequestException('This proposal has expired');
    }
  }

  /**
   * Accepts a proposal
   */
  async accept(
    token: string,
    contactMethodId?: string,
  ): Promise<Proposal> {
    const proposal = await this.findByToken(token);
    this.validateAcceptance(proposal);

    // Update proposal status
    proposal.status = ProposalStatus.ACCEPTED;
    proposal.acceptedAt = new Date();
    await this.proposalsRepository.save(proposal);

    // Mark which contact method was used for acceptance (if provided)
    if (contactMethodId) {
      const contactMethod =
        await this.proposalContactMethodsRepository.findOne({
          where: {
            id: contactMethodId,
            proposalId: proposal.id,
          },
        });

      if (contactMethod) {
        contactMethod.acceptedVia = true;
        await this.proposalContactMethodsRepository.save(contactMethod);
      }
    }

    // Create timeline event (use proposal.userId as the event creator)
    const { title, description } = formatProposalAcceptedEvent(proposal);
    await this.timelineService.createEvent(
      proposal.clientId,
      proposal.userId,
      TimelineEventType.PROPOSAL_ACCEPTED,
      title,
      description,
      {
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        totalAmount: Number(proposal.total),
      },
      RelatedEntityType.PROPOSAL,
      proposal.id,
    );

    return proposal;
  }

  /**
   * Rejects a proposal
   */
  async reject(token: string): Promise<Proposal> {
    const proposal = await this.findByToken(token);
    
    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException('Only sent proposals can be rejected');
    }

    // Update proposal status
    proposal.status = ProposalStatus.REJECTED;
    proposal.rejectedAt = new Date();
    await this.proposalsRepository.save(proposal);

    // Create timeline event (use proposal.userId as the event creator)
    const { title, description } = formatProposalRejectedEvent(proposal);
    await this.timelineService.createEvent(
      proposal.clientId,
      proposal.userId,
      TimelineEventType.PROPOSAL_REJECTED,
      title,
      description,
      {
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        totalAmount: Number(proposal.total),
      },
      RelatedEntityType.PROPOSAL,
      proposal.id,
    );

    return proposal;
  }
}

