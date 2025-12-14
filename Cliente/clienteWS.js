function ClienteWS(){
  this.socket = undefined;
  this.email = undefined;
  this.codigo = undefined;

  const tieneSesion = function(){
    try {
      return (typeof $ !== 'undefined' && typeof $.cookie === 'function') ? $.cookie('nick') : null;
    } catch(e){
      return null;
    }
  };

  this.setEmail = function(email){
    this.email = email;
    // Si ya estamos conectados, pedir estado para restaurar UI tras refresh
    try {
      if (this.socket){
        this.socket.emit('estadoUsuario', { email: this.email });
      }
    } catch(e) {}
  };

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

    // Al conectar, pedir estado si ya conocemos el email
    this.socket.on('connect', function(){
      try {
        if (cli.email){
          cli.socket.emit('estadoUsuario', { email: cli.email });
        }
      } catch(e) {}
    });

    this.socket.on('estadoUsuario', function(datos){
      if (!datos || !datos.ok){
        return;
      }
      if (datos.codigo){
        cli.codigo = datos.codigo;
      }
      if (datos.esperando && typeof cw !== 'undefined' && cw && typeof cw.mostrarEsperandoRival === 'function'){
        cw.mostrarEsperandoRival();
      }
    });

    this.socket.on("partidaCreada",function(datos){
      console.log(datos.codigo);
      cli.codigo=datos.codigo;
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarEsperandoRival === 'function'){
        cw.mostrarEsperandoRival();
      }
    });

    this.socket.on("listaPartidas",function(lista){
      console.log(lista);
      // Por requisito: solo mostrar partidas con sesión iniciada
      if (!tieneSesion()){
        return;
      }
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
      if (!tieneSesion()){
        return;
      }
      if (datos && datos.codigo){
        cli.codigo = datos.codigo;
      }
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarJugadorUnido === 'function'){
        cw.mostrarJugadorUnido(datos);
      }
    });

    // Fallback: si por lo que sea no estamos en la sala, filtramos por código
    this.socket.on('jugadorUnidoGlobal', function(datos){
      try {
        if (!tieneSesion()) return;
        if (!datos || !datos.codigo) return;
        if (!cli.codigo) return;
        if (String(datos.codigo) !== String(cli.codigo)) return;
        if (typeof cw !== 'undefined' && cw && typeof cw.mostrarJugadorUnido === 'function'){
          cw.mostrarJugadorUnido(datos);
        }
      } catch(e) {}
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
    // Robustez: asegurar email desde cookie de sesión
    try {
      if (!this.email){
        const nick = (typeof $ !== 'undefined' && typeof $.cookie === 'function') ? $.cookie('nick') : null;
        if (nick){
          this.email = nick;
        }
      }
    } catch(e) {}
    this.socket.emit("crearPartida",{"email":this.email});
  };

  this.unirAPartida=function(codigo){
    if (!this.socket){
      return;
    }
    // Robustez: asegurar email desde cookie de sesión
    try {
      if (!this.email){
        const nick = (typeof $ !== 'undefined' && typeof $.cookie === 'function') ? $.cookie('nick') : null;
        if (nick){
          this.email = nick;
        }
      }
    } catch(e) {}
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