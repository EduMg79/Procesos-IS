
function ControlWeb() {

    const contenedorId = '#au'; // contenedor principal para pintar componentes

    // ----------------------------
    // Utilidades
    // ----------------------------

    function normalizarUsuarios(data) {
        // Acepta { usuarios: {...} } o un objeto plano de usuarios
        if (data && typeof data === 'object' && data.usuarios && typeof data.usuarios === 'object') {
            return data.usuarios;
        }
        return data || {};
    }

    function normalizarUsuarioActivo(data) {
        // Acepta booleano directo o { res: boolean }
        if (typeof data === 'boolean') return data;
        if (data && typeof data === 'object') return !!data.res;
        return false;
    }

    function esEliminacionOk(data) {
        // Devuelve true si ok===true, false si ok===false, y tolera respuestas antiguas
        if (data && typeof data === 'object' && typeof data.ok === 'boolean') return data.ok;
        if (data === true || data === 'true') return true;
        if (typeof data === 'string' && data.toLowerCase().indexOf('eliminado') !== -1) return true;
        return false;
    }

    // ----------------------------
    // 1) Agregar usuario
    // ----------------------------
    this.mostrarAgregarUsuario = function() {
        const html = `
        <div class="form-group" id="cmp-agregar">
            <h5><i class="fa fa-user-plus text-primary"></i> Agregar usuario</h5>
            <div class="text-center my-3">
                    <a id="linkGoogleAuth" href="/auth/google" title="Iniciar sesión con Google">
                        <img id="imgAgregarUsuario" src="./img/android_dark_rd_ctn@2x.png" alt="Login con Google" class="img-fluid" style="max-height:160px; object-fit:contain; cursor:pointer;" />
                    </a>
            </div>
            <label for="nickAgregar" class="small text-muted">Nombre de usuario</label>
            <input type="text" class="form-control" id="nickAgregar" placeholder="p.ej. Pepe" />
            <button id="btnAgregar" type="button" class="btn btn-primary mt-3"><i class="fa fa-plus"></i> Agregar usuario</button>
            <div id="resAgregar" class="mt-3"></div>
        </div>`;
        $(contenedorId).append(html);

        // Click en la imagen => iniciar flujo de autenticación con Google
            // Refuerzo: si por algún motivo se impide la navegación del <a>, forzamos la redirección
            $("#imgAgregarUsuario").on("click", function(e){
                // Dejar que el <a> navegue, pero si se cancela, hacemos fallback
                setTimeout(function(){
                    const href = $("#linkGoogleAuth").attr("href") || "/auth/google";
                    if (location.pathname !== href) {
                        window.location.href = href;
                    }
                }, 0);
            });

        $("#btnAgregar").on("click", () => {
            const nick = $("#nickAgregar").val().trim();
            if (!nick) {
                return $("#resAgregar").html('<div class="alert alert-warning">Introduce un nick.</div>');
            }

            $.getJSON("/agregarUsuario/" + encodeURIComponent(nick))
             .done((data) => {
                if (data && data.ok) {
                    $.cookie("nick", nick)
                    $("#resAgregar").html(`<div class="alert alert-success">${data.msg}</div>`);
                    $("#msg").html(`<div class="alert alert-success">${data.msg}</div>`);
                    this.comprobarSesion(); // refresca la sesión
                } else {
                    $("#resAgregar").html(`<div class="alert alert-danger">${data.msg || 'El nick ya está ocupado.'}</div>`);
                    $("#msg").html(`<div class="alert alert-danger">${data.msg || 'El nick ya está ocupado.'}</div>`);
                }
             })
             .fail(() => {
                $("#resAgregar").html('<div class="alert alert-danger">Error al registrar usuario.</div>');
                $("#msg").html('<div class="alert alert-danger">Error al registrar usuario.</div>');
             });
        });
    };

    // ----------------------------
    // 2) Obtener usuarios
    // ----------------------------
    this.mostrarObtenerUsuarios = function() {
        const html = `
        <div class="form-group" id="cmp-obtener">
            <h5><i class="fa fa-users text-info"></i> Obtener usuarios</h5>
            <button id="btnObtener" type="button" class="btn btn-info mb-2"><i class="fa fa-list"></i> Obtener usuarios</button>
            <div id="listaUsuarios" class="mt-2"></div>
        </div>`;
        $(contenedorId).append(html);

        $("#btnObtener").on("click", () => {
            $.ajax({
                type: 'GET',
                url: '/obtenerUsuarios',
                success: (data) => {
                    const usuariosObj = normalizarUsuarios(data);
                    const usuarios = Object.keys(usuariosObj || {});
                    if (!usuarios.length) {
                        return $("#listaUsuarios").html('<div class="alert alert-info">No hay usuarios registrados.</div>');
                    }
                    let lista = '<ul class="list-group">';
                    usuarios.forEach(n => lista += `<li class="list-group-item">${n}</li>`);
                    lista += '</ul>';
                    $("#listaUsuarios").html(lista);
                },
                error: () => {
                    $("#listaUsuarios").html('<div class="alert alert-danger">Error al obtener usuarios.</div>');
                },
                contentType: 'application/json'
            });
        });
    };

    // ----------------------------
    // 3) Usuario activo
    // ----------------------------
    this.mostrarUsuarioActivo = function() {
        const html = `
        <div class="form-group" id="cmp-activo">
            <h5><i class="fa fa-user-check text-warning"></i> ¿Usuario activo?</h5>
            <input type="text" id="nickActivo" class="form-control mb-2" placeholder="Nick a comprobar" />
            <button id="btnActivo" type="button" class="btn btn-warning"><i class="fa fa-search"></i> Comprobar</button>
            <div id="resActivo" class="mt-2"></div>
        </div>`;
        $(contenedorId).append(html);

        $("#btnActivo").on("click", () => {
            const nick = $("#nickActivo").val().trim();
            if (!nick) {
                return $("#resActivo").html('<div class="alert alert-warning">Introduce un nick para comprobar.</div>');
            }

            $.ajax({
                type: 'GET',
                url: '/usuarioActivo/' + encodeURIComponent(nick),
                success: (data) => {
                    const activo = normalizarUsuarioActivo(data);
                    if (activo) {
                        $("#resActivo").html(`<div class="alert alert-success">El usuario <b>${nick}</b> está activo.</div>`);
                    } else {
                        $("#resActivo").html(`<div class="alert alert-danger">El usuario <b>${nick}</b> NO está activo.</div>`);
                    }
                },
                error: () => {
                    $("#resActivo").html('<div class="alert alert-danger">Error al comprobar usuario.</div>');
                },
                contentType: 'application/json'
            });
        });
    };

    // ----------------------------
    // 4) Número de usuarios
    // ----------------------------
    this.mostrarNumeroUsuarios = function() {
        const html = `
        <div class="form-group" id="cmp-num">
            <h5><i class="fa fa-hashtag text-secondary"></i> Número de usuarios</h5>
            <button id="btnNum" type="button" class="btn btn-secondary"><i class="fa fa-hashtag"></i> Consultar</button>
            <div id="resNum" class="mt-2"></div>
        </div>`;
        $(contenedorId).append(html);

        $("#btnNum").on("click", () => {
            $.ajax({
                type: 'GET',
                url: '/numeroUsuarios',
                success: (data) => {
                    let num = (data && typeof data === 'object' && 'num' in data) ? data.num : data;
                    if (typeof num !== 'number') {
                        $.ajax({
                            type: 'GET',
                            url: '/obtenerUsuarios',
                            success: (d2) => {
                                const usuariosObj = normalizarUsuarios(d2);
                                const cnt = Object.keys(usuariosObj || {}).length;
                                $("#resNum").html(`<div class="alert alert-primary">Número de usuarios: <b>${cnt}</b></div>`);
                            },
                            error: () => {
                                $("#resNum").html('<div class="alert alert-danger">Error al obtener el número de usuarios.</div>');
                            }
                        });
                    } else {
                        $("#resNum").html(`<div class="alert alert-primary">Número de usuarios: <b>${num}</b></div>`);
                    }
                },
                error: () => {
                    $("#resNum").html('<div class="alert alert-danger">Error al obtener el número de usuarios.</div>');
                },
                contentType: 'application/json'
            });
        });
    };

    // ----------------------------
    // 5) Eliminar usuario
    // ----------------------------
    this.mostrarEliminarUsuario = function() {
        const html = `
        <div class="form-group" id="cmp-eliminar">
            <h5><i class="fa fa-user-times text-danger"></i> Eliminar usuario</h5>
            <input type="text" id="nickEliminar" class="form-control mb-2" placeholder="Nick a eliminar" />
            <button id="btnEliminar" type="button" class="btn btn-danger"><i class="fa fa-trash"></i> Eliminar usuario</button>
            <div id="resEliminar" class="mt-2"></div>
        </div>`;
        $(contenedorId).append(html);

        $("#btnEliminar").on("click", () => {
            const nick = $("#nickEliminar").val().trim();
            if (!nick) {
                return $("#resEliminar").html('<div class="alert alert-warning">Introduce un nick para eliminar.</div>');
            }

            $.ajax({
                type: 'GET',
                url: '/eliminarUsuario/' + encodeURIComponent(nick),
                success: (data) => {
                    if (esEliminacionOk(data)) {
                        $("#resEliminar").html(`<div class="alert alert-success">Usuario <b>${nick}</b> eliminado correctamente.</div>`);
                    } else {
                        $("#resEliminar").html(`<div class="alert alert-danger">No existe el usuario <b>${nick}</b>.</div>`);
                    }
                },
                error: () => {
                    $("#resEliminar").html('<div class="alert alert-danger">Error al eliminar usuario.</div>');
                },
                contentType: 'application/json'
            });
        });
    };

    // ----------------------------
    // Mensajes de sistema
    // ----------------------------
    this.mostrarMensaje = function(msg) {
        $("#au").html(`<div class="alert alert-info">${msg}</div>`);
        this.mostrarSalir();
    };

       this.mostrarModal = function(m){
        $('#msg').remove();
        if (m){
            const cadena = "<div id='msg'>"+m+"</div>";
            $('#mBody').append(cadena);
        }
        $('#miModal').modal('show');
    };

    // ----------------------------
    // Comprobar sesión
    // ----------------------------
    this.comprobarSesion = function() {
        let nick=  $.cookie("nick")
        //let nick = localStorage.getItem("nick");
        
        if (nick) {
            this.mostrarMensaje("Bienvenido al sistema, " + nick);
            this.mostrarCrearPartida();
            this.mostrarListaPartidas([]);
            this.mostrarEliminarPartida();
        } else {
            this.mostrarAgregarUsuario();
            this.mostrarRegistro();
        }
    };

    // ----------------------------
    // 6) Crear partida
    // ----------------------------
    this.mostrarCrearPartida = function() {
        const html = `
        <div class="form-group" id="cmp-crear-partida">
            <h5><i class="fa fa-gamepad text-success"></i> Crear partida</h5>
            <button id="btnCrearPartida" type="button" class="btn btn-success"><i class="fa fa-plus"></i> Crear partida</button>
            <div id="resCrearPartida" class="mt-3"></div>
        </div>`;
        $(contenedorId).append(html);

        $("#btnCrearPartida").on("click", () => {
            $("#btnCrearPartida").prop('disabled', true);
            $("#resCrearPartida").html('<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Esperando rival...</div>');
            if (typeof ws !== 'undefined' && ws && typeof ws.crearPartida === 'function'){
                ws.crearPartida();
            }
        });
    };

    // ----------------------------
    // 7) Lista de partidas disponibles
    // ----------------------------
    this.mostrarListaPartidas = function(lista) {
        const html = lista && lista.length ? `
        <div class="form-group" id="cmp-lista-partidas">
            <h5><i class="fa fa-list text-primary"></i> Partidas disponibles</h5>
            <table class="table table-hover table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Creador</th>
                        <th>Código</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="listaPartidosBody">
                </tbody>
            </table>
        </div>` : `
        <div class="form-group" id="cmp-lista-partidas">
            <h5><i class="fa fa-list text-primary"></i> Partidas disponibles</h5>
            <div class="alert alert-info">No hay partidas disponibles</div>
        </div>`;

        // Si ya existe, reemplazar solo la tabla; si no, añadir
        if ($("#cmp-lista-partidas").length) {
            $("#cmp-lista-partidas").replaceWith(html);
        } else {
            $(contenedorId).append(html);
        }

        // Llenar tabla si hay partidas
        if (lista && lista.length) {
            lista.forEach(partida => {
                const fila = `<tr>
                    <td>${partida.email || 'Desconocido'}</td>
                    <td><code>${partida.codigo}</code></td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-unir" data-codigo="${partida.codigo}">
                            <i class="fa fa-sign-in-alt"></i> Unirse
                        </button>
                    </td>
                </tr>`;
                $("#listaPartidosBody").append(fila);
            });

            // Manejador para botón "Unirse"
            $(".btn-unir").on("click", function() {
                const codigo = $(this).data('codigo');
                if (typeof ws !== 'undefined' && ws && typeof ws.unirAPartida === 'function'){
                    ws.unirAPartida(codigo);
                }
            });
        }
    };

    // ----------------------------
    // 8) Mostrar esperando rival
    // ----------------------------
    this.mostrarEsperandoRival = function() {
        $("#btnCrearPartida").prop('disabled', true);
        $("#resCrearPartida").html(`<div class="alert alert-warning"><i class="fa fa-spinner fa-spin"></i> Esperando rival (código: <code>${ws.codigo}</code>)...</div>`);
    };

    // ----------------------------
    // 9) Mostrar jugador unido
    // ----------------------------
    this.mostrarJugadorUnido = function(datos) {
        const mensaje = datos && datos.email ? `Se ha unido a la partida <b>${datos.email}</b>` : 'Un jugador se ha unido a la partida';
        const html = `<div class="alert alert-success"><i class="fa fa-check-circle"></i> ${mensaje}</div>`;
        $(contenedorId).find("#resCrearPartida").html(html);
        // También podría mostrarse como modal o notificación flotante si lo prefieres
    };
    // ----------------------------
    // 10) Eliminar partida
    // ----------------------------
    this.mostrarEliminarPartida = function() {
        const html = `
        <div class="form-group" id="cmp-eliminar-partida">
            <h5><i class="fa fa-trash text-danger"></i> Eliminar partida</h5>
            <input type="text" id="codigoEliminar" class="form-control mb-2" placeholder="Introduce el código de la partida" />
            <button id="btnEliminarPartida" type="button" class="btn btn-danger"><i class="fa fa-trash"></i> Eliminar</button>
            <div id="resEliminarPartida" class="mt-2"></div>
        </div>`;
        $(contenedorId).append(html);

        $("#btnEliminarPartida").on("click", () => {
            const codigo = $("#codigoEliminar").val().trim();
            if (!codigo) {
                return $("#resEliminarPartida").html('<div class="alert alert-warning">Introduce un código de partida.</div>');
            }
            if (typeof ws !== 'undefined' && ws && typeof ws.eliminarPartida === 'function'){
                ws.eliminarPartida(codigo);
            } else {
                $("#resEliminarPartida").html('<div class="alert alert-danger">Error: no se pudo conectar al servidor.</div>');
            }
        });
    };

    // ----------------------------
    // 11) Mostrar partida eliminada
    // ----------------------------
    this.mostrarPartidaEliminada = function(datos) {
        const msg = datos && datos.ok ? 'Partida eliminada correctamente' : 'No se pudo eliminar la partida (código no existe)';
        const tipo = datos && datos.ok ? 'success' : 'danger';
        const icono = datos && datos.ok ? 'check-circle' : 'exclamation-circle';
        const html = `<div class="alert alert-${tipo}"><i class="fa fa-${icono}"></i> ${msg}</div>`;
        $("#resEliminarPartida").html(html);
        if (datos && datos.ok) {
            $("#codigoEliminar").val('');
        }
    };    this.mostrarSalir = function() {
        $("#salir").on("click", () => {
            this.salir();
        });
    };

    this.mostrarRegistro = function() {
        $("#fmRegistro").remove();
        $("#registro").load("/registro.html", function(response, status) {
            if (status === 'error') {
                console.error('No se pudo cargar registro.html');
                return;
            }
            $("#btnRegistro").on("click", function(e) {
                e.preventDefault();
                let email = $("#email").val();
                let pwd = $("#pwd").val();
                let apellidos = $("#apellidos").val();
                let nombre = $("#nombre").val();
                if (email && pwd && apellidos && nombre) {
                    $.ajax({
                        type: 'POST',
                        url: '/registrarUsuario',
                        data: JSON.stringify({ email, password: pwd, apellidos, nombre }),
                        contentType: 'application/json',
                        success: function(data) {
                            if (data && data.ok) {
                                // No auto-login: mostrar formulario de login y mensaje de confirmación pendiente
                                $("#msg").html(`<div class='alert alert-success'>${data.msg || 'Registro correcto, falta confirmación'}</div>`);
                                cw.mostrarLogin();
                            } else {
                                const mensaje = data && data.msg ? data.msg : 'Error al registrar usuario.';
                                $("#msg").html(`<div class='alert alert-danger'>${mensaje}</div>`);
                                if (cw && typeof cw.mostrarModal === 'function') {
                                    cw.mostrarModal('No se ha podido registrar el usuario');
                                }
                            }
                        },
                        error: function(xhr) {
                            let errMsg = 'Error al registrar usuario.';
                            if (xhr.responseJSON && xhr.responseJSON.msg) errMsg = xhr.responseJSON.msg;
                            $("#msg").html(`<div class='alert alert-danger'>${errMsg}</div>`);
                            if (cw && typeof cw.mostrarModal === 'function') {
                                cw.mostrarModal('No se ha podido registrar el usuario');
                            }
                        }
                    });
                } else {
                    $("#msg").html(`<div class='alert alert-warning'>Rellena todos los campos.</div>`);
                }
            });
        });
    }

 this.mostrarLogin = function() {
    $("#fmLogin").remove();
        $("#registro").load("/login.html", function(response, status) {
            if (status === 'error') {
                console.error('No se pudo cargar login.html');
                return;
            }
        $("#btnLogin").on("click", function(e) {
            e.preventDefault();
            let email = $("#email").val();
            let pwd = $("#pwd").val();
            if (email && pwd) {
                rest.loginUsuario(email, pwd);
            } else {
                $("#msg").html('<div class="alert alert-warning">Rellena email y contraseña.</div>');
            }
        });
    });
}

this.salir=function(){
//localStorage.removeItem("nick");
$.removeCookie("nick");
location.reload();
rest.cerrarSesion();
}



}
