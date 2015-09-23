$(function(){
  var socketReady = false;
  var port = 9001;
  //var socket = io.connect('http://133.68.112.180:' +  port + '/');
  var socket = io.connect('http://127.0.0.1:' + port + '/');
  //
  //



  var canvas;
  var context;
  var pdfCanvas = 'pdfCanvas';
  var myCanvasDrawID='myCanvasDraw';
  var myCanvasPictureID='myCanvasPicture';
  var myCanvasPointerID='myCanvasPointer';
  var canvasStatus=[];
  var currentPageNumber;
  var pushing=false;
  var PDF;
  //PDF生成のタイミングで取得やるとCanvasの大きさがめちゃくちゃになる
  //TODO ヒューリスティクス->自動化
  var pdf;
  var pdfSize;
  var pdfWidth=594;
  var pdfHeight=842;
  var pdfIndex =1;
  var scale=1.0;
  var roomName = 'default';

   /*
  socket.ioハンドラ
  */
  // socket: channel connected
  
  socket.on('connect', onOpened)
        .on('syncLine',onLineDrawed)
        .on('syncFree',onFreeDrawed)
        .on('syncRect',onRectDrawed)
        .on('syncCircle',onCircleDrawed)
        .on('syncPointer',onPointerDrawed)
        .on('addCanvas',onAddCanvas)
        .on('clearPointerCanvas',onClearPointerCanvas)
        .on('syncBackCanvas',onBackCanvas)
        .on('pageNext',onPageNext)
        .on('pagePrev',onPagePrev)
        .on('signaling', onMessage)
        .on('changeVideoPosition',onPositionChanged)
        .on('initializeVideoPosition',onPositionInitialize);
  
  function onOpened(evt) {
    console.log('socket opened.');
    socketReady = true;
  
    roomName = getRoomName(); // 会議室名を取得する
   socket.emit('enter', roomName);
   socket.emit('noticeAddCanvas',{roomName:roomName,sendto:null});
  console.log('enter to ' + roomName);
  }




/**
 *
 *
 *editPD



 F.js
 *
 *
 * 
 */

   /**
canvas描画モジュール
**/
var drawTool = (function(){
  /*
  各メソッドのcanvasIDは　'canvas'+idとする
  */
  var module = {};

  /*
  module['canvasDraw'+canvasID]={
    */
  module.oldPointX=null; //ベジェ曲線描画に用いる元の座標
  module.oldPointY=null;  //一番最後
  module.semiOldPointX=null; //直近
  module.semiOldPointY=null;
  module.mode = 0;//0:線 1:四角 2:自由線 3:アノテーション
  
  

  module.drawCurve = function(canvasID,cx,cy){
   // module.drawPoint(ctx,cx,cy);
    if(module[canvasID].oldPointX && module[canvasID].semiOldPointX){
      var cav = document.getElementById(canvasID);
      ctx = cav.getContext('2d');
      ctx.beginPath();
      ctx.moveTo((module[canvasID].oldPointX+module[canvasID].semiOldPointX)/2,(module[canvasID].oldPointY+module[canvasID].semiOldPointY)/2);
      ctx.quadraticCurveTo(module[canvasID].semiOldPointX,module[canvasID].semiOldPointY,(module[canvasID].semiOldPointX+cx)/2,(module[canvasID].semiOldPointY+cy)/2);
      //ctx.closePath();
      ctx.stroke();
    
     
      module.updateLocus(canvasID,cx,cy);
    }else{

      module.updateLocus(canvasID,cx,cy);
    }
  };

  module.resDrawCurve = function(canvasID,cx,cy){
   // module.drawPoint(ctx,cx,cy);

    if(module[canvasID].oldPointX && module[canvasID].semiOldPointX){
      var cav = document.getElementById(canvasID);
     
      ctx = cav.getContext('2d');
      ctx.beginPath();
      ctx.moveTo((module[canvasID].oldPointX+module[canvasID].semiOldPointX)/2,(module[canvasID].oldPointY+module[canvasID].semiOldPointY)/2);
      ctx.quadraticCurveTo(module[canvasID].semiOldPointX,module[canvasID].semiOldPointY,(module[canvasID].semiOldPointX+cx)/2,(module[canvasID].semiOldPointY+cy)/2);
      //ctx.closePath();
      ctx.stroke();
    
      module.updateLocus(canvasID,cx,cy);
    }else{
     // console.log('old X : '+module[canvasID].oldPointX);
     // console.log('semi X : '+module[canvasID].semiOldPointX);
      module.updateLocus(canvasID,cx,cy);
    }
  };

  module.drawPoint = function(canvasID,cx,cy){
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    ctx.beginPath();
    ctx.arc(cx,cy,5,0,Math.PI*2);
    //ctx.closePath();
    ctx.fill();
  };

  module.drawLine = function(canvasID,cx1,cy1,cx2,cy2){
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    ctx.beginPath();
    //ctx.moveTo(module.semiOldPointX,module.semiOldPointY);
    //ctx.lineTo(module.semiOldPointX,module.semiOldPointY,cx,cy);
    ctx.moveTo(cx1,cy1);
    ctx.lineTo(cx2,cy2);
    ctx.stroke();
  };

  module.drawRect = function(canvasID,cx1,cy1,cx2,cy2){
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(cx1,cy1);
    ctx.lineTo(cx1,cy2);
    ctx.lineTo(cx2,cy2);
    ctx.lineTo(cx2,cy1);
    ctx.closePath();
    ctx.stroke();
  };

  module.drawCircle = function(canvasID,cx1,cy1,cx2,cy2){
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    ctx.beginPath();
    ctx.arc((cx1+cx2)/2,(cy1+cy2)/2,
      Math.sqrt((cx1-cx2)*(cx1-cx2)+(cy1-cy2)*(cy1-cy2))/2,0,Math.PI*2,true);
    ctx.stroke();
  }

  module.drawPointer = function(canvasID,cx,cy,ux,uy){
    //ux,uyにはつなぐ点四角の左側の中央の座標を入れる
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    console.log(ux);
   
    //ctx.strokeRect(ux-5,uy-95,250,190);
    ctx.beginPath();
    ctx.moveTo(ux-5,uy);
    ctx.lineTo(cx,cy);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ux-5,uy-95);
    ctx.lineTo(ux-5+255,uy-95);
    ctx.lineTo(ux-5+255,uy-95+195);
    ctx.lineTo(ux-5,uy-95+195);
    ctx.lineTo(ux-5,uy-95);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx,cy,4,0,Math.PI*2,true);
    ctx.stroke();
  }

  module.clearCanvas = function(canvasID){
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    ctx.clearRect(cav.style.left,cav.style.right,cav.width,cav.height);
  };

  module.updateLocus = function(canvasID,cx,cy){
    module[canvasID].oldPointX = module[canvasID].semiOldPointX;
    module[canvasID].oldPointY = module[canvasID].semiOldPointY;
    module[canvasID].semiOldPointX = cx;
    module[canvasID].semiOldPointY = cy;
  };

  module.clearLocus = function(canvasID){
    module[canvasID].oldPointX = null;
    module[canvasID].oldPointY = null;
    module[canvasID].semiOldPointX = null;
    module[canvasID].semiOldPointY = null;
  };

  //kokusei:matsuko$4649
  /**
    状態を保存する
  */
  module.pushStatus = function(canvasID){
    //TODO 自分の分と相手の分，どのように管理するのか
    //ans TODO 各ユーザごとにcanvasを追加する
    //
      var myContext = document.getElementById(myCanvasDrawID).getContext('2d');
      canvasStatus.push(myContext.getImageData($('#'+myCanvasDrawID).offset().left,$('#'+myCanvasDrawID).offset().top,$('#'+myCanvasDrawID).width(),$('#'+myCanvasDrawID).height()));
  };


  /**
    元の状態に戻す
  */
  module.popStatus = function(){
    //TODO 各ユーザごとにcanvasを持たせておき,対応するcanvasStatusをpopする
    //
      var myContext = document.getElementById(myCanvasDrawID).getContext('2d');
    var poped=canvasStatus.pop();
    if(poped){
     myContext.putImageData(poped,$('#'+myCanvasDrawID).offset().left,$('#'+myCanvasDrawID).offset().top);
    }
  };


  module.addCanvas= function(canvasID){
    var newElement1 = document.createElement('canvas');
    var newElement2 = document.createElement('canvas');
    var newElement3 = document.createElement('canvas');

    newElement1.id='canvasDraw'+canvasID;
    newElement2.id='canvasPicture'+canvasID;
    newElement3.id='canvasPointer'+canvasID;

    newElement1.width = pdfWidth;
    newElement2.width = pdfWidth;
    newElement3.width = pdfWidth+1000;

    newElement1.height = pdfHeight;
    newElement2.height = pdfHeight;
    newElement3.height = pdfHeight;

    var pictureBox = document.getElementById('pictureBox');
    var pointerBox = document.getElementById('pointerBox');
    var drawBox = document.getElementById('drawBox');
    drawBox.appendChild(newElement1);
    pictureBox.appendChild(newElement2);
    pointerBox.appendChild(newElement3);
    $('#canvasDraw'+canvasID).css({
        backgroundColor:'transparent',
        zIndex:2,
        position:'absolute'
    });
    $('#canvasPicture'+canvasID).css({
        backgroundColor:'transparent',
        zIndex:2,
        position:'absolute'
    });
    $('#canvasPointer'+canvasID).css({
        backgroundColor:'transparent',
        zIndex:3,
        position:'absolute'
    });

    
    var ectx1 = newElement1.getContext('2d');
    var ectx2 = newElement2.getContext('2d');
    var ectx3 = newElement3.getContext('2d');
    
    if(!userVideoColor[canvasID]){
    userVideoColor[canvasID] = getUserColor();
    }
    console.log(typeof userVideoColor[canvasID]);

    ectx1.strokeStyle=String(userVideoColor[canvasID]);
    ectx1.fillStyle=String(userVideoColor[canvasID]);
    ectx3.fillStyle=String(userVideoColor[canvasID]);
    ectx3.strokeStyle=String(userVideoColor[canvasID]);




    module['canvasDraw'+canvasID] = {};
    module['canvasDraw'+canvasID].semiOldPointY=null;
    module['canvasDraw'+canvasID].semiOldPointX=null;
    module['canvasDraw'+canvasID].oldPointX=null;
    module['canvasDraw'+canvasID].oldPointY=null;


   
    //module.setEventListener(canvasID);
  };

  module.setEventListener = function(canvasID){

/*
描画イベント
*/
$('#'+canvasID).mousedown(function(e){
  pushing=true;
  module.pushStatus(canvasID);
  console.log('mouseDown');
  switch(module.mode){
    case 0:
    //自由
    //var canvas = document.getElementById('the-canvas');
    //var ctx = canvas.getContext('2d');
    module.drawCurve(canvasID,e.pageX-5,e.pageY-30);
     socket.json.emit('noticeFreeDrawed',{
          roomName:roomName,
          currentX:e.pageX-5,
          currentY:e.pageY-30,
          mouseUp:false
      });
    break;
    case 1:
    //線
    module.updateLocus(canvasID,e.pageX-5,e.pageY-30);
    break;
    case 2:
    //四角
    module.updateLocus(canvasID,e.pageX-5,e.pageY-30);
    break;
    case 3:
    //円
    module.updateLocus(canvasID,e.pageX-5,e.pageY-30);
    break;
    case 4:
    //テキスト
    break;
    case 5:
    //ポインタ
    module.clearCanvas(canvasID);
    module.drawPointer(canvasID,e.pageX-5,e.pageY-30,$('#local-video').offset().left-10,$('#local-video').offset().top+90-40);
    socket.json.emit('noticePointerDrawed',{
      roomName:roomName,
      cx:e.pageX-5,
      cy:e.pageY-30,
      ux:$('#local-video').offset().left-10,
      uy:$('#local-video').offset().top+90-40
    });
    break;
  }
});
$('#'+canvasID).mousemove(function(e){
  console.log('mousemove');
  if(pushing){
   switch(module.mode){
    case 0:
    //自由
    module.drawCurve(canvasID,e.pageX-5,e.pageY-30);
     socket.json.emit('noticeFreeDrawed',{
          roomName:roomName,
          currentX:e.pageX-5,
          currentY:e.pageY-30,
          mouseUp:false
      });
    break;
    case 1:
    //線
    break;
    case 2:
    //四角
    break;
    case 3:
    //円
    break;
    case 4:
    //テキスト
    break;
    case 5:
    //ポインタ
   module.clearCanvas(canvasID);
    module.drawPointer(canvasID,e.pageX-5,e.pageY-30,$('#local-video').offset().left-10,$('#local-video').offset().top+90-40);
    socket.json.emit('noticePointerDrawed',{
      roomName:roomName,
      cx:e.pageX-5,
      cy:e.pageY-30,
      ux:$('#local-video').offset().left-10,
      uy:$('#local-video').offset().top+90-40
    });
    break;
  }
  }
});
$('#'+canvasID).mouseup(function(e){
    console.log('mouseUp');
   switch(module.mode){
    case 0:
    //自由
    module.drawCurve(canvasID,e.pageX-5,e.pageY-30);
     socket.json.emit('noticeFreeDrawed',{
          roomName:roomName,
          currentX:e.pageX-5,
          currentY:e.pageY-30,
          mouseUp:true
      });
    module.clearLocus(canvasID);
    if(canvasID == myCanvasDrawID){
      pushing=false;
    }
    break;
    case 1:
    //線
    module.drawLine(canvasID,module[canvasID].semiOldPointX,module[canvasID].semiOldPointY,e.pageX-5,e.pageY-30);
    socket.json.emit('noticeLineDrawed',{
        roomName:roomName,
        startX:module[canvasID].semiOldPointX,
        startY:module[canvasID].semiOldPointY,
        endX:e.pageX-5,
        endY:e.pageY-30
    });
    module.clearLocus(canvasID);
    break;
    case 2:
    //四角
    module.drawRect(canvasID,module[canvasID].semiOldPointX,module[canvasID].semiOldPointY,e.pageX-5,e.pageY-30);
    socket.json.emit('noticeRectDrawed',{
        roomName:roomName,
        startX:module[canvasID].semiOldPointX,
        startY:module[canvasID].semiOldPointY,
        endX:e.pageX-5,
        endY:e.pageY-30
    });
    module.clearLocus(canvasID);
    break;
    case 3:
    //円
    module.drawCircle(canvasID,e.pageX-5,e.pageY-30,module[canvasID].semiOldPointX,module[canvasID].semiOldPointY);
    
    socket.json.emit('noticeCircleDrawed',{
      roomName:roomName,
      cx1:e.pageX-5,
      cy1:e.pageY-30,
      cx2:module[canvasID].semiOldPointX,
      cy2:module[canvasID].semiOldPointY
    });
    module.clearLocus(canvasID);
    break;
    case 4:
    //テキスト
    module.clearLocus(canvasID);
    break;
    case 5:
    //ポインタ
    module.clearCanvas(canvasID);
    socket.json.emit('noticeClearPointerCanvas',{
      roomName:roomName,
      cx:e.pageX-5,
      cy:e.pageY-30,
      ux:$('#local-video').offset().left-10,
      uy:$('#local-video').offset().top+90-40
    });
    pushing = false;
    break;
  }
});

  };

  return module;  
})();

  function generateCanvas(canvasID,pageNum){
    var newElement1 = document.createElement('canvas');
    var newElement2 = document.createElement('canvas');
    var newElement3 = document.createElement('canvas');
    
    newElement1.id = 'canvasDraw'+canvasID+String(pageNum);
    newElement2.id = 'canvasPicture'+canvasID+String(pageNum);
    newElement3.id = 'canvasPointer'+canvasID+String(pageNum);

    newElement1.zIndex = 2;
    newElement2.zIndex = 2;
    newElement3.zIndex = 3;

    var pageWidth = document.getElementById('canvasPDF'+String(pageNum)).width;
    var pageHeight = document.getElementById('canvasPDF'+String(pageNum)).height;

    newElement1.width= pageWidth;
    newElement1.height= pageHeight;
    newElement2.width= pageWidth;
    newElement2.height= pageHeight;
    newElement3.width= pageWidth;
    newElement3.height= pageHeight;

    canvasContainer[pageNum].push(newElement1);
    canvasContainer[pageNum].push(newElement2);
    canvasContainer[pageNum].push(newElement3);
  }


  /**
  Addのタイミングで呼ばれる
  */
  function generateCanvasList(canvasID){
    var i = 1;
    for(i=1;i<pdf.numPages+1;i++){
      generateCanvas(canvasID,i);
      //setPdf2Canvas(i);
    }
  }


  /**
    PDFの読み込み時に呼ばれる
  */
  function setPDF2Canvas(pageNum){
    //最奥CanvasであるPDFの描画
    pdf.getPage(pageNum).then(function(page){
      var viewport = page.getViewport(scale);
      var newCanvas = document.createElement('canvas');
      newCanvas.id='canvasPDF'+String(pageNum);
      newCanvas.width = viewport.width;
      newCanvas.height = viewport.height;
      var newContext = newCanvas.getContext('2d');

      var renderContext = {
       canvasContext: newContext,
       viewport: viewport
      };
      page.render(renderContext);
       return newCanvas;

       });
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

  function onNewCanvas(message){
    socket.emit('noticeAddCanvas',{roomName:roomName});
  }

  function onLineDrawed(message){
    console.log('syncLineDrawed from '+message.target.from);

      var targetID = 'canvasDraw'+message.target.from;
      var messageValue = message.body.value;
      drawTool.drawLine(targetID,messageValue.startX,messageValue.startY,messageValue.endX,messageValue.endY);
      drawTool.clearLocus(targetID);
  }

  function onFreeDrawed(message){
    console.log('syncFreeDrawed from '+message.target.from);
      var targetID = 'canvasDraw'+message.target.from;
      var messageValue = message.body.value;
      drawTool.resDrawCurve(targetID,messageValue.currentX,messageValue.currentY);
        
      if(messageValue.mouseUp){
        drawTool.clearLocus(targetID);
      }
  }

  function onRectDrawed(message){
    console.log('syncRectDrawed from '+message.target.from);
      var targetID = 'canvasDraw'+message.target.from;
      var messageValue = message.body.value;
      drawTool.drawRect(targetID,messageValue.startX,messageValue.startY,messageValue.endX,messageValue.endY);
      drawTool.clearLocus(targetID);
  }

  function onCircleDrawed(message){
    console.log('syncCircleDrawed from '+message.target.from);
    var targetID = 'canvasDraw'+message.target.from;
    var messageValue = message.body.value;
    drawTool.drawCircle(targetID,messageValue.cx1,messageValue.cy1,messageValue.cx2,messageValue.cy2)
  }

  function onPointerDrawed(message){
      var targetID = 'canvasPointer'+message.target.from;
      var messageValue = message.body.value;
      drawTool.clearCanvas(targetID);
      drawTool.drawPointer(targetID,messageValue.cx,messageValue.cy,messageValue.ux,messageValue.uy);
  }


  function onAddCanvas(message){
    var canvasID = message.target.from;
    console.log(message.target.sendto);

    drawTool.addCanvas(canvasID);
    if(message.target.sendto ==null){

    socket.emit('noticeAddCanvas',{roomName:roomName,sendto:message.target.from});
    }
  }

  function onClearPointerCanvas(message){
      var targetID = 'canvasPointer'+message.target.from;
      drawTool.clearCanvas(targetID);
  }

  function onBackCanvas(message){
      var targetID = 'canvasDraw'+message.target.from;
      var messageValue = message.body.value;
      //drawTool.pop();
  }

  function onPageNext(message){
      pdfNextPage();
  }

  function onPagePrev(message){
    pdfPrevPage();
  }

/*
pdf初期呼び出し
*/
  PDFJS.getDocument('1DEX-6.pdf').then(function(pdf1) {
  // you can now use *pdf* here
  pdf = pdf1;
  pdfSize = pdf.numPages;
  pdf.getPage(pdfIndex).then(function(page) {
  // you can now use *page* here

var viewport = page.getViewport(scale);

canvas = document.getElementById(pdfCanvas);
context = canvas.getContext('2d');
canvas.height = viewport.height;
canvas.width = viewport.width;
pdfWidth = canvas.width;
pdfHeight = canvas.height;
$('#'+myCanvasDrawID).attr({
  width:pdfWidth,
  Height:pdfHeight,
});
$('#'+myCanvasPictureID).attr({
  width:pdfWidth,
  Height:pdfHeight,
});
$('#'+myCanvasPointerID).attr({
  width:pdfWidth,
  Height:pdfHeight,
});
var renderContext = {
  canvasContext: context,
  viewport: viewport
};
page.render(renderContext);


    });
  });


  function pdfNextPage(){
    if(pdfIndex<pdf.numPages){
      pdfIndex++;
      pdf.getPage(pdfIndex).then(function(page){
      var viewport = page.getViewport(scale);
      var renderContext = {
        canvasContext: context,
        viewport : viewport
      };
      page.render(renderContext);
    });
    }
  }

  function pdfPrevPage(){
    if(pdfIndex>1){
    pdfIndex--;
    pdf.getPage(pdfIndex).then(function(page){
      var viewport = page.getViewport(scale);
      var renderContext = {
        canvasContext: context,
        viewport : viewport
      };
      page.render(renderContext);

    });
    }
  }

  function pdfChangePage(pageNum){
    if(1<=pageNum && pageNum<=pdf.numPages){
      pdfIndex = pageNum;
      pdf.getPage(pageIndex).then(function(page){
        var viewport = page.getViewport(scale);
        var renderContext = {
          canvasContext: context,//初期のやつ入れ替えてる
          viewport : viewport
        }
        page.render(renderContext);
      });
    }
  }

  function pdfDownload(pageNum){
      if(1<= pageNum && pageNum<=pdf.numPages){
       var options = {
           orientation: "p",
           unit: "pt",
           format: "a4"
        };
        var doc = new jsPDF(options,'','','');
        //var imgdata = canvas.toDataURL('image/png');
        //doc.addImage(imgdata,'png',canvas.style.left,canvas.style.top,canvas.widht,canvas.height);
        var imgdata = canvas.toDataURL('image/png');
        //doc.save('sample.pdf');
        console.log(imgdata);

        var img = new Image();
        img.onload=function(){
             doc.addImage(img,'png',canvas.style.left,canvas.style.top,canvas.width,canvas.height);
        //doc.output('datauri');
        doc.save('sample.pdf');
        }

        img.src = imgdata;
      }
  }

  function pdfOutputOne(canvasItem){
    var options = {
           orientation: "p",
           unit: "pt",
           format: "a4"
        };
        var doc = new jsPDF(options,'','','');
        //var imgdata = canvas.toDataURL('image/png');
        //doc.addImage(imgdata,'png',canvas.style.left,canvas.style.top,canvas.widht,canvas.height);
        var imgdata = canvasItem.toDataURL('image/png');
        //doc.save('sample.pdf');
        console.log(imgdata);

        var img = new Image();
        img.onload=function(){
             doc.addImage(img,'png',canvasItem.style.left,canvasItem.style.top,canvasItem.width,canvasItem.height);
        //doc.output('datauri');
        doc.save('sample.pdf');
        }

        img.src = imgdata;
       
  }

  function pdfShogaDownload(pageNum,doc,callback){
      console.log(pageNum);
     if(1<=pageNum && pageNum<= pdf.numPages){
      pdf.getPage(pageNum).then(function(page){
        var viewport = page.getViewport(scale);

        var cav = document.createElement('canvas');
        var ctx = cav.getContext('2d');
        //cav.width = viewport.width;
        //cav.height =　viewport.height;
        cav.height = pdfHeight;
        cav.width = pdfWidth;
        var renderContext = {
          canvasContext:ctx,
          viewport :viewport
        }

        var renderTask = page.render(renderContext);


        renderTask.promise.then(function () {
          console.log('ok');
        ctx.fillStyle='red';
        ctx.fillRect(0,0,35,35);
        ctx.fillRect(cav.width-35,0,35,35);
        ctx.fillRect(0,cav.height-35,35,35);
        ctx.fillStyle="white";
        ctx.fillRect(5,5,25,25);
        ctx.fillRect(cav.width-30,5,25,25);
        ctx.fillRect(5,cav.height-30,25,25);
        ctx.fillStyle='red';
        ctx.fillRect(10,10,15,15);
        ctx.fillRect(cav.width-25,10,15,15);
        ctx.fillRect(10,cav.height-25,15,15);
        /*
        var options = {
           orientation: "p",
           unit: "pt",
           format: "a4"
        };
        var doc = new jsPDF(options,'','','');
        */
        //var imgdata = canvas.toDataURL('image/png');
        //doc.addImage(imgdata,'png',canvas.style.left,canvas.style.top,canvas.widht,canvas.height);
        var imgdata = cav.toDataURL('image/png');
        //doc.save('sample.pdf');
        console.log(imgdata);

        var img = new Image();
        img.onload=function(){
             doc.addImage(img,'png',canvas.style.left,canvas.style.top,canvas.width,canvas.height);
        //doc.output('datauri');
       //doc.save('dample.pdf');
       if(pageNum== pdf.numPages){
        doc.save('shoga.pdf');
       }else{
        doc.addPage();
       }
        callback();
        }

        img.src = imgdata;
        });

        
      });
    }
  }

  function pdfShogaDownloadMulti(){
        
        var options = {
           orientation: "p",
           unit: "pt",
           format: "a4"
        };
        var doc = new jsPDF(options,'','','');
        
          var i = 1;
          var ar = new Array();
          for(i=1;i<=pdf.numPages;i++){
            ar.push(i);
          }

          async.each(ar,function(value,callback){
              console.log(value);
              pdfShogaDownload(value,doc,callback);
          });
        /*
        for(i=1;i<=pdf.namPages;i++){
          console.log(i);
          pdfShogaDownload(i,doc);
          if(i==pdf.numPages){
            break;
          }else{
            doc.addPage();
          }
        }
        */
       // doc.save('sample.pdf');
  }

  function unionCanvas(){
    var editCanvas = document.createElement('canvas');
    editCanvas.width = pdfWidth;
    editCanvas.height = pdfHeight;
    var editCtx = editCanvas.getContext('2d');
    var drawBoxChildren = document.getElementById('drawBox').children;
    var pictureBoxChildren =document.getElementById('pictureBox').children;
    var unionList = new Array();
    var pdfCav = document.getElementById('pdfCanvas');
    unionList.push(pdfCav);
    for(var i=0;i<drawBoxChildren.length;i++){
      unionList.push(drawBoxChildren[i]);
    }
    for(var j=0;j<pictureBoxChildren.length;j++){
      unionList.push(pictureBoxChildren[j]);
    }
    
    var func1 = function(done){
      async.each(unionList,function(value,callback){
        console.log(value);
        drawImageCanvas(value,editCanvas,callback);
      });  
      done(null,'val');
    }
    async.waterfall([
      func1
      ],function(err,result){

        if(err){
          console.error(err);
        }else{
          pdfOutputOne(editCanvas);
        }
      });



  }

  function drawImageCanvas(canvasItem,eCanvas,callback){
    var img = new Image();
    var imgUrl = canvasItem.toDataURL('image/png');
    var pdfctx = eCanvas.getContext('2d');
    img.onload=function(){
      pdfctx.drawImage(img,0,0);
      console.log(imgUrl);
      callback();
    }
    img.src = imgUrl;

  }
/*
$('#the-canvas').click(function(e){
  var canvas = document.getElementById('the-canvas');
  var ctx = canvas.getContext('2d');
  drawTool.drawCurve(ctx,e.pageX,e.pageY);
});
*/

/*
切り替えツール
*/
$('#free_button').click(function(e){
  //自由線 0a
  console.log('mode change 0');
  drawTool.mode=0;
  var myCanvasD = document.getElementById(myCanvasDrawID);
  var myCanvasP = document.getElementById(myCanvasPointerID);
  var drawBox = document.getElementById('drawBox');
  var pointerBox = document.getElementById('pointerBox');
  pointerBox.style.zIndex=3;
  drawBox.style.zIndex=4;
  myCanvasD.style.zIndex=4;
  myCanvasP.style.zIndex=3;
  myCanvasP.width= pdfWidth;

});
$('#line_button').click(function(e){
  //固定線 1
  console.log('mode change 1');
  drawTool.mode=1;
  var myCanvasD = document.getElementById(myCanvasDrawID);
  var myCanvasP = document.getElementById(myCanvasPointerID);
  var drawBox = document.getElementById('drawBox');
  var pointerBox = document.getElementById('pointerBox');
  pointerBox.style.zIndex=3;
  drawBox.style.zIndex=4;
  myCanvasD.style.zIndex=4;
  myCanvasP.style.zIndex=3;
  myCanvasP.width= pdfWidth;
});
$('#rect_button').click(function(e){
  //四角線 2
  console.log('mode change 2');
  drawTool.mode=2;
  var myCanvasD = document.getElementById(myCanvasDrawID);
  var myCanvasP = document.getElementById(myCanvasPointerID);
  var drawBox = document.getElementById('drawBox');
  var pointerBox = document.getElementById('pointerBox');
  pointerBox.style.zIndex=3;
  drawBox.style.zIndex=4;
  myCanvasD.style.zIndex=4;
  myCanvasP.style.zIndex=3;
  myCanvasP.width= pdfWidth;
});
$('#circle_button').click(function(e){
  //円 3
  console.log('mode change 3');
  drawTool.mode=3;
  var myCanvasD = document.getElementById(myCanvasDrawID);
  var myCanvasP = document.getElementById(myCanvasPointerID);
  var drawBox = document.getElementById('drawBox');
  var pointerBox = document.getElementById('pointerBox');
  pointerBox.style.zIndex=3;
  drawBox.style.zIndex=4;
  myCanvasD.style.zIndex=4;
  myCanvasP.style.zIndex=3;
  myCanvasP.width= pdfWidth;
});
$('#text_button').click(function(e){
  //テキスト 4
  console.log('mode change 4');
  drawTool.mode=4;

  var myCanvasD = document.getElementById(myCanvasDrawID);
  var myCanvasP = document.getElementById(myCanvasPointerID);
  var drawBox = document.getElementById('drawBox');
  var pointerBox = document.getElementById('pointerBox');
  pointerBox.style.zIndex=3;
  drawBox.style.zIndex=4;
  myCanvasD.style.zIndex=4;
  myCanvasP.style.zIndex=3;
  myCanvasP.width= pdfWidth;

});
$('#back_button').click(function(e){
  console.log('back');
  drawTool.popStatus();
});
$('#next_button').click(function(e){
  console.log('back');
  //TODO ページめくり
  pdfNextPage();
  socket.json.emit('noticeNextPage',{
      roomName:roomName
  });
});
$('#prev_button').click(function(e){
  console.log('back');
  //TODO ページめくり
  pdfPrevPage();

  socket.json.emit('noticePrevPage',{
      roomName:roomName
  });
});
$('#pointer_button').click(function(e){
  console.log('pointer');
  console.log('mode change 5');
  drawTool.mode=5;
  var myCanvasD = document.getElementById(myCanvasDrawID);
  var myCanvasP = document.getElementById(myCanvasPointerID);
  var drawBox = document.getElementById('drawBox');
  var pointerBox = document.getElementById('pointerBox');
  pointerBox.style.zIndex=4;
  drawBox.style.zIndex=3;
  myCanvasD.style.zIndex=3;
  myCanvasP.style.zIndex=4;
  myCanvasP.width= pdfWidth+1000;
});
$('#download_button').click(function(e){
    unionCanvas();
  console.log('donwload');
});
$('#shoga_download_button').click(function(e){
    pdfShogaDownloadMulti();
  console.log('shoga download');
});


//初期リスナーセット
//全般的に初期化
drawTool.setEventListener(myCanvasDrawID);
drawTool.setEventListener(myCanvasPointerID);
drawTool[myCanvasDrawID] = {};
drawTool[myCanvasDrawID].semiOldPointX=null;
drawTool[myCanvasDrawID].semiOldPointY=null;
drawTool[myCanvasDrawID].oldPointX=null;
drawTool[myCanvasDrawID].oldPointY=null;
drawTool[myCanvasPointerID] = {};
drawTool[myCanvasPointerID].semiOldPointX=null;
drawTool[myCanvasPointerID].semiOldPointY=null;
drawTool[myCanvasPointerID].oldPointX=null;
drawTool[myCanvasPointerID].oldPointY=null;


/**
 *
 *
 *
 * multiAutoChat.js
 * 
 *
 * 
 */



   var localVideo = document.getElementById('local-video');
    $('#local-video').draggable({
        drag:sendVideoPositionChanged,
        containment:'parent'
    });
    $('#item_area').dblclick(function(e){
      if($('#local-video').zIndex()== 5){
        $('#local-video').zIndex(10);
      }
      else{
        $('#local-video').zIndex(5);
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
    if(!userVideoColor[id]){
    userVideoColor[id] = getUserColor();
    }
    var itemHtml = 
    '<video id="'+id+'"'+
    'autoplay style="width:240px;height:180px;position:absolute;-webkit-transform: scaleX(-1);margin:0px 0px 0px 0px;zIndex:1;">';

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
      console.log("Received offer, set offer, sending answer....");
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
    console.log("Received offer...");
	console.log(evt);
    setOffer(evt);
	sendAnswer(evt);
	//peerStarted = true; --
  }
  
  function onAnswer(evt) {
    console.log("Received Answer...");
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
    console.log("Received Candidate...");
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
    //console.log(targetVideo);
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
       // console.log('change volume in '+ value);
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
    peer.addEventListener("removestream", onRemoteStreamRemoved, false);

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
	  return;
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
	  return;
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
  