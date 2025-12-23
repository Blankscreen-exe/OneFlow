export const getPasswordResetEmailTemplate = (
  resetLink: string,
  userName?: string,
): { subject: string; html: string; text: string } => {
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h1 style="color: #333; margin-top: 0;">Password Reset Request</h1>
        <p>${greeting}</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetLink}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

${greeting}

You requested to reset your password. Use the link below to reset it:

${resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

This is an automated message, please do not reply to this email.
  `;

  return {
    subject: 'Password Reset Request',
    html: html.trim(),
    text: text.trim(),
  };
};

