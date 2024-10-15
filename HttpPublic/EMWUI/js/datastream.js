const remocon = document.querySelector('#remote');
const indicator = document.querySelector(".remote-control-indicator")
//BMLブラウザのサイズ指定 要改善
const playerUI = document.querySelector('#playerUI');
const setbmlBrowserSize = () => {
	var width = window.innerWidth;
	var height = width * (9/16);
	if (fullscreen){
		if (window.innerHeight < width * (9/16)){
			height = window.innerHeight;
			width = height * (16/9);
		}
	}else if (theater && window.innerHeight * 0.85 - 70 < width * (9/16)){
		height = window.innerHeight * 0.85 - 70;
		width = height * (16/9);
	}else if (!fullscreen){
		width = playerUI.clientWidth;
		height = width * (9/16);
	}
	bmlBrowserSetVisibleSize(width,height);
}
window.addEventListener('resize', () => setbmlBrowserSize());




//コメント送信
var setSendComment;
(function(){
  var bcomm=document.querySelector("#comment-control");
  var commInput=document.querySelector("#comm");
  if (commInput){
    var commSend=null;
    commInput.onkeydown=function(e){
      if(!e.isComposing&&e.keyCode!=229&&e.key=="Enter"){
        if(commSend&&commInput.value)commSend(commInput);
        commInput.value="";
        bcomm.classList.remove("is-dirty");
      }
    };
    var btn=document.querySelector("#commSend");
    btn.onclick=function(){
      if(commSend&&commInput.value)commSend(commInput);
        commInput.value="";
        bcomm.classList.remove("is-dirty");
    };
  }
  setSendComment=function(f){
    if (bcomm) bcomm.style.display=f?null:"none";
    commSend=f;
  };
})();



//実況
var danmaku=null;
var onJikkyoStream=null;
var onJikkyoStreamError=null;
toggleJikkyo=function(enabled){
  if(enabled===false||enabled===undefined&&onJikkyoStream){
    onJikkyoStream=null;
    onJikkyoStreamError=null;
    openSubStream();
    setSendComment(null);
    $('#jk-comm').empty();
    return;
  }
  if (!VideoSrc) return;
  var comm=document.getElementById("jk-comm");
  if(!danmaku){
    danmaku=new Danmaku({
      container:document.getElementById("danmaku-container"),
      opacity:1,
      callback:function(){},
      error:function(msg){},
      apiBackend:{read:function(opt){opt.success([]);}},
      height:jk_comment_height,
      duration:jk_comment_durtion,
      paddingTop:10,
      paddingBottom:10,
      unlimited:false,
      api:{id:"noid",address:"noad",token:"noto",user:"nous",speedRate:1}
    });
  }
  function addMessage(text){
    var b=document.createElement("strong");
    b.innerText=text;
    var div=document.createElement("div");
    div.appendChild(b);
    comm.appendChild(div);
  }
  setSendComment(function(commInput){
    if(/^@/.test(commInput.value)){
      if(commInput.value=="@sw"){
        commInput.className=commInput.className=="refuge"?"nico":"refuge";
      }
      return;
    }
    var xhr=new XMLHttpRequest();
    xhr.open("POST", `${ROOT}api/comment`);
    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    xhr.onloadend=function(){
      if(xhr.status!=200){
        addMessage("Post error! ("+xhr.status+")");
      }
    };
    var d=document.querySelector(".is_cast").dataset;
    var postCommentQuery=`ctok=${ctokC}&n=0&id=${d.onid}-${d.tsid}-${d.sid}`;
    xhr.send(postCommentQuery+(commInput.className=="refuge"?"&refuge=1":"")+"&comm="+encodeURIComponent(commInput.value).replace(/%20/g,"+"));
  });
  var commHide=true;
  setInterval(function(){
    if(getComputedStyle(comm).display=="none"){
      commHide=true;
    }else{
      var scroll=Math.abs(comm.scrollTop+comm.clientHeight-comm.scrollHeight)<comm.clientHeight/4;
      //comm.style.height=vid.clientHeight+"px";
      if(commHide||scroll)comm.scrollTop=comm.scrollHeight;
      commHide=false;
    }
  },1000);
  var fragment=null;
  var scatter=[];
  var scatterInterval=200;
  var closed=false;
  onJikkyoStream=function(tag){
      if(/^<chat /.test(tag)){
      var c=parseChatTag(replaceTag(tag));
      if(c){
        if(c.yourpost)c.border="2px solid #c00";
        scatter.push(c);
        var dateSpan=document.createElement("span");
        dateSpan.innerText=String(100+(Math.floor(c.date/3600)+9)%24).substring(1)+":"+
                    String(100+Math.floor(c.date/60)%60).substring(1)+":"+
                    String(100+c.date%60).substring(1);
        var userSpan=document.createElement(c.yourpost?"b":"span");
        userSpan.innerText="("+c.user.substring(c.user.substring(0,2)=="a:"?2:0).substring(0,3)+")";
        userSpan.className=c.refuge?"refuge":"nico";
        var span=document.createElement("span");
        span.innerText=c.text;
        if(c.color!=0xffffff){
          span.style.backgroundColor=c.colorcode;
          span.className=(c.color>>16)*3+(c.color>>8)%256*6+c.color%256<255?"dark":"light";
        }
        var div=document.createElement("div");
        if(closed){
          div.className="closed";
          closed=false;
        }
        div.appendChild(dateSpan);
        div.appendChild(userSpan);
        div.appendChild(span);
        if(!fragment)fragment=document.createDocumentFragment();
        fragment.appendChild(div);
      }
      return;
      }else if(/^<chat_result /.test(tag)){
      var m=tag.match(/^[^>]*? status="(\d+)"/);
      if(m&&m[1]!="0")addMessage("Error! (chat_result="+m[1]+")");
      return;
      }else if(/^<!-- M=/.test(tag)){
      if(tag.substring(7,22)=="Closed logfile.")closed=true;
      else if(tag.substring(7,31)!="Started reading logfile:")addMessage(tag.substring(7,tag.length-4));
      return;
      }else if(!/^<!-- J=/.test(tag)){
      return;
    }
    if(tag.indexOf(";T=")<0)scatterInterval=90;
    else scatterInterval=Math.min(Math.max(scatterInterval+(scatter.length>0?-10:10),100),200);
    setTimeout(function(){
      var scroll=Math.abs(comm.scrollTop+comm.clientHeight-comm.scrollHeight)<comm.clientHeight/4;
      if(fragment){
        comm.appendChild(fragment);
        fragment=null;
      }
      if(scatterInterval<100){
        danmaku.draw(scatter);
        scatter.splice(0);
      }
      var n=Math.ceil(scatter.length/5);
      if(n>0){
        for(var i=0;i<5;i++){
          setTimeout(function(){
            if(scatter.length>0){
              danmaku.draw(scatter.slice(0,n));
              scatter.splice(0,n);
            }
          },scatterInterval*i);
        }
      }
      if(commHide||scroll){
        while(comm.childElementCount>1000){
          comm.removeChild(comm.firstElementChild);
        }
      }
      if(scroll)comm.scrollTop=comm.scrollHeight;
    },0);
  };
  onJikkyoStreamError=function(status,readCount){
    addMessage("Error! ("+status+"|"+readCount+"Bytes)");
  };
  openSubStream();
  addMessage('接続開始');
};

