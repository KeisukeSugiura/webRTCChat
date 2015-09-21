
  $(function(){
    var localVideo = document.getElementById('local-video');
    $('#local-video').draggable({
        drag:sendVideoPositionChanged,
        containment:'parent'
    });
    $('#item_area').dblclick(function(e){
      if($('#local-video').zIndex()== 0){
        $('#local-video').zIndex(10);
      }
      else{
        $('#local-video').zIndex(0);
      }
    });

  //var remoteVideo = document.getElementById('remote-video');
  var localStream = null;
  var mediaConstraints = {'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true }};

  // ---- multi people video & audio ----
  var videoElementsInUse = {};
  var videoElementsStandBy = {};
  var myCenterX=0;
  var myCenterY=0;
  var centerX = new Array();
  var centerY = new Array();
  var userVideoCount =0;
  var userVideoColor={};
  //$('#start_button').click(startVideo);
  //$('#stop_button').click(stopVideo);
  //$('#call_button').click(call);
  //$('#hangup_button').click(hangUp);
 // pushVideoStandBy(getVideoForRemote(0));
  //pushVideoStandBy(getVideoForRemote(1));
  //pushVideoStandBy(getVideoForRemote(2));
  startVideo();
  var roomName ="_defaultroom";

  function sendVideoPositionChanged(e,ui){
      myCenterX = $('#local-video').offset().left;
      myCenterY = $('#local-video').offset().top;

      var sendObj={
        top:$('#local-video').offset().top,
        left:$('#local-video').offset().left,
        roomName:roomName
      }
      socket.emit('changeVideoPosition',sendObj);
      setAllVideoVolume();
  }

  function getVideoForRemote(index) {
    var elementID = 'webrtc-remote-video-' + index;
    var element = document.getElementById(elementID);
    return element;
  }

  // ---- video element management ---
  function pushVideoStandBy(element) {
    videoElementsStandBy[element.id] = element;
  }

  function popVideoStandBy() {
    var element = null;
    for (var id in videoElementsStandBy) {
      element = videoElementsStandBy[id];
      delete videoElementsStandBy[id];
      return element;
    }
    return null;
  }

  function pushVideoInUse(id, element) {
    videoElementsInUse[id] = element;
  }

  function popVideoInUse(id) {
    element = videoElementsInUse[id];
    delete videoElementsInUse[id];
    return element;
  }

  function generateItemWithId(id){
    userVideoColor[id] = getUserColor();
    var itemHtml = 
    '<video id="'+id+'"'+
    'autoplay style="width:240px;height:180px;position:absolute;margin:0px 0px 0px 0px;zIndex:1;">';

    $('#item_area').append(itemHtml);
    var elm = document.getElementById(id);
    elm.style.border = '3px solid '+userVideoColor[id];
    socket.emit('initializeVideoPosition',{roomName:roomName});
    //$('#'+id).draggable();
    return document.getElementById(id);
  }

  function getUserColor(){
      userVideoCount = userVideoCount % MAX_CONNECTION_COUNT;//6
      switch(userVideoCount++){
        case 0:
          return 'red';
        break;
        case 1:
          return 'blue';
        break;
        case 2:
          return 'green';
        break;
        case 3:
          return 'gray';
        break;
        case 4:
          return 'orange';
        break;
        case 5:
          return 'purple';
        break;
        default:
          return 'black';
        break;
      }
  }


  function attachVideo(id, stream) {
    console.log('try to attach video. id=' + id);
    //TODO
    //var videoElement = popVideoStandBy();
    var videoElement=generateItemWithId(id);
    if (videoElement) {
      videoElement.src = window.URL.createObjectURL(stream);
      console.log("videoElement.src=" + videoElement.src);
      pushVideoInUse(id, videoElement);
      videoElement.style.display = 'block';

    }
    else {
      console.error('--- no video element stand by.');
    }
  }

  function detachVideo(id) {
    console.log('try to detach video. id=' + id);
    var videoElement = popVideoInUse(id);
    if (videoElement) {
      videoElement.pause();
      videoElement.src = "";
      console.log("videoElement.src=" + videoElement.src);
      //pushVideoStandBy(videoElement);
      $('#'+id).remove();
    }
    else {
      console.warn('warning --- no video element using with id=' + id);
    }
  }

  function detachAllVideo() {
    var element = null;
    for (var id in videoElementsInUse) {
      detachVideo(id);
    }
  }

  function getFirstVideoInUse() {
    var element = null;
    for (var id in videoElementsInUse) {
      element = videoElementsInUse[id];
      return element;
    }
    return null;
  }

  function getVideoCountInUse() {
    var count = 0;
    for (var id in videoElementsInUse) {
      count++;
    }
    return count;
  }
  
  
  function isLocalStreamStarted() {
    if (localStream) {
      return true;
    }
    else {
      return false;
    }
  }

  // -------------- multi connections --------------------
  var MAX_CONNECTION_COUNT = 6;
  var connections = {}; // Connection hash
  function Connection() { // Connection Class
    var self = this;
    var id = "";  // socket.id of partner
    var peerconnection = null; // RTCPeerConnection instance
    var established = false; // is Already Established
    var iceReady = false;
  }

  function getConnection(id) {
    var con = null;
    con = connections[id];
    return con;
  }

  function addConnection(id, connection) {
    connections[id] = connection;
  }

  function getConnectionCount() {
    var count = 0;
    for (var id in connections) {
      count++;
    }

    console.log('getConnectionCount=' + count);
    return count;
  }

  function isConnectPossible() {
    if (getConnectionCount() < MAX_CONNECTION_COUNT)
      return true;
    else
      return false;
  }

  function getConnectionIndex(id_to_lookup) {
    var index = 0;
    for (var id in connections) {
      if (id == id_to_lookup) {
        return index;
      }

      index++;
    }

    // not found
    return -1;
  }

  function deleteConnection(id) {
    delete connections[id];
  }

  function stopAllConnections() {
    for (var id in connections) {
      var conn = connections[id];
      conn.peerconnection.close();
      conn.peerconnection = null;
      delete connections[id];
    }
  }

  function stopConnection(id) {
    var conn = connections[id];
    if(conn) {
      console.log('stop and delete connection with id=' + id);
      conn.peerconnection.close();
      conn.peerconnection = null;
      delete connections[id];
    }
    else {
      console.log('try to stop connection, but not found id=' + id);
    }
  }

  function isPeerStarted() {
    if (getConnectionCount() > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  
  // ---- socket ------
  
  // socket: accept connection request
  function onMessage(evt) {
    var id = evt.target.from;
    var target = evt.target.sendto;
    var conn = getConnection(id);

    console.log('----------------\n'+evt.body.type+'\n------------------');
    if (evt.body.type === 'call') {
      if (! isLocalStreamStarted()) {
	    return;
	  }
      if (conn) {
	    return;  // already connected
	  }

      if (isConnectPossible()) {
        socket.json.emit('signaling',{target:{sendto:id,from:null},body:{type: "response"}});
      }
      else {
	    console.warn('max connections. so ignore call'); 
	  }
	  return;
    }
    else if (evt.body.type === 'response') {
      sendOffer(evt);
      return;
    } else if (evt.body.type === 'offer') {
      console.log("Received offer, set offer, sending answer....")
      onOffer(evt);	  
    } else if (evt.body.type === 'answer' && isPeerStarted()) {  // **
      console.log('Received answer, settinng answer SDP');
	  onAnswer(evt);
    } else if (evt.body.type === 'candidate' && isPeerStarted()) { // **
      console.log('Received ICE candidate...');
	  onCandidate(evt);

    } else if (evt.body.type === 'user disconnected' && isPeerStarted()) { // **
      console.log("disconnected");
      //stop();
	     detachVideo(id); // force detach video
      stopConnection(id);
    }
  }

  function onPositionChanged(message){
      var targetID = message.target.from;
      $('#'+targetID).css({
        top:message.body.value.top,
        left:message.body.value.left
      });
      centerX[targetID] = message.body.value.left;
      centerY[targetID] = message.body.value.top;
      setVideoVolume(targetID);
  }

  function onPositionInitialize(message){
      sendVideoPositionChanged();
  }

  function getRoomName() { // たとえば、 URLに  ?roomname  とする
    var url = document.location.href;
    var args = url.split('?');
    if (args.length > 1) {
      var room = args[1];
      if (room != "") {
        return room;
      }
    }
    return "_defaultroom";
  }
  
  // ----------------- handshake --------------
  //var textForSendSDP = document.getElementById('text-for-send-sdp');
  //var textForSendICE = document.getElementById('text-for-send-ice');
  //var textToReceiveSDP = document.getElementById('text-for-receive-sdp');
  //var textToReceiveICE = document.getElementById('text-for-receive-ice');
  //var iceSeparator = '------ ICE Candidate -------';
  //var CR = String.fromCharCode(13);
  
  /*--
  function onSDP() {
    var text = textToReceiveSDP.value;
	var evt = JSON.parse(text);
	if (peerConnection) {
	  onAnswer(evt);
	}
	else {
	  onOffer(evt);
	}
	
	//textToReceiveSDP.value ="";
  }
  --*/
  
  //--- multi ICE candidate ---
  /*--
  function onICE() {
    var text = textToReceiveICE.value;
	var arr = text.split(iceSeparator);
	for (var i = 1, len = arr.length; i < len; i++) {
      var evt = JSON.parse(arr[i]);
	  onCandidate(evt);
    }

	textToReceiveICE.value ="";
  }
  ---*/
  
  
  function onOffer(evt) {
    console.log("Received offer...")
	console.log(evt);
    setOffer(evt);
	sendAnswer(evt);
	//peerStarted = true; --
  }
  
  function onAnswer(evt) {
    console.log("Received Answer...")
	console.log(evt);
	setAnswer(evt);
  }
  
  function onCandidate(evt) {
	var id = evt.target.from;
    var conn = getConnection(id);
    if (! conn) {
	  console.error('peerConnection not exist!');
	  return;
	}
    
    // --- check if ice ready ---
    if (! conn.iceReady) {
      console.warn("PeerConn is not ICE ready, so ignore");
      return;
    }
	  
    var candidate = new RTCIceCandidate({sdpMLineIndex:evt.body.sdpMLineIndex, sdpMid:evt.body.sdpMid, candidate:evt.body.candidate});
    console.log("Received Candidate...")
	console.log(candidate);
    conn.peerconnection.addIceCandidate(candidate);
  }

  function sendSDP(sdp) {
    var text = JSON.stringify(sdp);
	console.log("---sending sdp text ---");
	console.log(text);
  
	//textForSendSDP.value = text;
	
	// send via socket
	socket.json.emit('signaling',sdp);
  }
  
  function sendCandidate(candidate) {
    var text = JSON.stringify(candidate);
	console.log("---sending candidate text ---");
	console.log(text);
	//textForSendICE.value = (textForSendICE.value + CR + iceSeparator + CR + text + CR);
	//textForSendICE.scrollTop = textForSendICE.scrollHeight;
	
	// send via socket
	socket.json.emit('signaling',candidate);
  }
  
  // ---------------------- video handling -----------------------
  // start local video
  function startVideo() {
	navigator.webkitGetUserMedia({video: true, audio: true},
     function (stream) { // success
      localStream = stream;
      localVideo.src = window.webkitURL.createObjectURL(stream);
      localVideo.play();
	    localVideo.volume = 0;
      call();
     },
     function (error) { // error
      console.error('An error occurred:');
      console.error(error);
      return;
     }
	);
  }

  // stop local video
  function stopVideo() {
    localVideo.src = "";
    localStream.stop();
  }

  function setVideoVolume(id){
    var targetVideo = document.getElementById(id);
    console.log(targetVideo);
    var dist = euclidDist(id);
    if(dist<120){
      targetVideo.volume=1.0;
    }
    else if(dist < 500){
      targetVideo.volume = 1.0 - ((dist-120) / 380);
    }else{
      targetVideo.volume = 0;
    }
  }
  function setAllVideoVolume(){
    var keys =Object.keys(videoElementsInUse);
    //console.log(keys);
    keys.forEach(function(value,index,arr){
        console.log('change volume in '+ value);
        setVideoVolume(value);
    });
  }

  function euclidDist(id){
      //想定myCenterXとcenterX[]が存在している
      return distance = Math.sqrt((myCenterX-centerX[id])*(myCenterX-centerX[id])+(myCenterY-centerY[id])*(myCenterY-centerY[id]));
  }

  // ---------------------- connection handling -----------------------
  function prepareNewConnection(id) {
    var pc_config = {"iceServers":[]};
    var peer = null;
    try {
      peer = new webkitRTCPeerConnection(pc_config);
    } catch (e) {
      console.log("Failed to create PeerConnection, exception: " + e.message);
    }
    var conn = new Connection();
    conn.id = id;
    conn.peerconnection = peer;
    peer.id = id;
    addConnection(id, conn);

    // send any ice candidates to the other peer
    peer.onicecandidate = function (evt) {
      if (evt.candidate) {
        console.log(evt.candidate);
        sendCandidate({target:{sendto:conn.id,from:null},body:{type: "candidate", 
                          sendto: conn.id,
                          sdpMLineIndex: evt.candidate.sdpMLineIndex,
                          sdpMid: evt.candidate.sdpMid,
                          candidate: evt.candidate.candidate}});
      } else {
        console.log("End of candidates. ------------------- phase=" + evt.eventPhase);
        conn.established = true;

      }
    };

    console.log('Adding local stream...');
    peer.addStream(localStream);

    peer.addEventListener("addstream", onRemoteStreamAdded, false);
    peer.addEventListener("removestream", onRemoteStreamRemoved, false)

    // when remote adds a stream, hand it on to the local video element
    function onRemoteStreamAdded(event) {
      console.log("Added remote stream");
      attachVideo(this.id, event.stream);

	  //remoteVideo.src = window.webkitURL.createObjectURL(event.stream);
    }

    // when remote removes a stream, remove it from the local video element
    function onRemoteStreamRemoved(event) {
      console.log("Remove remote stream");
      detachVideo(this.id);
	  //remoteVideo.pause();
      //remoteVideo.src = "";
    }

    return conn;
  }

  function sendOffer(evt) {
    var id = evt.target.from;
	   var conn = getConnection(id);
    if (!conn) {
      conn = prepareNewConnection(id);
    }

	conn.peerconnection.createOffer(function (sessionDescription) { // in case of success
      conn.iceReady = true;
      conn.peerconnection.setLocalDescription(sessionDescription);
      var sendObj ={target:{sendto:id,from:''},body:sessionDescription};
	  //sendSDP(sessionDescription);
      sendSDP(sendObj);
    }, function () { // in case of error
      console.log("Create Offer failed");
    }, mediaConstraints);
    conn.iceReady = true;
  }

  function setOffer(evt) {
	var id = evt.target.from;
    var conn = getConnection(id);
    if (! conn) {
      conn = prepareNewConnection(id);
      conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt.body));
    }
	else {
	  console.error('peerConnection alreay exist!');
	}
  }
  
  function sendAnswer(evt) {
    console.log('sending Answer. Creating remote session description...' );
	var id = evt.target.from;
    var conn = getConnection(id);
    if (! conn) {
	  console.error('peerConnection not exist!');
	  return
    }

    conn.peerconnection.createAnswer(function (sessionDescription) { 
      // in case of success
      conn.iceReady = true;
      conn.peerconnection.setLocalDescription(sessionDescription);
      //sessionDescription.sendto = id;
	  //sendSDP(sessionDescription);
    var sendObj ={body:sessionDescription,target:{sendto:id,from:''}};
      sendSDP(sendObj);
    }, function () { // in case of error
      console.log("Create Answer failed");
    }, mediaConstraints);
    conn.iceReady = true;
  }

  function setAnswer(evt) {
	var id = evt.target.from;
    var conn = getConnection(id);
    if (! conn) {
	  console.error('peerConnection not exist!');
	  return
    }
    conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt.body));

  }
  
  // -------- handling user UI event -----
  /*-----
  // start the connection upon user request
  function connect() {
    if (!peerStarted && localStream && socketReady) { // **
	//if (!peerStarted && localStream) { // --
      sendOffer();
      peerStarted = true;
    } else {
      alert("Local stream not running yet - try again.");
    }
  }
  ----------*/
  
  // call others before connecting peer
  function call() {
    if (! isLocalStreamStarted()) {
      alert("Local stream not running yet. Please [Start Video] or [Start Screen].");
      return;
    }
    if (! socketReady) {
      alert("Socket is not connected to server. Please reload and try again.");
      return;
    }

    // call others, in same room
    console.log("call others in same room, befeore offer");
    socket.json.emit('signaling',{target:{sendto:null,from:null,roomName:roomName},body:{type: "call"}});
  }
  
  // stop the connection upon user request
  function hangUp() {
    console.log("Hang up.");
    socket.json.emit('signaling',{target:{sendto:null,from:null},body:{type: "user disconnected"}});
    detachAllVideo();
    stopAllConnections();
  }

  /*--
  function stop() {
    peerConnection.close();
    peerConnection = null;
    //peerStarted = false; --
  }
  --*/
});
