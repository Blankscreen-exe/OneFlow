import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import * as crypto from 'crypto';

@Injectable()
export class InvoiceAccessService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  /**
   * Generates a unique access token for an invoice
   */
  generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Ensures an invoice has an access token, generating one if needed
   */
  async ensureAccessToken(invoice: Invoice): Promise<string> {
    if (!invoice.accessToken) {
      invoice.accessToken = this.generateAccessToken();
      await this.invoicesRepository.save(invoice);
    }
    return invoice.accessToken;
  }

  /**
   * Finds an invoice by access token
   */
  async findByToken(token: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { accessToken: token },
      relations: ['items', 'client', 'user', 'proposal'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Validates access to an invoice
   */
  validateAccess(invoice: Invoice, serviceProviderId?: string): void {
    // Optional: Validate service provider matches if provided
    if (serviceProviderId && invoice.userId !== serviceProviderId) {
      throw new BadRequestException('Invoice does not belong to the specified service provider');
    }
  }
}

