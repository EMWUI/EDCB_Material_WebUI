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
window.addEventListener('resize', setbmlBrowserSize());




//コメント送信
var setSendComment;
(function(){
  var bcomm=document.querySelector("#comment-control");
  var commInput=document.querySelector("#comm");
  if (commInput){
    var commSend=null;
    commInput.onkeydown=function(e){
      if(!e.isComposing&&e.keyCode!=229&&e.key=="Enter"){
        if(commSend&&commInput.value)commSend(commInput.value);
        commInput.value="";
        bcomm.classList.remove("is-dirty");
      }
    };
    var btn=document.querySelector("#commSend");
    btn.onclick=function(){
      if(commSend&&commInput.value)commSend(commInput.value);
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
      container:document.getElementById("playerUI"),
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
  setSendComment(function(value){
    var xhr=new XMLHttpRequest();
    xhr.open("POST", root +"api/comment");
    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    xhr.onloadend=function(){
      if(xhr.status!=200){
        addMessage("Post error! ("+xhr.status+")");
      }
    };
    var d=document.querySelector(".is_cast").dataset;
    xhr.send(`ctok=${ctokC}&n=0&id=${d.onid}-${d.tsid}-${d.sid}&comm=`+encodeURIComponent(value).replace(/%20/g,"+"));
  });
  var commHide=true;
  setInterval(function(){
    if(getComputedStyle(comm).display=="none"){
      commHide=true;
    }else{
      var scroll=Math.abs(comm.scrollTop+comm.clientHeight-comm.scrollHeight)<comm.clientHeight/4;
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
        var b=document.createElement(c.yourpost?"strong":"b");
        b.innerText=String(100+(Math.floor(c.date/3600)+9)%24).substring(1)+":"+
                    String(100+Math.floor(c.date/60)%60).substring(1)+":"+
                    String(100+c.date%60).substring(1)+" ("+c.user.substring(0,3)+") ";
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
        div.appendChild(b);
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
