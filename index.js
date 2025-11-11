require('dotenv').config();
 
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
 name: process.env.SESSION_NAME || 'Sistema',
 keys: (process.env.SESSION_KEYS ? process.env.SESSION_KEYS.split(',') : ['key1','key2'])
}));

app.use(passport.initialize());
app.use(passport.session());

// Estrategia local (email + password) usando sistema.loginUsuario
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
    function(email, password, done) {
        sistema.loginUsuario({ email: email, password: password }, function(user, msg){
            if (user && user.email && user.email !== -1) {
                return done(null, user);
            } else {
                return done(null, false, { message: msg || 'Credenciales inválidas' });
            }
        });
    }
));

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
        cw.mostrarLogin();
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
            // Mensaje adaptado: registro correcto pero pendiente de confirmación
            response.send({ ok: true, nick: res.email, msg: "Registro correcto, falta confirmación" });
        } else {
            response.status(409).send({ ok: false, msg: `El usuario ya está registrado.` });
        }
    });
});

app.get("/confirmarUsuario/:email/:key",function(request,response){
let email=request.params.email;
let key=request.params.key;
sistema.confirmarUsuario({"email":email,"key":key},function(usr){
if (usr.email!=-1){
response.cookie('nick',usr.email);
}
response.redirect('/');
});
})



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

// Endpoint login con Passport Local que devuelve JSON (sin redirecciones)
app.post('/loginUsuario', function(req, res, next){
    passport.authenticate('local', function(err, user){
        if (err){ return res.status(500).send({ok:false,msg:'Error interno'}); }
        if (!user){ return res.status(401).send({ok:false,msg:'Credenciales inválidas'}); }
        req.login(user, function(err2){
            if (err2){ return res.status(500).send({ok:false,msg:'Error creando sesión'}); }
            // Establecer cookie 'nick' con el email
            try { res.cookie('nick', user.email); } catch(e) {}
            return res.send({ok:true,nick:user.email});
        });
    })(req,res,next);
});
app.get("/ok",function(request,response){
response.send({ok:true,nick:request.user.email})
});


const haIniciado=function(request,response,next){
if (request.user){
next();
}
else{
response.redirect("/")
}
}


app.get("/obtenerUsuarios",haIniciado,function(request,response){
let lista=sistema.obtenerUsuarios();
response.send(lista);
})


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
                // Validate audience matches your configured client id
                const expectedAud = process.env.GOOGLE_ONETAP_VERIFY_AUD || process.env.GOOGLE_ONETAP_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
                if (expectedAud && tokenInfo.aud !== expectedAud) {
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
 response.status(401).send({ok:false,msg:"Credenciales inválidas"})
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

// Cerrar sesión y eliminar usuario en memoria
app.get("/cerrarSesion", haIniciado, function(request, response){
    let nick = undefined;
    if (request.user){
        // Para usuarios Google el email viene en emails[0].value
        if (request.user.email){
            nick = request.user.email;
        } else if (request.user.emails && request.user.emails[0] && request.user.emails[0].value){
            nick = request.user.emails[0].value;
        }
    }
    // Passport 0.6 logout requiere callback
    request.logout(function(err){
        if (err){
            return response.status(500).send({ok:false,msg:"Error cerrando sesión"});
        }
        if (nick){
            sistema.eliminarUsuario(nick);
        }
        response.clearCookie('nick');
        response.redirect('/');
    });
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
