const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


const encuesta = {
    pregunta: 'Cual es tu lenguaje de programacion favorito?',
    opciones: {
        'JavaScript': 0,
        'Python': 0,
        'Java': 0,
        'C#': 0,
        'PHP': 0
    }
};
const votosRegistrados = new Set(); // Para evitar votos duplicados

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    // Enviar estado actual al nuevo usuario
    socket.emit('encuesta:estado', encuesta);
    // Notificar a todos cuantos estan conectados
    const usuariosConectados = io.engine.clientsCount;
    io.emit('usuarios:conteo', usuariosConectados);
    // Escuchar votos
    socket.on('encuesta:votar', (opcion) => {
        if (votosRegistrados.has(socket.id)) {
            socket.emit('encuesta:error', 'Ya votaste!');
            return;
        }
        encuesta.opciones[opcion]++;
        votosRegistrados.add(socket.id);
        // La magia! Enviar a TODOS los conectados
        io.emit('encuesta:resultado', encuesta);
    });
    // Reacciones con emojis
    socket.on('reaccion:enviar', (emoji) => {
        socket.broadcast.emit('reaccion:mostrar', emoji);
        socket.emit('reaccion:mostrar', emoji);
    });

    socket.on('reaccion:mostrar', (emoji) => {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.classList.add('emoji');

    span.style.left = Math.random() * 90 + '%';

    document.body.appendChild(span);

    setTimeout(() => {
        span.remove();
    }, 3000);
});
    // Desconexion
    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        io.emit('usuarios:conteo', io.engine.clientsCount);
    });

});


const PORT = 3002;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});