import { Proposal } from '../../proposals/entities/proposal.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Payment } from '../../payments/entities/payment.entity';

/**
 * Format event title and description for proposal created event
 */
export function formatProposalCreatedEvent(proposal: Proposal): {
  title: string;
  description: string;
} {
  return {
    title: `Proposal Created: ${proposal.title}`,
    description: `A new proposal "${proposal.title}" was created with a total of $${Number(proposal.total).toFixed(2)}.`,
  };
}

/**
 * Format event title and description for proposal sent event
 */
export function formatProposalSentEvent(proposal: Proposal): {
  title: string;
  description: string;
} {
  return {
    title: `Proposal Sent: ${proposal.title}`,
    description: `Proposal "${proposal.title}" was sent to the client.`,
  };
}

/**
 * Format event title and description for proposal accepted event
 */
export function formatProposalAcceptedEvent(proposal: Proposal): {
  title: string;
  description: string;
} {
  return {
    title: `Proposal Accepted: ${proposal.title}`,
    description: `Proposal "${proposal.title}" was accepted by the client. Total amount: $${Number(proposal.total).toFixed(2)}.`,
  };
}

/**
 * Format event title and description for proposal rejected event
 */
export function formatProposalRejectedEvent(proposal: Proposal): {
  title: string;
  description: string;
} {
  return {
    title: `Proposal Rejected: ${proposal.title}`,
    description: `Proposal "${proposal.title}" was rejected by the client.`,
  };
}

/**
 * Format event title and description for invoice created event
 */
export function formatInvoiceCreatedEvent(invoice: Invoice): {
  title: string;
  description: string;
} {
  return {
    title: `Invoice Created: ${invoice.invoiceNumber}`,
    description: `Invoice ${invoice.invoiceNumber} was created with a total of $${Number(invoice.total).toFixed(2)}.`,
  };
}

/**
 * Format event title and description for invoice sent event
 */
export function formatInvoiceSentEvent(invoice: Invoice): {
  title: string;
  description: string;
} {
  return {
    title: `Invoice Sent: ${invoice.invoiceNumber}`,
    description: `Invoice ${invoice.invoiceNumber} was sent to the client. Amount due: $${Number(invoice.total).toFixed(2)}.`,
  };
}

/**
 * Format event title and description for payment received event
 */
export function formatPaymentReceivedEvent(
  payment: Payment,
  invoice: Invoice,
): { title: string; description: string } {
  return {
    title: `Payment Received: $${Number(payment.amount).toFixed(2)} for Invoice ${invoice.invoiceNumber}`,
    description: `Payment of $${Number(payment.amount).toFixed(2)} was received for invoice ${invoice.invoiceNumber}.`,
  };
}

/**
 * Format event title and description for note added event
 */
export function formatNoteAddedEvent(title: string, description?: string): {
  title: string;
  description: string;
} {
  return {
    title: `Note: ${title}`,
    description: description || '',
  };
}