var vidMeta=document.getElementById("vid-meta");
loadVtt=function(){
  var work=[];
  var dataList=[];
  var cues=vidMeta.track.cues;
  for(var i=0;i<cues.length;i++){
    var ret=decodeB24CaptionFromCueText(cues[i].text,work);
    if(!ret){return;}
    for(var j=0;j<ret.length;j++){dataList.push({pts:cues[i].startTime,pes:ret[j]});}
  }
  creatCap();
  if(!$subtitles.hasClass('checked')){cap.hide();}
  dataList.reverse();
  (function pushCap(){
    for(var i=0;i<100;i++){
      var data=dataList.pop();
      if(!data){return;}
      cap.pushRawData(data.pts,data.pes);
    }
    setTimeout(pushCap,0);
  })();
};

var cbDatacast;
(function(){
  var psiData=null;
  var readTimer=null;
  var videoLastSec=0;
  function startRead(){
    clearTimeout(readTimer);
    var startSec=vid.currentTime;
    videoLastSec=startSec;
    var ctx={};
    function read(){
      var videoSec=vid.currentTime;
      if(videoSec<videoLastSec||videoLastSec+10<videoSec){
        startRead();
        return;
      }
      videoLastSec=videoSec;
      if(psiData&&readPsiData(psiData,function(sec,dict,code,pid){
          dict[code]=bmlBrowserPlayTSSection(pid,dict[code],Math.floor(sec*90000))||dict[code];
          return sec<videoSec;
        },startSec,ctx)!==false){
        startRead();
        return;
      }
      readTimer=setTimeout(read,500);
    }
    readTimer=setTimeout(read,500);
  }
  var xhr=null;
  cbDatacast=function(){
    if(!$remote_control.hasClass('disabled')){
      clearTimeout(readTimer);
      readTimer=null;
      bmlBrowserSetInvisible(true);
      return;
    }
    startRead();
    setbmlBrowserSize();
    bmlBrowserSetInvisible(false);
    if(xhr)return;
    xhr=new XMLHttpRequest();
    xhr.open("GET",vid.getAttribute("src").replace(/\.[0-9A-Za-z]+$/,"")+".psc");
    xhr.responseType="arraybuffer";
    xhr.overrideMimeType("application/octet-stream");
    xhr.onloadend=function(){
      if(!psiData){
        indicator.innerText="Error! ("+xhr.status+")";
      }
    };
    xhr.onload=function(){
      if(xhr.status!=200||!xhr.response)return;
      psiData=xhr.response;
    };
    xhr.send();
    indicator.innerText="接続中...";
    remocon.classList.add('done');
  };
})();

