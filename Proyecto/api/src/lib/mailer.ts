import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from '../config/env.js';

export interface IMailer {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class MockMailer implements IMailer {
  private readonly dir = '/tmp/ranchuni-mails';

  async send(to: string, subject: string, body: string): Promise<void> {
    mkdirSync(this.dir, { recursive: true });
    const filename = `${Date.now()}_${to.replace(/[@.]/g, '_')}.eml`;
    const content = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toISOString()}`,
      '',
      body,
    ].join('\n');
    writeFileSync(join(this.dir, filename), content, 'utf-8');
  }
}

let _mailerInstance: IMailer | null = null;

export function getMailer(): IMailer {
  if (!_mailerInstance) {
    _mailerInstance = new MockMailer();
  }
  return _mailerInstance;
}

export function setMailer(mailer: IMailer): void {
  _mailerInstance = mailer;
}

export function buildVerifEmail(link: string): string {
  return `Hola,\n\nConfirma tu cuenta RanchUNI haciendo clic en el siguiente enlace:\n\n${link}\n\nEste enlace expira en 24 horas.\n\nComedor UNI`;
}

export function buildOTPEmail(otp: string): string {
  return `Hola,\n\nTu código de verificación para iniciar sesión en RanchUNI es:\n\n  ${otp}\n\nEste código expira en 5 minutos. No lo compartas con nadie.\n\nComedor UNI`;
}

export { config };
