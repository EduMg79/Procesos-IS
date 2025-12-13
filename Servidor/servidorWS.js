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

            socket.on("crearPartida",function(datos){
                const email = datos ? datos.email : undefined;
                const res = sistema.crearPartida(email);
                const codigo = res ? res.codigo : -1;
                if (codigo !== -1){
                    socket.join(codigo);
                }
                srv.enviarAlRemitente(socket,"partidaCreada",{"codigo":codigo});
                const lista = sistema.obtenerPartidasDisponibles();
                srv.enviarATodosMenosRemitente(socket,"listaPartidas",lista);
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
                    io.to(res.codigo).emit('jugadorUnido',{email:email,otroJugador:otroJugador,jugadores:jugadores});
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