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
                if (data && data.nick && data.nick !== -1) {
                    //localStorage.setItem("nick", nick);
                    $.cookie("nick", nick)
                    $("#resAgregar").html(`<div class="alert alert-success">Usuario <b>${nick}</b> registrado correctamente.</div>`);
                    this.comprobarSesion(); // refresca la sesión
                } else {
                    $("#resAgregar").html(`<div class="alert alert-danger">El nick <b>${nick}</b> ya está ocupado.</div>`);
                }
             })
             .fail(() => {
                $("#resAgregar").html('<div class="alert alert-danger">Error al registrar usuario.</div>');
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

    // ----------------------------
    // Comprobar sesión
    // ----------------------------
    this.comprobarSesion = function() {
        let nick=  $.cookie("nick")
        //let nick = localStorage.getItem("nick");
        
        if (nick) {
            this.mostrarMensaje("Bienvenido al sistema, " + nick);
        } else {
            this.mostrarAgregarUsuario();
        }
    };

    // ----------------------------
    // Cerrar sesión
    // ----------------------------
    this.salir = function() {
        //localStorage.removeItem("nick");
        $.removeCookie("nick")
        this.mostrarMensaje("Has cerrado sesión.");
        location.reload();
    };

    // ----------------------------
    // Botón de salir
    // ----------------------------
    this.mostrarSalir = function() {
        $("#salir").on("click", () => {
            this.salir();
        });
    };

}
