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
                if (data && data.ok && data.nick){
                    $.cookie('nick', data.nick);
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
                }
            },
            error: function(xhr){
                let msg = 'No se pudo iniciar sesión.';
                if (xhr && xhr.responseJSON && xhr.responseJSON.msg){ msg = xhr.responseJSON.msg; }
                if (typeof $("#msg").html === 'function'){
                    $("#msg").html('<div class="alert alert-danger">'+msg+'</div>');
                }
            }
        });
    };

}
