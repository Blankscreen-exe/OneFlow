export function getPaymentConfirmationEmailTemplate(
  paymentAmount: number,
  invoiceNumber: string,
  invoiceTotal: number,
  paymentDate: Date,
  serviceProviderEmail: string,
  serviceProviderName?: string,
  paymentMethod?: string,
): { subject: string; html: string; text: string } {
  const subject = `Payment Confirmation - Invoice ${invoiceNumber}`;

  const paymentMethodHtml = paymentMethod
    ? `<p><strong>Payment Method:</strong> ${paymentMethod}</p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .receipt-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .amount { font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Payment Confirmation</h1>
        <p>Thank you for your payment!</p>
        
        <div class="receipt-box">
          <h2 style="margin-top: 0;">Receipt Details</h2>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Payment Amount:</strong> <span class="amount">$${paymentAmount.toFixed(2)}</span></p>
          <p><strong>Invoice Total:</strong> $${invoiceTotal.toFixed(2)}</p>
          <p><strong>Payment Date:</strong> ${paymentDate.toLocaleDateString()} ${paymentDate.toLocaleTimeString()}</p>
          ${paymentMethodHtml}
        </div>

        <p>This email serves as your receipt for this payment. Please keep it for your records.</p>
        
        <p>If you have any questions about this payment, please contact:</p>
        <p>
          <strong>${serviceProviderName || serviceProviderEmail}</strong><br>
          ${serviceProviderEmail}
        </p>

        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Payment Confirmation

Thank you for your payment!

Receipt Details:
Invoice Number: ${invoiceNumber}
Payment Amount: $${paymentAmount.toFixed(2)}
Invoice Total: $${invoiceTotal.toFixed(2)}
Payment Date: ${paymentDate.toLocaleDateString()} ${paymentDate.toLocaleTimeString()}
${paymentMethod ? `Payment Method: ${paymentMethod}` : ''}

This email serves as your receipt for this payment. Please keep it for your records.

If you have any questions about this payment, please contact:
${serviceProviderName || serviceProviderEmail}
${serviceProviderEmail}

---
This is an automated confirmation email. Please do not reply to this message.
  `.trim();

  return { subject, html, text };
}

