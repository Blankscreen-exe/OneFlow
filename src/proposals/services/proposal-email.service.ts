import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../email/email.service';
import { Proposal } from '../entities/proposal.entity';
import { ProposalContactMethod } from '../entities/proposal-contact-method.entity';
import { ClientContact, ContactType } from '../../client-contacts/entities/client-contact.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { ProposalAcceptanceService } from './proposal-acceptance.service';
import { getProposalEmailTemplate } from '../templates/proposal-email.template';

@Injectable()
export class ProposalEmailService {
  private readonly logger = new Logger(ProposalEmailService.name);

  constructor(
    @InjectRepository(ProposalContactMethod)
    private proposalContactMethodsRepository: Repository<ProposalContactMethod>,
    @InjectRepository(ClientContact)
    private clientContactsRepository: Repository<ClientContact>,
    private emailService: EmailService,
    private proposalAcceptanceService: ProposalAcceptanceService,
    private configService: ConfigService,
  ) {}

  /**
   * Sends a proposal via email contact
   */
  async sendViaEmail(
    proposal: Proposal,
    contactMethod: ProposalContactMethod,
  ): Promise<void> {
    try {
      // Get the contact details
      const contact = await this.clientContactsRepository.findOne({
        where: { id: contactMethod.contactId },
      });

      if (!contact || contact.type !== ContactType.EMAIL) {
        throw new Error('Contact is not an email type');
      }

      // Ensure proposal has acceptance token
      const token = await this.proposalAcceptanceService.ensureAcceptanceToken(
        proposal,
      );

      // Build acceptance link
      const frontendUrl = this.configService.get<string>('frontend.url') || 'http://localhost:3000';
      const acceptanceLink = `${frontendUrl}/api/proposals/public/${token}/accept`;

      // Get proposal items for email template
      const items = proposal.items?.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      }));

      // Generate email template
      const { subject, html, text } = getProposalEmailTemplate(
        proposal.title,
        proposal.client?.name || 'Client',
        acceptanceLink,
        proposal.validUntil,
        proposal.coverLetter,
        items,
        Number(proposal.subtotal),
        Number(proposal.taxAmount),
        Number(proposal.total),
      );

      // Send email
      await this.emailService.sendEmail(contact.value, subject, html, text);

      // Update delivery status
      contactMethod.sentAt = new Date();
      contactMethod.deliveryStatus = DeliveryStatus.DELIVERED;
      await this.proposalContactMethodsRepository.save(contactMethod);

      this.logger.log(
        `Proposal ${proposal.id} sent via email to ${contact.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send proposal ${proposal.id} via email:`,
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

