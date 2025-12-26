export function getProposalEmailTemplate(
  proposalTitle: string,
  clientName: string,
  acceptanceLink: string,
  validUntil?: Date,
  coverLetter?: string,
  items?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>,
  subtotal?: number,
  taxAmount?: number,
  total?: number,
): { subject: string; html: string; text: string } {
  const subject = `Proposal: ${proposalTitle}`;

  const itemsHtml = items && items.length > 0
    ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${item.unitPrice.toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${subtotal !== undefined ? `<p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>` : ''}
      ${taxAmount !== undefined && taxAmount > 0 ? `<p><strong>Tax:</strong> $${taxAmount.toFixed(2)}</p>` : ''}
      ${total !== undefined ? `<p style="font-size: 18px; font-weight: bold;"><strong>Total:</strong> $${total.toFixed(2)}</p>` : ''}
    `
    : '';

  const validUntilHtml = validUntil
    ? `<p><strong>Valid Until:</strong> ${validUntil.toLocaleDateString()}</p>`
    : '';

  const coverLetterHtml = coverLetter
    ? `<div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff;">
         <p style="white-space: pre-wrap;">${coverLetter}</p>
       </div>`
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
        <h1>${proposalTitle}</h1>
        <p>Dear ${clientName},</p>
        <p>We are pleased to present the following proposal for your consideration.</p>
        ${coverLetterHtml}
        ${itemsHtml}
        ${validUntilHtml}
        <p>To accept this proposal, please click the button below:</p>
        <a href="${acceptanceLink}" class="button">Accept Proposal</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${acceptanceLink}</p>
        <p>Thank you for your consideration.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    </body>
    </html>
  `;

  const text = `
${proposalTitle}

Dear ${clientName},

We are pleased to present the following proposal for your consideration.

${coverLetter ? coverLetter + '\n\n' : ''}${items && items.length > 0
    ? items.map(item => `${item.description} - Qty: ${item.quantity} - Unit: $${item.unitPrice.toFixed(2)} - Total: $${item.total.toFixed(2)}`).join('\n') +
      (subtotal !== undefined ? `\nSubtotal: $${subtotal.toFixed(2)}` : '') +
      (taxAmount !== undefined && taxAmount > 0 ? `\nTax: $${taxAmount.toFixed(2)}` : '') +
      (total !== undefined ? `\nTotal: $${total.toFixed(2)}` : '') + '\n\n'
    : ''}${validUntil ? `Valid Until: ${validUntil.toLocaleDateString()}\n\n` : ''}To accept this proposal, please visit:
${acceptanceLink}

Thank you for your consideration.

Best regards,
The Team
  `;

  return { subject, html, text };
}

