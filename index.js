var express = require('express');
var socket = require("socket.io");
var connectToDatabase = require('./public/conection'); // Asegúrate de que esté bien escrito
var bcrypt = require('bcrypt');  // Para encriptar contraseñas
var session = require('express-session'); // Para manejar sesiones
var bodyParser = require('body-parser');  // Para procesar datos de formularios

var app = express();

// Middleware para manejar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware para manejar sesiones
app.use(session({
    secret: 'mysecret', // Cambia esto a un secreto seguro en producción
    resave: false,
    saveUninitialized: true
}));

// Servidor para escuchar las peticiones
var server = app.listen(5000, function(){
    console.log("Servidor activo en el puerto 5000...");
});

// Indicar que use una ubicación para los archivos de la vista
app.use(express.static('public'));

var io = socket(server);

// Conectar a MongoDB
connectToDatabase().then(db => {
    const usersCollection = db.collection('users');
    const chatCollection = db.collection('messages');

    // Ruta para registrar usuarios
    app.post('/register', async function(req, res) {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Comprobar si el usuario ya existe
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).send("El usuario ya existe");
        }

        // Insertar nuevo usuario en la base de datos
        await usersCollection.insertOne({ username, password: hashedPassword });
        res.send("Usuario registrado con éxito");
    });

    // Ruta para iniciar sesión
    app.post('/login', async function(req, res) {
        const { username, password } = req.body;
        
        // Buscar el usuario en la base de datos
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(400).send("Usuario no encontrado");
        }

        // Comparar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).send("Contraseña incorrecta");
        }

        // Iniciar sesión y enviar nombre de usuario
        req.session.user = user;
        res.json({ message: "Inicio de sesión exitoso", username: username });
    });

    io.on('connection', function(socket){
        console.log('Hay una conexión', socket.id);

        // Enviar mensajes históricos cuando un usuario se conecta
        chatCollection.find().toArray(function(err, result) {
            if (err) throw err;
            socket.emit('load messages', result); // Enviar mensajes históricos al cliente
        });

        socket.on('chat', function(data){
            console.log(data);
            chatCollection.insertOne({ usuario: data.usuario, mensaje: data.mensaje, timestamp: new Date() }, function(err, res) {
                if (err) throw err;
                console.log("Mensaje guardado en la base de datos");
            });
            io.sockets.emit('chat', data);
        });

        socket.on('typing', function(data){
            socket.broadcast.emit('typing', data);
        });
    });
}).catch(error => {
    console.error("Error al conectar a la base de datos:", error);
});
