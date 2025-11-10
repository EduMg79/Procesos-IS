
const bcrypt = require('bcrypt');

function Sistema(){
const datos=require("./cad.js");
const correo=require("./email.js");

this.usuarios={};
this.cad=new datos.CAD();
this.cad.conectar(function(db){
 console.log("Conectado a Mongo Atlas");
});


this.loginUsuario = function(obj, callback) {
  const modelo = this;
  // Buscar por email sin forzar confirmada para poder dar mensajes claros
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
      bcrypt.compare(obj.password, stored, function(err, result) {
        if (err) { console.log('[login] bcrypt error:', err); return callback({ email: -1 }, 'Error validando credenciales'); }
        if (!result) { console.log('[login] contraseña incorrecta (bcrypt)'); return callback({ email: -1 }, 'Contraseña incorrecta'); }
        return onPasswordOk();
      });
    } else {
      // Contraseñas legacy en texto plano
      if (obj.password === stored) {
        // Opcional: migración a bcrypt
        try {
          bcrypt.hash(obj.password, 10).then(function(hash){
            usr.password = hash;
            if (modelo.cad && typeof modelo.cad.actualizarUsuario === 'function'){
              modelo.cad.actualizarUsuario(usr, function(){ /* noop */ });
            }
          }).catch(function(){ /* noop */ });
        } catch(e) { /* noop */ }
        return onPasswordOk();
      } else {
        console.log('[login] contraseña incorrecta (plano)');
        return callback({ email: -1 }, 'Contraseña incorrecta');
      }
    }
  });
}

this.usuarioGoogle=function(usr,callback){
this.cad.buscarOCrearUsuario(usr,function(obj){
callback(obj);
});
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
this.buscarUsuario=function(obj,callback){
    this.cad.buscarUsuario(obj,callback);
}

this.insertarUsuario=function(usuario,callback){
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

  this.cad.buscarUsuario({email: obj.email}, function(usr) {
    if (!usr) {
      // El usuario no existe, luego lo puedo registrar
      obj.key = Date.now().toString();
      obj.confirmada = false; // si quieres permitir login inmediato, pon true

      // Hash de contraseña antes de insertar si viene definida
      const continuar = function(){
        modelo.cad.insertarUsuario(obj, function(res) {
          callback(res);
        });
      };
      if (obj.password) {
        bcrypt.hash(obj.password, 10).then(function(hash){
          obj.password = hash;
          continuar();
        }).catch(function(){ continuar(); });
      } else {
        continuar();
      }

      // Envío de correo opcional (si email está configurado)
      try { if (correo && typeof correo.enviarEmail === 'function') correo.enviarEmail(obj.email, obj.key, "Confirmar cuenta"); } catch(e) {}
    } else {
      callback({ "email": -1 });
    }
  });
};


this.confirmarUsuario=function(obj,callback){
let modelo=this;
this.cad.buscarUsuario({"email":obj.email,"confirmada":false,"key":obj.key},function(usr){
if (usr){
usr.confirmada=true;
modelo.cad.actualizarUsuario(usr,function(res){
callback({"email":res.email}); //callback(res)
})
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
module.exports.Sistema = Sistema;