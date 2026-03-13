const nodemailer = require('nodemailer');

// Configurar transporte de email
const createTransporter = () => {
  // En desarrollo, usar Ethereal (emails de prueba) o console log
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
    return null; // Modo desarrollo sin SMTP
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Enviar email de restablecimiento de contraseña
 */
const sendPasswordResetEmail = async (email, nombre, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer-password/${resetToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 10px; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Restablecer Contraseña</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este correo.
          </div>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no respondas.</p>
          <p>© ${new Date().getFullYear()} Tienda Online</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Hola ${nombre},

    Recibimos una solicitud para restablecer la contraseña de tu cuenta.

    Para crear una nueva contraseña, visita el siguiente enlace:
    ${resetUrl}

    Este enlace expirará en 1 hora.

    Si no solicitaste este cambio, ignora este correo.

    © ${new Date().getFullYear()} Tienda Online
  `;

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Tienda Online" <noreply@tienda.com>',
    to: email,
    subject: 'Restablecer tu contraseña - Tienda Online',
    text: textContent,
    html: htmlContent
  };

  // En desarrollo sin SMTP configurado, solo loguear
  if (!transporter) {
    console.log('📧 [DEV] Email de restablecimiento de contraseña:');
    console.log('   Para:', email);
    console.log('   Token:', resetToken);
    console.log('   URL:', resetUrl);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};

/**
 * Enviar email de confirmación de cambio de contraseña
 */
const sendPasswordChangedEmail = async (email, nombre) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #FEE2E2; border: 1px solid #EF4444; padding: 10px; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Contraseña Actualizada</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Tu contraseña ha sido actualizada exitosamente.</p>
          <p>Si realizaste este cambio, no necesitas hacer nada más.</p>
          <div class="warning">
            <strong>⚠️ ¿No fuiste tú?</strong><br>
            Si no realizaste este cambio, tu cuenta podría estar comprometida. 
            Contacta inmediatamente con nuestro soporte.
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Tienda Online</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 [DEV] Email de confirmación de cambio de contraseña enviado a:', email);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Tienda Online" <noreply@tienda.com>',
      to: email,
      subject: 'Tu contraseña fue actualizada - Tienda Online',
      html: htmlContent
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
    // No lanzamos error aquí, es solo informativo
    return { success: false };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
