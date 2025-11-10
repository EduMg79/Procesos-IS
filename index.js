

const bodyParser=require("body-parser");

const fs = require("fs");
const passport=require("passport");
const cookieSession=require("cookie-session");
// Usar la ruta con la misma mayúscula que la carpeta para evitar problemas en despliegues Linux/macOS
require("./Servidor/passport-setup.js");
const path = require('path');
const express = require('express');
const app = express();
const https = require('https');
const modelo = require("./Servidor/modelo.js");
const PORT = process.env.PORT || 3000;
let sistema = new modelo.Sistema();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
// Servir archivos estáticos desde la carpeta 'Cliente' (ojo a mayúsculas en despliegue)
app.use(express.static(path.join(__dirname, 'Cliente')));
// También servir estáticos bajo /Cliente para compatibilidad con rutas profundas
app.use('/Cliente', express.static(path.join(__dirname, 'Cliente')));

// Parse bodies for One Tap and other POSTs
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieSession({
 name: 'Sistema',
 keys: ['key1', 'key2']
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/auth/google",passport.authenticate('google', { scope: ['profile','email'] }));

// Callback de Google OAuth: coincide con callbackURL en Servidor/passport-setup.js
app.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/fallo' }),
    function(request, response) {
        try {
            const nick = (request.user && (request.user.emails && request.user.emails[0] && request.user.emails[0].value)) || '';
            if (nick && sistema && typeof sistema.agregarUsuario === 'function'){
                sistema.agregarUsuario(nick);
            }
            if (nick) {
                response.cookie('nick', nick);
            }
        } catch (e) {
            // continuar aunque falle el alta
        }
        response.redirect('/');
    }
);

this.registrarUsuario = function(email, password) {
  $.ajax({
    type: 'POST',
    url: '/registrarUsuario',
    data: JSON.stringify({ "email": email, "password": password }),
    success: function(data) {
      if (data.nick != -1) {
        console.log("Usuario " + data.nick + " ha sido registrado");
        $.cookie("nick", data.nick);
        cw.limpiar();
        cw.mostrarMensaje("Bienvenido al sistema, " + data.nick);
        // cw.mostrarLogin();
      } else {
        console.log("El nick está ocupado");
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      console.log("Status: " + textStatus);
      console.log("Error: " + errorThrown);
    },
    contentType: 'application/json'
  });
};


app.post("/registrarUsuario", function(request, response) {
    sistema.registrarUsuario(request.body, function(res) {
        if (res && res.email && res.email !== -1) {
            response.send({ ok: true, nick: res.email, msg: `Usuario <b>${res.email}</b> registrado correctamente.` });
        } else {
            response.status(409).send({ ok: false, msg: `El usuario ya está registrado.` });
        }
    });
});


this.loginUsuario = function(email, password) {
  $.ajax({
    type: 'POST',
    url: '/loginUsuario',
    data: JSON.stringify({ "email": email, "password": password }),
    success: function(data) {
      if (data.nick != -1) {
        console.log("Usuario " + data.nick + " ha sido registrado");
        $.cookie("nick", data.nick);
        cw.limpiar();
        cw.mostrarMensaje("Bienvenido al sistema, " + data.nick);
        // cw.mostrarLogin();
      } else {
        console.log("No se pudo iniciar sesión");
        cw.mostrarLogin();
        // cw.mostrarMensajeLogin("No se pudo iniciar sesión");
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      console.log("Status: " + textStatus);
      console.log("Error: " + errorThrown);
    },
    contentType: 'application/json'
  });
}

app.post('/loginUsuario', function(req, res){
    const { email, password } = req.body || {};
    if (!email || !password){
        return res.status(400).send({ ok:false, msg:'Faltan credenciales' });
    }
    sistema.loginUsuario({ email, password }, function(result){
        if (result && result.email && result.email !== -1){
            res.cookie('nick', result.email);
            return res.send({ ok:true, nick: result.email });
        } else {
            return res.status(401).send({ ok:false, msg:'Credenciales inválidas' });
        }
    });
});




// Endpoint to receive Google One Tap credential (id_token)
app.post('/oneTap/callback', (req, res) => {
    const id_token = req.body.credential;
    if (!id_token) return res.status(400).send('credential missing');
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`;
    https.get(verifyUrl, (verifyRes) => {
        let data = '';
        verifyRes.on('data', chunk => data += chunk);
        verifyRes.on('end', () => {
            try {
                const tokenInfo = JSON.parse(data);
                // Validate audience matches your client id
                if (tokenInfo.aud !== '747124604783-2dbkftslri635jj8abl4jfvq05fcu59d.apps.googleusercontent.com') {
                    return res.status(401).send('Invalid audience');
                }
                const email = tokenInfo.email;
                if (!email) return res.status(400).send('No email in token');
                // Register or update user in the system
                if (sistema && typeof sistema.agregarUsuario === 'function'){
                    sistema.agregarUsuario(email);
                }
                res.cookie('nick', email);
                return res.redirect('/');
            } catch (e) {
                return res.status(500).send('Token verification failed');
            }
        });
    }).on('error', (err) => {
        return res.status(500).send('Verification request failed');
    });
});

app.post('/oneTap/callback',
passport.authenticate('google-one-tap', { failureRedirect: '/fallo' }),
function(req, res) {
// Successful authentication, redirect home.
res.redirect('/good');
});

// GET handler for /oneTap/callback to prevent 'Cannot GET' error
app.get('/oneTap/callback', (req, res) => {
    res.redirect('/');
});


app.get("/good", function(request,response){
let email=request.user.emails[0].value;
sistema.usuarioGoogle({"email":email},function(obj){
response.cookie('nick',obj.email);
response.redirect('/');
});
});

// Eliminado /good duplicado; el flujo se maneja en /google/callback

app.get("/fallo",function(request,response){
 response.send({nick:"nook"})
});


app.get("/agregarUsuario/:nick", function(request, response) {
    let nick = request.params.nick;
    let existed = sistema.usuarioActivo(nick);
    if (existed) {
        response.status(409).json({ ok: false, msg: `El nick <b>${nick}</b> ya está ocupado.` });
    } else {
        let res = sistema.agregarUsuario(nick);
        response.status(200).json({ ok: true, nick: res.nick, msg: `Usuario <b>${nick}</b> registrado correctamente.` });
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
