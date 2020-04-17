const express = require('express');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"))

const MAX_CLIENTS = 3;
let clients = 0;

io.on('connection', function (socket) {

    // socket.on("NewClient", function () {
    //     if (clients < 2) {
            // if (clients == 1) {
    //             this.emit('CreatePeer')
    //         }
    //     }
    //     else
    //         this.emit('SessionActive')
    //     clients++;
    // })

    socket.on('ready', function() {
      socket.emit('ready', socket.id);
    });
    socket.on('offer', function (id, message) {
      socket.to(id).emit('offer', socket.id, message);
      console.log('Local Description server.js: ' + socket.id);
    });
    socket.on('answer', function (id, message) {
      socket.to(id).emit('answer', socket.id, message);
    });
    socket.on('candidate', function (id, message) {
      socket.to(id).emit('candidate', socket.id, message);
    });
    socket.on('disconnect', function() {
      socket.emit('bye', socket.id);
    });
    
    // socket.on('offer', function(message) {
    //   console.log('Local Description: ' + message);
    // })
    // socket.on('Answer', SendAnswer)
    // socket.on('disconnect', Disconnect)
})


http.listen(port, () => console.log(`Active on ${port} port`))
