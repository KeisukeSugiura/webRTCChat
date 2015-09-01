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

  socket.on('message', function(message) {
    // 送信元のidをメッセージに追加（相手が分かるように）
    message.target.from = socket.id;
        // 送信先が指定されているか？
    
    var target = message.target.sendto;
    var body = message.body;
  
    if (target) {
	　　// 送信先が指定されていた場合は、その相手のみに送信
      console.log(message.target.from+'  ----->  '+message.target.sendto+' ('+message.body.type+') ');
      io.sockets.to(target).emit('message', message);
    return;
    }

	// 特に指定がなければ、ブロードキャスト
  //
  console.log(message.target.from+'  emitMessage '+'('+message.body.type+')'); 
  emitMessage('message', message);

  
});

  socket.on('disconnect', function(message) { 
    //console.log(message.target.from+'  emitMessage'); 
    console.log(socket.id+' disconnected')
    //emitMessage('user disconnected');
  });

  // 会議室名が指定されていたら、室内だけに通知
  function emitMessage(type, message) {

    var roomname;
   // socket.get('roomname', function(err, _room) {  roomname = _room;  });

   if (roomname) { 
     io.socket.broadcast.to(roomname).emit(type, message);   
   }
   else {
     socket.broadcast.emit(type, message);
   }
 } 
});
