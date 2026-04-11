import nodemailer, { Transporter } from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } from '@config';

declare global {
  var mailTransporter: Transporter | undefined;
}

const createMailTransporter = (): Transporter | null => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const mailTransporter = globalThis.mailTransporter ?? createMailTransporter();

if (process.env.NODE_ENV !== 'production') {
  globalThis.mailTransporter = mailTransporter ?? undefined;
}

/**
 * Health check for SMTP/Mail service.
 * Verifies SMTP connection by checking connectivity.
 */
const checkMailHealth = async (): Promise<{ healthy: boolean; message: string }> => {
  if (!mailTransporter) {
    return { healthy: false, message: 'Mail not configured (SMTP_HOST, SMTP_USER, or SMTP_PASS not set)' };
  }

  try {
    const verify = await mailTransporter.verify();
    if (verify) {
      return { healthy: true, message: `Mail service connected: ${SMTP_HOST}:${SMTP_PORT}` };
    }
    return { healthy: false, message: 'Mail service verify returned false' };
  } catch (error) {
    const err = error as Error;
    return { healthy: false, message: `Mail connection failed: ${err.message}` };
  }
};

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

const sendMail = async (options: SendMailOptions): Promise<void> => {
  if (!mailTransporter) {
    throw new Error('Mail transporter not configured');
  }

  await mailTransporter.sendMail({
    from: options.from ?? SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

export { checkMailHealth, sendMail, mailTransporter };
