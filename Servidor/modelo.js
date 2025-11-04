function Sistema(){
const datos=require("./cad.js");

this.usuarios={};
this.cad=new datos.CAD();
this.cad.conectar(function(db){
 console.log("Conectado a Mongo Atlas");
});

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
}
function Usuario(nick){
 this.nick=nick;
}
module.exports.Sistema = Sistema;