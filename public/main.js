let socket = io()

const video1 = document.querySelector('video#video1');
const video2 = document.querySelector('video#video2');
const video3 = document.querySelector('video#video3');

const config = {
    'iceServers': [{
      'urls': ['stun:stun.l.google.com:19302']
    }]
  };

const constraints = {
    audio: true,
    video: true
  };

window.onunload = window.onbeforeunload = function() {
  socket.close();
};

const peerConnection = new RTCPeerConnection(config);

navigator.mediaDevices.getUserMedia(constraints)
.then(function(stream) {
  video1.srcObject = stream
  peerConnection.addStream(stream);
  peerConnection.createOffer()
  .then(sdp => peerConnection.setLocalDescription(sdp))
  .then(function() {
    console.log('Local Description: ' + peerConnection.localDescription);
    socket.emit('offer', peerConnection.localDescription);
    console.log('Offer Sent')
  })
})
