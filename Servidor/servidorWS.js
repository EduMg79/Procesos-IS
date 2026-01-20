function ServidorWS(io){
    this.enviarAlRemitente=function(socket,mensaje,datos){
        socket.emit(mensaje,datos);
    }

    this.enviarATodosMenosRemitente=function(socket,mens,datos){
        socket.broadcast.emit(mens,datos);
    }

    this.enviarGlobal=function(io,mens,datos){
        io.emit(mens,datos);
    }

    this.lanzarServidor=function(io, sistema){
        const srv=this;
        io.on('connection', function(socket){
            console.log("Capa WS activa");

            // Restaurar estado del usuario (p.ej. tras refrescar página)
            socket.on('estadoUsuario', function(datos){
                const email = datos ? datos.email : undefined;
                if (!email){
                    return srv.enviarAlRemitente(socket,'estadoUsuario',{ok:false});
                }

                // Si el usuario no está en memoria pero tiene cookie, lo recreamos para poder continuar.
                try {
                    if (!sistema.usuarioActivo(email)){
                        sistema.agregarUsuario(email);
                    }
                } catch(e) {}

                const usr = sistema.usuarios ? sistema.usuarios[email] : undefined;
                const codigo = usr ? usr.partida : undefined;
                const partida = (codigo && sistema.partidas) ? sistema.partidas[codigo] : undefined;

                if (codigo && partida){
                    const jugadores = partida.jugadores ? partida.jugadores.map(function(j){return j.email || j.nick;}) : [];
                    const esperando = jugadores.length < (partida.maxJug || 2);
                    try { socket.join(codigo); } catch(e) {}
                    srv.enviarAlRemitente(socket,'estadoUsuario',{ok:true,codigo:codigo,esperando:esperando,jugadores:jugadores});
                } else {
                    srv.enviarAlRemitente(socket,'estadoUsuario',{ok:true,codigo:null,esperando:false});
                }

                // Enviar lista actual para que la UI se pinte siempre.
                try {
                    srv.enviarAlRemitente(socket,'listaPartidas',sistema.obtenerPartidasDisponibles());
                } catch(e) {}
            });

            socket.on("crearPartida",function(datos){
                const email = datos ? datos.email : undefined;
                const tamano = datos ? (datos.tamano || 3) : 3;
                const esIA = datos ? datos.esIA : false;
                const dificultadIA = datos ? datos.dificultadIA : 'facil';
                const modoJuego = datos ? (datos.modoJuego || 'normal') : 'normal';

                // Robustez: si el usuario no está en memoria, lo recreamos.
                try {
                    if (email && !sistema.usuarioActivo(email)){
                        sistema.agregarUsuario(email);
                    }
                } catch(e) {}

                const res = sistema.crearPartida(email, tamano, esIA, dificultadIA, modoJuego);
                const codigo = res ? res.codigo : -1;
                if (codigo !== -1){
                    socket.join(codigo);
                }
                
                // Para Football Grid y Basketball Grid, enviar los equipos también
                if (modoJuego === 'footballgrid' && res){
                    srv.enviarAlRemitente(socket,"partidaCreada",{
                        "codigo":codigo, 
                        "tamano":3, 
                        "esIA":esIA, 
                        "modo": "footballgrid",
                        "equiposFilas": res.equiposFilas,
                        "equiposColumnas": res.equiposColumnas
                    });
                } else if (modoJuego === 'basketballgrid' && res){
                    srv.enviarAlRemitente(socket,"partidaCreada",{
                        "codigo":codigo, 
                        "tamano":3, 
                        "esIA":esIA, 
                        "modo": "basketballgrid",
                        "equiposFilas": res.equiposFilas,
                        "equiposColumnas": res.equiposColumnas
                    });
                } else {
                    srv.enviarAlRemitente(socket,"partidaCreada",{"codigo":codigo, "tamano":tamano, "esIA":esIA, "dificultadIA":dificultadIA});
                }
                
                // Si es IA, enviar estado inicial del juego inmediatamente
                if (esIA && codigo !== -1){
                    const estadoJuego = sistema.obtenerEstadoPartida(codigo);
                    srv.enviarAlRemitente(socket,'inicioJuego', estadoJuego);
                    
                    // Iniciar temporizador para IA también
                    sistema.iniciarTemporizador(codigo, io);
                } else {
                    // Solo emitir lista de partidas si NO es contra IA
                    const lista = sistema.obtenerPartidasDisponibles();
                    io.emit("listaPartidas",lista);
                }
            });

            socket.on('unirAPartida',function(data){
                const email=data ? data.email : undefined;
                const codigo=data ? data.codigo : undefined;
                const res=sistema.unirAPartida(email,codigo);
                if (res && res.codigo && res.codigo!==-1){
                    socket.join(res.codigo);
                    const partida=sistema.partidas[res.codigo];
                    const jugadores=partida ? partida.jugadores.map(function(j){return j.email || j.nick;}) : [];
                    srv.enviarAlRemitente(socket,'unidoAPartida',{codigo:res.codigo,jugadores:jugadores});
                    // Notificar a todos en la sala (incluyendo al remitente) que alguien se unió
                    const otroJugador = jugadores.length > 1 ? jugadores.find(function(j){ return j !== email; }) : undefined;
                    io.to(res.codigo).emit('jugadorUnido',{codigo:res.codigo,email:email,otroJugador:otroJugador,jugadores:jugadores});
                    // Fallback global (algunos clientes pueden no estar en la sala tras refresh)
                    io.emit('jugadorUnidoGlobal',{codigo:res.codigo,email:email,otroJugador:otroJugador,jugadores:jugadores});
                    const lista = sistema.obtenerPartidasDisponibles();
                    srv.enviarATodosMenosRemitente(socket,"listaPartidas",lista);

                    // Si hay 2 jugadores, iniciar el juego
                    if (jugadores.length === 2){
                        partida.iniciarJuego();
                        const estadoJuego = sistema.obtenerEstadoPartida(res.codigo);
                        
                        // Para Grid games, enviar equipos
                        if (partida.modo === 'footballgrid'){
                            estadoJuego.equiposFilas = partida.equiposFilas;
                            estadoJuego.equiposColumnas = partida.equiposColumnas;
                            estadoJuego.modo = 'footballgrid';
                        } else if (partida.modo === 'basketballgrid'){
                            estadoJuego.equiposFilas = partida.equiposFilas;
                            estadoJuego.equiposColumnas = partida.equiposColumnas;
                            estadoJuego.modo = 'basketballgrid';
                        }
                        io.to(res.codigo).emit('inicioJuego', estadoJuego);
                        
                        // Iniciar temporizador
                        sistema.iniciarTemporizador(res.codigo, io);
                    }
                }
                else{
                    srv.enviarAlRemitente(socket,'error',{msg:'No se pudo unir a la partida',codigo:res ? res.codigo : -1});
                }
            });

            socket.on('obtenerPartidas',function(){
                srv.enviarAlRemitente(socket,'listaPartidas',sistema.obtenerPartidasDisponibles());
            });

            socket.on('eliminarPartida',function(datos){
                const codigo = datos ? datos.codigo : undefined;
                if (codigo && sistema.partidas[codigo]){
                    // Limpiar referencia de partida en los jugadores
                    try {
                        const partida = sistema.partidas[codigo];
                        if (partida && Array.isArray(partida.jugadores)){
                            partida.jugadores.forEach(function(j){
                                if (j){
                                    j.partida = undefined;
                                }
                            });
                        }
                    } catch(e) {}

                    delete sistema.partidas[codigo];
                    srv.enviarAlRemitente(socket,'partidaEliminada',{ok:true,codigo:codigo});
                    const lista = sistema.obtenerPartidasDisponibles();
                    io.emit("listaPartidas",lista);
                }
                else{
                    srv.enviarAlRemitente(socket,'partidaEliminada',{ok:false,codigo:codigo});
                }
            });

            socket.on('realizarMovimiento',function(datos){
                const email = datos ? datos.email : undefined;
                const codigo = datos ? datos.codigo : undefined;
                const fila = datos ? datos.fila : undefined;
                const columna = datos ? datos.columna : undefined;

                const resultado = sistema.realizarMovimiento(email, codigo, fila, columna);
                if (resultado && resultado.ok){
                    const estadoJuego = sistema.obtenerEstadoPartida(codigo);
                    io.to(codigo).emit('movimientoRealizado', estadoJuego);
                    
                    // Reiniciar temporizador después del movimiento
                    const partida = sistema.partidas[codigo];
                    if (partida && !partida.ganador){
                        sistema.iniciarTemporizador(codigo, io);
                    } else if (partida && partida.ganador){
                        sistema.detenerTemporizador(codigo);
                    }
                    
                    // Si es partida contra IA y no ha terminado, hacer movimiento de IA
                    if (partida && partida.esIA && !partida.ganador && !partida.tableroLleno()){
                        // Pequeño delay para simular que la IA "piensa"
                        setTimeout(function(){
                            const resultadoIA = sistema.movimientoIA(codigo);
                            if (resultadoIA && resultadoIA.ok){
                                const nuevoEstado = sistema.obtenerEstadoPartida(codigo);
                                io.to(codigo).emit('movimientoRealizado', nuevoEstado);
                                
                                // Reiniciar temporizador después del movimiento de IA
                                if (!sistema.partidas[codigo].ganador){
                                    sistema.iniciarTemporizador(codigo, io);
                                } else {
                                    sistema.detenerTemporizador(codigo);
                                }
                            }
                        }, partida.dificultadIA === 'dificil' ? 800 : 400);
                    }
                } else {
                    srv.enviarAlRemitente(socket,'error',{msg: resultado.msg || 'Movimiento inválido'});
                }
            });

            socket.on('realizarMovimientoFootballGrid',function(datos){
                const email = datos ? datos.email : undefined;
                const codigo = datos ? datos.codigo : undefined;
                const fila = datos ? datos.fila : undefined;
                const columna = datos ? datos.columna : undefined;
                const nombreJugador = datos ? datos.nombreJugador : undefined;

                if (!nombreJugador || nombreJugador.trim() === ''){
                    return srv.enviarAlRemitente(socket,'error',{msg: 'Debes introducir el nombre de un jugador'});
                }

                const resultado = sistema.realizarMovimientoFootballGrid(email, codigo, fila, columna, nombreJugador.trim());
                if (resultado && resultado.ok){
                    // Si hay error, enviar mensaje solo al jugador que falló
                    if (resultado.error){
                        srv.enviarAlRemitente(socket,'errorTurno',{msg: resultado.error});
                    }
                    
                    // Enviar estado actualizado a todos (sin mensaje de error)
                    const estadoJuego = sistema.obtenerEstadoPartida(codigo);
                    estadoJuego.equiposFilas = resultado.equiposFilas;
                    estadoJuego.equiposColumnas = resultado.equiposColumnas;
                    estadoJuego.modo = 'footballgrid';
                    io.to(codigo).emit('movimientoRealizadoFootballGrid', estadoJuego);
                    
                    // Reiniciar temporizador después del movimiento
                    const partida = sistema.partidas[codigo];
                    if (partida && !partida.ganador){
                        sistema.iniciarTemporizador(codigo, io);
                    } else if (partida && partida.ganador){
                        sistema.detenerTemporizador(codigo);
                    }
                } else {
                    srv.enviarAlRemitente(socket,'error',{msg: resultado.msg || 'Movimiento inválido'});
                }
            });

            socket.on('realizarMovimientoBasketballGrid',function(datos){
                const email = datos ? datos.email : undefined;
                const codigo = datos ? datos.codigo : undefined;
                const fila = datos ? datos.fila : undefined;
                const columna = datos ? datos.columna : undefined;
                const nombreJugador = datos ? datos.nombreJugador : undefined;

                if (!nombreJugador || nombreJugador.trim() === ''){
                    return srv.enviarAlRemitente(socket,'error',{msg: 'Debes introducir el nombre de un jugador'});
                }

                const resultado = sistema.realizarMovimientoBasketballGrid(email, codigo, fila, columna, nombreJugador.trim());
                if (resultado && resultado.ok){
                    // Si hay error, enviar mensaje solo al jugador que falló
                    if (resultado.error){
                        srv.enviarAlRemitente(socket,'errorTurno',{msg: resultado.error});
                    }
                    
                    // Enviar estado actualizado a todos (sin mensaje de error)
                    const estadoJuego = sistema.obtenerEstadoPartida(codigo);
                    estadoJuego.equiposFilas = resultado.equiposFilas;
                    estadoJuego.equiposColumnas = resultado.equiposColumnas;
                    estadoJuego.modo = 'basketballgrid';
                    io.to(codigo).emit('movimientoRealizadoBasketballGrid', estadoJuego);
                    
                    // Reiniciar temporizador después del movimiento
                    const partida = sistema.partidas[codigo];
                    if (partida && !partida.ganador){
                        sistema.iniciarTemporizador(codigo, io);
                    } else if (partida && partida.ganador){
                        sistema.detenerTemporizador(codigo);
                    }
                } else {
                    srv.enviarAlRemitente(socket,'error',{msg: resultado.msg || 'Movimiento inválido'});
                }
            });

            socket.on('buscarJugadores',function(datos){
                const query = datos ? datos.query : undefined;
                const equipo1 = datos ? datos.equipo1 : undefined;
                const equipo2 = datos ? datos.equipo2 : undefined;

                if (!query || query.trim() === ''){
                    return srv.enviarAlRemitente(socket,'resultadosBusquedaJugadores',{jugadores: []});
                }

                const resultados = sistema.buscarJugadoresPorNombre(query.trim(), equipo1, equipo2);
                srv.enviarAlRemitente(socket,'resultadosBusquedaJugadores',{jugadores: resultados});
            });

            socket.on('buscarJugadoresNBA',function(datos){
                const query = datos ? datos.query : undefined;
                const equipo1 = datos ? datos.equipo1 : undefined;
                const equipo2 = datos ? datos.equipo2 : undefined;

                if (!query || query.trim() === ''){
                    return srv.enviarAlRemitente(socket,'resultadosBusquedaJugadoresNBA',{jugadores: []});
                }

                const resultados = sistema.buscarJugadoresNBAPorNombre(query.trim(), equipo1, equipo2);
                srv.enviarAlRemitente(socket,'resultadosBusquedaJugadoresNBA',{jugadores: resultados});
            });

            socket.on('enviarMensajeChat',function(datos){
                const email = datos ? datos.email : undefined;
                const codigo = datos ? datos.codigo : undefined;
                const mensaje = datos ? datos.mensaje : undefined;

                if (!email || !codigo || !mensaje || mensaje.trim() === ''){
                    return;
                }

                // Verificar que el usuario está en la partida
                const partida = sistema.partidas[codigo];
                if (!partida){
                    return;
                }

                const usr = sistema.usuarios[email];
                if (!usr || !partida.jugadores.includes(usr)){
                    return;
                }

                // No permitir chat en partidas contra IA
                if (partida.esIA){
                    return;
                }

                // Enviar mensaje a todos en la sala
                io.to(codigo).emit('mensajeChat', {
                    email: email,
                    mensaje: mensaje.trim(),
                    timestamp: Date.now()
                });
            });
        });
    }
}
module.exports.ServidorWS=ServidorWS;