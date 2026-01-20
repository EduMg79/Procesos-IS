
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
                    // Sincronizar WS con el nuevo usuario para que crear/unirse funcione sin recargar
                    try {
                        if (typeof ws !== 'undefined' && ws) {
                            if (typeof ws.setEmail === 'function') {
                                ws.setEmail(nick);
                            } else {
                                ws.email = nick;
                            }
                        }
                    } catch (e) {}
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
            // Mantener WS en sincronía con la sesión (imprescindible para crear/unirse a partidas)
            try {
                if (typeof ws !== 'undefined' && ws) {
                    if (typeof ws.setEmail === 'function') {
                        ws.setEmail(nick);
                    } else {
                        ws.email = nick;
                    }
                }
            } catch (e) {}

            this.mostrarMensaje("Bienvenido al sistema, " + nick);
        } else {
            this.mostrarAgregarUsuario();
            this.mostrarRegistro();
        }
    };

    // ----------------------------
    // Partidas (se muestran al pulsar "Partidas")
    // ----------------------------
    this.mostrarPartidas = function(){
        // Solo si hay sesión
        const nick = $.cookie("nick");
        if (!nick){
            return this.mostrarModal('Inicia sesión para gestionar partidas');
        }

        // Sincronizar WS con la sesión
        try {
            if (typeof ws !== 'undefined' && ws) {
                if (typeof ws.setEmail === 'function') {
                    ws.setEmail(nick);
                } else {
                    ws.email = nick;
                }
            }
        } catch(e) {}

        // Limpiar contenedor principal y pintar controles de partidas
        $(contenedorId).html('');
        
        // Mostrar pestañas de modo de juego
        this.mostrarSelectorModoJuego();
    };

    // ----------------------------
    // Selector de modo: Multijugador vs IA
    // ----------------------------
    this.mostrarSelectorModoJuego = function() {
        const html = `
        <div class="form-group" id="cmp-selector-modo">
            <h4 class="text-center mb-4"><i class="fa fa-gamepad"></i> Selecciona el modo de juego</h4>
            <div class="btn-group d-flex mb-4" role="group">
                <button type="button" class="btn btn-lg modo-btn active" id="btnModoMultijugador" data-modo="multijugador">
                    <i class="fa fa-users"></i> Multijugador
                </button>
                <button type="button" class="btn btn-lg modo-btn" id="btnModoIA" data-modo="ia">
                    <i class="fa fa-robot"></i> vs IA
                </button>
                <button type="button" class="btn btn-lg modo-btn" id="btnModoFootballGrid" data-modo="footballgrid">
                    <i class="fa fa-futbol"></i> Football Grid
                </button>
                <button type="button" class="btn btn-lg modo-btn" id="btnModoBasketballGrid" data-modo="basketballgrid">
                    <i class="fa fa-basketball-ball"></i> Basketball Grid
                </button>
            </div>
            <div id="contenedor-modo"></div>
        </div>`;
        
        $(contenedorId).html(html);
        
        // Manejadores de pestañas
        $(".modo-btn").on("click", function(){
            $(".modo-btn").removeClass("active");
            $(this).addClass("active");
            const modo = $(this).data("modo");
            
            if (modo === "multijugador"){
                cw.mostrarModoMultijugador();
            } else if (modo === "ia"){
                cw.mostrarModoIA();
            } else if (modo === "footballgrid"){
                cw.mostrarModoFootballGrid();
            } else if (modo === "basketballgrid"){
                cw.mostrarModoBasketballGrid();
            }
        });
        
        // Mostrar multijugador por defecto
        this.mostrarModoMultijugador();
    };

    // ----------------------------
    // Modo Multijugador
    // ----------------------------
    this.mostrarModoMultijugador = function() {
        const html = `
        <div id="modo-multijugador-contenedor">
            <div class="form-group" id="cmp-crear-partida">
                <h5><i class="fa fa-gamepad text-success"></i> Crear partida de 3 en Raya</h5>
                <div class="mb-3">
                    <label class="font-weight-bold">Selecciona el tamaño del tablero:</label>
                    <div class="btn-group d-flex mt-2" role="group">
                        <button type="button" class="btn size-btn-multi active" data-size="3">3x3</button>
                        <button type="button" class="btn size-btn-multi" data-size="4">4x4</button>
                        <button type="button" class="btn size-btn-multi" data-size="5">5x5</button>
                    </div>
                </div>
                <button id="btnCrearPartidaMulti" type="button" class="btn btn-success btn-block">+ Crear partida</button>
                <div id="resCrearPartidaMulti" class="mt-3"></div>
            </div>
            
            <div class="form-group" id="cmp-lista-partidas">
                <h5><i class="fa fa-list text-primary"></i> Partidas disponibles</h5>
                <div class="alert alert-info">Cargando partidas...</div>
            </div>
            
            <div class="form-group" id="cmp-eliminar-partida">
                <h5><i class="fa fa-trash text-danger"></i> Eliminar partida</h5>
                <label for="codigoEliminarMulti">Introduce el código de la partida:</label>
                <input type="text" id="codigoEliminarMulti" class="form-control mb-2" placeholder="Introduce el código de la partida" />
                <button id="btnEliminarPartidaMulti" type="button" class="btn btn-danger">Eliminar</button>
                <div id="resEliminarPartidaMulti" class="mt-2"></div>
            </div>
        </div>`;
        
        $("#contenedor-modo").html(html);
        
        let tamanoSeleccionado = 3;
        
        // Selector de tamaño
        $(".size-btn-multi").on("click", function(){
            $(".size-btn-multi").removeClass("active");
            $(this).addClass("active");
            tamanoSeleccionado = parseInt($(this).data("size"));
        });
        
        // Crear partida
        $("#btnCrearPartidaMulti").on("click", () => {
            $("#btnCrearPartidaMulti").prop('disabled', true);
            $("#resCrearPartidaMulti").html('<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Esperando rival...</div>');
            if (typeof ws !== 'undefined' && ws && typeof ws.crearPartida === 'function'){
                ws.crearPartida(tamanoSeleccionado);
            }
        });
        
        // Eliminar partida
        $("#btnEliminarPartidaMulti").on("click", () => {
            const codigo = $("#codigoEliminarMulti").val().trim();
            if (!codigo) {
                return $("#resEliminarPartidaMulti").html('<div class="alert alert-warning">Introduce un código de partida.</div>');
            }
            if (typeof ws !== 'undefined' && ws && typeof ws.eliminarPartida === 'function'){
                ws.eliminarPartida(codigo);
            } else {
                $("#resEliminarPartidaMulti").html('<div class="alert alert-danger">Error: no se pudo conectar al servidor.</div>');
            }
        });

        // Pedir lista inicial de partidas
        try {
            if (typeof ws !== 'undefined' && ws && ws.socket) {
                ws.socket.emit('obtenerPartidas');
            }
        } catch(e) {}
    };

    // ----------------------------
    // Modo vs IA
    // ----------------------------
    this.mostrarModoIA = function() {
        const html = `
        <div class="form-group" id="cmp-ia">
            <h5><i class="fa fa-robot text-info"></i> Jugar contra IA</h5>
            
            <div class="mb-3">
                <label class="font-weight-bold">Tamaño del tablero:</label>
                <div class="btn-group d-flex mt-2" role="group">
                    <button type="button" class="btn size-btn-ia active" data-size="3">3x3</button>
                    <button type="button" class="btn size-btn-ia" data-size="4">4x4</button>
                    <button type="button" class="btn size-btn-ia" data-size="5">5x5</button>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="font-weight-bold">Dificultad:</label>
                <div class="btn-group d-flex mt-2" role="group">
                    <button type="button" class="btn dificultad-btn active" data-dificultad="facil" style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);">
                        <i class="fa fa-smile"></i> Fácil
                    </button>
                    <button type="button" class="btn dificultad-btn" data-dificultad="medio" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
                        <i class="fa fa-meh"></i> Medio
                    </button>
                    <button type="button" class="btn dificultad-btn" data-dificultad="dificil" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);">
                        <i class="fa fa-fire"></i> Difícil
                    </button>
                </div>
            </div>
            
            <button id="btnCrearPartidaIA" type="button" class="btn btn-success btn-lg btn-block">
                <i class="fa fa-play"></i> Comenzar Juego
            </button>
            <div id="resCrearPartidaIA" class="mt-3"></div>
         
        </div>`;
        
        $("#contenedor-modo").html(html);
        
        let tamanoSeleccionado = 3;
        let dificultadSeleccionada = 'facil';
        
        // Selector de tamaño
        $(".size-btn-ia").on("click", function(){
            $(".size-btn-ia").removeClass("active");
            $(this).addClass("active");
            tamanoSeleccionado = parseInt($(this).data("size"));
        });
        
        // Selector de dificultad
        $(".dificultad-btn").on("click", function(){
            $(".dificultad-btn").removeClass("active");
            $(this).addClass("active");
            dificultadSeleccionada = $(this).data("dificultad");
        });
        
        // Crear partida contra IA
        $("#btnCrearPartidaIA").on("click", () => {
            $("#btnCrearPartidaIA").prop('disabled', true);
            $("#resCrearPartidaIA").html('<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Iniciando partida...</div>');
            if (typeof ws !== 'undefined' && ws && typeof ws.crearPartidaIA === 'function'){
                ws.crearPartidaIA(tamanoSeleccionado, dificultadSeleccionada);
            }
        });
    };

    // ----------------------------
    // Modo Football Grid
    // ----------------------------
    this.mostrarModoFootballGrid = function() {
        const html = `
        <div class="form-group" id="cmp-footballgrid">
            <h5><i class="fa fa-futbol text-warning"></i> Football Grid</h5>
            <p class="text-muted small">¡Conecta 3 jugadores en línea! Cada casilla requiere un jugador que haya jugado en ambos equipos (fila y columna).</p>
            
            <button id="btnCrearPartidaFootballGrid" type="button" class="btn btn-warning btn-lg btn-block">
                <i class="fa fa-play"></i> Comenzar Juego
            </button>
            <div id="resCrearPartidaFootballGrid" class="mt-3"></div>
        </div>`;
        
        $("#contenedor-modo").html(html);
        
        // Crear partida Football Grid
        $("#btnCrearPartidaFootballGrid").on("click", () => {
            $("#btnCrearPartidaFootballGrid").prop('disabled', true);
            $("#resCrearPartidaFootballGrid").html('<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Esperando rival...</div>');
            if (typeof ws !== 'undefined' && ws && typeof ws.crearPartidaFootballGrid === 'function'){
                ws.crearPartidaFootballGrid();
            }
        });
    };

    this.mostrarModoBasketballGrid = function() {
        const html = `
        <div class="form-group" id="cmp-basketballgrid">
            <h5><i class="fa fa-basketball-ball text-danger"></i> Basketball Grid</h5>
            <p class="text-muted small">¡Conecta 3 jugadores en línea! Cada casilla requiere un jugador de la NBA que haya jugado en ambos equipos (fila y columna).</p>
            
            <button id="btnCrearPartidaBasketballGrid" type="button" class="btn btn-danger btn-lg btn-block">
                <i class="fa fa-play"></i> Comenzar Juego
            </button>
            <div id="resCrearPartidaBasketballGrid" class="mt-3"></div>
        </div>`;
        
        $("#contenedor-modo").html(html);
        
        // Crear partida Basketball Grid
        $("#btnCrearPartidaBasketballGrid").on("click", () => {
            $("#btnCrearPartidaBasketballGrid").prop('disabled', true);
            $("#resCrearPartidaBasketballGrid").html('<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Esperando rival...</div>');
            if (typeof ws !== 'undefined' && ws && typeof ws.crearPartidaBasketballGrid === 'function'){
                ws.crearPartidaBasketballGrid();
            }
        });
    };

    // ----------------------------
    // 6) Crear partida
    // ----------------------------
    this.mostrarCrearPartida = function() {
        const html = `
        <div class="form-group" id="cmp-crear-partida">
            <h5><i class="fa fa-gamepad text-success"></i> Crear partida de 3 en Raya</h5>
            <div class="mb-3">
                <label class="font-weight-bold">Selecciona el tamaño del tablero:</label>
                <div class="btn-group d-flex mt-2" role="group">
                    <button type="button" class="btn size-btn active" data-size="3">3x3</button>
                    <button type="button" class="btn size-btn" data-size="4">4x4</button>
                    <button type="button" class="btn size-btn" data-size="5">5x5</button>
                </div>
            </div>
            <button id="btnCrearPartida" type="button" class="btn btn-success btn-block">+ Crear partida</button>
            <div id="resCrearPartida" class="mt-3"></div>
        </div>`;
        $(contenedorId).append(html);

        // Selector de tamaño
        let tamanoSeleccionado = 3;
        $(".size-btn").on("click", function(){
            $(".size-btn").removeClass("active");
            $(this).addClass("active");
            tamanoSeleccionado = parseInt($(this).data("size"));
        });

        $("#btnCrearPartida").on("click", () => {
            $("#btnCrearPartida").prop('disabled', true);
            $("#resCrearPartida").html('<div class="alert alert-info"><i class="fa fa-spinner fa-spin"></i> Esperando rival...</div>');
            if (typeof ws !== 'undefined' && ws && typeof ws.crearPartida === 'function'){
                ws.crearPartida(tamanoSeleccionado);
            }
        });
    };

    // ----------------------------
    // 7) Lista de partidas disponibles
    // ----------------------------
    this.mostrarListaPartidas = function(lista) {
        const html = lista && lista.length ? `
            <h5><i class="fa fa-list text-primary"></i> Partidas disponibles</h5>
            <table class="table table-hover table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Creador</th>
                        <th>Código</th>
                        <th>Jugadores</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="listaPartidosBody">
                </tbody>
            </table>` : `
            <h5><i class="fa fa-list text-primary"></i> Partidas disponibles</h5>
            <div class="alert alert-info">No hay partidas disponibles</div>`;

        // Actualizar el contenedor de lista de partidas
        if ($("#cmp-lista-partidas").length) {
            $("#cmp-lista-partidas").html(html);
        }

        // Llenar tabla si hay partidas
        if (lista && lista.length) {
            lista.forEach(partida => {
                const num = (partida && typeof partida.numJugadores === 'number') ? partida.numJugadores : (partida && Array.isArray(partida.jugadores) ? partida.jugadores.length : 0);
                const max = (partida && typeof partida.maxJug === 'number') ? partida.maxJug : 2;
                const fila = `<tr>
                    <td>${partida.email || 'Desconocido'}</td>
                    <td><code>${partida.codigo}</code></td>
                    <td>${num}/${max}</td>
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
        if ($("#btnCrearPartidaMulti").length) {
            $("#btnCrearPartidaMulti").prop('disabled', true);
            $("#resCrearPartidaMulti").html(`
                <div class="alert alert-warning">
                    <div><i class="fa fa-spinner fa-spin"></i> Esperando rival (código: <code>${ws.codigo}</code>)...</div>
                    <div class="mt-2">
                        <button id="btnCancelarPartida" type="button" class="btn btn-outline-danger btn-sm">
                            <i class="fa fa-times"></i> Cancelar partida
                        </button>
                    </div>
                </div>
            `);

            // Cancelar la partida mientras está esperando
            $("#btnCancelarPartida").off('click').on('click', function(){
                try {
                    if (typeof ws !== 'undefined' && ws && typeof ws.eliminarPartida === 'function' && ws.codigo){
                        ws.eliminarPartida(ws.codigo);
                    }
                } catch(e) {}
            });
        }
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
            <label for="codigoEliminar">Introduce el código de la partida:</label>
            <input type="text" id="codigoEliminar" class="form-control mb-2" placeholder="Introduce el código de la partida" />
            <button id="btnEliminarPartida" type="button" class="btn btn-danger">Eliminar</button>
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
        
        if ($("#resEliminarPartidaMulti").length) {
            $("#resEliminarPartidaMulti").html(html);
            if (datos && datos.ok) {
                $("#codigoEliminarMulti").val('');
            }
        }

        // Si acabamos de cancelar la partida que estábamos esperando, resetear UI
        try {
            if (datos && datos.ok && typeof ws !== 'undefined' && ws && ws.codigo && datos.codigo === ws.codigo){
                ws.codigo = undefined;
                if ($("#btnCrearPartidaMulti").length) {
                    $("#btnCrearPartidaMulti").prop('disabled', false);
                    $("#resCrearPartidaMulti").html('');
                }
            }
        } catch(e) {}
    };

    // ----------------------------
    // 12) Mostrar tablero del juego
    // ----------------------------
    this.mostrarTableroJuego = function(datos) {
        console.log('mostrarTableroJuego - datos recibidos:', datos);
        const tamano = datos.tamano || 3;
        const tablero = datos.tablero || [];
        const turnoActual = datos.turnoActual;
        const ganador = datos.ganador;
        const simbolos = datos.simbolos || {};
        const jugadores = datos.jugadores || [];
        const nick = $.cookie("nick");
        const miSimbolo = simbolos[nick] || '?';
        
        console.log('Jugadores:', jugadores);
        console.log('Nick actual:', nick);
        
        // Detectar si es partida contra IA - usar datos.esIA si está disponible
        const esIA = datos.esIA || jugadores.some(j => j === 'IA' || (typeof j === 'string' && j.startsWith('IA_')));
        console.log('¿Es IA?:', esIA);
        console.log('datos.esIA:', datos.esIA);
        const rivalNick = esIA ? '🤖 IA' : (jugadores.find(j => j !== nick) || 'Rival');
        const rivalSimbolo = simbolos[rivalNick] || (esIA ? simbolos['IA'] || simbolos[jugadores.find(j => j !== nick)] : '?');

        let estadoTexto = '';
        let estadoClase = 'waiting';
        
        if (ganador === 'empate') {
            estadoTexto = '¡Empate! El tablero está lleno';
            estadoClase = 'finished';
        } else if (ganador) {
            if (ganador === nick) {
                estadoTexto = '🎉 ¡Felicidades! Has ganado';
            } else {
                estadoTexto = esIA ? '😔 La IA ha ganado. ¡Inténtalo de nuevo!' : '😔 Has perdido. ¡Mejor suerte la próxima!';
            }
            estadoClase = 'finished';
        } else if (turnoActual === nick) {
            estadoTexto = '✨ Tu turno - Elige una casilla';
            estadoClase = 'playing';
        } else {
            estadoTexto = esIA ? '🤖 La IA está pensando...' : `⏳ Turno de ${rivalNick}`;
            estadoClase = 'waiting';
        }

        const html = `
        <div id="game-container">
            <div id="game-header">
                <h2 id="game-title">🎮 3 en Raya${esIA ? ' - vs IA' : ''}</h2>
                <div id="game-info">
                    <div class="info-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <h6>Tú</h6>
                        <p>${nick} (${miSimbolo})</p>
                    </div>
                    <div class="info-card" style="background: linear-gradient(135deg, ${esIA ? '#f093fb 0%, #f5576c' : '#f093fb 0%, #f5576c'} 100%);">
                        <h6>Rival</h6>
                        <p>${rivalNick} (${rivalSimbolo})</p>
                    </div>
                    <div class="info-card timer-card" style="background: linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%, #2BFF88 100%);">
                        <h6>⏱️ Tiempo</h6>
                        <p id="temporizador-display">60</p>
                    </div>
                </div>
            </div>
            
            <div id="game-layout">
                <div id="game-board" class="board-${tamano}x${tamano}">
                </div>
                
                ${!esIA ? `
                <div id="chat-container">
                    <div id="chat-header">
                        <i class="fa fa-comments"></i> Chat
                    </div>
                    <div id="chat-messages"></div>
                    <div id="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Escribe un mensaje..." maxlength="200" />
                        <button id="chat-send-btn"><i class="fa fa-paper-plane"></i></button>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div id="game-status" class="${estadoClase}">
                ${estadoTexto}
            </div>
            
            <div id="game-controls">
                <button id="btnSalirJuego" class="btn btn-secondary">
                    <i class="fa fa-arrow-left"></i> Salir del juego
                </button>
                ${ganador ? '<button id="btnNuevaPartida" class="btn btn-success"><i class="fa fa-redo"></i> Nueva partida</button>' : ''}
            </div>
        </div>`;
        
        $(contenedorId).html(html);

        // Generar celdas del tablero
        for (let i = 0; i < tamano; i++) {
            for (let j = 0; j < tamano; j++) {
                const valor = tablero[i] && tablero[i][j] ? tablero[i][j] : '';
                const claseValor = valor ? (valor === 'X' ? 'x' : 'o') : '';
                const claseTaken = valor ? 'taken' : '';
                const cell = `<div class="cell ${claseValor} ${claseTaken}" data-fila="${i}" data-col="${j}">${valor}</div>`;
                $("#game-board").append(cell);
            }
        }

        // Event handler para celdas
        $(".cell:not(.taken)").on("click", function() {
            if (turnoActual !== nick || ganador) return;
            const fila = parseInt($(this).data("fila"));
            const col = parseInt($(this).data("col"));
            if (typeof ws !== 'undefined' && ws && typeof ws.realizarMovimiento === 'function') {
                ws.realizarMovimiento(fila, col);
            }
        });

        // Botón salir
        $("#btnSalirJuego").on("click", function() {
            if (confirm('¿Seguro que quieres salir del juego?')) {
                if (typeof ws !== 'undefined' && ws && typeof ws.eliminarPartida === 'function' && ws.codigo) {
                    ws.eliminarPartida(ws.codigo);
                }
                cw.mostrarPartidas();
            }
        });

        // Botón nueva partida
        $("#btnNuevaPartida").on("click", function() {
            cw.mostrarPartidas();
        });

        // Chat handlers (solo en multijugador)
        if (!esIA) {
            $("#chat-send-btn").on("click", function() {
                const mensaje = $("#chat-input").val().trim();
                if (mensaje && typeof ws !== 'undefined' && ws && typeof ws.enviarMensajeChat === 'function') {
                    ws.enviarMensajeChat(mensaje);
                    $("#chat-input").val('');
                }
            });

            $("#chat-input").on("keypress", function(e) {
                if (e.which === 13) { // Enter key
                    $("#chat-send-btn").click();
                }
            });
        }
    };

    // ----------------------------
    // Tablero Football Grid
    // ----------------------------
    this.mostrarTableroFootballGrid = function(datos) {
        const tablero = datos.tablero || [];
        const turnoActual = datos.turnoActual;
        const ganador = datos.ganador;
        const jugadores = datos.jugadores || [];
        const equiposFilas = datos.equiposFilas || [];
        const equiposColumnas = datos.equiposColumnas || [];
        const nick = $.cookie("nick");
        
        const rivalNick = jugadores.find(j => j !== nick) || 'Rival';

        let estadoTexto = '';
        let estadoClase = 'waiting';
        
        if (ganador === 'empate') {
            estadoTexto = '¡Empate! El tablero está lleno';
            estadoClase = 'finished';
        } else if (ganador) {
            if (ganador === nick) {
                estadoTexto = '🎉 ¡Felicidades! Has ganado';
            } else {
                estadoTexto = '😔 Has perdido. ¡Mejor suerte la próxima!';
            }
            estadoClase = 'finished';
        } else if (turnoActual === nick) {
            estadoTexto = '✨ Tu turno - Selecciona una casilla y escribe el nombre de un jugador';
            estadoClase = 'playing';
        } else {
            estadoTexto = `⏳ Turno de ${rivalNick}`;
            estadoClase = 'waiting';
        }

        const html = `
        <div id="game-container">
            <div id="game-header">
                <h2 id="game-title">⚽ Football Grid</h2>
                <div id="game-info">
                    <div class="info-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <h6>Tú</h6>
                        <p>${nick}</p>
                    </div>
                    <div class="info-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <h6>Rival</h6>
                        <p>${rivalNick}</p>
                    </div>
                    <div class="info-card timer-card" style="background: linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%, #2BFF88 100%);">
                        <h6>⏱️ Tiempo</h6>
                        <p id="temporizador-display">60</p>
                    </div>
                </div>
            </div>
            
            <div id="game-layout">
                <div id="football-grid-board" class="board-footballgrid">
                    <div class="grid-corner"></div>
                    ${equiposColumnas.map(equipo => `<div class="grid-header grid-col-header">${equipo}</div>`).join('')}
                    ${equiposFilas.map((equipoFila, i) => `
                        <div class="grid-header grid-row-header">${equipoFila}</div>
                        ${equiposColumnas.map((equipoCol, j) => {
                            const celda = tablero[i] && tablero[i][j] ? tablero[i][j] : null;
                            const contenido = celda ? celda.nombre : '';
                            const claseTaken = celda ? 'taken' : '';
                            const emailClase = celda && celda.email === nick ? 'my-move' : '';
                            return `<div class="football-cell ${claseTaken} ${emailClase}" data-fila="${i}" data-col="${j}">${contenido}</div>`;
                        }).join('')}
                    `).join('')}
                </div>
                
                <div id="chat-container">
                    <div id="chat-header">
                        <i class="fa fa-comments"></i> Chat
                    </div>
                    <div id="chat-messages"></div>
                    <div id="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Escribe un mensaje..." maxlength="200" />
                        <button id="chat-send-btn"><i class="fa fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
            
            <div id="game-status" class="${estadoClase}">
                ${estadoTexto}
            </div>
            
            <div id="game-controls">
                <button id="btnSalirJuego" class="btn btn-secondary">
                    <i class="fa fa-arrow-left"></i> Salir del juego
                </button>
                ${ganador ? '<button id="btnNuevaPartida" class="btn btn-success"><i class="fa fa-redo"></i> Nueva partida</button>' : ''}
            </div>
        </div>`;
        
        $(contenedorId).html(html);

        // Event handler para celdas
        $(".football-cell:not(.taken)").on("click", function() {
            if (turnoActual !== nick || ganador) return;
            const fila = parseInt($(this).data("fila"));
            const col = parseInt($(this).data("col"));
            
            cw.mostrarBuscadorJugador(fila, col, equiposFilas[fila], equiposColumnas[col]);
        });

        // Botón salir
        $("#btnSalirJuego").on("click", function() {
            if (confirm('¿Seguro que quieres salir del juego?')) {
                if (typeof ws !== 'undefined' && ws && typeof ws.eliminarPartida === 'function' && ws.codigo) {
                    ws.eliminarPartida(ws.codigo);
                }
                cw.mostrarPartidas();
            }
        });

        // Botón nueva partida
        $("#btnNuevaPartida").on("click", function() {
            cw.mostrarPartidas();
        });

        // Chat handlers
        $("#chat-send-btn").on("click", function() {
            const mensaje = $("#chat-input").val().trim();
            if (mensaje && typeof ws !== 'undefined' && ws && typeof ws.enviarMensajeChat === 'function') {
                ws.enviarMensajeChat(mensaje);
                $("#chat-input").val('');
            }
        });

        $("#chat-input").on("keypress", function(e) {
            if (e.which === 13) { // Enter key
                $("#chat-send-btn").click();
            }
        });
    };

    // ----------------------------
    // Buscador de jugadores para Football Grid
    // ----------------------------
    this.mostrarBuscadorJugador = function(fila, col, equipo1, equipo2) {
        // Crear modal de búsqueda
        const modalHtml = `
        <div id="modal-buscar-jugador" class="modal-overlay">
            <div class="modal-content-jugador">
                <div class="modal-header-jugador">
                    <h5><i class="fa fa-search"></i> Buscar Jugador</h5>
                    <button type="button" class="btn-close-modal" id="btnCerrarBuscador">&times;</button>
                </div>
                <div class="modal-body-jugador">
                    <p class="text-muted small mb-3">
                        Busca un jugador que haya jugado en <strong>${equipo1}</strong> y <strong>${equipo2}</strong>
                    </p>
                    <input type="text" id="inputBuscarJugador" class="form-control" placeholder="Escribe el nombre del jugador..." autocomplete="off" />
                    <div id="resultados-busqueda" class="resultados-busqueda"></div>
                </div>
            </div>
        </div>`;
        
        $("body").append(modalHtml);
        
        // Variables para guardar fila/col
        window.filaSeleccionada = fila;
        window.colSeleccionada = col;
        window.equipo1Seleccionado = equipo1;
        window.equipo2Seleccionado = equipo2;
        
        // Focus en input
        setTimeout(() => $("#inputBuscarJugador").focus(), 100);
        
        // Cerrar modal
        $("#btnCerrarBuscador, #modal-buscar-jugador").on("click", function(e) {
            if (e.target.id === "modal-buscar-jugador" || e.target.id === "btnCerrarBuscador") {
                $("#modal-buscar-jugador").remove();
            }
        });
        
        // Buscar mientras escribe
        let timeoutBusqueda;
        $("#inputBuscarJugador").on("input", function() {
            const query = $(this).val().trim();
            clearTimeout(timeoutBusqueda);
            
            if (query.length < 2) {
                $("#resultados-busqueda").html("");
                return;
            }
            
            timeoutBusqueda = setTimeout(() => {
                if (typeof ws !== 'undefined' && ws && typeof ws.buscarJugadores === 'function') {
                    ws.buscarJugadores(query, equipo1, equipo2);
                }
            }, 300);
        });
        
        // Permitir Enter para seleccionar primer resultado
        $("#inputBuscarJugador").on("keypress", function(e) {
            if (e.which === 13) {
                const primerResultado = $(".resultado-jugador:first");
                if (primerResultado.length > 0) {
                    primerResultado.click();
                }
            }
        });
    };

    this.mostrarResultadosBusqueda = function(jugadores) {
        const container = $("#resultados-busqueda");
        
        if (!jugadores || jugadores.length === 0) {
            container.html('<div class="no-resultados">No se encontraron jugadores</div>');
            return;
        }
        
        let html = '';
        jugadores.forEach(jugador => {
            const bandera = jugador.nacionalidad === 'Argentina' ? '🇦🇷' : 
                           jugador.nacionalidad === 'Brazil' ? '🇧🇷' :
                           jugador.nacionalidad === 'Portugal' ? '🇵🇹' :
                           jugador.nacionalidad === 'Spain' ? '🇪🇸' :
                           jugador.nacionalidad === 'France' ? '🇫🇷' :
                           jugador.nacionalidad === 'Germany' ? '🇩🇪' :
                           jugador.nacionalidad === 'England' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' :
                           jugador.nacionalidad === 'Italy' ? '🇮🇹' :
                           jugador.nacionalidad === 'Netherlands' ? '🇳🇱' :
                           jugador.nacionalidad === 'Belgium' ? '🇧🇪' :
                           jugador.nacionalidad === 'Uruguay' ? '🇺🇾' :
                           jugador.nacionalidad === 'Colombia' ? '🇨🇴' :
                           jugador.nacionalidad === 'Mexico' ? '🇲🇽' :
                           jugador.nacionalidad === 'Poland' ? '🇵🇱' :
                           jugador.nacionalidad === 'Croatia' ? '🇭🇷' :
                           jugador.nacionalidad === 'Egypt' ? '🇪🇬' :
                           jugador.nacionalidad === 'Senegal' ? '🇸🇳' : '🌍';
            
            html += `
            <div class="resultado-jugador" data-nombre="${jugador.nombre}">
                <span class="bandera-jugador">${bandera}</span>
                <div class="info-jugador">
                    <div class="nombre-jugador">${jugador.nombre}</div>
                    <div class="detalles-jugador">${jugador.posicion} - (${jugador.nacimiento})</div>
                </div>
            </div>`;
        });
        
        container.html(html);
        
        // Click en resultado
        $(".resultado-jugador").on("click", function() {
            const nombreJugador = $(this).data("nombre");
            if (typeof ws !== 'undefined' && ws && typeof ws.realizarMovimientoFootballGrid === 'function') {
                ws.realizarMovimientoFootballGrid(window.filaSeleccionada, window.colSeleccionada, nombreJugador);
            }
            $("#modal-buscar-jugador").remove();
        });
    };

    // ----------------------------
    // Basketball Grid Board
    // ----------------------------
    this.mostrarTableroBasketballGrid = function(datos) {
        const tablero = datos.tablero || [];
        const turnoActual = datos.turnoActual;
        const ganador = datos.ganador;
        const jugadores = datos.jugadores || [];
        const equiposFilas = datos.equiposFilas || [];
        const equiposColumnas = datos.equiposColumnas || [];
        const nick = $.cookie("nick");
        
        const rivalNick = jugadores.find(j => j !== nick) || 'Rival';

        let estadoTexto = '';
        let estadoClase = 'waiting';
        
        if (ganador === 'empate') {
            estadoTexto = '¡Empate! El tablero está lleno';
            estadoClase = 'finished';
        } else if (ganador) {
            if (ganador === nick) {
                estadoTexto = '🎉 ¡Felicidades! Has ganado';
            } else {
                estadoTexto = '😔 Has perdido. ¡Mejor suerte la próxima!';
            }
            estadoClase = 'finished';
        } else if (turnoActual === nick) {
            estadoTexto = '✨ Tu turno - Selecciona una casilla y escribe el nombre de un jugador';
            estadoClase = 'playing';
        } else {
            estadoTexto = `⏳ Turno de ${rivalNick}`;
            estadoClase = 'waiting';
        }

        const html = `
        <div id="game-container">
            <div id="game-header">
                <h2 id="game-title">🏀 Basketball Grid</h2>
                <div id="game-info">
                    <div class="info-card" style="background: linear-gradient(135deg, #FF512F 0%, #DD2476 100%);">
                        <h6>Tú</h6>
                        <p>${nick}</p>
                    </div>
                    <div class="info-card" style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);">
                        <h6>Rival</h6>
                        <p>${rivalNick}</p>
                    </div>
                    <div class="info-card timer-card" style="background: linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%, #2BFF88 100%);">
                        <h6>⏱️ Tiempo</h6>
                        <p id="temporizador-display">60</p>
                    </div>
                </div>
            </div>
            
            <div id="game-layout">
                <div id="basketball-grid-board" class="board-basketballgrid">
                    <div class="grid-corner"></div>
                    ${equiposColumnas.map(equipo => `<div class="grid-header grid-col-header">${equipo}</div>`).join('')}
                    ${equiposFilas.map((equipoFila, i) => `
                        <div class="grid-header grid-row-header">${equipoFila}</div>
                        ${equiposColumnas.map((equipoCol, j) => {
                            const celda = tablero[i] && tablero[i][j] ? tablero[i][j] : null;
                            const contenido = celda ? celda.nombre : '';
                            const claseTaken = celda ? 'taken' : '';
                            const emailClase = celda && celda.email === nick ? 'my-move' : '';
                            return `<div class="basketball-cell ${claseTaken} ${emailClase}" data-fila="${i}" data-col="${j}">${contenido}</div>`;
                        }).join('')}
                    `).join('')}
                </div>
                
                <div id="chat-container">
                    <div id="chat-header">
                        <i class="fa fa-comments"></i> Chat
                    </div>
                    <div id="chat-messages"></div>
                    <div id="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Escribe un mensaje..." maxlength="200" />
                        <button id="chat-send-btn"><i class="fa fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
            
            <div id="game-status" class="${estadoClase}">
                ${estadoTexto}
            </div>
            
            <div id="game-controls">
                <button id="btnSalirJuego" class="btn btn-secondary">
                    <i class="fa fa-arrow-left"></i> Salir del juego
                </button>
                ${ganador ? '<button id="btnNuevaPartida" class="btn btn-success"><i class="fa fa-redo"></i> Nueva partida</button>' : ''}
            </div>
        </div>`;
        
        $(contenedorId).html(html);

        // Event handler para celdas
        $(".basketball-cell:not(.taken)").on("click", function() {
            if (turnoActual !== nick || ganador) return;
            const fila = parseInt($(this).data("fila"));
            const col = parseInt($(this).data("col"));
            
            cw.mostrarBuscadorJugadorNBA(fila, col, equiposFilas[fila], equiposColumnas[col]);
        });

        // Botón salir
        $("#btnSalirJuego").on("click", function() {
            if (confirm('¿Seguro que quieres salir del juego?')) {
                if (typeof ws !== 'undefined' && ws && typeof ws.eliminarPartida === 'function' && ws.codigo) {
                    ws.eliminarPartida(ws.codigo);
                }
                cw.mostrarPartidas();
            }
        });

        // Botón nueva partida
        $("#btnNuevaPartida").on("click", function() {
            cw.mostrarPartidas();
        });

        // Chat handlers
        $("#chat-send-btn").on("click", function() {
            const mensaje = $("#chat-input").val().trim();
            if (mensaje && typeof ws !== 'undefined' && ws && typeof ws.enviarMensajeChat === 'function') {
                ws.enviarMensajeChat(mensaje);
                $("#chat-input").val('');
            }
        });

        $("#chat-input").on("keypress", function(e) {
            if (e.which === 13) { // Enter key
                $("#chat-send-btn").click();
            }
        });
    };

    // ----------------------------
    // Buscador de jugadores para Basketball Grid
    // ----------------------------
    this.mostrarBuscadorJugadorNBA = function(fila, col, equipo1, equipo2) {
        // Crear modal de búsqueda
        const modalHtml = `
        <div id="modal-buscar-jugador" class="modal-overlay">
            <div class="modal-content-jugador">
                <div class="modal-header-jugador">
                    <h5><i class="fa fa-search"></i> Buscar Jugador NBA</h5>
                    <button type="button" class="btn-close-modal" id="btnCerrarBuscador">&times;</button>
                </div>
                <div class="modal-body-jugador">
                    <p class="text-muted small mb-3">
                        Busca un jugador que haya jugado en <strong>${equipo1}</strong> y <strong>${equipo2}</strong>
                    </p>
                    <input type="text" id="inputBuscarJugadorNBA" class="form-control" placeholder="Escribe el nombre del jugador..." autocomplete="off" />
                    <div id="resultados-busqueda-nba" class="resultados-busqueda"></div>
                </div>
            </div>
        </div>`;
        
        $("body").append(modalHtml);
        
        // Variables para guardar fila/col
        window.filaSeleccionada = fila;
        window.colSeleccionada = col;
        window.equipo1Seleccionado = equipo1;
        window.equipo2Seleccionado = equipo2;
        
        // Focus en input
        setTimeout(() => $("#inputBuscarJugadorNBA").focus(), 100);
        
        // Cerrar modal
        $("#btnCerrarBuscador, #modal-buscar-jugador").on("click", function(e) {
            if (e.target.id === "modal-buscar-jugador" || e.target.id === "btnCerrarBuscador") {
                $("#modal-buscar-jugador").remove();
            }
        });
        
        // Buscar mientras escribe
        let timeoutBusqueda;
        $("#inputBuscarJugadorNBA").on("input", function() {
            const query = $(this).val().trim();
            clearTimeout(timeoutBusqueda);
            
            if (query.length < 2) {
                $("#resultados-busqueda-nba").html("");
                return;
            }
            
            timeoutBusqueda = setTimeout(() => {
                if (typeof ws !== 'undefined' && ws && typeof ws.buscarJugadoresNBA === 'function') {
                    ws.buscarJugadoresNBA(query, equipo1, equipo2);
                }
            }, 300);
        });
        
        // Permitir Enter para seleccionar primer resultado
        $("#inputBuscarJugadorNBA").on("keypress", function(e) {
            if (e.which === 13) {
                const primerResultado = $(".resultado-jugador-nba:first");
                if (primerResultado.length > 0) {
                    primerResultado.click();
                }
            }
        });
    };

    this.mostrarResultadosBusquedaNBA = function(jugadores) {
        const container = $("#resultados-busqueda-nba");
        
        if (!jugadores || jugadores.length === 0) {
            container.html('<div class="no-resultados">No se encontraron jugadores</div>');
            return;
        }
        
        let html = '';
        jugadores.forEach(jugador => {
            const bandera = jugador.nacionalidad === 'USA' ? '🇺🇸' : 
                           jugador.nacionalidad === 'Canada' ? '🇨🇦' :
                           jugador.nacionalidad === 'Spain' ? '🇪🇸' :
                           jugador.nacionalidad === 'France' ? '🇫🇷' :
                           jugador.nacionalidad === 'Germany' ? '🇩🇪' :
                           jugador.nacionalidad === 'Greece' ? '🇬🇷' :
                           jugador.nacionalidad === 'Serbia' ? '🇷🇸' :
                           jugador.nacionalidad === 'Slovenia' ? '🇸🇮' :
                           jugador.nacionalidad === 'Croatia' ? '🇭🇷' :
                           jugador.nacionalidad === 'Australia' ? '🇦🇺' :
                           jugador.nacionalidad === 'Argentina' ? '🇦🇷' :
                           jugador.nacionalidad === 'Lithuania' ? '🇱🇹' :
                           jugador.nacionalidad === 'Latvia' ? '🇱🇻' :
                           jugador.nacionalidad === 'Turkey' ? '🇹🇷' :
                           jugador.nacionalidad === 'China' ? '🇨🇳' :
                           jugador.nacionalidad === 'Cameroon' ? '🇨🇲' :
                           jugador.nacionalidad === 'Nigeria' ? '🇳🇬' :
                           jugador.nacionalidad === 'Brazil' ? '🇧🇷' :
                           jugador.nacionalidad === 'Dominican Republic' ? '🇩🇴' : '🌍';
            
            html += `
            <div class="resultado-jugador-nba" data-nombre="${jugador.nombre}">
                <span class="bandera-jugador">${bandera}</span>
                <div class="info-jugador">
                    <div class="nombre-jugador">${jugador.nombre}</div>
                    <div class="detalles-jugador">${jugador.posicion} - (${jugador.nacimiento})</div>
                </div>
            </div>`;
        });
        
        container.html(html);
        
        // Click en resultado
        $(".resultado-jugador-nba").on("click", function() {
            const nombreJugador = $(this).data("nombre");
            if (typeof ws !== 'undefined' && ws && typeof ws.realizarMovimientoBasketballGrid === 'function') {
                ws.realizarMovimientoBasketballGrid(window.filaSeleccionada, window.colSeleccionada, nombreJugador);
            }
            $("#modal-buscar-jugador").remove();
        });
    };

    // ----------------------------
    // Agregar mensaje al chat
    // ----------------------------
    this.agregarMensajeChat = function(email, mensaje, timestamp) {
        const chatMessages = $('#chat-messages');
        if (chatMessages.length === 0) return;

        const nick = $.cookie("nick");
        const esPropio = email === nick;
        const hora = timestamp ? new Date(timestamp).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : '';
        
        const mensajeHtml = `
        <div class="chat-message ${esPropio ? 'chat-message-own' : 'chat-message-other'}">
            <div class="chat-message-header">
                <span class="chat-message-author">${esPropio ? 'Tú' : email}</span>
                <span class="chat-message-time">${hora}</span>
            </div>
            <div class="chat-message-text">${mensaje}</div>
        </div>`;
        
        chatMessages.append(mensajeHtml);
        // Auto-scroll al último mensaje
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    };

    // ----------------------------
    // Mostrar mensaje temporal
    // ----------------------------
    this.mostrarMensajeTemporal = function(mensaje, tipo) {
        console.log('Mostrando mensaje temporal:', mensaje, tipo);
        const claseAlerta = tipo === 'error' ? 'alert-danger' : (tipo === 'warning' ? 'alert-warning' : 'alert-info');
        const html = `
        <div id="mensaje-temporal" class="alert ${claseAlerta} mensaje-temporal" role="alert">
            <strong>${mensaje}</strong>
        </div>`;
        
        // Eliminar mensaje anterior si existe
        $('#mensaje-temporal').remove();
        
        // Agregar nuevo mensaje
        $('body').append(html);
        
        // Asegurar que sea visible
        $('#mensaje-temporal').show();
        
        // Eliminar después de 4 segundos
        setTimeout(() => {
            $('#mensaje-temporal').fadeOut(400, function() {
                $(this).remove();
            });
        }, 4000);
    };

    this.actualizarTemporizador = function(tiempo) {
        const display = $('#temporizador-display');
        if (display.length > 0) {
            display.text(tiempo);
            
            // Cambiar color si queda poco tiempo
            if (tiempo <= 10) {
                display.css('color', '#ff4757');
                display.css('font-weight', 'bold');
            } else {
                display.css('color', 'white');
                display.css('font-weight', 'normal');
            }
        }
    };

    this.mostrarSalir = function() {
        $("#salir").on("click", () => {
            this.salir();
        });
    };

    this.mostrarRegistro = function() {
        // Limpiar contenedor principal
        $(contenedorId).html('');
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
    // Limpiar contenedor principal
    $(contenedorId).html('');
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

// ----------------------------
// Mostrar página de estadísticas
// ----------------------------
this.mostrarPaginaEstadisticas = function(email) {
    // Limpiar contenedor principal y div de registro
    $(contenedorId).html('<div class="text-center mt-4"><i class="fa fa-spinner fa-spin fa-3x"></i><p>Cargando estadísticas...</p></div>');
    $('#registro').html('');
    $('#msg').html('');
    
    if (typeof rest !== 'undefined' && rest && typeof rest.obtenerEstadisticas === 'function'){
        rest.obtenerEstadisticas(email, function(data){
            if (data && data.email !== -1){
                const victorias = data.victorias || 0;
                const derrotas = data.derrotas || 0;
                const total = victorias + derrotas;
                const porcentaje = total > 0 ? ((victorias / total) * 100).toFixed(1) : 0;
                
                const html = `
                <div class="estadisticas-container">
                    <h2 class="text-center mb-4"><i class="fa fa-trophy"></i> Estadísticas de ${email}</h2>
                    <div class="estadisticas-card">
                        <div class="stats-grid">
                            <div class="stat-item stat-victorias">
                                <div class="stat-icon">🏆</div>
                                <div class="stat-value">${victorias}</div>
                                <div class="stat-label">Victorias</div>
                            </div>
                            <div class="stat-item stat-derrotas">
                                <div class="stat-icon">💔</div>
                                <div class="stat-value">${derrotas}</div>
                                <div class="stat-label">Derrotas</div>
                            </div>
                            <div class="stat-item stat-total">
                                <div class="stat-icon">🎮</div>
                                <div class="stat-value">${total}</div>
                                <div class="stat-label">Partidas Jugadas</div>
                            </div>
                        </div>
                        <div class="stats-porcentaje">
                            <div class="porcentaje-circle">
                                <div class="porcentaje-value">${porcentaje}%</div>
                                <div class="porcentaje-label">Efectividad</div>
                            </div>
                        </div>
                        <div class="stats-info">
                            <p class="text-muted text-center mt-4"><i class="fa fa-info-circle"></i> Solo se cuentan partidas multijugador</p>
                        </div>
                    </div>
                </div>`;
                
                $(contenedorId).html(html);
            } else {
                $(contenedorId).html('<div class="alert alert-warning"><i class="fa fa-exclamation-triangle"></i> No se pudieron cargar las estadísticas</div>');
            }
        });
    }
};

// ----------------------------
// Mostrar página de perfil con logros
// ----------------------------
this.mostrarPaginaPerfil = function(email) {
    $(contenedorId).html('<div class="text-center mt-4"><i class="fa fa-spinner fa-spin fa-3x"></i><p>Cargando perfil...</p></div>');
    $('#registro').html('');
    $('#msg').html('');
    
    if (typeof rest !== 'undefined' && rest && typeof rest.obtenerPerfil === 'function'){
        rest.obtenerPerfil(email, function(data){
            if (data && data.ok){
                const nick = data.nick || email.split('@')[0];
                const fotoPerfil = data.fotoPerfil || '👤';
                const victorias = data.victorias || 0;
                const derrotas = data.derrotas || 0;
                const total = victorias + derrotas;
                const logros = data.logros || [];
                const rachaActual = data.rachaActual || 0;
                const mejorRacha = data.mejorRacha || 0;
                
                // Emojis disponibles para foto de perfil
                const emojisDisponibles = ['👤', '😀', '😎', '🤓', '🎮', '🏆', '⭐', '🔥', '💎', '👑', '🎯', '🚀', '💪', '🦄', '🐉'];
                
                let logrosHtml = '';
                if (logros.length > 0) {
                    logros.forEach(logro => {
                        const fecha = new Date(logro.fecha);
                        const fechaStr = fecha.toLocaleDateString('es-ES');
                        logrosHtml += `
                        <div class="logro-item">
                            <div class="logro-icono">${logro.icono}</div>
                            <div class="logro-info">
                                <div class="logro-nombre">${logro.nombre}</div>
                                <div class="logro-descripcion">${logro.descripcion}</div>
                                <div class="logro-fecha">Desbloqueado: ${fechaStr}</div>
                            </div>
                        </div>`;
                    });
                } else {
                    logrosHtml = '<p class="text-center text-muted"><i class="fa fa-info-circle"></i> Aún no has desbloqueado ningún logro. ¡Sigue jugando!</p>';
                }
                
                const html = `
                <div class="perfil-container">
                    <h2 class="text-center mb-4"><i class="fa fa-user-circle"></i> Mi Perfil</h2>
                    
                    <div class="perfil-card">
                        <div class="perfil-header">
                            <div class="perfil-avatar-section">
                                <div class="perfil-avatar" id="currentAvatar">${fotoPerfil}</div>
                                <button id="btnCambiarAvatar" class="btn btn-sm btn-outline-primary mt-2">
                                    <i class="fa fa-edit"></i> Cambiar Avatar
                                </button>
                            </div>
                            <div class="perfil-info-section">
                                <div class="perfil-email">${email}</div>
                                <div class="perfil-nick-section">
                                    <label>Nick:</label>
                                    <input type="text" id="inputNick" class="form-control perfil-nick-input" value="${nick}" maxlength="20">
                                    <button id="btnGuardarNick" class="btn btn-success btn-sm mt-2">
                                        <i class="fa fa-save"></i> Guardar Nick
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="perfil-stats-mini">
                            <div class="stat-mini">
                                <div class="stat-mini-icon">🏆</div>
                                <div class="stat-mini-value">${victorias}</div>
                                <div class="stat-mini-label">Victorias</div>
                            </div>
                            <div class="stat-mini">
                                <div class="stat-mini-icon">💔</div>
                                <div class="stat-mini-value">${derrotas}</div>
                                <div class="stat-mini-label">Derrotas</div>
                            </div>
                            <div class="stat-mini">
                                <div class="stat-mini-icon">🎮</div>
                                <div class="stat-mini-value">${total}</div>
                                <div class="stat-mini-label">Total</div>
                            </div>
                            <div class="stat-mini">
                                <div class="stat-mini-icon">🔥</div>
                                <div class="stat-mini-value">${rachaActual}</div>
                                <div class="stat-mini-label">Racha Actual</div>
                            </div>
                            <div class="stat-mini">
                                <div class="stat-mini-icon">⭐</div>
                                <div class="stat-mini-value">${mejorRacha}</div>
                                <div class="stat-mini-label">Mejor Racha</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="logros-card">
                        <h3 class="logros-titulo">
                            <i class="fa fa-trophy"></i> Logros Desbloqueados 
                            <span class="logros-count">(${logros.length})</span>
                        </h3>
                        <div class="logros-lista">
                            ${logrosHtml}
                        </div>
                    </div>
                    
                    <div id="avatar-selector" class="avatar-selector" style="display: none;">
                        <h4>Selecciona tu avatar</h4>
                        <div class="avatar-grid">
                            ${emojisDisponibles.map(emoji => `
                                <div class="avatar-option ${emoji === fotoPerfil ? 'selected' : ''}" data-emoji="${emoji}">
                                    ${emoji}
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-3">
                            <button id="btnGuardarAvatar" class="btn btn-success">
                                <i class="fa fa-check"></i> Guardar Avatar
                            </button>
                            <button id="btnCancelarAvatar" class="btn btn-secondary">
                                <i class="fa fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>`;
                
                $(contenedorId).html(html);
                
                let avatarSeleccionado = fotoPerfil;
                
                // Mostrar selector de avatar
                $("#btnCambiarAvatar").on("click", function() {
                    $("#avatar-selector").slideDown();
                });
                
                // Seleccionar avatar
                $(".avatar-option").on("click", function() {
                    $(".avatar-option").removeClass("selected");
                    $(this).addClass("selected");
                    avatarSeleccionado = $(this).data("emoji");
                });
                
                // Guardar avatar
                $("#btnGuardarAvatar").on("click", function() {
                    rest.actualizarPerfil(email, nick, avatarSeleccionado, function(resultado) {
                        if (resultado.ok) {
                            $("#currentAvatar").text(avatarSeleccionado);
                            $("#avatar-selector").slideUp();
                            cw.mostrarMensaje('Avatar actualizado correctamente');
                        } else {
                            alert('Error al actualizar el avatar');
                        }
                    });
                });
                
                // Cancelar selección avatar
                $("#btnCancelarAvatar").on("click", function() {
                    $("#avatar-selector").slideUp();
                    avatarSeleccionado = fotoPerfil;
                    $(".avatar-option").removeClass("selected");
                    $(`.avatar-option[data-emoji="${fotoPerfil}"]`).addClass("selected");
                });
                
                // Guardar nick
                $("#btnGuardarNick").on("click", function() {
                    const nuevoNick = $("#inputNick").val().trim();
                    if (!nuevoNick) {
                        alert('El nick no puede estar vacío');
                        return;
                    }
                    rest.actualizarPerfil(email, nuevoNick, fotoPerfil, function(resultado) {
                        if (resultado.ok) {
                            cw.mostrarMensaje('Nick actualizado correctamente');
                        } else {
                            alert('Error al actualizar el nick');
                        }
                    });
                });
                
            } else {
                $(contenedorId).html('<div class="alert alert-warning"><i class="fa fa-exclamation-triangle"></i> No se pudo cargar el perfil</div>');
            }
        });
    }
};
}

