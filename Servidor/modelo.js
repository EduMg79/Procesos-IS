
const bcrypt = require('bcrypt');

function Sistema(){
const datos=require("./cad.js");

this.usuarios={};
this.cad=new datos.CAD();
this.cad.conectar(function(db){
 console.log("Conectado a Mongo Atlas");
});


this.loginUsuario = function(obj, callback) {
  let modelo = this;

  this.cad.buscarUsuario({ "email": obj.email, "confirmada": true }, function(usr) {
    if (!usr) {
      callback({ "email": -1 });
      return -1;
    } else {
      bcrypt.compare(obj.password, usr.password, function(err, result) {
        if (result) {
          callback(usr);
          modelo.agregarUsuario(usr);
        } else {
          callback({ "email": -1 });
        }
      });
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

this.registrarUsuario = function (obj, callback) {
    let modelo = this;
    if (!obj.nick) {
        obj.nick = obj.email;
    }
    this.cad.buscarUsuario({ "email": obj.email }, async function (usr) {
        if (!usr) {
            // Simplificado: confirmada directamente sin email de confirmación
            obj.confirmada = true;
            const hash = await bcrypt.hash(obj.password, 10);
            obj.password = hash;
            modelo.cad.insertarUsuario(obj, function (res) {
                callback(res);
            });
        } else {
            callback({ "email": -1 });
        }
    });
};


}
function Usuario(nick){
 this.nick=nick;
}
module.exports.Sistema = Sistema;