import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from '../entities/proposal.entity';
import { ProposalContactMethod } from '../entities/proposal-contact-method.entity';
import { ClientContact, ContactType } from '../../client-contacts/entities/client-contact.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

@Injectable()
export class ProposalPlatformService {
  private readonly logger = new Logger(ProposalPlatformService.name);

  constructor(
    @InjectRepository(ProposalContactMethod)
    private proposalContactMethodsRepository: Repository<ProposalContactMethod>,
    @InjectRepository(ClientContact)
    private clientContactsRepository: Repository<ClientContact>,
  ) {}

  /**
   * Handles sending proposal via platform contacts (Upwork, LinkedIn, etc.)
   * Phase 1: Logs platform instructions (manual process)
   * Phase 2: Future API integrations
   */
  async sendViaPlatform(
    proposal: Proposal,
    contactMethod: ProposalContactMethod,
  ): Promise<void> {
    try {
      // Get the contact details
      const contact = await this.clientContactsRepository.findOne({
        where: { id: contactMethod.contactId },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // Validate it's a platform contact
      const platformTypes = [
        ContactType.UPWORK,
        ContactType.LINKEDIN,
        ContactType.FREELANCER,
        ContactType.GURU,
      ];

      if (!platformTypes.includes(contact.type)) {
        throw new Error('Contact is not a platform type');
      }

      // Phase 1: Log platform instructions (manual process)
      this.logger.log(
        `Proposal ${proposal.id} should be sent manually via ${contact.type} to ${contact.value}`,
      );
      this.logger.log(
        `Platform: ${contact.type}, URL: ${contact.value}, Proposal: ${proposal.title}`,
      );

      // For now, mark as delivered (manual confirmation)
      // In Phase 2, this would make actual API calls
      contactMethod.sentAt = new Date();
      contactMethod.deliveryStatus = DeliveryStatus.DELIVERED;
      await this.proposalContactMethodsRepository.save(contactMethod);

      this.logger.log(
        `Proposal ${proposal.id} marked as sent via ${contact.type}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process proposal ${proposal.id} via platform:`,
        error,
      );

      // Update delivery status to failed
      contactMethod.sentAt = new Date();
      contactMethod.deliveryStatus = DeliveryStatus.FAILED;
      contactMethod.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.proposalContactMethodsRepository.save(contactMethod);

      throw error;
    }
  }
}

