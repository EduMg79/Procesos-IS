function ClienteRest(){
    
    this.agregarUsuario=function(nick){
        var cli=this;
        $.getJSON("/agregarUsuario/"+nick,function(data){
            if (data.nick!=-1){
                console.log("Usuario "+nick+" ha sido registrado")
            }
            else{
                console.log("El nombre de usuario ya está ocupado");
            }
        })
    }
    this.agregarUsuario2=function(nick){
        $.ajax({
            type:'GET',
            url:'/agregarUsuario/'+nick,
            success:function(data){
                if (data.nick!=-1){
                    console.log("Usuario "+nick+" ha sido registrado")
                }
                else{
                    console.log("El nombre de usuario ya está ocupado");
                }
            },
            error:function(xhr, textStatus, errorThrown){
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            },
            contentType:'application/json'
        });
    }
    this.obtenerUsuarios=function(){
        $.getJSON("/obtenerUsuarios",function(data){
            console.log(data);
        })
    }
    this.numeroUsuarios=function(){
        $.getJSON("/numeroUsuarios",function(data){
            console.log(data);
        })
    }
    this.usuarioActivo=function(nick){
        $.getJSON("/usuarioActivo/"+nick,function(data){
            console.log(data);
        })
    }
    this.eliminarUsuario=function(nick){
        $.getJSON("/eliminarUsuario/"+nick,function(data){
            if (data.nick!=-1){
                console.log("Usuario "+nick+" ha sido eliminado")
            }
            else{
                console.log("El usuario no existe");
            }
        }) 
    }
}