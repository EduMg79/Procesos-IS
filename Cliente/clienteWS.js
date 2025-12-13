function ClienteWS(){
  this.socket = undefined;
  this.email = undefined;
  this.codigo = undefined;

  this.ini = function(){
    this.socket = io.connect();
    this.lanzarServidorWS();
  };

  // Suscribe manejadores WS del lado cliente
  this.lanzarServidorWS=function(){
    if (!this.socket){
      return;
    }
    const cli=this;
    this.socket.on("partidaCreada",function(datos){
      console.log(datos.codigo);
      cli.codigo=datos.codigo;
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarEsperandoRival === 'function'){
        cw.mostrarEsperandoRival();
      }
    });

    this.socket.on("listaPartidas",function(lista){
      console.log(lista);
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarListaPartidas === 'function'){
        cw.mostrarListaPartidas(lista);
      }
    });

    this.socket.on("unidoAPartida",function(datos){
      console.log('unidoAPartida', datos);
      if (datos && datos.codigo){
        cli.codigo = datos.codigo;
      }
    });

    this.socket.on("jugadorUnido",function(datos){
      console.log('jugadorUnido', datos);
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarJugadorUnido === 'function'){
        cw.mostrarJugadorUnido(datos);
      }
    });

    this.socket.on("partidaEliminada",function(datos){
      console.log('partidaEliminada', datos);
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarPartidaEliminada === 'function'){
        cw.mostrarPartidaEliminada(datos);
      }
    });
  }

  this.crearPartida=function(){
    if (!this.socket){
      return;
    }
    this.socket.emit("crearPartida",{"email":this.email});
  };

  this.unirAPartida=function(codigo){
    if (!this.socket){
      return;
    }
    this.socket.emit("unirAPartida",{"email":this.email,"codigo":codigo});
  };

  this.eliminarPartida=function(codigo){
    if (!this.socket){
      return;
    }
    this.socket.emit("eliminarPartida",{"nick":this.nick,"codigo":codigo});
  };

  this.ini();
}

// asegurar exportación global
if (typeof window !== 'undefined') {
  window.ClienteWS = ClienteWS;
}