/* eslint-disable no-console */

type SendResult = { ok: boolean; id?: string; error?: string };

type MailInput = {
  to: string;
  subject: string;
  html: string;
};

const BRAND = 'Arithmax';
const PRIMARY = '#693061';
const PRIMARY_SOFT = '#f7f0f6';
const BUTTON_STYLE = `background:${PRIMARY};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block`;
const LABEL_STYLE = 'color:#8a8f98;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:bold';

export class MailService {
  async send({ to, subject, html }: MailInput): Promise<SendResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
      return { ok: false, error: 'RESEND_API_KEY o MAIL_FROM no configurados' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };

      if (!response.ok) {
        return {
          ok: false,
          error: data.message ?? `Resend respondio HTTP ${response.status}`,
        };
      }

      return { ok: true, id: data.id };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  sendWelcome(
    to: string,
    data: { firstName?: string | null; tempPassword: string; expiresAt?: Date | null }
  ): Promise<SendResult> {
    const softwareUrl = process.env.SOFTWARE_URL ?? '#';
    return this.send({
      to,
      subject: `Bienvenido a ${BRAND} — tus accesos`,
      html: layout(`
        <h2 style="margin:0 0 16px">¡Bienvenido${data.firstName ? `, ${escapeHtml(data.firstName)}` : ''}!</h2>
        <p>Gracias por tu compra. Tu licencia de <strong>${BRAND}</strong> ya está activa${
          data.expiresAt ? ` y es vigente hasta el <strong>${formatDate(data.expiresAt)}</strong>` : ''
        }.</p>
        <p style="margin:24px 0 8px;${LABEL_STYLE}">Tus accesos</p>
        <table style="border-collapse:collapse;margin:0 0 16px;border-top:1px solid #eeeeee">
          <tr><td style="padding:8px 24px 8px 0;color:#8a8f98">Correo</td><td style="padding:8px 0"><strong>${escapeHtml(to)}</strong></td></tr>
          <tr><td style="padding:8px 24px 8px 0;color:#8a8f98">Contraseña temporal</td><td style="padding:8px 0"><strong style="color:${PRIMARY}">${escapeHtml(data.tempPassword)}</strong></td></tr>
        </table>
        <p style="margin:24px 0">
          <a href="${softwareUrl}" style="${BUTTON_STYLE}">Ingresar a ${BRAND}</a>
        </p>
        <div style="background:${PRIMARY_SOFT};border-radius:8px;padding:14px 18px;color:#4b3a48">
          👉 Por seguridad, te pediremos cambiar esta contraseña temporal al entrar por primera vez.
        </div>
        <p>¡Gracias por confiar en nosotros!</p>
      `),
    });
  }

  sendRenewal(
    to: string,
    data: { firstName?: string | null; expiresAt: Date }
  ): Promise<SendResult> {
    const softwareUrl = process.env.SOFTWARE_URL ?? '#';
    return this.send({
      to,
      subject: `Tu licencia de ${BRAND} fue renovada`,
      html: layout(`
        <h2 style="margin:0 0 16px">¡Licencia renovada${data.firstName ? `, ${escapeHtml(data.firstName)}` : ''}!</h2>
        <p>Gracias por renovar. Tu licencia de <strong>${BRAND}</strong> ahora es vigente hasta el
        <strong style="color:${PRIMARY}">${formatDate(data.expiresAt)}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${softwareUrl}" style="${BUTTON_STYLE}">Ingresar a ${BRAND}</a>
        </p>
        <p>¡Gracias por seguir con nosotros!</p>
      `),
    });
  }

  // Correo de agradecimiento + cross-sell; se envia despues de la bienvenida
  // o la renovacion para invitar al cliente a conocer el resto del catalogo
  sendThankYou(
    to: string,
    data: { firstName?: string | null }
  ): Promise<SendResult> {
    const storeUrl = process.env.STORE_URL;
    return this.send({
      to,
      subject: `Gracias por tu confianza — descubre más de ${BRAND}`,
      html: layout(`
        <h2 style="margin:0 0 16px">¡Gracias por tu confianza${data.firstName ? `, ${escapeHtml(data.firstName)}` : ''}!</h2>
        <p>Queremos agradecerte de corazón por formar parte de la comunidad de
        <strong>${BRAND}</strong> y Numerología Cotidiana.</p>
        <p>Además de tu licencia, en nuestra tienda encontrarás mucho más para
        acompañar tu camino:</p>
        <ul style="line-height:1.9;padding-left:20px">
          <li><strong>Reportes personalizados</strong> con análisis a tu medida</li>
          <li><strong>Membresías</strong> con beneficios y contenido exclusivo</li>
          <li><strong>Cursos</strong> para profundizar en la numerología</li>
        </ul>
        ${
          storeUrl
            ? `<p style="margin:24px 0">
          <a href="${storeUrl}" style="${BUTTON_STYLE}">Explorar la tienda</a>
        </p>`
            : ''
        }
        <p>Esperamos que disfrutes tu experiencia. ¡Gracias por confiar en nosotros!</p>
      `),
    });
  }

  sendPasswordReset(to: string, data: { resetUrl: string }): Promise<SendResult> {
    return this.send({
      to,
      subject: `Restablece tu contraseña de ${BRAND}`,
      html: layout(`
        <h2 style="margin:0 0 16px">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p style="margin:24px 0">
          <a href="${data.resetUrl}" style="${BUTTON_STYLE}">Crear nueva contraseña</a>
        </p>
        <p style="color:#8a8f98">El enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo:
        tu contraseña actual sigue siendo válida.</p>
      `),
    });
  }
}

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${PRIMARY};border-radius:8px 8px 0 0">
        <tr>
          <td style="padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold">${BRAND}</td>
          <td style="padding:18px 24px;color:#ffffff;font-size:12px;text-align:right">Numerología Cotidiana</td>
        </tr>
      </table>
      <div style="background:#ffffff;border-radius:0 0 8px 8px;padding:32px;line-height:1.6">${body}</div>
      <div style="text-align:center;color:#9ca3af;font-size:12px;padding-top:16px">
        ${BRAND} · Numerología Cotidiana
      </div>
    </div>
  </body>
</html>`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
