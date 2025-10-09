const modelo = require("./modelo.js");

describe('El sistema', function() {
 let sistema;
 beforeEach(function() {
 sistema=new modelo.Sistema()
 });
       it('No hay usuarios', function() {
              expect(sistema.numeroUsuarios().num).toEqual(0);
       });
       it('puedes agregar un usuario', function() {
              sistema.agregarUsuario('Joselu');
              expect(sistema.numeroUsuarios().num).toEqual(1);
       });
       it('puedes obtener los usuarios', function() {
              sistema.agregarUsuario('Joselu');
              sistema.agregarUsuario('Anarosa');
              const usuarios = sistema.obtenerUsuarios().usuarios;
              expect(Object.keys(usuarios).length).toEqual(2);
              expect(usuarios.hasOwnProperty('Joselu')).toBeTrue();
              expect(usuarios.hasOwnProperty('Anarosa')).toBeTrue();
       });
       it ('puedes comprobar si un usuario existe', function() {
              sistema.agregarUsuario('Joselu');
              expect(sistema.usuarioActivo('Joselu').res).toBeTrue();
              expect(sistema.usuarioActivo('Anarosa').res).toBeFalse();
       });
       it('puedes eliminar un usuario', function() {
              sistema.agregarUsuario('Joselu');
              sistema.agregarUsuario('Anarosa');
              expect(sistema.numeroUsuarios().num).toEqual(2);
              expect(sistema.eliminarUsuario('Joselu').res).toBeTrue();
              expect(sistema.numeroUsuarios().num).toEqual(1);
              expect(sistema.usuarioActivo('Joselu').res).toBeFalse();
              expect(sistema.usuarioActivo('Anarosa').res).toBeTrue();
       });
})
