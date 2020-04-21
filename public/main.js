let socket = io.connect(window.location.origin);

const localVideo = document.querySelector('.localVideo');
const remoteVideos = document.querySelector('.remoteVideos');

const peerConnections = {};

const config = {
  'iceServers': [{
    'urls': ['stun:stun.l.google.com:19302']
  }]
};

const constraints = {
  audio: true,
  video: true
};

let gettingUserMedia = false;
let getUserMediaAttempts = 5;

window.onunload = window.onbeforeunload = function () {
  socket.close();
};

socket.on('ready', (id) => {
  if (!(localVideo instanceof HTMLVideoElement) || !localVideo.srcObject) {
    return;
  }
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;
  if (localVideo instanceof HTMLVideoElement) {
    peerConnection.addStream(localVideo.srcObject);
  }
  peerConnection.createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(function () {
      socket.emit('offer', id, peerConnection.localDescription);
      console.log('offer emit socket to id: ' + id + 'from socket id:' + socket.id);
    });
  peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);

  //stun handling
  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
      console.log('onicecandidate socket on ready');
    }
  };
})

socket.on('offer', function (id, description) {
  const peerConnection = new RTCPeerConnection(config);
  console.log('inside offer on ' + id);

  peerConnections[id] = peerConnection;
  if (localVideo instanceof HTMLVideoElement) {
    peerConnection.addStream(localVideo.srcObject);
  }
  peerConnection.setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(function () {
      socket.emit('answer', id, peerConnection.localDescription);
      console.log('answer emit socket to id: ' + id + 'from socket id:' + socket.id);

    });
  peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);

  //stun handling
  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
      console.log('onicecandidate socket on offer');
    }
  };
});

socket.on('candidate', function (id, candidate) {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
    console.log('inside candidate socket on ' + id);

});

socket.on('answer', function (id, description) {
  peerConnections[id].setRemoteDescription(description);
  console.log('inside answer socket on ' + id);
});

socket.on('bye', function (id) {
  handleRemoteHangup(id);
});

function handleRemoteStreamAdded(stream, id) {
  const remoteVideo = document.createElement('video');
  remoteVideo.srcObject = stream;
  remoteVideo.setAttribute("id", id.replace(/[^a-zA-Z]+/g, "").toLowerCase());
  remoteVideo.setAttribute("playsinline", "true");
  remoteVideo.setAttribute("autoplay", "true");
  remoteVideos.appendChild(remoteVideo);
  if (remoteVideos.querySelectorAll("video").length === 1) {
    remoteVideos.setAttribute("class", "one remoteVideos");
  } else {
    remoteVideos.setAttribute("class", "remoteVideos");
  }
}


function getUserMediaDevices() {
  if (localVideo instanceof HTMLVideoElement) {
    if (localVideo.srcObject) {
      getUserMediaSuccess(localVideo.srcObject);
    } else if (!gettingUserMedia && !localVideo.srcObject) {
      gettingUserMedia = true;
      navigator.mediaDevices.getUserMedia(constraints)
        .then(getUserMediaSuccess)
        .catch(getUserMediaError);
    }
  }
}

function getUserMediaError(error) {
  console.error(error);
  gettingUserMedia = false;
  (--getUserMediaAttempts > 0) && setTimeout(getUserMediaDevices, 1000);
}

function getUserMediaSuccess(stream) {
  if (localVideo instanceof HTMLVideoElement) {
    !localVideo.scrObject && (localVideo.srcObject = stream)
  }
  socket.emit('ready');
  console.log('ready emit socket id: ' + socket.id);
}

function handleRemoteHangup(id) {
  peerConnections[id] && peerConnections[id].close();
  delete peerConnections[id];
  document.querySelector("#" + id.replace(/[^a-zA-Z]+/g, "").toLowerCase()).remove();
  if (remoteVideos.querySelectorAll("video").length === 1) {
    remoteVideos.setAttribute("class", "one remoteVideos");
  } else {
    remoteVideos.setAttribute("class", "remoteVideos");
  }
}

function clientStartGame() {
  var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    // var players = {}; // this is magically defined in game.js

    var localDirection // used to display accel direction

    socket.on('gameStateUpdate', updateGameState);

    function drawPlayers(players) {
      // draw players
      // the game world is 500x500, but we're downscaling 5x to smooth accel out
      Object.keys(players).forEach((playerId) => {
        let player = players[playerId]
        var direction

        ctx.fillStyle = player.colour;
        ctx.fillRect(player.x/5, player.y/5, playerSize/5, playerSize/5);

        if (playerId == socket.id) {
          direction = localDirection
        } else {
          direction = player.direction
        }
        // draw accel direction for current player based on local variable
        // the idea here is to give players instant feedback when they hit a key
        // to mask the server lag
        ctx.fillStyle = 'black';
        let accelWidth = 3
        switch(direction) {
          case 'up':
            ctx.fillRect(player.x/5, player.y/5 - accelWidth, playerSize/5, accelWidth);
            break
          case 'down':
            ctx.fillRect(player.x/5, player.y/5  + playerSize/5, playerSize/5, accelWidth);
            break
          case 'left':
            ctx.fillRect(player.x/5 - accelWidth, player.y/5, accelWidth, playerSize/5);
            break
          case 'right':
            ctx.fillRect(player.x/5 + playerSize/5, player.y/5, accelWidth, playerSize/5);
        }
      })
    }

    function updateGameState(gameState) {
      // update local state to match state on server
      players = gameState.players
      doubloon = gameState.doubloon
      // draw stuff

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set score info
      var playerCount = Object.keys(players).length
      document.getElementById('playerCount').innerHTML = String(playerCount) + " gunda" + (playerCount > 1 ? 's' : '') + " on the salty seas"
      var scores = ''
      Object.values(players).sort((a,b) => (b.score - a.score)).forEach((player, index) => {
        scores += "<p><span style='border-bottom: 1px solid " + player.colour + ";'>" + player.name + "</span> has " + player.score + " sikke</p>"
      })
      document.getElementById('scores').innerHTML = scores

      // draw doubloon
      ctx.beginPath();
      ctx.arc((doubloon.x + doubloonSize/2)/5, (doubloon.y + doubloonSize/2)/5, doubloonSize/5, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'gold';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#003300';
      ctx.stroke();

      drawPlayers(players)
    }

    // key handling
    $('html').keydown(function(e) {
      if (e.key == "ArrowDown") {
        socket.emit('down', players);
        accelPlayer(socket.id, 0, 1)
        localDirection = 'down'
      } else if (e.key == "ArrowUp") {
        socket.emit('up', players);
        accelPlayer(socket.id, 0, -1)
        localDirection = 'up'
      } else if (e.key == "ArrowLeft") {
        socket.emit('left', players);
        accelPlayer(socket.id, -1, 0)
        localDirection = 'left'
      } else if (e.key == "ArrowRight") {
        socket.emit('right', players);
        accelPlayer(socket.id, 1, 0)
        localDirection = 'right'
      }
    })

    function gameLoop() {
      // update game
      updateGameState({players: players, doubloon: doubloon})
      // move everyone around
      Object.keys(players).forEach((playerId) => {
        let player = players[playerId]
        movePlayer(playerId)
      })
    }

    function drawGame() {
      // draw stuff
      drawPlayers(players)
      requestAnimationFrame(drawGame)
    }

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)
}

clientStartGame();
getUserMediaDevices();
