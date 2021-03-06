$(function(){

  

  


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
      
      ctx.strokeStyle="red";
      ctx.lineWidth=5;
      ctx.stroke();
    
     
      module.updateLocus(canvasID,cx,cy);
    }else{

      module.updateLocus(canvasID,cx,cy);
    }
  }

  module.resDrawCurve = function(canvasID,cx,cy){
   // module.drawPoint(ctx,cx,cy);

    if(module[canvasID].oldPointX && module[canvasID].semiOldPointX){
      var cav = document.getElementById(canvasID);
     
      ctx = cav.getContext('2d');
      ctx.beginPath();
      ctx.moveTo((module[canvasID].oldPointX+module[canvasID].semiOldPointX)/2,(module[canvasID].oldPointY+module[canvasID].semiOldPointY)/2);
      ctx.quadraticCurveTo(module[canvasID].semiOldPointX,module[canvasID].semiOldPointY,(module[canvasID].semiOldPointX+cx)/2,(module[canvasID].semiOldPointY+cy)/2);
      //ctx.closePath();
      
      ctx.strokeStyle="red";
      ctx.lineWidth=5;
      ctx.stroke();
    
      module.updateLocus(canvasID,cx,cy);
    }else{
      console.log('old X : '+module[canvasID].oldPointX);
      console.log('semi X : '+module[canvasID].semiOldPointX);
      module.updateLocus(canvasID,cx,cy);
    }
  }

  module.drawPoint = function(canvasID,cx,cy){
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    ctx.beginPath();
    ctx.arc(cx,cy,5,0,Math.PI*2);
    //ctx.closePath();
    ctx.fill();
  }

  module.drawLine = function(canvasID,cx1,cy1,cx2,cy2){
    var cav = document.getElementById(canvasID);
    var ctx = cav.getContext('2d');
    ctx.beginPath();
    //ctx.moveTo(module.semiOldPointX,module.semiOldPointY);
    //ctx.lineTo(module.semiOldPointX,module.semiOldPointY,cx,cy);
    ctx.moveTo(cx1,cy1);
    ctx.lineTo(cx2,cy2);
    ctx.stroke();
  }

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
  }


  module.updateLocus = function(canvasID,cx,cy){
    module[canvasID].oldPointX = module[canvasID].semiOldPointX;
    module[canvasID].oldPointY = module[canvasID].semiOldPointY;
    module[canvasID].semiOldPointX = cx;
    module[canvasID].semiOldPointY = cy;
  }

  module.clearLocus = function(canvasID){
    module[canvasID].oldPointX = null;
    module[canvasID].oldPointY = null;
    module[canvasID].semiOldPointX = null;
    module[canvasID].semiOldPointY = null;
  }

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
  }


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
  }


  module.addCanvas= function(canvasID){
    var newElement1 = document.createElement('canvas');
    var newElement2 = document.createElement('canvas');
    var newElement3 = document.createElement('canvas');
    //TODO canvas要素のプロパティ設定
    newElement1.id='canvasDraw'+canvasID;
    newElement2.id='canvasPicture'+canvasID;
    newElement3.id='canvasPointer'+canvasID;

    newElement1.width = pdfWidth;
    newElement2.width = pdfWidth;
    newElement3.width = pdfWidth;

    newElement1.height = pdfHeight;
    newElement2.height = pdfHeight;
    newElement3.height = pdfHeight;

    var canvasBox = document.getElementById('canvasBox');
    canvasBox.appendChild(newElement1);
    canvasBox.appendChild(newElement2);
    canvasBox.appendChild(newElement3);
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


    module['canvasDraw'+canvasID] = {};
    module['canvasDraw'+canvasID].semiOldPointY=null;
    module['canvasDraw'+canvasID].semiOldPointX=null;
    module['canvasDraw'+canvasID].oldPointX=null;
    module['canvasDraw'+canvasID].oldPointY=null;


   
    //module.setEventListener(canvasID);
  }

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
    break;
    case 4:
    //テキスト
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
    module.clearLocus(canvasID);
    break;
    case 4:
    //テキスト
    module.clearLocus(canvasID);
    break;
  }
});

  }

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

  function onPointerDrawed(message){
      var targetID = 'canvasDraw'+message.target.from;

  }


  function onAddCanvas(message){
    var canvasID = message.target.from;
    console.log(message.target.sendto);

    drawTool.addCanvas(canvasID);
    if(message.target.sendto ==null){

    socket.emit('noticeAddCanvas',{roomName:roomName,sendto:message.target.from});
    }
  }

  function onPointerDrawed(message){
      var targetID = 'canvasDraw'+message.target.from;

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
      }
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
      }
      page.render(renderContext);

    });
    }
  }

  function pdfChangePage(pageNum){
    if(1<=pageNum && pageNum<=pdf.numPages){
      pdfIndex = pageNum;
      pdf.getPage(pdfIndex).then(function(page){
        var viewport = page.getViewport(scale);
        var renderContext = {
          canvasContext: context,
          viewport : viewport
        }
        page.render(renderContext);
      });
    }
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
});
$('#line_button').click(function(e){
  //固定線 1
  console.log('mode change 1');
  drawTool.mode=1;
});
$('#rect_button').click(function(e){
  //四角線 2
  console.log('mode change 2');
  drawTool.mode=2;
});
$('#circle_button').click(function(e){
  //円 3
  console.log('mode change 3');
  drawTool.mode=3;
});
$('#text_button').click(function(e){
  //テキスト 4
  console.log('mode change 4');
  drawTool.mode=4;
});
$('#back_button').click(function(e){
  console.log('back');
  drawTool.popStatus();
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
$('#ponter_button').click(function(e){
  console.log('pointer');
  console.log('mode change 5');
  drawTool.mode=5;
  //TODO Z-indexの変更
});



//初期リスナーセット
//全般的に初期化
drawTool.setEventListener(myCanvasDrawID);
drawTool[myCanvasDrawID] = {};
drawTool[myCanvasDrawID].semiOldPointX=null;
drawTool[myCanvasDrawID].semiOldPointY=null;
drawTool[myCanvasDrawID].oldPointX=null;
drawTool[myCanvasDrawID].oldPointY=null;

});