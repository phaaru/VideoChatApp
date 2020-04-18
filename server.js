const credentials = require('./credentials');
const express = require('express');
const app = express();
let server
let port;
if (credentials.key && credentials.cert) {
  const https = require('https');
  server = https.createServer(credentials, app);
  port = 443;
} else {
  const http = require('http');
  server = http.createServer(app);
  port = 3000;
}
// const http = require('http')
// const server = http.createServer(app)
const io = require('socket.io')(server)
// const port = process.env.PORT || 3000

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
      console.log("ready emit with socket id : " + socket.id)
    });
    socket.on('offer', function (id, message) {
      socket.to(id).emit('offer', socket.id, message)
      // socket.to(id).emit('offer', socket.id, message)
      console.log('offer emit with socket ' + id + 'message' + message);
    });
    socket.on('answer', function (id, message) {
      // socket.to(id).emit('answer', socket.id, message);
      socket.to(id).emit('answer', socket.id, message);
      console.log('answer emit with socket ' + id + 'message' + message);
    });
    socket.on('candidate', function (id, message) {
      socket.to(id).emit('candidate', socket.id, message);
      // socket.to(id).emit('candidate', socket.id, message);
      // console.log('candidate emit with socket ' + id + 'message' + message);
    });
    socket.on('disconnect', function() {
      socket.emit('bye', socket.id);
      console.log('disconnect emit with socket ' + socket.id);
    });
    
    // socket.on('offer', function(message) {
    //   console.log('Local Description: ' + message);
    // })
    // socket.on('Answer', SendAnswer)
    // socket.on('disconnect', Disconnect)
})


server.listen(port, () => console.log(`Active on ${port} port`))