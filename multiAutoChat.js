var port = 9001;
var io = require('socket.io').listen(port);
console.log((new Date()) + " Server is listening on port " + port);

io.sockets.on('connection', function(socket) {
  // 入室
  socket.on('enter', function(roomname) {
    //socket.set('roomname', roomname);
    //
    console.log(socket.id+' join '+roomname);
    socket.join(roomname);
  });

  socket.on('signaling', function(message) {
    // 送信元のidをメッセージに追加（相手が分かるように）

    message.target.from = socket.id;
        // 送信先が指定されているか？
    
    var target = message.target.sendto;
    var body = message.body;


    if (target) {
	　　// 送信先が指定されていた場合は、その相手のみに送信
      console.log(message.target.from+'  ----->  '+message.target.sendto+' ('+message.body.type+') ');
      io.sockets.to(target).emit('signaling', message);
    return;
    }

	// 特に指定がなければ、ブロードキャスト
  //
  console.log(message.target.from+'  emitMessage '+'('+message.body.type+')'); 
  emitMessage('signaling', message);

  
});

  socket.on('disconnect', function(message) { 
    //console.log(message.target.from+'  emitMessage'); 
    console.log(socket.id+' disconnected');
    var sendObj={
      body:{type:'user disconnected'},
      target:{from:socket.id,sendto:null}
    }
    emitMessage('signaling',sendObj);
  });


  socket.on('changeVideoPosition',function(message){
    var sendObj={
      body:{type:'changeVideoPosition',value:message},
      target:{from:socket.id,sendto:null,roomName:message.roomName}
    }
    emitMessage('changeVideoPosition',sendObj);
  });

  socket.on('initializeVideoPosition',function(message){
      var sendObj={
        body:{type:'initializeVideoPosition',value:message},
        target:{from:socket.id,sendto:null,roomName:message.roomName}
      }
      emitMessage('initializeVideoPosition',sendObj);
  });

  // 会議室名が指定されていたら、室内だけに通知
  function emitMessage(type, message) {

    var roomname=message.target.roomName;
   // socket.get('roomname', function(err, _room) {  roomname = _room;  });

   if (roomname) { 
     socket.to(roomname).emit(type, message);   
   }
   else {
     socket.broadcast.emit(type, message);
   }
 } 
});
