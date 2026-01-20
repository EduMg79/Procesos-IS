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
const httpServer = require('http').Server(app);
const { Server } = require('socket.io');
const moduloWS = require("./Servidor/servidorWS.js");
let ws = new moduloWS.ServidorWS();
let io = new Server(httpServer);

const https = require('https');
const modelo = require("./Servidor/modelo.js");
// Cloud Run proporciona PORT (normalmente 8080); fallback a 3000 en local
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

// Detrás de proxy (Cloud Run) para que req.secure y x-forwarded-proto funcionen
app.set('trust proxy', 1);

// Helper para setear cookie 'nick' con atributos adecuados (SameSite=None; Secure en HTTPS)
function setNickCookie(req, res, value){
    const forwardedProto = (req.headers && req.headers['x-forwarded-proto']) || '';
    const baseUrl = process.env.BASE_URL || process.env.APP_BASE_URL || '';
    const isHttpsEnv = baseUrl.startsWith('https://') || forwardedProto === 'https' || req.secure;
    const opts = { path: '/' };
    if (isHttpsEnv){
        opts.sameSite = 'None';
        opts.secure = true;
    } else {
        opts.sameSite = 'Lax';
    }
    try { res.cookie('nick', value, opts); } catch(e) {}
}

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

app.get('/google/callback',
 passport.authenticate('google', { failureRedirect: '/fallo' }),
 function(req, res) {
 res.redirect('/good');
});
// One Tap se maneja con verificación manual en la ruta POST /oneTap/callback (ver más abajo)
app.get("/good", function(request,response){
 let email=request.user.emails[0].value;
 sistema.usuarioGoogle({"email":email},function(obj){
setNickCookie(request, response, obj.email);
 // Marcar usuario activo también para flujo Google / One Tap
 sistema.agregarUsuario(obj.email);
 response.redirect('/');
});
});
app.get("/fallo",function(request,response){
 // Unificar semántica de fallo: nick:-1 y status 401
 response.status(401).json({nick:-1,error:"Credenciales inválidas, cuenta no confirmada o error en autenticación."});
});


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
setNickCookie(request, response, usr.email);
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
            setNickCookie(req, res, user.email);
            return res.send({ok:true,nick:user.email,email:user.email});
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
    console.log('[oneTap] POST recibido');
    const id_token = req.body.credential;
    if (!id_token){
        console.log('[oneTap] credential ausente en body');
        return res.status(400).send('credential missing');
    }
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
                    console.log('[oneTap] Audiencia inválida. Esperada:', expectedAud, 'Recibida:', tokenInfo.aud);
                    return res.status(401).send('Invalid audience');
                }
                const email = tokenInfo.email;
                if (!email){
                    console.log('[oneTap] Token sin email');
                    return res.status(400).send('No email in token');
                }
                // Register or update user in the system
                if (sistema && typeof sistema.agregarUsuario === 'function'){
                    sistema.agregarUsuario(email);
                }
                setNickCookie(req, res, email);
                console.log('[oneTap] Login OK para', email);
                return res.send({ ok: true, nick: email });
            } catch (e) {
                console.log('[oneTap] Error parseando token:', e);
                return res.status(500).send('Token verification failed');
            }
        });
    }).on('error', (err) => {
        console.log('[oneTap] Error en petición de verificación:', err);
        return res.status(500).send('Verification request failed');
    });
});

// (El flujo de One Tap se maneja en la ruta POST /oneTap/callback con verificación manual)

// GET handler for /oneTap/callback to prevent 'Cannot GET' error
app.get('/oneTap/callback', (req, res) => {
    res.redirect('/');
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

app.get("/obtenerEstadisticas/:email", function(request, response) {
    let email = request.params.email;
    sistema.obtenerEstadisticas(email, function(estadisticas){
        response.json(estadisticas);
    });
});

app.get("/obtenerPerfil/:email", function(request, response) {
    let email = request.params.email;
    sistema.obtenerPerfil(email, function(perfil){
        response.json(perfil);
    });
});

app.post("/actualizarPerfil", function(request, response) {
    let email = request.body.email;
    let datosNuevos = {
        nick: request.body.nick,
        fotoPerfil: request.body.fotoPerfil
    };
    sistema.actualizarPerfil(email, datosNuevos, function(resultado){
        response.json(resultado);
    });
});

app.get("/obtenerLogros/:email", function(request, response) {
    let email = request.params.email;
    sistema.verificarYOtorgarLogros(email, function(logros){
        response.json({logros: logros});
    });
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
        try { response.clearCookie('nick', { path: '/', sameSite: 'None', secure: true }); } catch(e) { response.clearCookie('nick'); }
        response.redirect('/');
    });
});

// Servir favicon para evitar "Cannot GET /favicon.ico" cuando se visite tu app
app.get('/favicon.ico', function(req, res){
    res.sendFile(path.join(__dirname, 'Cliente', 'img', 'android_dark_rd_ctn@2x.png'));
});

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, 'Cliente', 'index.html'));
});

httpServer.listen(PORT, () => {
console.log(`App está escuchando en el puerto ${PORT}`);
console.log('Ctrl+C para salir');
});
ws.lanzarServidor(io, sistema);
