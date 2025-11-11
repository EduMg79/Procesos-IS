// Email sender configured via environment variables
const nodemailer = require('nodemailer');
const url = (process.env.BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000') + '/';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || process.env.SMTP_USER,
    pass: process.env.MAIL_PASS || process.env.SMTP_PASS
  }
});

module.exports.enviarEmail = async function(direccion, key, men) {
  const result = await transporter.sendMail({
  from: process.env.MAIL_USER || process.env.SMTP_USER,
    to: direccion,
    subject: men,
    text: 'Pulsa aquí para confirmar cuenta',
    html: `
      <p>Bienvenido a Sistema</p>
      <p>
        <a href="${url}confirmarUsuario/${direccion}/${key}">
          Pulsa aquí para confirmar cuenta
        </a>
      </p>
    `
  });

  console.log('Correo enviado a:', direccion);
};
