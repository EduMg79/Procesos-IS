// const bcrypt = require('bcrypt');

function Sistema(){
// const datos=require("./cad.js");
// const correo=require("./email.js");

this.usuarios={};
this.partidas={};
// this.cad=new datos.CAD();
// this.cad.conectar(function(db){
//  console.log("Conectado a Mongo Atlas");
// });


this.loginUsuario = function(obj, callback) {
    const modelo = this;
    // Buscar por email sin forzar confirmada para poder dar mensajes claros
    if (!this.cad || typeof this.cad.buscarUsuario !== 'function') {
        return callback({ email: -1 }, 'CAD no disponible en cliente');
    }
    this.cad.buscarUsuario({ email: obj.email }, function(usr) {
        if (!usr) {
            console.log('[login] usuario no encontrado:', obj.email);
            return callback({ email: -1 }, 'Usuario no registrado');
        }

        const stored = usr.password || '';
        const isBcrypt = typeof stored === 'string' && stored.startsWith('$2') && stored.length >= 50;

        const onPasswordOk = function() {
            if (usr.confirmada === false) {
                console.log('[login] cuenta no confirmada:', obj.email);
                return callback({ email: -1 }, 'Cuenta no confirmada. Revisa tu correo.');
            }
            // Alta en usuarios en memoria utilizando el email como nick
            try { modelo.agregarUsuario(usr.email); } catch(e) { }
            console.log('[login] OK:', obj.email);
            return callback(usr);
        };

        if (isBcrypt) {
            // bcrypt.compare(obj.password, stored, function(err, result) { ... })
            return callback({ email: -1 }, 'Validación local no disponible');
        } else {
            if (obj.password === stored) {
                return onPasswordOk();
            } else {
                console.log('[login] contraseña incorrecta (plano)');
                return callback({ email: -1 }, 'Contraseña incorrecta');
            }
        }
    });
}

this.usuarioGoogle=function(usr,callback){
if (this.cad && typeof this.cad.buscarOCrearUsuario === 'function'){
this.cad.buscarOCrearUsuario(usr,function(obj){
callback(obj);
});
} else {
callback(usr);
}
}
 this.usuarios={};

         this.agregarUsuario = function(nick) {
                let res = { "nick": -1 };
                if (!this.usuarios[nick]) {
                        this.usuarios[nick] = new Usuario(nick);
                        res.nick = nick;
                } else {
                        console.log("el nick " + nick + " está en uso");
                }
                return res;
        }
        this.obtenerCodigo=function(){
            let codigo;
            do {
                codigo = Math.random().toString(36).substr(2,6);
            } while (this.partidas[codigo]);
            return codigo;
        }

        this.crearPartida=function(email){
            const usr=this.usuarios[email];
            if (!usr){
                return {codigo:-1};
            }
            const codigo=this.obtenerCodigo();
            const partida=new Partida(codigo);
            partida.jugadores.push(usr);
            this.partidas[codigo]=partida;
            usr.partida=codigo;
            return {codigo:codigo};
        }

        this.unirAPartida=function(email,codigo){
            const usr=this.usuarios[email];
            const partida=this.partidas[codigo];
            if (!usr || !partida){
                console.log("usuario o partida no existen");
                return {codigo:-1};
            }
            if (usr.partida && usr.partida!==codigo){
                console.log("el usuario ya está en otra partida");
                return {codigo:usr.partida};
            }
            if (partida.jugadores.length>=partida.maxJug){
                console.log("partida completa, no se aceptan mas jugadores");
                return {codigo:-1};
            }
            if (!partida.jugadores.includes(usr)){
                partida.jugadores.push(usr);
            }
            usr.partida=codigo;
            console.log("usuario " + email + " se ha unido a la partida " + codigo);
            return {codigo:codigo};
        }

        this.obtenerPartidasDisponibles=function(){
        const lista = [];
        for(const codigo in this.partidas){
            const partida = this.partidas[codigo];
            if(!partida){
                continue;
            }
            const hayHueco = partida.jugadores.length < partida.maxJug;
            if(!hayHueco){
                continue;
            }

            const creador = partida.jugadores[0];
            lista.push({
                codigo: partida.codigo,
                email : creador ? (creador.email || creador.nick) : null
            });
        }
        return lista;
    };

this.buscarUsuario=function(obj,callback){
        if (this.cad && typeof this.cad.buscarUsuario === 'function')
                this.cad.buscarUsuario(obj,callback);
}

this.insertarUsuario=function(usuario,callback){
        if (this.cad && typeof this.cad.insertarUsuario === 'function')
                this.cad.insertarUsuario(usuario,callback);
}




 this.obtenerUsuarios=function(){
        return this.usuarios;
}
this.usuarioActivo=function(nick){
        if(this.usuarios[nick]){
                return true;
        }
        return false;
}
this.eliminarUsuario=function(nick){
        if(this.usuarios[nick]){
                delete this.usuarios[nick];
        }
}
this.numeroUsuarios=function(){
        return {num: Object.keys(this.usuarios).length
}}

this.registrarUsuario = function(obj, callback) {
    let modelo = this;

    if (!obj.nick) {
        obj.nick = obj.email;
    }

    if (!this.cad || typeof this.cad.buscarUsuario !== 'function'){
        return callback({ "email": -1 });
    }

    this.cad.buscarUsuario({email: obj.email}, function(usr) {
        if (!usr) {
            obj.key = Date.now().toString();
            obj.confirmada = false;
            const continuar = function(){
                if (modelo.cad && typeof modelo.cad.insertarUsuario === 'function'){
                    modelo.cad.insertarUsuario(obj, function(res) {
                        callback(res);
                    });
                } else {
                    callback(obj);
                }
            };
            continuar();
        } else {
            callback({ "email": -1 });
        }
    });
};


this.confirmarUsuario=function(obj,callback){
let modelo=this;
if (!this.cad || typeof this.cad.buscarUsuario !== 'function'){
    return callback({"email":-1});
}
this.cad.buscarUsuario({"email":obj.email,"confirmada":false,"key":obj.key},function(usr){
if (usr){
usr.confirmada=true;
if (modelo.cad && typeof modelo.cad.actualizarUsuario === 'function'){
modelo.cad.actualizarUsuario(usr,function(res){
callback({"email":res.email});
})
}
}
else
{
callback({"email":-1});
}
})
}

}
function Usuario(nick){
 this.nick=nick;
}

function Partida(codigo){
this.codigo = codigo;
this.jugadores = [];
this.maxJug = 2;
}
// module.exports.Sistema = Sistema;