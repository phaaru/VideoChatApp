const credentials = require('./credentials');
const express = require('express');
const app = express();
if (credentials.key && credentials.cert) {
  const https = require('https');
  server = https.createServer(credentials, app);
  port = 443;
} else {
  const http = require('http');
  server = http.createServer(app);
  port = 3000;
}

const io = require('socket.io')(server)

app.use(express.static(__dirname + "/public"))

// const MAX_CLIENTS = 3;
let clients = 0;

io.on('connection', function (socket) {

    socket.on('ready', function() {
      socket.broadcast.emit('ready', socket.id);
      console.log("ready emit with socket id : " + socket.id)
    });
    socket.on('offer', function (id, message) {
      socket.to(id).emit('offer', socket.id, message)
      console.log('offer emit with socket ' + id + 'message' + message);
    });
    socket.on('answer', function (id, message) {
      socket.to(id).emit('answer', socket.id, message);
      console.log('answer emit with socket ' + id + 'message' + message);
    });
    socket.on('candidate', function (id, message) {
      socket.to(id).emit('candidate', socket.id, message);
    });
    socket.on('disconnect', function() {
      socket.broadcast.emit('bye', socket.id);
      console.log('disconnect emit with socket ' + socket.id);
    });
})


server.listen(port, () => console.log(`Active on ${port} port`))