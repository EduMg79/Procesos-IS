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

                // Robustez: si el usuario no está en memoria, lo recreamos.
                try {
                    if (email && !sistema.usuarioActivo(email)){
                        sistema.agregarUsuario(email);
                    }
                } catch(e) {}

                const res = sistema.crearPartida(email);
                const codigo = res ? res.codigo : -1;
                if (codigo !== -1){
                    socket.join(codigo);
                }
                srv.enviarAlRemitente(socket,"partidaCreada",{"codigo":codigo});
                const lista = sistema.obtenerPartidasDisponibles();
                // Incluir también al creador para que vea su partida al instante
                io.emit("listaPartidas",lista);
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
        });
    }
}
module.exports.ServidorWS=ServidorWS;