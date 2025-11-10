const correo=require("./email.js");


const nodemailer = require('nodemailer');
const url = "http://localhost:3000/"; 
// const url = "https://tu-url-de-despliegue.com/";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'edugonzal45@gmail.com', // 🔹 tu dirección Gmail
    pass: 'kkoz gnap tvxz kyge' // 🔹 clave de aplicación (no tu contraseña normal)
  }
});

module.exports.enviarEmail = async function(direccion, key, men) {
  const result = await transporter.sendMail({
    from: 'edugonzal45@gmail.com',
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
