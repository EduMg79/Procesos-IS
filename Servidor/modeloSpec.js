const modelo = require("./modelo.js");

xdescribe('El sistema', function() {
 let sistema;
 beforeEach(function() {
 sistema=new modelo.Sistema()
 });
       it('No hay usuarios al inicio', function() {
              expect(sistema.numeroUsuarios().num).toEqual(0);       });
       it('se puede agregar un usuario', function() {
              sistema.agregarUsuario('pepe');
              expect(sistema.numeroUsuarios().num).toEqual(1);
       });
       it('se puede obtener los usuarios', function() {
              sistema.agregarUsuario('Joselu');
              sistema.agregarUsuario('Vinisius');
              const usuarios = sistema.obtenerUsuarios().usuarios;
              expect(Object.keys(usuarios).length).toEqual(2);
              expect(usuarios.hasOwnProperty('Joselu')).toBeTrue();
              expect(usuarios.hasOwnProperty('Vinisius')).toBeTrue();
       });
       it ('se puede comprobar si un usuario existe', function() {
              sistema.agregarUsuario('Joselu');
              expect(sistema.usuarioActivo('Joselu').res).toBeTrue();
              expect(sistema.usuarioActivo('Vinisius').res).toBeFalse();
       });
       it('se puede eliminar un usuario', function() {
              sistema.agregarUsuario('Joselu');
              sistema.agregarUsuario('Vinisius');
              expect(sistema.numeroUsuarios().num).toEqual(2);
              expect(sistema.eliminarUsuario('Joselu').res).toBeTrue();
              expect(sistema.numeroUsuarios().num).toEqual(1);
              expect(sistema.usuarioActivo('Joselu').res).toBeFalse();
              expect(sistema.usuarioActivo('Vinisius').res).toBeTrue();
       });
})


describe("Pruebas de las partidas",function(){
let sistema;
let usr;
let usr2;
let usr3;

beforeEach(function(){
       sistema=new modelo.Sistema();
       usr={"nick":"Pepe","email":"pepe@pepe.es"};
       usr2={"nick":"Pepa","email":"pepa@pepa.es"};
       usr3={"nick":"Pepo","email":"pepo@pepo.es"};
       sistema.agregarUsuario(usr.email);
       sistema.agregarUsuario(usr2.email);
       sistema.agregarUsuario(usr3.email);
});

it("Usuarios y partidas en el sistema",function(){
       expect(sistema.numeroUsuarios().num).toEqual(3);
       expect(sistema.obtenerPartidasDisponibles().length).toEqual(0);
});

it("Crear partida",function(){
       const p1=sistema.crearPartida(usr2.email);
       expect(sistema.obtenerPartidasDisponibles().length).toEqual(1);
});

it("Unir a partida",function(){
       const p1=sistema.crearPartida(usr2.email);
       const codigo=p1.codigo;
       sistema.unirAPartida(usr3.email,codigo);
       expect(sistema.partidas[codigo].jugadores.length).toEqual(2);
       expect(sistema.obtenerPartidasDisponibles().length).toEqual(0); // partida completa
});

it("Un usuario no puede estar dos veces",function(){
       const p1=sistema.crearPartida(usr2.email);
       const codigo=p1.codigo;
       sistema.unirAPartida(usr2.email,codigo); // mismo usuario ya estaba
       expect(sistema.partidas[codigo].jugadores.length).toEqual(1);
});

it("Obtener partidas",function(){
       const p1=sistema.crearPartida(usr.email);
       const lista=sistema.obtenerPartidasDisponibles();
       expect(lista.length).toEqual(1);
       expect(lista[0].codigo).toEqual(p1.codigo);
       expect(lista[0].email).toEqual(usr.email);
})
});

