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

        this.crearPartida=function(email, tamano){
            const usr=this.usuarios[email];
            if (!usr){
                return {codigo:-1};
            }
            const codigo=this.obtenerCodigo();
            const partida=new Partida(codigo, tamano || 3);
            partida.jugadores.push(usr);
            this.partidas[codigo]=partida;
            usr.partida=codigo;
            return {codigo:codigo, tamano: partida.tamano};
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
            return {codigo:codigo, tamano: partida.tamano};
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

function Partida(codigo, tamano){
this.codigo = codigo;
this.jugadores = [];
this.maxJug = 2;
this.tamano=tamano || 3;
this.tablero=[];
this.turnoActual=null;
this.ganador=null;
this.simbolos={};
this.estado='esperando'; // esperando, jugando, finalizada

// Inicializar tablero vacío
for(let i=0; i<this.tamano; i++){
  this.tablero[i]=[];
  for(let j=0; j<this.tamano; j++){
    this.tablero[i][j]=null;
  }
}

this.iniciarJuego=function(){
  if (this.jugadores.length===2){
    this.simbolos[this.jugadores[0].nick || this.jugadores[0].email]='X';
    this.simbolos[this.jugadores[1].nick || this.jugadores[1].email]='O';
    this.turnoActual=this.jugadores[0].nick || this.jugadores[0].email;
    this.estado='jugando';
  }
}

this.cambiarTurno=function(){
  const email0=this.jugadores[0].nick || this.jugadores[0].email;
  const email1=this.jugadores[1].nick || this.jugadores[1].email;
  this.turnoActual = (this.turnoActual===email0) ? email1 : email0;
}

this.verificarGanador=function(){
  // Verificar filas
  for(let i=0; i<this.tamano; i++){
    let simbolo=this.tablero[i][0];
    if (simbolo && this.tablero[i].every(c=>c===simbolo)){
      return true;
    }
  }
  
  // Verificar columnas
  for(let j=0; j<this.tamano; j++){
    let simbolo=this.tablero[0][j];
    if (simbolo){
      let gana=true;
      for(let i=0; i<this.tamano; i++){
        if (this.tablero[i][j]!==simbolo){
          gana=false;
          break;
        }
      }
      if (gana) return true;
    }
  }
  
  // Verificar diagonal principal
  let simboloDiag=this.tablero[0][0];
  if (simboloDiag){
    let gana=true;
    for(let i=0; i<this.tamano; i++){
      if (this.tablero[i][i]!==simboloDiag){
        gana=false;
        break;
      }
    }
    if (gana) return true;
  }
  
  // Verificar diagonal inversa
  let simboloDiagInv=this.tablero[0][this.tamano-1];
  if (simboloDiagInv){
    let gana=true;
    for(let i=0; i<this.tamano; i++){
      if (this.tablero[i][this.tamano-1-i]!==simboloDiagInv){
        gana=false;
        break;
      }
    }
    if (gana) return true;
  }
  
  return false;
}

this.tableroLleno=function(){
  for(let i=0; i<this.tamano; i++){
    for(let j=0; j<this.tamano; j++){
      if (this.tablero[i][j]===null) return false;
    }
  }
  return true;
}
}
// module.exports.Sistema = Sistema;