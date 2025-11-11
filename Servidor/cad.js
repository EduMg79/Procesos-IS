

function CAD(){
const mongo=require("mongodb").MongoClient;
const ObjectId=require("mongodb").ObjectId;
this.usuarios;
this.conectar = async function(callback) {
  let cad = this;
  const uri = process.env.MONGODB_URI || "mongodb+srv://Hola:Hola@clusterprocesos.13l0nhg.mongodb.net/?retryWrites=true&w=majority";
  let client = new mongo(uri);
  await client.connect();

  const dbName = process.env.MONGODB_DBNAME || "sistema";
  const usersCol = process.env.MONGODB_USERS_COLLECTION || "usuarios";
  const database = client.db(dbName);
  cad.usuarios = database.collection(usersCol);
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

this.actualizarUsuario=function(obj,callback){
actualizar(this.usuarios,obj,callback);
}




 function actualizar(coleccion, obj, callback) {
  coleccion.findOneAndUpdate(
    { _id: ObjectId(obj._id) },
    { $set: obj },
    { upsert: false, returnDocument: "after", projection: { email: 1 } },
    function(err, doc) {
      if (err) { 
        throw err; 
      }
     else {
   console.log("Elemento actualizado");
   callback({email:doc.value.email});
}
});
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


