const fs = require("fs");
const express = require('express');
const app = express();
const modelo = require("./Servidor/modelo.js");
const PORT = process.env.PORT || 3000;
let sistema = new modelo.Sistema();
app.use(express.static(__dirname + "/"));

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

app.listen(PORT, () => {
    console.log(`App está escuchando en el puerto ${PORT}`);
    console.log('Ctrl+C para salir');
});