// Email sender configured via environment variables
const nodemailer = require('nodemailer');
const gv = require('./gestorVariables.js');
const url = (process.env.BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000') + '/';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || process.env.SMTP_USER,
    pass: process.env.MAIL_PASS || process.env.SMTP_PASS
  }
});
module.exports.obtenerOptions = async function(callback) {
  try {
    const [user, pass] = await Promise.all([
      gv.accessUSUARIOCORREO(),
      gv.accessCLAVECORREO(),
      gv.accessMONGODBURI()
    ]);
    callback({ user, pass });
  } catch (error) {
    console.error('Error obteniendo credenciales desde Secret Manager', error);
    callback({
      user: process.env.MAIL_USER || process.env.SMTP_USER,
      pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
      uri: process.env.MONGODB_URI
    });
  }
};

module.exports.conectar = async function() {
  return new Promise((resolve) => {
    module.exports.obtenerOptions((opts) => {
      if (opts && opts.user && opts.pass) {
        transporter.options.auth.user = opts.user;
        transporter.options.auth.pass = opts.pass;
      }
      resolve(opts);
    });
  });
};

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

if (require.main === module) {
  module.exports.obtenerOptions((options) => {
    console.log('Opciones obtenidas:', options);
  });
}
