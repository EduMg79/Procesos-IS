
const bcrypt = require('bcrypt');

function Sistema(){
const datos=require("./cad.js");
const correo=require("./email.js");
const sportsAPI=require("./sportsAPI.js");
const basketballAPI=require("./basketballAPI.js");

this.usuarios={};
this.partidas={};
this.sportsAPI=new sportsAPI.SportsAPI();
this.basketballAPI=new basketballAPI.BasketballAPI();
this.cad=new datos.CAD();
const esPrueba = process.env.NODE_ENV === 'test' || process.env.MODO === 'test';
this.cad.conectar(function(db){
 console.log("Conectado a Mongo Atlas");
 if (!esPrueba && correo && typeof correo.conectar === 'function'){
   correo.conectar().catch(()=>{});
 }
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
  this.obtenerCodigo=function(){
    let codigo;
    do {
      codigo = Math.random().toString(36).substr(2,6);
    } while (this.partidas[codigo]);
    return codigo;
  }

  this.crearPartida=function(email, tamano, esIA, dificultadIA, modoJuego){
    const usr=this.usuarios[email];
    if (!usr){
      return {codigo:-1};
    }
    const codigo=this.obtenerCodigo();
    const modo = modoJuego || '3enraya';
    let partida;
    
    if (modo === 'footballgrid'){
      partida = new PartidaFootballGrid(codigo);
    } else if (modo === 'basketballgrid'){
      partida = new PartidaBasketballGrid(codigo);
    } else if (modo === 'ultimatettt'){
      partida = new PartidaUltimateTTT(codigo);
    } else {
      partida = new Partida(codigo, tamano || 3);
    }
    
    partida.jugadores.push(usr);
    
    if (esIA){
      partida.esIA = true;
      partida.dificultadIA = dificultadIA || 'facil';
      // Agregar jugador IA
      const ia = {nick: 'IA', email: 'IA_' + codigo};
      partida.jugadores.push(ia);
      partida.iniciarJuego();
    }
    
    this.partidas[codigo]=partida;
    usr.partida=codigo;
    
    if (modo === 'footballgrid') {
      return {
        codigo: codigo, 
        modo: 'footballgrid',
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas,
        esIA: esIA
      };
    }
    
    if (modo === 'basketballgrid') {
      return {
        codigo: codigo, 
        modo: 'basketballgrid',
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas,
        esIA: esIA
      };
    }
    
    if (modo === 'ultimatettt') {
      return {
        codigo: codigo, 
        modo: 'ultimatettt',
        esIA: esIA
      };
    }
    
    return {codigo:codigo, tamano: partida.tamano, esIA: esIA, dificultadIA: partida.dificultadIA, modo: '3enraya'};
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
      console.log("partida completa");
      return {codigo:-1};
    }
    if (!partida.jugadores.includes(usr)){
      partida.jugadores.push(usr);
    }
    usr.partida=codigo;
    return {codigo:codigo, tamano: partida.tamano};
  }

  this.realizarMovimiento=function(email, codigo, fila, columna){
    const partida=this.partidas[codigo];
    const usr=this.usuarios[email];
    if (!partida){
      return {ok:false, msg:"Partida no encontrada"};
    }
    
    // En partidas IA, validar que el usuario esté en la partida de manera diferente
    if (partida.esIA){
      const esJugadorValido = partida.jugadores.some(j => {
        return (j.nick === email || j.email === email || j === usr);
      });
      if (!esJugadorValido){
        return {ok:false, msg:"No estás en esta partida"};
      }
    } else {
      if (!usr){
        return {ok:false, msg:"Usuario no encontrado"};
      }
      if (!partida.jugadores.includes(usr)){
        return {ok:false, msg:"No estás en esta partida"};
      }
    }
    
    if (partida.ganador){
      return {ok:false, msg:"La partida ya ha terminado"};
    }
    if (partida.turnoActual !== email){
      return {ok:false, msg:"No es tu turno"};
    }
    if (fila < 0 || fila >= partida.tamano || columna < 0 || columna >= partida.tamano){
      return {ok:false, msg:"Posición fuera del tablero"};
    }
    if (partida.tablero[fila][columna] !== null){
      return {ok:false, msg:"Casilla ocupada"};
    }
    
    // Realizar movimiento
    const simbolo = partida.simbolos[email];
    partida.tablero[fila][columna] = simbolo;
    
    // Verificar ganador
    const ganador = partida.verificarGanador();
    if (ganador){
      partida.ganador = email;
      partida.estado = 'finalizada';
      
      // Actualizar estadísticas solo en partidas multijugador (no IA)
      if (!partida.esIA && partida.jugadores.length === 2){
        this.actualizarEstadisticas(email, 'victoria');
        const perdedor = partida.jugadores.find(j => (j.email || j.nick) !== email);
        if (perdedor){
          this.actualizarEstadisticas(perdedor.email || perdedor.nick, 'derrota');
        }
      }
      
      return {ok:true, tablero:partida.tablero, ganador:email, simbolo:simbolo, empate:false};
    }
    
    // Verificar empate
    if (partida.tableroLleno()){
      partida.estado = 'finalizada';
      partida.ganador = 'empate';
      return {ok:true, tablero:partida.tablero, empate:true};
    }
    
    // Cambiar turno
    partida.cambiarTurno();
    return {ok:true, tablero:partida.tablero, turnoActual:partida.turnoActual};
  }

  this.movimientoIA=function(codigo){
    const partida=this.partidas[codigo];
    if (!partida || !partida.esIA){
      return {ok:false};
    }
    if (partida.ganador || partida.tableroLleno()){
      return {ok:false};
    }
    
    const emailIA = partida.jugadores[1].nick || partida.jugadores[1].email;
    if (partida.turnoActual !== emailIA){
      return {ok:false};
    }
    
    let movimiento;
    const dificultad = partida.dificultadIA || 'facil';
    
    if (dificultad === 'facil'){
      movimiento = this.movimientoIAFacil(partida);
    } else if (dificultad === 'medio'){
      movimiento = this.movimientoIAMedio(partida);
    } else {
      movimiento = this.movimientoIADificil(partida);
    }
    
    if (!movimiento){
      return {ok:false};
    }
    
    // Realizar movimiento de IA
    const simbolo = partida.simbolos[emailIA];
    partida.tablero[movimiento.fila][movimiento.columna] = simbolo;
    
    // Verificar ganador
    const ganador = partida.verificarGanador();
    if (ganador){
      partida.ganador = emailIA;
      partida.estado = 'finalizada';
      return {ok:true, movimiento:movimiento, tablero:partida.tablero, ganador:emailIA, empate:false};
    }
    
    // Verificar empate
    if (partida.tableroLleno()){
      partida.estado = 'finalizada';
      partida.ganador = 'empate';
      return {ok:true, movimiento:movimiento, tablero:partida.tablero, empate:true};
    }
    
    // Cambiar turno
    partida.cambiarTurno();
    return {ok:true, movimiento:movimiento, tablero:partida.tablero, turnoActual:partida.turnoActual};
  }

  // IA Fácil: movimientos aleatorios
  this.movimientoIAFacil=function(partida){
    const casillasVacias = [];
    for(let i=0; i<partida.tamano; i++){
      for(let j=0; j<partida.tamano; j++){
        if (partida.tablero[i][j] === null){
          casillasVacias.push({fila:i, columna:j});
        }
      }
    }
    if (casillasVacias.length === 0) return null;
    return casillasVacias[Math.floor(Math.random() * casillasVacias.length)];
  }

  // IA Medio: intenta ganar, bloquear, o aleatorio
  this.movimientoIAMedio=function(partida){
    const emailIA = partida.jugadores[1].nick || partida.jugadores[1].email;
    const emailJugador = partida.jugadores[0].nick || partida.jugadores[0].email;
    const simboloIA = partida.simbolos[emailIA];
    const simboloJugador = partida.simbolos[emailJugador];
    
    // 1. Intentar ganar
    const movGanar = this.buscarMovimientoGanador(partida, simboloIA);
    if (movGanar) return movGanar;
    
    // 2. Bloquear al jugador
    const movBloquear = this.buscarMovimientoGanador(partida, simboloJugador);
    if (movBloquear) return movBloquear;
    
    // 3. Movimiento aleatorio
    return this.movimientoIAFacil(partida);
  }

  // IA Difícil: usa minimax
  this.movimientoIADificil=function(partida){
    const emailIA = partida.jugadores[1].nick || partida.jugadores[1].email;
    const simboloIA = partida.simbolos[emailIA];
    
    let mejorPuntuacion = -Infinity;
    let mejorMovimiento = null;
    
    for(let i=0; i<partida.tamano; i++){
      for(let j=0; j<partida.tamano; j++){
        if (partida.tablero[i][j] === null){
          partida.tablero[i][j] = simboloIA;
          const puntuacion = this.minimax(partida, 0, false, -Infinity, Infinity);
          partida.tablero[i][j] = null;
          
          if (puntuacion > mejorPuntuacion){
            mejorPuntuacion = puntuacion;
            mejorMovimiento = {fila:i, columna:j};
          }
        }
      }
    }
    
    return mejorMovimiento || this.movimientoIAFacil(partida);
  }

  // Algoritmo minimax con poda alfa-beta
  this.minimax=function(partida, profundidad, esMaximizador, alfa, beta){
    const emailIA = partida.jugadores[1].nick || partida.jugadores[1].email;
    const emailJugador = partida.jugadores[0].nick || partida.jugadores[0].email;
    const simboloIA = partida.simbolos[emailIA];
    const simboloJugador = partida.simbolos[emailJugador];
    
    // Verificar estado terminal
    if (partida.verificarGanador()){
      // Determinar quién ganó
      const ultimoSimbolo = esMaximizador ? simboloJugador : simboloIA;
      if (ultimoSimbolo === simboloIA){
        return 10 - profundidad;
      } else {
        return profundidad - 10;
      }
    }
    
    if (partida.tableroLleno()){
      return 0;
    }
    
    // Limitar profundidad para tableros grandes
    if (profundidad > 5){
      return 0;
    }
    
    if (esMaximizador){
      let mejorPuntuacion = -Infinity;
      for(let i=0; i<partida.tamano; i++){
        for(let j=0; j<partida.tamano; j++){
          if (partida.tablero[i][j] === null){
            partida.tablero[i][j] = simboloIA;
            const puntuacion = this.minimax(partida, profundidad + 1, false, alfa, beta);
            partida.tablero[i][j] = null;
            mejorPuntuacion = Math.max(puntuacion, mejorPuntuacion);
            alfa = Math.max(alfa, puntuacion);
            if (beta <= alfa) break;
          }
        }
      }
      return mejorPuntuacion;
    } else {
      let mejorPuntuacion = Infinity;
      for(let i=0; i<partida.tamano; i++){
        for(let j=0; j<partida.tamano; j++){
          if (partida.tablero[i][j] === null){
            partida.tablero[i][j] = simboloJugador;
            const puntuacion = this.minimax(partida, profundidad + 1, true, alfa, beta);
            partida.tablero[i][j] = null;
            mejorPuntuacion = Math.min(puntuacion, mejorPuntuacion);
            beta = Math.min(beta, puntuacion);
            if (beta <= alfa) break;
          }
        }
      }
      return mejorPuntuacion;
    }
  }

  // Buscar movimiento ganador para un símbolo
  this.buscarMovimientoGanador=function(partida, simbolo){
    for(let i=0; i<partida.tamano; i++){
      for(let j=0; j<partida.tamano; j++){
        if (partida.tablero[i][j] === null){
          partida.tablero[i][j] = simbolo;
          const gana = partida.verificarGanador();
          partida.tablero[i][j] = null;
          if (gana){
            return {fila:i, columna:j};
          }
        }
      }
    }
    return null;
  }

  this.realizarMovimientoFootballGrid=function(email, codigo, fila, columna, nombreJugador){
    const partida=this.partidas[codigo];
    const usr=this.usuarios[email];
    
    if (!partida){
      return {ok:false, msg:"Partida no encontrada"};
    }
    if (!partida.modo || partida.modo !== 'footballgrid'){
      return {ok:false, msg:"Esta partida no es de Football Grid"};
    }
    if (!usr || !partida.jugadores.includes(usr)){
      return {ok:false, msg:"No estás en esta partida"};
    }
    if (partida.ganador){
      return {ok:false, msg:"La partida ya ha terminado"};
    }
    if (partida.turnoActual !== email){
      return {ok:false, msg:"No es tu turno"};
    }
    if (fila < 0 || fila >= 3 || columna < 0 || columna >= 3){
      return {ok:false, msg:"Posición fuera del tablero"};
    }
    if (partida.tablero[fila][columna] !== null){
      return {ok:false, msg:"Casilla ocupada"};
    }
    
    // Validar jugador con Football Grid
    const validacion = partida.validarMovimiento(fila, columna, nombreJugador);
    if (!validacion.valido){
      // Si el jugador es incorrecto, pierde el turno
      partida.cambiarTurno();
      return {
        ok:true, 
        tablero:partida.tablero, 
        turnoActual:partida.turnoActual,
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas,
        error: validacion.motivo
      };
    }
    
    // Realizar movimiento
    partida.tablero[fila][columna] = {
      email: email,
      nombre: validacion.jugador.nombreCompleto,
      jugador: validacion.jugador
    };
    partida.jugadoresUsados.push(validacion.jugador.nombreCompleto);
    
    // Verificar ganador
    const ganador = partida.verificarGanador();
    if (ganador){
      partida.ganador = email;
      partida.estado = 'finalizada';
      
      // Actualizar estadísticas en Football Grid (siempre es multijugador)
      this.actualizarEstadisticas(email, 'victoria');
      const perdedor = partida.jugadores.find(j => (j.email || j.nick) !== email);
      if (perdedor){
        this.actualizarEstadisticas(perdedor.email || perdedor.nick, 'derrota');
      }
      
      return {
        ok:true, 
        tablero:partida.tablero, 
        ganador:email, 
        empate:false,
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas
      };
    }
    
    // Verificar empate
    if (partida.tableroLleno()){
      partida.estado = 'finalizada';
      partida.ganador = 'empate';
      return {
        ok:true, 
        tablero:partida.tablero, 
        empate:true,
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas
      };
    }
    
    // Cambiar turno
    partida.cambiarTurno();
    return {
      ok:true, 
      tablero:partida.tablero, 
      turnoActual:partida.turnoActual,
      equiposFilas: partida.equiposFilas,
      equiposColumnas: partida.equiposColumnas
    };
  }

  this.realizarMovimientoBasketballGrid=function(email, codigo, fila, columna, nombreJugador){
    const partida=this.partidas[codigo];
    const usr=this.usuarios[email];
    
    if (!partida){
      return {ok:false, msg:"Partida no encontrada"};
    }
    if (!partida.modo || partida.modo !== 'basketballgrid'){
      return {ok:false, msg:"Esta partida no es de Basketball Grid"};
    }
    if (!usr || !partida.jugadores.includes(usr)){
      return {ok:false, msg:"No estás en esta partida"};
    }
    if (partida.ganador){
      return {ok:false, msg:"La partida ya ha terminado"};
    }
    if (partida.turnoActual !== email){
      return {ok:false, msg:"No es tu turno"};
    }
    if (fila < 0 || fila >= 3 || columna < 0 || columna >= 3){
      return {ok:false, msg:"Posición fuera del tablero"};
    }
    if (partida.tablero[fila][columna] !== null){
      return {ok:false, msg:"Casilla ocupada"};
    }
    
    // Validar jugador con Basketball Grid
    const validacion = partida.validarMovimiento(fila, columna, nombreJugador);
    if (!validacion.valido){
      // Si el jugador es incorrecto, pierde el turno
      partida.cambiarTurno();
      return {
        ok:true, 
        tablero:partida.tablero, 
        turnoActual:partida.turnoActual,
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas,
        error: validacion.motivo
      };
    }
    
    // Realizar movimiento
    partida.tablero[fila][columna] = {
      email: email,
      nombre: validacion.jugador.nombreCompleto,
      jugador: validacion.jugador
    };
    partida.jugadoresUsados.push(validacion.jugador.nombreCompleto.toLowerCase());
    
    // Verificar ganador
    const ganador = partida.verificarGanador();
    if (ganador){
      partida.ganador = email;
      partida.estado = 'finalizada';
      
      // Actualizar estadísticas
      this.actualizarEstadisticas(email, 'victoria');
      const perdedor = partida.jugadores.find(j => (j.email || j.nick) !== email);
      if (perdedor){
        this.actualizarEstadisticas(perdedor.email || perdedor.nick, 'derrota');
      }
      
      return {
        ok:true, 
        tablero:partida.tablero, 
        ganador:email, 
        empate:false,
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas
      };
    }
    
    // Verificar empate
    if (partida.tableroLleno()){
      partida.estado = 'finalizada';
      partida.ganador = 'empate';
      return {
        ok:true, 
        tablero:partida.tablero, 
        empate:true,
        equiposFilas: partida.equiposFilas,
        equiposColumnas: partida.equiposColumnas
      };
    }
    
    // Cambiar turno
    partida.cambiarTurno();
    return {
      ok:true, 
      tablero:partida.tablero, 
      turnoActual:partida.turnoActual,
      equiposFilas: partida.equiposFilas,
      equiposColumnas: partida.equiposColumnas
    };
  }

  this.realizarMovimientoUltimateTTT=function(email, codigo, bigRow, bigCol, smallRow, smallCol){
    const partida=this.partidas[codigo];
    const usr=this.usuarios[email];
    
    if (!partida || !usr){
      return {ok:false, msg:'Partida o usuario no encontrado'};
    }
    
    // Verificar que es el turno del jugador
    if (partida.turnoActual !== (usr.nick || usr.email)){
      return {ok:false, msg:'No es tu turno'};
    }
    
    // Validar el movimiento
    const validacion = partida.validarMovimiento(bigRow, bigCol, smallRow, smallCol);
    if (!validacion.valido){
      return {ok:true, error: validacion.error};
    }
    
    // Realizar el movimiento
    const simbolo = partida.simbolos[usr.nick || usr.email];
    partida.tablerosPequenos[bigRow][bigCol][smallRow][smallCol] = simbolo;
    
    // Verificar si se ganó el mini-tablero
    const resultadoMini = partida.verificarGanadorMini(partida.tablerosPequenos[bigRow][bigCol]);
    if (resultadoMini){
      partida.tableroGrande[bigRow][bigCol] = resultadoMini;
    }
    
    // Verificar ganador del tablero grande
    if (partida.verificarGanador()){
      partida.ganador = usr.nick || usr.email;
      partida.estado = 'finalizada';
      
      // Actualizar estadísticas
      const perdedor = partida.jugadores.find(j => (j.nick || j.email) !== (usr.nick || usr.email));
      this.actualizarEstadisticas(usr.email, 'victoria');
      if (perdedor){
        this.actualizarEstadisticas(perdedor.email || perdedor.nick, 'derrota');
      }
    } else if (partida.tableroLleno()){
      partida.ganador = 'empate';
      partida.estado = 'finalizada';
    } else {
      // Cambiar turno
      partida.cambiarTurno();
      
      // Determinar el próximo tablero obligatorio
      // El jugador debe ir al tablero (smallRow, smallCol)
      if (partida.tableroGrande[smallRow][smallCol] === null){
        // El tablero está disponible
        partida.tableroObligatorio = {i: smallRow, j: smallCol};
      } else {
        // El tablero ya está ganado, puede jugar en cualquiera disponible
        partida.tableroObligatorio = null;
      }
    }
    
    return {
      ok:true,
      tablero: partida.tableroGrande,
      tablerosPequenos: partida.tablerosPequenos,
      turnoActual: partida.turnoActual,
      ganador: partida.ganador,
      tableroObligatorio: partida.tableroObligatorio
    };
  }

  this.obtenerEstadoPartida=function(codigo){
    const partida=this.partidas[codigo];
    if (!partida){
      return {ok:false};
    }
    const estado = {
      ok:true,
      tablero:partida.tablero,
      turnoActual:partida.turnoActual,
      ganador:partida.ganador,
      simbolos:partida.simbolos,
      jugadores:partida.jugadores.map(j=>j.nick||j.email),
      tamano:partida.tamano,
      estado:partida.estado,
      tiempoRestante:partida.tiempoRestante || 60,
      esIA: partida.esIA || false
    };
    
    // Agregar datos específicos de Football Grid
    if (partida.modo === 'footballgrid'){
      estado.modo = 'footballgrid';
      estado.equiposFilas = partida.equiposFilas;
      estado.equiposColumnas = partida.equiposColumnas;
    }
    
    // Agregar datos específicos de Basketball Grid
    if (partida.modo === 'basketballgrid'){
      estado.modo = 'basketballgrid';
      estado.equiposFilas = partida.equiposFilas;
      estado.equiposColumnas = partida.equiposColumnas;
    }
    
    // Agregar datos específicos de Ultimate Tic-Tac-Toe
    if (partida.modo === 'ultimatettt'){
      estado.modo = 'ultimatettt';
      estado.tablerosPequenos = partida.tablerosPequenos;
      estado.tableroObligatorio = partida.tableroObligatorio;
    }
    
    return estado;
  }

  this.buscarJugadoresPorNombre=function(query, equipo1, equipo2){
    if (!query || query.length < 2){
      return [];
    }
    
    const queryLower = query.toLowerCase();
    let jugadores = [];
    
    // Buscar en jugadores populares - MOSTRAR TODAS las coincidencias sin filtrar por equipos
    jugadores = this.sportsAPI.jugadoresPopulares.filter(j => {
      if (!j || !j.nombreCompleto) return false;
      const nombreCompleto = j.nombreCompleto.toLowerCase();
      const apellido = j.apellido ? j.apellido.toLowerCase() : '';
      return nombreCompleto.includes(queryLower) || apellido.includes(queryLower);
    });
    
    // Limitar a 8 resultados y formatear
    return jugadores.slice(0, 8).map(j => ({
      nombre: j.nombreCompleto || 'Desconocido',
      nacionalidad: j.nacionalidad || 'N/A',
      posicion: j.posicion || 'N/A',
      nacimiento: j.nacimiento || 'N/A'
    }));
  }

  this.buscarJugadoresNBAPorNombre=function(query, equipo1, equipo2){
    if (!query || query.length < 2){
      return [];
    }
    
    const queryLower = query.toLowerCase();
    let jugadores = [];
    
    // Buscar en jugadores de NBA - MOSTRAR TODAS las coincidencias sin filtrar por equipos
    jugadores = this.basketballAPI.jugadoresPopulares.filter(j => {
      if (!j || !j.nombreCompleto) return false;
      const nombreCompleto = j.nombreCompleto.toLowerCase();
      const apellido = j.apellido ? j.apellido.toLowerCase() : '';
      return nombreCompleto.includes(queryLower) || apellido.includes(queryLower);
    });
    
    // Limitar a 8 resultados y formatear
    return jugadores.slice(0, 8).map(j => ({
      nombre: j.nombreCompleto || 'Desconocido',
      nacionalidad: j.nacionalidad || 'N/A',
      posicion: j.posicion || 'N/A',
      nacimiento: j.nacimiento || 'N/A'
    }));
  }

  this.iniciarTemporizador=function(codigo, io){
    const sistema = this;
    const partida = this.partidas[codigo];
    
    if (!partida || partida.ganador || partida.estado !== 'jugando'){
      return;
    }
    
    // Limpiar temporizador anterior si existe
    if (partida.temporizador){
      clearInterval(partida.temporizador);
    }
    
    // Crear nuevo temporizador
    partida.temporizador = setInterval(() => {
      if (!sistema.partidas[codigo] || partida.ganador || partida.estado !== 'jugando'){
        clearInterval(partida.temporizador);
        return;
      }
      
      partida.tiempoRestante--;
      
      // Emitir tiempo actualizado cada segundo
      if (io){
        io.to(codigo).emit('actualizarTiempo', {tiempo: partida.tiempoRestante});
      }
      
      // Si se acabó el tiempo, cambiar turno
      if (partida.tiempoRestante <= 0){
        clearInterval(partida.temporizador);
        partida.cambiarTurno();
        
        // Enviar notificación de tiempo agotado y nuevo estado
        if (io){
          const estadoJuego = sistema.obtenerEstadoPartida(codigo);
          if (partida.modo === 'footballgrid'){
            estadoJuego.modo = 'footballgrid';
            estadoJuego.equiposFilas = partida.equiposFilas;
            estadoJuego.equiposColumnas = partida.equiposColumnas;
            io.to(codigo).emit('tiempoAgotado', {});
            io.to(codigo).emit('movimientoRealizadoFootballGrid', estadoJuego);
          } else {
            io.to(codigo).emit('tiempoAgotado', {});
            io.to(codigo).emit('movimientoRealizado', estadoJuego);
          }
        }
        
        // Reiniciar temporizador para el siguiente turno
        sistema.iniciarTemporizador(codigo, io);
      }
    }, 1000);
  }

  this.detenerTemporizador=function(codigo){
    const partida = this.partidas[codigo];
    if (partida && partida.temporizador){
      clearInterval(partida.temporizador);
      partida.temporizador = null;
    }
  }

  this.eliminarPartida=function(codigo){
    if (this.partidas[codigo]){
      const partida=this.partidas[codigo];
      
      // Detener temporizador
      if (partida.temporizador){
        clearInterval(partida.temporizador);
      }
      
      partida.jugadores.forEach(usr=>{
        if (usr.partida===codigo){
          usr.partida=null;
        }
      });
      delete this.partidas[codigo];
      return {ok:true};
    }
    return {ok:false};
  }

      this.obtenerPartidasDisponibles=function(){
        const lista = [];
        for(const codigo in this.partidas){
            const partida = this.partidas[codigo];
            if(!partida){
                continue;
            }
            // Filtrar partidas contra IA - no deben aparecer en lista multijugador
            if(partida.esIA){
                continue;
            }
          const hayHueco = partida.jugadores.length < partida.maxJug;
            if(!hayHueco){
                continue;
            }

            const creador = partida.jugadores[0];
            lista.push({
            codigo: partida.codigo,
            email : creador ? (creador.email || creador.nick) : null,
            numJugadores: Array.isArray(partida.jugadores) ? partida.jugadores.length : 0,
            maxJug: partida.maxJug || 2
            });
        }
        return lista;
    };

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
      obj.victorias = 0;
      obj.derrotas = 0;

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

this.actualizarEstadisticas=function(email, resultado){
  const modelo = this;
  this.cad.buscarUsuario({email: email}, function(usr){
    if (usr){
      if (resultado === 'victoria'){
        usr.victorias = (usr.victorias || 0) + 1;
        usr.rachaActual = (usr.rachaActual || 0) + 1;
        usr.mejorRacha = Math.max(usr.mejorRacha || 0, usr.rachaActual);
      } else if (resultado === 'derrota'){
        usr.derrotas = (usr.derrotas || 0) + 1;
        usr.rachaActual = 0; // Resetear racha
      }
      modelo.cad.actualizarUsuario(usr, function(res){
        console.log(`Estadísticas actualizadas para ${email}: ${resultado}`);
        // Verificar y otorgar logros después de actualizar
        modelo.verificarYOtorgarLogros(email, function(nuevosLogros){
          if (nuevosLogros.length > 0){
            console.log(`Nuevos logros para ${email}:`, nuevosLogros);
          }
        });
      });
    }
  });
}

this.obtenerEstadisticas=function(email, callback){
  this.cad.buscarUsuario({email: email}, function(usr){
    if (usr){
      callback({
        email: usr.email,
        victorias: usr.victorias || 0,
        derrotas: usr.derrotas || 0
      });
    } else {
      callback({email: -1});
    }
  });
}

this.verificarYOtorgarLogros=function(email, callback){
  const modelo = this;
  this.cad.buscarUsuario({email: email}, function(usr){
    if (!usr) {
      callback([]);
      return;
    }
    
    let logrosActuales = usr.logros || [];
    let nuevosLogros = [];
    const victorias = usr.victorias || 0;
    const derrotas = usr.derrotas || 0;
    const totalPartidas = victorias + derrotas;
    
    // Definición de logros
    const logrosDisponibles = [
      { id: 'primera_victoria', nombre: '¡Primera Victoria!', descripcion: 'Gana tu primera partida', icono: '🏆', condicion: () => victorias >= 1 },
      { id: 'cinco_victorias', nombre: 'Ganador Serial', descripcion: 'Consigue 5 victorias', icono: '🎖️', condicion: () => victorias >= 5 },
      { id: 'diez_victorias', nombre: 'Maestro del Juego', descripcion: 'Alcanza 10 victorias', icono: '👑', condicion: () => victorias >= 10 },
      { id: 'veinte_victorias', nombre: 'Leyenda', descripcion: 'Logra 20 victorias', icono: '⭐', condicion: () => victorias >= 20 },
      { id: 'primera_derrota', nombre: 'Aprendiendo', descripcion: 'Pierde tu primera partida', icono: '📚', condicion: () => derrotas >= 1 },
      { id: 'diez_partidas', nombre: 'Jugador Activo', descripcion: 'Completa 10 partidas', icono: '🎮', condicion: () => totalPartidas >= 10 },
      { id: 'cincuenta_partidas', nombre: 'Veterano', descripcion: 'Juega 50 partidas', icono: '🎯', condicion: () => totalPartidas >= 50 },
      { id: 'racha_cinco', nombre: 'Racha Imparable', descripcion: 'Gana 5 partidas seguidas', icono: '🔥', condicion: () => (usr.rachaActual || 0) >= 5 },
      { id: 'perfectionist', nombre: 'Perfeccionista', descripcion: 'Gana 10 partidas sin perder ninguna', icono: '💎', condicion: () => victorias >= 10 && derrotas === 0 }
    ];
    
    // Verificar cada logro
    logrosDisponibles.forEach(logro => {
      const yaConseguido = logrosActuales.some(l => l.id === logro.id);
      if (!yaConseguido && logro.condicion()) {
        const logroCompleto = {
          id: logro.id,
          nombre: logro.nombre,
          descripcion: logro.descripcion,
          icono: logro.icono,
          fecha: new Date()
        };
        logrosActuales.push(logroCompleto);
        nuevosLogros.push(logroCompleto);
      }
    });
    
    // Actualizar usuario con nuevos logros
    if (nuevosLogros.length > 0) {
      usr.logros = logrosActuales;
      modelo.cad.actualizarUsuario(usr, function(res){
        console.log(`Nuevos logros otorgados a ${email}:`, nuevosLogros.map(l => l.nombre));
        callback(nuevosLogros);
      });
    } else {
      callback([]);
    }
  });
}

this.obtenerPerfil=function(email, callback){
  this.cad.obtenerPerfil(email, function(usr){
    if (usr){
      callback({
        ok: true,
        email: usr.email,
        nick: usr.nick || usr.email.split('@')[0],
        fotoPerfil: usr.fotoPerfil || '👤',
        victorias: usr.victorias || 0,
        derrotas: usr.derrotas || 0,
        logros: usr.logros || [],
        rachaActual: usr.rachaActual || 0,
        mejorRacha: usr.mejorRacha || 0
      });
    } else {
      callback({ok: false});
    }
  });
}

this.actualizarPerfil=function(email, datosNuevos, callback){
  this.cad.actualizarPerfil(email, datosNuevos, callback);
}

}
function Usuario(nick){
 this.nick=nick;
}
function Partida(codigo, tamano){
 this.codigo=codigo;
 this.jugadores=[];
 this.maxJug=2;
 this.tamano=tamano || 3;
 this.tablero=[];
 this.turnoActual=null;
 this.ganador=null;
 this.simbolos={};
 this.estado='esperando'; // esperando, jugando, finalizada
 this.tiempoRestante=60; // 60 segundos por turno
 this.temporizador=null;
 
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
     this.tiempoRestante=60;
   }
 }
 
 this.cambiarTurno=function(){
   const email0=this.jugadores[0].nick || this.jugadores[0].email;
   const email1=this.jugadores[1].nick || this.jugadores[1].email;
   this.turnoActual = (this.turnoActual===email0) ? email1 : email0;
   this.tiempoRestante=60; // Resetear a 60 segundos
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

// Clase para Football Grid (Tic Tac Toe de Fútbol)
function PartidaFootballGrid(codigo){
  this.codigo=codigo;
  this.jugadores=[];
  this.maxJug=2;
  this.modo='footballgrid';
  this.tablero=[];
  this.turnoActual=null;
  this.ganador=null;
  this.estado='esperando';
  this.tiempoRestante=60; // 60 segundos por turno
  this.temporizador=null;
  
  // Cargar Sports API
  const sportsAPIModule=require("./sportsAPI.js");
  const api=new sportsAPIModule.SportsAPI();
  
  // Generar grid aleatorio de equipos
  const grid = api.generarGridAleatorio();
  this.equiposFilas = grid.equiposFilas;
  this.equiposColumnas = grid.equiposColumnas;
  
  // Inicializar tablero 3x3 (solo para Football Grid)
  for(let i=0; i<3; i++){
    this.tablero[i]=[];
    for(let j=0; j<3; j++){
      this.tablero[i][j]=null;
    }
  }
  
  // Jugadores ya usados (para evitar repeticiones)
  this.jugadoresUsados=[];
  
  this.iniciarJuego=function(){
    if (this.jugadores.length===2){
      this.turnoActual=this.jugadores[0].nick || this.jugadores[0].email;
      this.estado='jugando';
      this.tiempoRestante=60;
    }
  }
  
  this.cambiarTurno=function(){
    const email0=this.jugadores[0].nick || this.jugadores[0].email;
    const email1=this.jugadores[1].nick || this.jugadores[1].email;
    this.turnoActual = (this.turnoActual===email0) ? email1 : email0;
    this.tiempoRestante=60; // Resetear a 60 segundos
  }
  
  // Validar movimiento de Football Grid
  this.validarMovimiento=function(fila, columna, nombreJugador){
    if (this.tablero[fila][columna] !== null){
      return {valido:false, motivo:"Casilla ocupada"};
    }
    
    // Verificar que no se haya usado el jugador antes
    if (this.jugadoresUsados.includes(nombreJugador.toLowerCase())){
      return {valido:false, motivo:"Jugador ya utilizado"};
    }
    
    // Obtener los equipos correspondientes
    const equipoFila = this.equiposFilas[fila];
    const equipoColumna = this.equiposColumnas[columna];
    
    // Validar con la API
    const validacion = api.validarJugador(nombreJugador, equipoFila, equipoColumna);
    
    if (!validacion.valido){
      return validacion;
    }
    
    return {valido:true, jugador:validacion.jugador};
  }
  
  this.verificarGanador=function(){
    // Verificar filas
    for(let i=0; i<3; i++){
      let simbolo=this.tablero[i][0];
      if (simbolo && this.tablero[i].every(c=>c!==null && c.email===simbolo.email)){
        return true;
      }
    }
    
    // Verificar columnas
    for(let j=0; j<3; j++){
      let simbolo=this.tablero[0][j];
      if (simbolo){
        let gana=true;
        for(let i=0; i<3; i++){
          if (!this.tablero[i][j] || this.tablero[i][j].email!==simbolo.email){
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
      for(let i=0; i<3; i++){
        if (!this.tablero[i][i] || this.tablero[i][i].email!==simboloDiag.email){
          gana=false;
          break;
        }
      }
      if (gana) return true;
    }
    
    // Verificar diagonal inversa
    let simboloDiagInv=this.tablero[0][2];
    if (simboloDiagInv){
      let gana=true;
      for(let i=0; i<3; i++){
        if (!this.tablero[i][2-i] || this.tablero[i][2-i].email!==simboloDiagInv.email){
          gana=false;
          break;
        }
      }
      if (gana) return true;
    }
    
    return false;
  }
  
  this.tableroLleno=function(){
    for(let i=0; i<3; i++){
      for(let j=0; j<3; j++){
        if (this.tablero[i][j]===null) return false;
      }
    }
    return true;
  }
}

// Clase para Basketball Grid (Tic Tac Toe de NBA)
function PartidaBasketballGrid(codigo){
  this.codigo=codigo;
  this.jugadores=[];
  this.maxJug=2;
  this.modo='basketballgrid';
  this.tablero=[];
  this.turnoActual=null;
  this.ganador=null;
  this.estado='esperando';
  this.tiempoRestante=60;
  this.temporizador=null;
  
  // Cargar Basketball API
  const basketballAPIModule=require("./basketballAPI.js");
  const api=new basketballAPIModule.BasketballAPI();
  
  // Generar grid aleatorio de equipos NBA
  const grid = api.generarGridAleatorio();
  this.equiposFilas = grid.equiposFilas;
  this.equiposColumnas = grid.equiposColumnas;
  
  // Inicializar tablero 3x3
  for(let i=0; i<3; i++){
    this.tablero[i]=[];
    for(let j=0; j<3; j++){
      this.tablero[i][j]=null;
    }
  }
  
  this.jugadoresUsados=[];
  
  this.iniciarJuego=function(){
    if (this.jugadores.length===2){
      this.turnoActual=this.jugadores[0].nick || this.jugadores[0].email;
      this.estado='jugando';
      this.tiempoRestante=60;
    }
  }
  
  this.cambiarTurno=function(){
    const email0=this.jugadores[0].nick || this.jugadores[0].email;
    const email1=this.jugadores[1].nick || this.jugadores[1].email;
    this.turnoActual = (this.turnoActual===email0) ? email1 : email0;
    this.tiempoRestante=60;
  }
  
  this.validarMovimiento=function(fila, columna, nombreJugador){
    if (this.tablero[fila][columna] !== null){
      return {valido:false, motivo:"Casilla ocupada"};
    }
    
    if (this.jugadoresUsados.includes(nombreJugador.toLowerCase())){
      return {valido:false, motivo:"Jugador ya utilizado"};
    }
    
    const equipoFila = this.equiposFilas[fila];
    const equipoColumna = this.equiposColumnas[columna];
    
    const validacion = api.validarJugador(nombreJugador, equipoFila, equipoColumna);
    
    if (!validacion.valido){
      return validacion;
    }
    
    return {valido:true, jugador:validacion.jugador};
  }
  
  this.verificarGanador=function(){
    // Verificar filas
    for(let i=0; i<3; i++){
      let simbolo=this.tablero[i][0];
      if (simbolo && this.tablero[i].every(c=>c!==null && c.email===simbolo.email)){
        return true;
      }
    }
    
    // Verificar columnas
    for(let j=0; j<3; j++){
      let simbolo=this.tablero[0][j];
      if (simbolo){
        let gana=true;
        for(let i=0; i<3; i++){
          if (!this.tablero[i][j] || this.tablero[i][j].email!==simbolo.email){
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
      for(let i=0; i<3; i++){
        if (!this.tablero[i][i] || this.tablero[i][i].email!==simboloDiag.email){
          gana=false;
          break;
        }
      }
      if (gana) return true;
    }
    
    // Verificar diagonal inversa
    let simboloDiagInv=this.tablero[0][2];
    if (simboloDiagInv){
      let gana=true;
      for(let i=0; i<3; i++){
        if (!this.tablero[i][2-i] || this.tablero[i][2-i].email!==simboloDiagInv.email){
          gana=false;
          break;
        }
      }
      if (gana) return true;
    }
    
    return false;
  }
  
  this.tableroLleno=function(){
    for(let i=0; i<3; i++){
      for(let j=0; j<3; j++){
        if (this.tablero[i][j]===null) return false;
      }
    }
    return true;
  }
}

// Ultimate Tic-Tac-Toe (3 en Raya Global)
function PartidaUltimateTTT(codigo){
  this.codigo=codigo;
  this.jugadores=[];
  this.maxJug=2;
  this.modo='ultimatettt';
  
  // Tablero grande: 3x3 donde cada casilla es un mini-tablero
  // null = no ganado, 'X' = ganado por X, 'O' = ganado por O, 'empate' = empate
  this.tableroGrande = [];
  for(let i=0; i<3; i++){
    this.tableroGrande[i] = [null, null, null];
  }
  
  // 9 mini-tableros: cada uno es 3x3
  // tablerosPequenos[i][j] es el mini-tablero en la posición (i,j) del tablero grande
  this.tablerosPequenos = [];
  for(let i=0; i<3; i++){
    this.tablerosPequenos[i] = [];
    for(let j=0; j<3; j++){
      this.tablerosPequenos[i][j] = [];
      for(let k=0; k<3; k++){
        this.tablerosPequenos[i][j][k] = [null, null, null];
      }
    }
  }
  
  this.turnoActual=null;
  this.ganador=null;
  this.simbolos={};
  this.estado='esperando';
  this.tiempoRestante=60;
  this.temporizador=null;
  
  // null = puede jugar en cualquier tablero pequeño disponible
  // {i, j} = debe jugar en el tablero pequeño (i,j)
  this.tableroObligatorio = null;
  
  this.iniciarJuego=function(){
    if (this.jugadores.length===2){
      this.simbolos[this.jugadores[0].nick || this.jugadores[0].email]='X';
      this.simbolos[this.jugadores[1].nick || this.jugadores[1].email]='O';
      this.turnoActual=this.jugadores[0].nick || this.jugadores[0].email;
      this.estado='jugando';
      this.tiempoRestante=60;
    }
  }
  
  this.cambiarTurno=function(){
    const email0=this.jugadores[0].nick || this.jugadores[0].email;
    const email1=this.jugadores[1].nick || this.jugadores[1].email;
    this.turnoActual = (this.turnoActual===email0) ? email1 : email0;
    this.tiempoRestante=60;
  }
  
  // Verificar si un mini-tablero tiene ganador
  this.verificarGanadorMini=function(tablero){
    // Verificar filas
    for(let i=0; i<3; i++){
      if (tablero[i][0] && tablero[i][0]===tablero[i][1] && tablero[i][1]===tablero[i][2]){
        return tablero[i][0];
      }
    }
    
    // Verificar columnas
    for(let j=0; j<3; j++){
      if (tablero[0][j] && tablero[0][j]===tablero[1][j] && tablero[1][j]===tablero[2][j]){
        return tablero[0][j];
      }
    }
    
    // Diagonales
    if (tablero[0][0] && tablero[0][0]===tablero[1][1] && tablero[1][1]===tablero[2][2]){
      return tablero[0][0];
    }
    if (tablero[0][2] && tablero[0][2]===tablero[1][1] && tablero[1][1]===tablero[2][0]){
      return tablero[0][2];
    }
    
    // Verificar empate
    let lleno = true;
    for(let i=0; i<3; i++){
      for(let j=0; j<3; j++){
        if (tablero[i][j]===null){
          lleno = false;
          break;
        }
      }
      if (!lleno) break;
    }
    if (lleno) return 'empate';
    
    return null;
  }
  
  // Verificar ganador del tablero grande
  this.verificarGanador=function(){
    // Verificar filas
    for(let i=0; i<3; i++){
      if (this.tableroGrande[i][0] && 
          this.tableroGrande[i][0]!=='empate' &&
          this.tableroGrande[i][0]===this.tableroGrande[i][1] && 
          this.tableroGrande[i][1]===this.tableroGrande[i][2]){
        return true;
      }
    }
    
    // Verificar columnas
    for(let j=0; j<3; j++){
      if (this.tableroGrande[0][j] && 
          this.tableroGrande[0][j]!=='empate' &&
          this.tableroGrande[0][j]===this.tableroGrande[1][j] && 
          this.tableroGrande[1][j]===this.tableroGrande[2][j]){
        return true;
      }
    }
    
    // Diagonales
    if (this.tableroGrande[0][0] && 
        this.tableroGrande[0][0]!=='empate' &&
        this.tableroGrande[0][0]===this.tableroGrande[1][1] && 
        this.tableroGrande[1][1]===this.tableroGrande[2][2]){
      return true;
    }
    if (this.tableroGrande[0][2] && 
        this.tableroGrande[0][2]!=='empate' &&
        this.tableroGrande[0][2]===this.tableroGrande[1][1] && 
        this.tableroGrande[1][1]===this.tableroGrande[2][0]){
      return true;
    }
    
    return false;
  }
  
  this.tableroLleno=function(){
    for(let i=0; i<3; i++){
      for(let j=0; j<3; j++){
        if (this.tableroGrande[i][j]===null) return false;
      }
    }
    return true;
  }
  
  // Validar movimiento
  this.validarMovimiento=function(bigRow, bigCol, smallRow, smallCol){
    // Verificar que el tablero pequeño no esté ganado
    if (this.tableroGrande[bigRow][bigCol] !== null){
      return {valido: false, error: 'Este tablero pequeño ya está ganado o empatado'};
    }
    
    // Verificar que la casilla esté vacía
    if (this.tablerosPequenos[bigRow][bigCol][smallRow][smallCol] !== null){
      return {valido: false, error: 'Esta casilla ya está ocupada'};
    }
    
    // Verificar tablero obligatorio
    if (this.tableroObligatorio !== null){
      if (this.tableroObligatorio.i !== bigRow || this.tableroObligatorio.j !== bigCol){
        return {valido: false, error: 'Debes jugar en el tablero iluminado'};
      }
    }
    
    return {valido: true};
  }
}

module.exports.Sistema = Sistema;