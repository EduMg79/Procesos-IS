import dotenv from "dotenv";
dotenv.config();

const apiKey = secretos.env.API_KEY;

const fs = require("fs");
const passport=require("passport");
const cookieSession=require("cookie-session");
// Usar la ruta con la misma mayúscula que la carpeta para evitar problemas en despliegues Linux/macOS
require("./Servidor/passport-setup.js");
const path = require('path');
const express = require('express');
const app = express();
const modelo = require("./Servidor/modelo.js");
const PORT = process.env.PORT || 3000;
let sistema = new modelo.Sistema();
// Servir archivos estáticos desde la carpeta 'Cliente' (ojo a mayúsculas en despliegue)
app.use(express.static(path.join(__dirname, 'Cliente')));
// También servir estáticos bajo /Cliente para compatibilidad con rutas profundas
app.use('/Cliente', express.static(path.join(__dirname, 'Cliente')));

app.use(cookieSession({
 name: 'Sistema',
 keys: ['key1', 'key2']
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/auth/google",passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/google/callback',
 passport.authenticate('google', { failureRedirect: '/fallo' }),
 function(req, res) {
 res.redirect('/good');
});

app.get("/good", function(request,response){
 let nick=request.user.emails[0].value;
 if (nick){
 sistema.agregarUsuario(nick);
 }
 //console.log(request.user.emails[0].value);
 response.cookie('nick',nick);
 response.redirect('/');
});

app.get("/fallo",function(request,response){
 response.send({nick:"nook"})
});


app.get("/agregarUsuario/:nick", function(request, response) {
    let nick = request.params.nick;
    let existed = sistema.usuarioActivo(nick);
    if (existed) {
        response.status(409).json({ ok: false });
    } else {
        let res = sistema.agregarUsuario(nick);
        response.status(200).json(res);
    }
    
});

app.get("/obtenerUsuarios", function(request, response) {
    let res = sistema.obtenerUsuarios();
    response.send(res);
});

app.get("/usuarioActivo/:nick", function(request, response) {
    let nick = request.params.nick;
    let res = sistema.usuarioActivo(nick);
    response.send(res);
});

app.get("/numeroUsuarios", function(request, response) {
    let res = sistema.numeroUsuarios();
    response.send(res);
});

app.get("/eliminarUsuario/:nick", function(request, response) {
    let nick = request.params.nick;
    let existed = sistema.usuarioActivo(nick);
    if (existed) {
        sistema.eliminarUsuario(nick);
        response.json({ ok: true });
    } else {
        response.json({ ok: false });
    }
});

// Servir favicon para evitar "Cannot GET /favicon.ico" cuando se visite tu app
app.get('/favicon.ico', function(req, res){
    res.sendFile(path.join(__dirname, 'Cliente', 'img', 'android_dark_rd_ctn@2x.png'));
});

app.listen(PORT, () => {
    console.log(`App está escuchando en el puerto ${PORT}`);
    console.log('Ctrl+C para salir');
});

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, 'Cliente', 'index.html'));
});
