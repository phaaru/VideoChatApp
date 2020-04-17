let socket = io()

const localVideo = document.querySelector('video#localVideo');
// const video2 = document.querySelector('video#video2');
// const video3 = document.querySelector('video#video3');

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

// const peerConnection = new RTCPeerConnection(config);

// navigator.mediaDevices.getUserMedia(constraints)
//   .then(function (stream) {
//     localVideo.srcObject = stream
//     peerConnection.addStream(stream);
//     peerConnection.createOffer()
//       .then(sdp => peerConnection.setLocalDescription(sdp))
//       .then(function () {
//         console.log('Local Description: ' + peerConnection.localDescription);
//         socket.emit('offer', peerConnection.localDescription);
//         console.log('Offer Sent')
//       })
//   })

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
    });
  peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);

  //stun handling
  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
    }
  };
})

socket.on('offer', function (id, description) {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;
  if (localVideo instanceof HTMLVideoElement) {
    peerConnection.addStream(localVideo.srcObject);
  }
  peerConnection.setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(function () {
      socket.emit('answer', id, peerConnection.localDescription);
    });
  peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);
  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
    }
  };
});

socket.on('candidate', function (id, candidate) {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on('answer', function (id, description) {
  peerConnections[id].setRemoteDescription(description);
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
  if (localVideo instanceof HTMLVideoELement) {
    !localVideo.scrObject && (localVideo.srcObject = stream)
  }
  socket.emit('ready');
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

getUserMediaDevices();
