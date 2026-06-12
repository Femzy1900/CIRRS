const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,   // true for SSL (Resend port 465), false for STARTTLS (587)
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'CIRS'} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Email] Sent to %s — Message ID: %s', options.email, info.messageId);
  }
};

module.exports = sendEmail;
