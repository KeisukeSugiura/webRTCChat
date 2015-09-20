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

  socket.on('noticeLineDrawed',function(message){
      var sendObj={
      body:{type:'synkLine',value:message},
      target:{from:socket.id,sendto:null,roomName:message.roomName}
    }
    emitMessage('syncLine',sendObj);  

  });


  socket.on('noticeFreeDrawed',function(message){
      var sendObj={
      body:{type:'syncFree',value:message},
      target:{from:socket.id,sendto:null,roomName:message.roomName}
    }
    emitMessage('syncFree',sendObj);
  });


  socket.on('noticeRectDrawed',function(message){
      var sendObj={
      body:{type:'syncRect',value:message},
      target:{from:socket.id,sendto:null,roomName:message.roomName}
    }
      emitMessage('syncRect',sendObj)
  });

  socket.on('noticeAddCanvas',function(message){
      var sendObj={
      body:{type:'addCanvas',value:message},
      target:{from:socket.id,sendto:message.sendto,roomName:message.roomName}
    }
      if(message.sendto){
         io.sockets.to(message.sendto).emit('signaling', sendObj);
      }
      emitMessage('addCanvas',sendObj)
  });

    socket.on('noticeNextPage',function(message){
      var sendObj={
      body:{type:'nextPage',value:message},
      target:{from:socket.id,sendto:null,roomName:message.roomName}
    }
      emitMessage('nextPage',sendObj)
  });

      socket.on('noticeNextPage',function(message){
      var sendObj={
      body:{type:'nextPage',value:message},
      target:{from:socket.id,sendto:null,roomName:message.roomName}
    }
      emitMessage('nextPage',sendObj)
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
