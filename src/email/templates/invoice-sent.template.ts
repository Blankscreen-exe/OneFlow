export function getInvoiceSentEmailTemplate(
  invoiceNumber: string,
  clientName: string,
  invoiceLink: string,
  total: number,
  amountDue: number,
  dueDate?: Date,
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>,
  taxAmount?: number,
  serviceProviderEmail?: string,
): { subject: string; html: string; text: string } {
  const subject = `Invoice ${invoiceNumber}${serviceProviderEmail ? ` from ${serviceProviderEmail}` : ''}`;

  const itemsHtml =
    items && items.length > 0
      ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${item.description}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.unitPrice.toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.total.toFixed(2)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
      ${taxAmount !== undefined && taxAmount > 0 ? `<p><strong>Tax:</strong> $${taxAmount.toFixed(2)}</p>` : ''}
      <p style="font-size: 18px; font-weight: bold;"><strong>Total:</strong> $${total.toFixed(2)}</p>
    `
      : `<p style="font-size: 18px; font-weight: bold;"><strong>Total:</strong> $${total.toFixed(2)}</p>`;

  const dueDateHtml = dueDate
    ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background-color: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Invoice ${invoiceNumber}</h1>
        <p>Dear ${clientName},</p>
        <p>Please find your invoice details below.</p>
        ${itemsHtml}
        ${dueDateHtml}
        <p>To view and pay this invoice, please click the button below:</p>
        <a href="${invoiceLink}" class="button">View & Pay Invoice</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${invoiceLink}</p>
        <p>You can also create an account to view your invoice history and manage payments.</p>
        <p>Thank you for your business.</p>
        <p>Best regards,<br>${serviceProviderEmail || 'Service Provider'}</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Invoice ${invoiceNumber}

Dear ${clientName},

Please find your invoice details below.

${items && items.length > 0
    ? items
        .map(
          (item) =>
            `${item.description} - Qty: ${item.quantity} - Unit: $${item.unitPrice.toFixed(2)} - Total: $${item.total.toFixed(2)}`,
        )
        .join('\n') +
      (taxAmount !== undefined && taxAmount > 0 ? `\nTax: $${taxAmount.toFixed(2)}` : '') +
      `\nTotal: $${total.toFixed(2)}`
    : `Total: $${total.toFixed(2)}`}

${dueDate ? `Due Date: ${new Date(dueDate).toLocaleDateString()}` : ''}

To view and pay this invoice, please visit:
${invoiceLink}

You can also create an account to view your invoice history and manage payments.

Thank you for your business.

Best regards,
${serviceProviderEmail || 'Service Provider'}
  `.trim();

  return { subject, html, text };
}

