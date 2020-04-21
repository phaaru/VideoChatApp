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

const engine = require('./public/game')

app.use(express.static(__dirname + "/public"))

// const MAX_CLIENTS = 3;
// let clients = 0;

let gameInterval, updateInterval

function pirateName() {
  var names = [
    'Yeda Anna',
    'Chota Chatri',
    'Vasooli Bhai',
    'Ded-Futiya',
    'Perpendicooler',
    'Mogambo',
    'Gabbar Singh',
    'Circuit',
    'Don',
    'Anna Seth',
    'Crime Master Gogo',
    'Ramadhir Singh',
    'Munna Bhai'
  ]
  return names[Math.floor(Math.random() * names.length)]
}

function gameLoop() {
  // move everyone around
  Object.keys(engine.players).forEach((playerId) => {
    let player = engine.players[playerId]
    engine.movePlayer(playerId)
  })
}

function emitUpdates() {
  // tell everyone what's up
  io.emit('gameStateUpdate', { players: engine.players, doubloon: engine.doubloon });
}

io.on('connection', function (socket) {
  console.log('User connected: ', socket.id)

  // Video Chat socket.on
  socket.on('ready', function () {
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

  // start game if this is the first player
  if (Object.keys(engine.players).length == 0) {
    engine.shuffleDoubloon()
  	gameInterval = setInterval(gameLoop, 25)
    updateInterval = setInterval(emitUpdates, 40)
	}

  // get open position
  var posX = 0
  var posY = 0
  while (!engine.isValidPosition({ x: posX, y: posY }, socket.id)) {
    posX = Math.floor(Math.random() * Number(engine.gameSize) - 100) + 10
    posY = Math.floor(Math.random() * Number(engine.gameSize) - 100) + 10
  }

  // add player to engine.players obj
  engine.players[socket.id] = {
  	accel: {
  		x: 0,
  		y: 0
  	},
  	x: posX,
    y: posY,
  	colour: engine.stringToColour(socket.id),
  	score: 0,
    name: pirateName()
  }

  socket.on('up', function(msg){
    engine.accelPlayer(socket.id, 0, -1)
  });

  socket.on('down', function(msg) {
    engine.accelPlayer(socket.id, 0, 1)
  })

  socket.on('left', function(msg){
    engine.accelPlayer(socket.id, -1, 0)
  });

  socket.on('right', function(msg) {
    engine.accelPlayer(socket.id, 1, 0)
  });

  socket.on('disconnect', function () {
    // remotehangUp called on client
    socket.broadcast.emit('bye', socket.id);
    console.log('disconnect emit with socket ' + socket.id);

    // delete player
    delete engine.players[socket.id]
  	// end game if there are no engine.players left
  	if (Object.keys(engine.players).length > 0) {
    	io.emit('gameStateUpdate', engine.players);
  	} else {
  		clearInterval(gameInterval)
      clearInterval(updateInterval)
  	}
  });
})

server.listen(port, () => console.log(`Active on ${port} port`))