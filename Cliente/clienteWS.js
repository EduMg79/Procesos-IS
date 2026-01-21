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
      console.log('partidaCreada', datos);
      cli.codigo=datos.codigo;
      
      // Si es Football Grid, mostrar tablero inmediatamente con equipos
      if (datos.modo === 'footballgrid' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroFootballGrid === 'function'){
        cw.mostrarTableroFootballGrid({
          tablero: Array(3).fill(null).map(() => Array(3).fill(null)),
          equiposFilas: datos.equiposFilas,
          equiposColumnas: datos.equiposColumnas,
          jugadores: [cli.email],
          turnoActual: null,
          ganador: null
        });
      } else if (datos.modo === 'basketballgrid' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroBasketballGrid === 'function'){
        cw.mostrarTableroBasketballGrid({
          tablero: Array(3).fill(null).map(() => Array(3).fill(null)),
          equiposFilas: datos.equiposFilas,
          equiposColumnas: datos.equiposColumnas,
          jugadores: [cli.email],
          turnoActual: null,
          ganador: null
        });
      } else if (datos.modo === 'ultimatettt' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroUltimateTTT === 'function'){
        // Crear tableros vacíos para Ultimate TTT
        const tableroGrande = Array(3).fill(null).map(() => Array(3).fill(null));
        const tablerosPequenos = [];
        for(let i=0; i<3; i++){
          tablerosPequenos[i] = [];
          for(let j=0; j<3; j++){
            tablerosPequenos[i][j] = [];
            for(let k=0; k<3; k++){
              tablerosPequenos[i][j][k] = [null, null, null];
            }
          }
        }
        cw.mostrarTableroUltimateTTT({
          tablero: tableroGrande,
          tablerosPequenos: tablerosPequenos,
          jugadores: [cli.email],
          turnoActual: null,
          ganador: null,
          tableroObligatorio: null
        });
      } else if (!datos.esIA && typeof cw !== 'undefined' && cw && typeof cw.mostrarEsperandoRival === 'function'){
        // Solo mostrar esperando rival si NO es IA
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

    this.socket.on("inicioJuego",function(datos){
      console.log('inicioJuego', datos);
      if (!tieneSesion()){
        return;
      }
      // Detectar modo de juego
      if (datos.modo === 'footballgrid' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroFootballGrid === 'function'){
        cw.mostrarTableroFootballGrid(datos);
      } else if (datos.modo === 'basketballgrid' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroBasketballGrid === 'function'){
        cw.mostrarTableroBasketballGrid(datos);
      } else if (datos.modo === 'ultimatettt' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroUltimateTTT === 'function'){
        cw.mostrarTableroUltimateTTT(datos);
      } else if (typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroJuego === 'function'){
        cw.mostrarTableroJuego(datos);
      }
    });

    this.socket.on("estadoJuego",function(datos){
      console.log('estadoJuego', datos);
      if (!tieneSesion()){
        return;
      }
      // Detectar modo de juego
      if (datos.modo === 'footballgrid' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroFootballGrid === 'function'){
        cw.mostrarTableroFootballGrid(datos);
      } else if (datos.modo === 'basketballgrid' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroBasketballGrid === 'function'){
        cw.mostrarTableroBasketballGrid(datos);
      } else if (datos.modo === 'ultimatettt' && typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroUltimateTTT === 'function'){
        cw.mostrarTableroUltimateTTT(datos);
      } else if (typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroJuego === 'function'){
        cw.mostrarTableroJuego(datos);
      }
    });

    this.socket.on("movimientoRealizado",function(datos){
      console.log('movimientoRealizado', datos);
      if (!tieneSesion()){
        return;
      }
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroJuego === 'function'){
        cw.mostrarTableroJuego(datos);
      }
    });

    this.socket.on("movimientoRealizadoFootballGrid",function(datos){
      console.log('movimientoRealizadoFootballGrid', datos);
      if (!tieneSesion()){
        return;
      }
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroFootballGrid === 'function'){
        cw.mostrarTableroFootballGrid(datos);
      }
    });

    this.socket.on("movimientoRealizadoBasketballGrid",function(datos){
      console.log('movimientoRealizadoBasketballGrid', datos);
      if (!tieneSesion()){
        return;
      }
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroBasketballGrid === 'function'){
        cw.mostrarTableroBasketballGrid(datos);
      }
    });

    this.socket.on("movimientoRealizadoUltimateTTT",function(datos){
      console.log('movimientoRealizadoUltimateTTT', datos);
      if (!tieneSesion()){
        return;
      }
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarTableroUltimateTTT === 'function'){
        cw.mostrarTableroUltimateTTT(datos);
      }
    });

    this.socket.on("errorTurno",function(datos){
      console.log('errorTurno', datos);
      if (datos && datos.msg){
        // Cerrar modal si está abierto
        $("#modal-buscar-jugador").remove();
        
        // Mostrar alerta temporal al jugador que perdió el turno
        setTimeout(() => {
          if (typeof cw !== 'undefined' && cw && typeof cw.mostrarMensajeTemporal === 'function'){
            cw.mostrarMensajeTemporal(`❌ ${datos.msg} - Pierdes el turno`, 'error');
          } else {
            alert(datos.msg);
          }
        }, 100);
      }
    });

    this.socket.on("error",function(datos){
      console.error('Error del servidor:', datos);
      if (datos && datos.msg){
        alert(datos.msg);
      }
    });

    this.socket.on("resultadosBusquedaJugadores",function(datos){
      console.log('resultadosBusquedaJugadores', datos);
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarResultadosBusqueda === 'function'){
        cw.mostrarResultadosBusqueda(datos.jugadores || []);
      }
    });

    this.socket.on("resultadosBusquedaJugadoresNBA",function(datos){
      console.log('resultadosBusquedaJugadoresNBA', datos);
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarResultadosBusquedaNBA === 'function'){
        cw.mostrarResultadosBusquedaNBA(datos.jugadores || []);
      }
    });

    this.socket.on("actualizarTiempo",function(datos){
      if (datos && typeof datos.tiempo !== 'undefined'){
        if (typeof cw !== 'undefined' && cw && typeof cw.actualizarTemporizador === 'function'){
          cw.actualizarTemporizador(datos.tiempo);
        }
      }
    });

    this.socket.on("tiempoAgotado",function(){
      if (typeof cw !== 'undefined' && cw && typeof cw.mostrarMensajeTemporal === 'function'){
        cw.mostrarMensajeTemporal('⏰ ¡Tiempo agotado! El turno pasa al siguiente jugador', 'warning');
      }
    });

    this.socket.on("mensajeChat",function(datos){
      if (datos && datos.email && datos.mensaje){
        if (typeof cw !== 'undefined' && cw && typeof cw.agregarMensajeChat === 'function'){
          cw.agregarMensajeChat(datos.email, datos.mensaje, datos.timestamp);
        }
      }
    });
  }

  this.crearPartida=function(tamano){
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
    this.socket.emit("crearPartida",{"email":this.email, "tamano": tamano || 3, "esIA": false});
  };

  this.crearPartidaIA=function(tamano, dificultad){
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
    this.socket.emit("crearPartida",{"email":this.email, "tamano": tamano || 3, "esIA": true, "dificultadIA": dificultad || 'facil'});
  };

  this.crearPartidaFootballGrid=function(){
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
    this.socket.emit("crearPartida",{"email":this.email, "tamano": 3, "esIA": false, "modoJuego": "footballgrid"});
  };

  this.crearPartidaBasketballGrid=function(){
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
    this.socket.emit("crearPartida",{"email":this.email, "tamano": 3, "esIA": false, "modoJuego": "basketballgrid"});
  };

  this.crearPartidaUltimateTTT=function(){
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
    this.socket.emit("crearPartida",{"email":this.email, "tamano": 3, "esIA": false, "modoJuego": "ultimatettt"});
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

  this.realizarMovimiento=function(fila, columna){
    if (!this.socket || !this.codigo){
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
    this.socket.emit("realizarMovimiento",{
      "email":this.email,
      "codigo":this.codigo,
      "fila":fila,
      "columna":columna
    });
  };

  this.realizarMovimientoFootballGrid=function(fila, columna, nombreJugador){
    if (!this.socket || !this.codigo){
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
    this.socket.emit("realizarMovimientoFootballGrid",{
      "email":this.email,
      "codigo":this.codigo,
      "fila":fila,
      "columna":columna,
      "nombreJugador":nombreJugador
    });
  };

  this.realizarMovimientoBasketballGrid=function(fila, columna, nombreJugador){
    if (!this.socket || !this.codigo){
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
    this.socket.emit("realizarMovimientoBasketballGrid",{
      "email":this.email,
      "codigo":this.codigo,
      "fila":fila,
      "columna":columna,
      "nombreJugador":nombreJugador
    });
  };

  this.realizarMovimientoUltimateTTT=function(bigRow, bigCol, smallRow, smallCol){
    if (!this.socket || !this.codigo){
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
    this.socket.emit("realizarMovimientoUltimateTTT",{
      "email":this.email,
      "codigo":this.codigo,
      "bigRow":bigRow,
      "bigCol":bigCol,
      "smallRow":smallRow,
      "smallCol":smallCol
    });
  };

  this.buscarJugadores=function(query, equipo1, equipo2){
    if (!this.socket){
      return;
    }
    this.socket.emit("buscarJugadores",{
      "query":query,
      "equipo1":equipo1,
      "equipo2":equipo2
    });
  };

  this.buscarJugadoresNBA=function(query, equipo1, equipo2){
    if (!this.socket){
      return;
    }
    this.socket.emit("buscarJugadoresNBA",{
      "query":query,
      "equipo1":equipo1,
      "equipo2":equipo2
    });
  };

  this.enviarMensajeChat=function(mensaje){
    if (!this.socket || !this.codigo || !mensaje || mensaje.trim() === ''){
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
    this.socket.emit("enviarMensajeChat",{
      "email":this.email,
      "codigo":this.codigo,
      "mensaje":mensaje.trim()
    });
  };

  this.ini();
}

// asegurar exportación global
if (typeof window !== 'undefined') {
  window.ClienteWS = ClienteWS;
}