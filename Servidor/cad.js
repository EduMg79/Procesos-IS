

function CAD(){
const mongo=require("mongodb").MongoClient;
const ObjectId=require("mongodb").ObjectId;
this.usuarios;
this.conectar = async function(callback) {
  let cad = this;
  let client = new mongo("mongodb+srv://Hola:Hola@clusterprocesos.13l0nhg.mongodb.net/?retryWrites=true&w=majority");
  await client.connect();

  const database = client.db("sistema");
  cad.usuarios = database.collection("usuarios");
  callback(database);
}

  this.buscarOCrearUsuario = function(usr, callback) {
    buscarOCrear(this.usuarios, usr, callback);
  }

  this.buscarUsuario=function(obj,callback){
buscar(this.usuarios,obj,callback);
}
this.insertarUsuario=function(usuario,callback){
insertar(this.usuarios,usuario,callback);
}





  // Métodos privados
  function buscar(coleccion, criterio, callback) {
    coleccion.find(criterio).toArray(function(error, usuarios) {
      if (usuarios.length == 0) {
        callback(undefined);
      }
      else {
        callback(usuarios[0]);
      }
    });
  }

  function insertar(coleccion, elemento, callback) {
    coleccion.insertOne(elemento, function(err, result) {
      if (err) {
        console.log("error");
      }
      else {
        console.log("Nuevo elemento creado");
        callback(elemento);
      }
    });
  }

  function buscarOCrear(coleccion, criterio, callback) {
    coleccion.findOneAndUpdate(
      criterio,
      { $set: criterio },
      { upsert: true, returnDocument: "after", projection: { email: 1 } },
      function(err, doc) {
        if (err) { throw err; }
        else {
          console.log("Elemento actualizado");
          console.log(doc.value.email);
          callback({ email: doc.value.email });
        }
      }
    );
  }
}
module.exports.CAD=CAD;


