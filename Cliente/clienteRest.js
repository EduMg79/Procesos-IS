function ClienteRest() {

    // ----------------------------
    // Agregar usuario usando getJSON
    // ----------------------------
    this.agregarUsuario = function(nick) {
        $.getJSON("/agregarUsuario/" + nick, function(data) {
            let msg = "El nick " + nick + " está ocupado";
            if (data.nick != -1) {
                console.log("Usuario " + nick + " ha sido registrado");
                msg = "Bienvenido al sistema, " + nick;
                //localStorage.setItem("nick", nick); // Guarda en localStorage
                $.cookie("nick", nick)
            } else {
                console.log("El nick ya está ocupado");
            }
            cw.mostrarMensaje(msg);
        });
    };

    // ----------------------------
    // Agregar usuario usando AJAX genérico
    // ----------------------------
    this.agregarUsuario2 = function(nick) {
        $.ajax({
            type: 'GET',
            url: '/agregarUsuario/' + nick,
            success: function(data) {
                if (data.nick != -1) {
                    console.log("Usuario " + nick + " ha sido registrado");
                } else {
                    console.log("El nombre de usuario ya está ocupado");
                }
            },
            error: function(xhr, textStatus, errorThrown) {
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            },
            contentType: 'application/json'
        });
    };

    // ----------------------------
    // Obtener todos los usuarios
    // ----------------------------
    this.obtenerUsuarios = function() {
        $.getJSON("/obtenerUsuarios", function(data) {
            console.log(data);
        });
    };

    // ----------------------------
    // Obtener número de usuarios
    // ----------------------------
    this.numeroUsuarios = function() {
        $.getJSON("/numeroUsuarios", function(data) {
            console.log(data);
        });
    };

    // ----------------------------
    // Comprobar si un usuario está activo
    // ----------------------------
    this.usuarioActivo = function(nick) {
        $.getJSON("/usuarioActivo/" + nick, function(data) {
            console.log(data);
        });
    };

    // ----------------------------
    // Eliminar un usuario
    // ----------------------------
    this.eliminarUsuario = function(nick) {
        $.getJSON("/eliminarUsuario/" + nick, function(data) {
            if (data.nick != -1) {
                console.log("Usuario " + nick + " ha sido eliminado");
            } else {
                console.log("El usuario no existe");
            }
        });
    };

    // ----------------------------
    // Login de usuario
    // ----------------------------
    this.loginUsuario = function(email, password) {
        $.ajax({
            type: 'POST',
            url: '/loginUsuario',
            data: JSON.stringify({ email: email, password: password }),
            contentType: 'application/json',
            success: function(data) {
                if (data && data.ok && data.email){
                    // Guardar email como identificador único en cookie 'nick'
                    $.cookie('nick', data.email);
                    // Guardar nick de pantalla en cookie separada
                    $.cookie('nickDisplay', data.nick || data.email.split('@')[0]);
                    if (typeof ws !== 'undefined' && ws){
                        ws.email = data.email;
                    }
                    if (typeof $("#msg").html === 'function'){
                        $("#msg").html('<div class="alert alert-success">Bienvenido al sistema, ' + data.nick + '</div>');
                    }
                    if (typeof cw !== 'undefined' && cw && typeof cw.comprobarSesion === 'function'){
                        cw.comprobarSesion();
                    }
                } else {
                    if (typeof $("#msg").html === 'function'){
                        $("#msg").html('<div class="alert alert-danger">No se pudo iniciar sesión.</div>');
                    }
                    if (typeof cw !== 'undefined' && cw && typeof cw.mostrarModal === 'function'){
                        cw.mostrarModal('No se ha podido iniciar sesión');
                    }
                }
            },
            error: function(xhr){
                let msg = 'No se pudo iniciar sesión.';
                if (xhr && xhr.responseJSON && xhr.responseJSON.msg){ msg = xhr.responseJSON.msg; }
                if (typeof $("#msg").html === 'function'){
                    $("#msg").html('<div class="alert alert-danger">'+msg+'</div>');
                }
                if (typeof cw !== 'undefined' && cw && typeof cw.mostrarModal === 'function'){
                    cw.mostrarModal('No se ha podido iniciar sesión');
                }
            }
        });
    };

    // ----------------------------
    // Cerrar sesión
    // ----------------------------
    this.cerrarSesion = function(){
        $.getJSON("/cerrarSesion", function(){
            console.log("Sesión cerrada");
            $.removeCookie("nick");
            if (typeof cw !== 'undefined' && cw && typeof cw.comprobarSesion === 'function'){
                cw.comprobarSesion();
            }
        });
    };

    // ----------------------------
    // Obtener estadísticas de un usuario
    // ----------------------------
    this.obtenerEstadisticas = function(email, callback){
        $.getJSON("/obtenerEstadisticas/" + encodeURIComponent(email), function(data){
            if (callback && typeof callback === 'function'){
                callback(data);
            }
        });
    };

    // ----------------------------
    // Obtener perfil de un usuario
    // ----------------------------
    this.obtenerPerfil = function(email, callback){
        $.getJSON("/obtenerPerfil/" + encodeURIComponent(email), function(data){
            if (callback && typeof callback === 'function'){
                callback(data);
            }
        });
    };

    // ----------------------------
    // Actualizar perfil de un usuario
    // ----------------------------
    this.actualizarPerfil = function(email, nick, fotoPerfil, callback){
        $.ajax({
            type: 'POST',
            url: '/actualizarPerfil',
            data: JSON.stringify({ 
                email: email, 
                nick: nick, 
                fotoPerfil: fotoPerfil 
            }),
            contentType: 'application/json',
            success: function(data){
                if (callback && typeof callback === 'function'){
                    callback(data);
                }
            },
            error: function(xhr){
                console.error('Error actualizando perfil:', xhr);
                if (callback && typeof callback === 'function'){
                    callback({ok: false, error: 'Error al actualizar'});
                }
            }
        });
    };

    // ----------------------------
    // Obtener logros de un usuario
    // ----------------------------
    this.obtenerLogros = function(email, callback){
        $.getJSON("/obtenerLogros/" + encodeURIComponent(email), function(data){
            if (callback && typeof callback === 'function'){
                callback(data);
            }
        });
    };

}
