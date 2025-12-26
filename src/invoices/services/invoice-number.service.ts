import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class InvoiceNumberService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  /**
   * Generates the next sequential invoice number for a user in a given year
   * Format: INV-{year}-{sequence} (e.g., INV-2025-001)
   * @param userId - The user ID to generate the invoice number for
   * @param year - Optional year (defaults to current year)
   * @returns The next invoice number in sequence
   */
  async generateNextInvoiceNumber(
    userId: string,
    year?: number,
  ): Promise<string> {
    const currentYear = year || new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    // Find all invoices for this user in this year
    // Invoice numbers are stored as strings like "INV-2025-001"
    const existingInvoices = await this.invoicesRepository.find({
      where: {
        userId,
        invoiceNumber: Like(`${prefix}%`),
      },
      select: ['invoiceNumber'],
    });

    // Extract sequence numbers from existing invoice numbers
    const sequences = existingInvoices
      .map((invoice) => {
        const match = invoice.invoiceNumber.match(/^INV-\d{4}-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((seq) => seq > 0);

    // Find the next sequence number
    const nextSequence = sequences.length > 0 ? Math.max(...sequences) + 1 : 1;

    // Format with leading zeros (3 digits: 001, 002, etc.)
    const sequenceStr = nextSequence.toString().padStart(3, '0');

    return `${prefix}${sequenceStr}`;
  }
}

