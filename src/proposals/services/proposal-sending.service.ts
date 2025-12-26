import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Proposal } from '../entities/proposal.entity';
import { ProposalContactMethod } from '../entities/proposal-contact-method.entity';
import { ClientContact, ContactType } from '../../client-contacts/entities/client-contact.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { ProposalEmailService } from './proposal-email.service';
import { ProposalPlatformService } from './proposal-platform.service';

@Injectable()
export class ProposalSendingService {
  private readonly logger = new Logger(ProposalSendingService.name);

  constructor(
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
    @InjectRepository(ProposalContactMethod)
    private proposalContactMethodsRepository: Repository<ProposalContactMethod>,
    @InjectRepository(ClientContact)
    private clientContactsRepository: Repository<ClientContact>,
    private proposalEmailService: ProposalEmailService,
    private proposalPlatformService: ProposalPlatformService,
  ) {}

  /**
   * Sends a proposal via multiple contact methods
   * Handles partial failures gracefully
   */
  async sendViaContacts(
    proposalId: string,
    contactIds: string[],
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId },
      relations: ['items', 'client'],
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Get all contacts
    const contacts = await this.clientContactsRepository.find({
      where: { id: In(contactIds) },
    });

    if (contacts.length !== contactIds.length) {
      throw new Error('One or more contacts not found');
    }

    // Get or create ProposalContactMethod records
    const contactMethods: ProposalContactMethod[] = [];
    for (const contactId of contactIds) {
      let contactMethod = await this.proposalContactMethodsRepository.findOne({
        where: { proposalId, contactId },
      });

      if (!contactMethod) {
        contactMethod = this.proposalContactMethodsRepository.create({
          proposalId,
          contactId,
          deliveryStatus: DeliveryStatus.PENDING,
        });
        await this.proposalContactMethodsRepository.save(contactMethod);
      }

      contactMethods.push(contactMethod);
    }

    // Send via each contact method (parallel execution)
    const results = await Promise.allSettled(
      contactMethods.map(async (contactMethod) => {
        const contact = contacts.find(
          (c) => c.id === contactMethod.contactId,
        );

        if (!contact) {
          throw new Error('Contact not found');
        }

        // Route to appropriate service based on contact type
        switch (contact.type) {
          case ContactType.EMAIL:
            await this.proposalEmailService.sendViaEmail(
              proposal,
              contactMethod,
            );
            break;

          case ContactType.UPWORK:
          case ContactType.LINKEDIN:
          case ContactType.FREELANCER:
          case ContactType.GURU:
            await this.proposalPlatformService.sendViaPlatform(
              proposal,
              contactMethod,
            );
            break;

          case ContactType.PHONE:
            // Phone contacts are not supported for sending yet
            this.logger.warn(
              `Phone contacts not supported for sending: ${contact.value}`,
            );
            contactMethod.deliveryStatus = DeliveryStatus.FAILED;
            contactMethod.errorMessage = 'Phone contacts not supported for sending';
            await this.proposalContactMethodsRepository.save(contactMethod);
            throw new Error('Phone contacts not supported for sending');

          default:
            throw new Error(`Unsupported contact type: ${contact.type}`);
        }
      }),
    );

    // Count successes and failures
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success++;
      } else {
        failed++;
        const contact = contacts[index];
        errors.push(
          `Failed to send via ${contact?.type} (${contact?.value}): ${result.reason}`,
        );
      }
    });

    this.logger.log(
      `Proposal ${proposalId} sending completed: ${success} succeeded, ${failed} failed`,
    );

    return { success, failed, errors };
  }
}

