export function getOverdueInvoiceReminderTemplate(
  invoiceNumber: string,
  invoiceTotal: number,
  amountDue: number,
  dueDate: Date,
  daysOverdue: number,
  paymentLink: string,
  serviceProviderEmail: string,
  serviceProviderName?: string,
  clientName?: string,
): { subject: string; html: string; text: string } {
  const subject = `Reminder: Invoice ${invoiceNumber} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;

  const urgencyColor = daysOverdue > 30 ? '#dc3545' : daysOverdue > 14 ? '#fd7e14' : '#ffc107';
  const urgencyMessage =
    daysOverdue > 30
      ? 'This invoice is significantly overdue. Please make payment immediately.'
      : daysOverdue > 14
        ? 'This invoice is overdue. Please arrange payment as soon as possible.'
        : 'This invoice is past due. Please make payment to avoid further action.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert-box { background-color: #fff3cd; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0; }
        .invoice-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background-color: #0056b3; }
        .days-overdue { font-size: 20px; font-weight: bold; color: ${urgencyColor}; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Invoice Payment Reminder</h1>
        <p>Dear ${clientName || 'Client'},</p>
        
        <div class="alert-box">
          <p class="days-overdue">Invoice ${invoiceNumber} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</p>
          <p>${urgencyMessage}</p>
        </div>

        <div class="invoice-box">
          <h2 style="margin-top: 0;">Invoice Details</h2>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Total Amount:</strong> $${invoiceTotal.toFixed(2)}</p>
          <p><strong>Amount Due:</strong> $${amountDue.toFixed(2)}</p>
          <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
        </div>

        <p>To make a payment, please click the button below:</p>
        <a href="${paymentLink}" class="button">Pay Invoice Now</a>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${paymentLink}</p>

        <p>If you have already made payment, please ignore this reminder. If you have any questions or concerns, please contact us:</p>
        <p>
          <strong>${serviceProviderName || serviceProviderEmail}</strong><br>
          ${serviceProviderEmail}
        </p>

        <p>Thank you for your prompt attention to this matter.</p>
        
        <p>Best regards,<br>${serviceProviderName || serviceProviderEmail}</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Invoice Payment Reminder

Dear ${clientName || 'Client'},

Invoice ${invoiceNumber} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue

${urgencyMessage}

Invoice Details:
Invoice Number: ${invoiceNumber}
Total Amount: $${invoiceTotal.toFixed(2)}
Amount Due: $${amountDue.toFixed(2)}
Due Date: ${dueDate.toLocaleDateString()}

To make a payment, please visit:
${paymentLink}

If you have already made payment, please ignore this reminder. If you have any questions or concerns, please contact us:

${serviceProviderName || serviceProviderEmail}
${serviceProviderEmail}

Thank you for your prompt attention to this matter.

Best regards,
${serviceProviderName || serviceProviderEmail}
  `.trim();

  return { subject, html, text };
}