var Jikkyolog;    
(function(){
  var logText=null;
  var readTimer=null;
  var videoLastSec=0;
  function startRead(){
    clearTimeout(readTimer);
    var startSec=vid.currentTime;
    videoLastSec=startSec;
    var ctx={};
    function read(){
      var videoSec=vid.currentTime;
      if(videoSec<videoLastSec||videoLastSec+10<videoSec){
        startRead();
        return;
      }
      videoLastSec=videoSec;
      if(logText){
        readJikkyoLog(logText,function(sec,tag){
          if(onJikkyoStream)onJikkyoStream(tag);
          return sec<videoSec;
        },startSec,ctx);
      }
      readTimer=setTimeout(read,200);
    }
    readTimer=setTimeout(read,200);
  }
  var xhr=null;
  Jikkyolog=function(){
    if($danmaku.hasClass('checked')){
      toggleJikkyo(false);
      clearTimeout(readTimer);
      readTimer=null;
      return;
    }
    toggleJikkyo(true);
    startRead();
    if(xhr)return;
    xhr=new XMLHttpRequest();
    xhr.open("GET",`${ROOT}api/jklog?fname=${$('.is_cast').data('path').replace(/^(?:\.\.\/)+/,"")}`);
    xhr.onloadend=function(){
      if(!logText){
        if(onJikkyoStreamError)onJikkyoStreamError(xhr.status,0);
      }
    };
    xhr.onload=function(){
      if(xhr.status!=200||!xhr.response)return;
      logText=xhr.response;
    };
    xhr.send();
  }
})();

var openSubStream;
var onDataStream=null;
var onDataStreamError=null;
(function(){
  var reopen=false;
  var xhr=null;
  openSubStream=function(){
    if(reopen)return;
    if(xhr){
      xhr.abort();
      xhr=null;
      if(onDataStream||onJikkyoStream){
        reopen=true;
        setTimeout(function(){reopen=false;openSubStream();},5000);
      }
      return;
    }
    if(!onDataStream&&!onJikkyoStream)return;
    var readCount=0;
    var ctx={};
    xhr=new XMLHttpRequest();
    xhr.open("GET",VideoSrc+(onDataStream?"&psidata=1":"")+
             (onJikkyoStream?"&jikkyo=1":"")+"&ofssec="+(($('.is_cast').data('ofssec') || 0)+Math.floor(vid.currentTime)));
    xhr.onloadend=function(){
      if(xhr&&(readCount==0||xhr.status!=0)){
        if(onDataStreamError)onDataStreamError(xhr.status,readCount);
        if(onJikkyoStreamError)onJikkyoStreamError(xhr.status,readCount);
      }
      xhr=null;
    };
    xhr.onprogress=function(){
      if(xhr&&xhr.status==200&&xhr.response){
        readCount=progressPsiDataChatMixedStream(readCount,xhr.response,onDataStream,onJikkyoStream,ctx);
      }
    };
    xhr.send();
  };
})();

//データ放送
toggleDataStream=function(enabled){
  if (enabled===false||enabled===undefined&&onDataStream){
    onDataStream=null;
    onDataStreamError=null;
    openSubStream();
    bmlBrowserSetInvisible(true);
    return;
  }
  if (!VideoSrc) return;
  setbmlBrowserSize();
  bmlBrowserSetInvisible(false);
  onDataStream=function(pid,dict,code,pcr){
    dict[code]=bmlBrowserPlayTSSection(pid,dict[code],pcr)||dict[code];
  };
  onDataStreamError=function(status,readCount){
    indicator.innerText="Error! ("+status+"|"+readCount+"Bytes)";
  };
  openSubStream();
  indicator.innerText="接続中...";
  remocon.classList.add('done');
}
