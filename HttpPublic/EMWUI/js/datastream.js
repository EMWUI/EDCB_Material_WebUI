//BMLブラウザのサイズ指定 要改善
const playerUI = document.querySelector('#playerUI');
const setbmlBrowserSize = () => {
	var width = window.innerWidth;
	var height = width * (9/16);
	if (vid.fullscreen){
		if (window.innerHeight < width * (9/16)){
			height = window.innerHeight;
			width = height * (16/9);
		}
	}else if (vid.theater && window.innerHeight * 0.85 - 70 < width * (9/16)){
		height = window.innerHeight * 0.85 - 70;
		width = height * (16/9);
	}else if (!vid.fullscreen){
		width = playerUI.clientWidth;
		height = width * (9/16);
	}
	bmlBrowserSetVisibleSize(width,height);
}
window.addEventListener('resize', () => setbmlBrowserSize());

const oncuechangeB24Caption = e => {
  $(e.target).off('cuechange',oncuechangeB24Caption);
  createCap();
  Datacast.oncuechangeB24Caption(vid.cap, e.target.track.cues);
};

class Datacast{
  #e;
  #ctok;
  #replaceTag;
  #params;
  #danmaku;
  #api={
    jklog: 'jklog',
    comment: 'comment',
  }
  #elems={
    vcont: document.getElementById("vid-cont"),
    comm: document.getElementById("jikkyo-comm"),
    chats: document.getElementById("jikkyo-chats"),
    commInput: document.getElementById("comm"),
    commBtn: document.getElementById("commSend"),
    bcomm: document.getElementById("comment-control"),
    indicator: document.querySelector(".remote-control-indicator"),
  }
  constructor(video,danmaku,ctok,replaceTag,api){
    this.#e=video;
    this.#params=new URLSearchParams();
    if(danmaku){
      if(api)Object.assign(this.#api,api);
      this.#ctok=ctok;
      this.#replaceTag=replaceTag;
      this.#danmaku=new Danmaku(Object.assign({
        container:this.#elems.vcont,
        opacity:1,
        callback:function(){},
        error:function(msg){},
        apiBackend:{read:function(opt){opt.success([]);}},
        height:32,
        duration:5,
        paddingTop:10,
        paddingBottom:10,
        unlimited:false,
        api:{id:"noid",address:"noad",token:"noto",user:"nous",speedRate:1}
      }, danmaku));
      if(this.#elems.commInput)this.#addSendComment();
    }
  }

  get clear(){return this.#clear}
  get datacast(){return this.#datacast}
  get jikkyo(){return this.#jk}
  get toggleDatacast(){return this.#toggleDatacast}
  get toggleJikkyo(){return this.#toggleJikkyo}
  get setFast(){return this.#setFast}

  get setElemsList(){this.#setElems}


  #clear(){
    this.#jklog.clear();
    this.#psc.clear();
    this.#disableJikkyo();
    this.#disableDatacast();
  }
  #STATE={
    DISABLED:0,
    STREAM:1,
    LOG:2,
  }
  get #datacast(){
    return {
      unavailable: this.#unavailable,
      enable: ()=>this.#enableDatacast(),
      disable: ()=>this.#disableDatacast(),
    }
  }
  get #unavailable(){
    return this.#loaded&&this.#loaded!=(this.#e.initSrc||this.#e.getAttribute("src")) ? true : false
  }
  #datacastState=this.#STATE.DISABLED;
  #enableDatacast(){
    if(this.#e.initSrc)this.#dataStream.enable();
    else this.#psc.enable();
  }
  #disableDatacast(){
    if(this.#datacastState==this.#STATE.STREAM)this.#dataStream.disable();
    else this.#psc.disable();
  }
  #toggleDatacast(enabled){
    if(enabled===false||enabled===undefined&&this.#datacastState)
      this.#disableDatacast();
    else this.#enableDatacast();
    return this.#jikkyoState?true:false;
  }
  get #jk(){
    return {
      danmaku: this.#danmaku,
      show: ()=>this.#showJikkyo(),
      hide: ()=>this.#hideJikkyo(),
      enable: ()=>this.#enableJikkyo(),
      disable: ()=>this.#disableJikkyo(),
    }
  }
  #jikkyoState=this.#STATE.DISABLED;
  #enableJikkyo(){
    if(this.#e.initSrc)this.#jikkyo.enable();
    else this.#jklog.enable();
  }
  #disableJikkyo(){
    if(this.#jikkyoState==this.#STATE.STREAM)this.#jikkyo.disable();
    else this.#jklog.disable();
  }
  #showJikkyo(){
    if(!this.#jikkyoState)this.#enableJikkyo();
    this.#danmaku.show();
  }
  #hideJikkyo(){
    if(!this.#jikkyoState)this.#enableJikkyo();
    this.#danmaku.hide();
  }
  #toggleJikkyo(enabled, load){
    if(enabled===false&&!load||enabled===undefined&&this.#jikkyoState)
      this.#disableJikkyo();
    else if(!enabled)this.#hideJikkyo();
    else this.#showJikkyo();
    return this.#jikkyoState?true:false;
  }
  #setFast(fast){
    if(fast===null)this.#params.delete('fast');
    else this.#params.set('fast',fast);
    this.#openSubStream();
  }

  #fname(){
    const src=this.#e.initSrc||new URL(this.#e.getAttribute('src'), location.href);
    if(src.searchParams.has('fname'))return src.searchParams.get('fname');
    else return this.#e.getAttribute('src')||'';
  }
  #setElems(elems){
    Object.assign(this.#elems,elems);
    this.#addSendComment();
  }
  #addSendComment(){
    this.#elems.commInput.onkeydown=e=>{if(!e.isComposing&&e.keyCode!=229&&e.key=="Enter")this.#sendComment();}
    this.#elems.commBtn.onclick=()=>this.#sendComment();
  }

  #readPsiData(data,proc,startSec,ctx){
    data=new DataView(data);
    ctx=ctx||{};
    if(!ctx.pids){
      ctx.pids=[];
      ctx.dict=[];
      ctx.pos=0;
      ctx.trailerSize=0;
      ctx.timeListCount=-1;
      ctx.codeListPos=0;
      ctx.codeCount=0;
      ctx.initTime=-1;
      ctx.currTime=-1;
    }
    while(data.byteLength-ctx.pos>=ctx.trailerSize+32){
      var pos=ctx.pos+ctx.trailerSize;
      var timeListLen=data.getUint16(pos+10,true);
      var dictionaryLen=data.getUint16(pos+12,true);
      var dictionaryWindowLen=data.getUint16(pos+14,true);
      var dictionaryDataSize=data.getUint32(pos+16,true);
      var dictionaryBuffSize=data.getUint32(pos+20,true);
      var codeListLen=data.getUint32(pos+24,true);
      if(data.getUint32(pos)!=0x50737363||
        data.getUint32(pos+4)!=0x0d0a9a0a||
        dictionaryWindowLen<dictionaryLen||
        dictionaryBuffSize<dictionaryDataSize||
        dictionaryWindowLen>65536-4096){
        return null;
      }
      var chunkSize=32+timeListLen*4+dictionaryLen*2+Math.ceil(dictionaryDataSize/2)*2+codeListLen*2;
      if(data.byteLength-pos<chunkSize)break;
      var timeListPos=pos+32;
      pos+=32+timeListLen*4;
      if(ctx.timeListCount<0){
        var pids=[];
        var dict=[];
        var sectionListPos=0;
        for(var i=0;i<dictionaryLen;i++,pos+=2){
          var codeOrSize=data.getUint16(pos,true)-4096;
          if(codeOrSize>=0){
            if(codeOrSize>=ctx.pids.length||ctx.pids[codeOrSize]<0)return null;
            pids[i]=ctx.pids[codeOrSize];
            dict[i]=ctx.dict[codeOrSize];
            ctx.pids[codeOrSize]=-1;
          }else{
            pids[i]=codeOrSize;
            dict[i]=null;
            sectionListPos+=2;
          }
        }
        sectionListPos+=pos;
        for(var i=0;i<dictionaryLen;i++){
          if(pids[i]>=0)continue;
          dict[i]=new Uint8Array(data.buffer.slice(sectionListPos,sectionListPos+pids[i]+4097));
          sectionListPos+=pids[i]+4097;
          pids[i]=data.getUint16(pos,true)&0x1fff;
          pos+=2;
        }
        for(var i=dictionaryLen,j=0;i<dictionaryWindowLen;j++){
          if(j>=ctx.pids.length)return null;
          if(ctx.pids[j]<0)continue;
          pids[i]=ctx.pids[j];
          dict[i++]=ctx.dict[j];
        }
        ctx.pids=pids;
        ctx.dict=dict;
        ctx.timeListCount=0;
        pos=sectionListPos+dictionaryDataSize%2;
      }else{
        pos+=dictionaryLen*2+Math.ceil(dictionaryDataSize/2)*2;
      }
      pos+=ctx.codeListPos;
      timeListPos+=ctx.timeListCount*4;
      for(;ctx.timeListCount<timeListLen;ctx.timeListCount++,timeListPos+=4){
        var initTime=ctx.initTime;
        var currTime=ctx.currTime;
        var absTime=data.getUint32(timeListPos,true);
        if(absTime==0xffffffff){
          currTime=-1;
        }else if(absTime>=0x80000000){
          currTime=absTime&0x3fffffff;
          if(initTime<0)initTime=currTime;
        }else{
          var n=data.getUint16(timeListPos+2,true)+1;
          if(currTime>=0){
            currTime+=data.getUint16(timeListPos,true);
            var sec=((currTime+0x40000000-initTime)&0x3fffffff)/11250;
            if(sec>=(startSec||0)){
              for(;ctx.codeCount<n;ctx.codeCount++,pos+=2,ctx.codeListPos+=2){
                var code=data.getUint16(pos,true)-4096;
                if(!proc(sec,ctx.dict,code,ctx.pids[code]))return false;
              }
              ctx.codeCount=0;
            }else{
              pos+=n*2;
              ctx.codeListPos+=n*2;
            }
          }else{
            pos+=n*2;
            ctx.codeListPos+=n*2;
          }
        }
        ctx.initTime=initTime;
        ctx.currTime=currTime;
      }
      ctx.pos=pos;
      ctx.trailerSize=2+(2+chunkSize)%4;
      ctx.timeListCount=-1;
      ctx.codeListPos=0;
      ctx.currTime=-1;
    }
    var ret=data.buffer.slice(ctx.pos);
    ctx.pos=0;
    return ret;
  }
  #progressPsiDataChatMixedStream(readCount,response,ctx){
    ctx=ctx||{};
    if(!ctx.ctx){
      ctx.ctx={};
      ctx.atobRemain="";
      ctx.psiData=new Uint8Array(0);
    }
    while(readCount<response.length){
      var i=response.indexOf("<",readCount);
      if(i==readCount){
        i=response.indexOf("\n",readCount);
        if(i<0)break;
        this.#jikkyo.stream(response.substring(readCount,i));
        readCount=i+1;
      }else{
        i=i<0?response.length:i;
        var n=Math.floor((i-readCount+ctx.atobRemain.length)/4)*4;
        if(n){
          var addData=atob(ctx.atobRemain+response.substring(readCount,readCount+n-ctx.atobRemain.length));
          ctx.atobRemain=response.substring(readCount+n-ctx.atobRemain.length,i);
          var concatData=new Uint8Array(ctx.psiData.length+addData.length);
          for(var j=0;j<ctx.psiData.length;j++)concatData[j]=ctx.psiData[j];
          for(var j=0;j<addData.length;j++)concatData[ctx.psiData.length+j]=addData.charCodeAt(j);
          ctx.psiData=this.#readPsiData(concatData.buffer,(sec,dict,code,pid)=>{
            this.#dataStream.stream(pid,dict,code,Math.floor(sec*90000));
            return true;
          },0,ctx.ctx);
          if(ctx.psiData)ctx.psiData=new Uint8Array(ctx.psiData);
        }else{
          atobRemain+=response.substring(readCount,i);
        }
        readCount=i;
      }
    }
    return readCount;
  }
  static decodeB24CaptionFromCueText(text,work){
    work=work||[];
    text=text.replace(/\r?\n/g,'');
    var re=/<v b24caption[0-8]>(.*?)<\/v>/g;
    var src,ret=null;
    while((src=re.exec(text))!==null){
      src=src[1].replace(/<.*?>/g,'').replace(/&(?:amp|lt|gt|quot|apos);/g,function(m){
        return m=='&amp;'?'&':m=='&lt;'?'<':m=='&gt;'?'>':m=='&quot;'?'"':'\'';
      });
      var brace=[],wl=0,hi=0;
      for(var i=0;i<src.length;){
        if(src[i]=='%'){
          if((++i)+2>src.length)return null;
          var c=src[i++];
          var d=src[i++];
          if(c=='^'){
            work[wl++]=0xc2;
            work[wl++]=d.charCodeAt(0)+64;
          }else if(c=='='){
            if(d=='{'){
              work[wl++]=0;
              work[wl++]=0;
              work[wl++]=0;
              brace.push(wl);
            }else if(d=='}'&&brace.length>0){
              var pos=brace.pop();
              work[pos-3]=wl-pos>>16&255;
              work[pos-2]=wl-pos>>8&255;
              work[pos-1]=wl-pos&255;
            }else return null;
          }else if(c=='+'){
            if(d=='{'){
              var pos=src.indexOf('%+}',i);
              if(pos<0)return null;
              try{
                var buf=atob(src.substring(i,pos));
                for(var j=0;j<buf.length;j++)work[wl++]=buf.charCodeAt(j);
              }catch(e){return null;}
              i=pos+3;
            }else return null;
          }else{
            var x=c.charCodeAt(0);
            var y=d.charCodeAt(0);
            work[wl++]=(x>=97?x-87:x>=65?x-55:x-48)<<4|(y>=97?y-87:y>=65?y-55:y-48);
          }
        }else{
          var x=src.charCodeAt(i++);
          if(x<0x80){
            work[wl++]=x;
          }else if(x<0x800){
            work[wl++]=0xc0|x>>6;
            work[wl++]=0x80|x&63;
          }else if(0xd800<=x&&x<=0xdbff){
            hi=x;
          }else if(0xdc00<=x&&x<=0xdfff){
            x=0x10000+((hi&0x3ff)<<10)+(x&0x3ff);
            work[wl++]=0xf0|x>>18;
            work[wl++]=0x80|x>>12&63;
            work[wl++]=0x80|x>>6&63;
            work[wl++]=0x80|x&63;
          }else{
            work[wl++]=0xe0|x>>12;
            work[wl++]=0x80|x>>6&63;
            work[wl++]=0x80|x&63;
          }
        }
      }
      if(brace.length>0)return null;
      if(3<=wl&&wl<=65520){
        var r=new Uint8Array(wl+7);
        r[0]=0x80;
        r[1]=0xff;
        r[2]=0xf0;
        r[3]=work[0];
        r[4]=work[1];
        r[5]=work[2];
        r[6]=wl-3>>8&255;
        r[7]=wl-3&255;
        for(var i=3;i<wl;i++)r[i+5]=work[i];
        ret=ret||[];
        ret.push(r);
      }
    }
    return ret;
  }
  #unescapeHtml(s){
    return s.replace(/&(?:amp|lt|gt|quot|apos|#10|#13);/g,function(m){
      return m[1]=="l"?"<":m[1]=="g"?">":m[1]=="q"?'"':m[3]=="p"?"&":m[3]=="o"?"'":m[3]=="0"?"\n":"\r";
    });
  }
  #chatTagColors={
    red:"#ff0000",
    pink:"#ff8080",
    orange:"#ffc000",
    yellow:"#ffff00",
    green:"#00ff00",
    cyan:"#00ffff",
    blue:"#0000ff",
    purple:"#c000ff",
    black:"#000000",
    white2:"#cccc99",
    niconicowhite:"#cccc99",
    red2:"#cc0033",
    truered:"#cc0033",
    pink2:"#ff33cc",
    orange2:"#ff6600",
    passionorange:"#ff6600",
    yellow2:"#999900",
    madyellow:"#999900",
    green2:"#00cc66",
    elementalgreen:"#00cc66",
    cyan2:"#00cccc",
    blue2:"#3399ff",
    marineblue:"#3399ff",
    purple2:"#6633cc",
    nobleviolet:"#6633cc",
    black2:"#666666"
  }
  #getChatTagColorRe=new RegExp("(?:^| )(#[0-9A-Fa-f]{6}|"+Object.keys(this.#chatTagColors).join("|")+")(?: |$)");
  #parseChatTag(tag){
    var m=tag.match(/^<chat(?= )(.*)>(.*?)<\/chat>$/);
    if(m){
      var a=m[1];
      var r={text:this.#unescapeHtml(m[2])};
      m=a.match(/ date="(\d+)"/);
      if(m){
        r.date=parseInt(m[1],10);
        if(r.date>=0){
          m=a.match(/ mail="(.*?)"/);
          r.mail=m?m[1]:"";
          m=r.mail.match(/(?:^| )(ue|shita)(?: |$)/);
          r.type=!m?"right":m[1]=="ue"?"top":"bottom";
          m=r.mail.match(this.#getChatTagColorRe);
          r.colorcode=!m?"#ffffff":m[1][0]=="#"?m[1]:this.#chatTagColors[m[1]];
          r.color=parseInt(r.colorcode.substring(1),16);
          r.yourpost=/ yourpost="1"/.test(a);
          r.refuge=/ nx_jikkyo="1"| x_refuge="1"/.test(a);
          m=a.match(/ user_id="([0-9A-Za-z_:-]*)"/);
          r.user=m?m[1]:"";
          return r;
        }
      }
    }
    return null;
  }
  #readJikkyoLog(text,proc,startSec,ctx){
    ctx=ctx||{};
    if(ctx.pos===undefined){
      ctx.pos=0;
      ctx.currSec=-1;
    }
    for(;;){
      var i=text.indexOf("\n",ctx.pos);
      if(i<0)break;
      var tag=text.substring(ctx.pos,i);
      var sec=ctx.currSec;
      if(/^<!-- J=/.test(tag))sec++;
      if(sec>=(startSec||0)&&!proc(sec,tag))break;
      ctx.pos=i+1;
      ctx.currSec=sec;
    }
  }

  #commHide;
  #checkScrollID;
  #fragment;
  #scatter=[];
  #scatterInterval=200;
  #closed;
  #jkID="?";
  #jikkyo={
    disable:()=>{
      this.#jikkyoState=this.#STATE.DISABLED;
      this.#params.delete('jikkyo');
      clearInterval(this.#checkScrollID);
      this.#checkScrollID=0;
      this.#openSubStream();
      if(this.#elems.bcomm){
        this.#elems.bcomm.style.display="none";
        while (this.#elems.chats.firstChild) this.#elems.chats.removeChild(this.#elems.chats.firstChild);
      }
    },
    enable:()=>{
      this.#jikkyoState=this.#STATE.STREAM;
      this.#params.set('jikkyo', 1);
      this.#fragment=null;
      this.#scatter=[];
      this.#scatterInterval=200;
      this.#closed=false;
      this.#jkID="?";
      if(this.#elems.bcomm){
        this.#elems.bcomm.style.display=null;
        this.#chatsScroller();
      }
      this.#openSubStream();
    },
    error:(status,readCount)=>{
      this.#addMessage("Error! ("+status+"|"+readCount+"Bytes)");
    },
    stream:(tag)=>{
      if(/^<chat /.test(tag)){
        var c=this.#parseChatTag(this.#replaceTag(tag));
        if(c){
          if(c.yourpost)c.border="2px solid #c00";
          this.#scatter.push(c);
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
          if(this.#closed){
            div.className="closed";
            this.#closed=false;
          }
          div.appendChild(dateSpan);
          div.appendChild(userSpan);
          div.appendChild(span);
          if(!this.#fragment)this.#fragment=document.createDocumentFragment();
          this.#fragment.appendChild(div);
          this.count++;
        }
        return;
      }else if(/^<chat_result /.test(tag)){
        var m=tag.match(/^[^>]*? status="(\d+)"/);
        if(m&&m[1]!="0")this.#addMessage("Error! (chat_result="+m[1]+")");
        return;
      }else if(/^<x_room /.test(tag)){
        var m=tag.match(/^[^>]*? nickname="(.*?)"/);
        var nickname=m?m[1]:"";
        var loggedIn=/^[^>]*? is_logged_in="1"/.test(tag);
        var refuge=/^[^>]*? refuge="1"/.test(tag);
        this.#addMessage("Connected to "+(refuge?"refuge":"nicovideo")+" jk"+this.#jkID+" ("+(loggedIn?"login=":"")+nickname+")");
        return;
      }else if(/^<x_disconnect /.test(tag)){
        var m=tag.match(/^[^>]*? status="(\d+)"/);
        var refuge=/^[^>]*? refuge="1"/.test(tag);
        if(m)this.#addMessage("Disconnected from "+(refuge?"refuge":"nicovideo")+" (status="+m[1]+")");
        return;
      }else if(/^<!-- M=/.test(tag)){
        if(tag.substring(7,22)=="Closed logfile.")this.#closed=true;
        else if(tag.substring(7,31)!="Started reading logfile:")this.#addMessage(tag.substring(7,tag.length-4));
        return;
      }else if(!/^<!-- J=/.test(tag)){
        return;
      }
      this.#jkID=tag.match(/^<!-- J=(\d*)/)[1]||"?";
      if(tag.indexOf(";T=")<0)this.#scatterInterval=90;
      else this.#scatterInterval=Math.min(Math.max(this.#scatterInterval+(this.#scatter.length>0?-10:10),100),200);
      setTimeout(()=>{
        var scroll=Math.abs(this.#elems.chats.scrollTop+this.#elems.chats.clientHeight-this.#elems.chats.scrollHeight)<this.#elems.chats.clientHeight/4;
        if(this.#fragment){
          this.#elems.chats.appendChild(this.#fragment);
          this.#fragment=null;
        }
        if(this.#scatterInterval<100){
          this.#danmaku.draw(this.#scatter);
          this.#scatter.splice(0);
        }
        var n=Math.ceil(this.#scatter.length/5);
        if(n>0){
          for(var i=0;i<5;i++){
            setTimeout(()=>{
              if(this.#scatter.length>0){
                this.#danmaku.draw(this.#scatter.slice(0,n));
                this.#scatter.splice(0,n);
              }
            },this.#scatterInterval*i);
          }
        }
        if(this.#commHide||scroll){
          while(this.#elems.chats.childElementCount>1000){
            this.#elems.chats.removeChild(this.#elems.chats.firstElementChild);
          }
        }
        if(scroll)this.#elems.chats.scrollTop=this.#elems.chats.scrollHeight;
      },0);
    },
  }
  #chatsScroller(){
    clearInterval(this.#checkScrollID);
    this.#commHide=true;
    this.#checkScrollID=setInterval(()=>{
      if(getComputedStyle(this.#elems.comm).display=="none"){
        this.#commHide=true;
      }else{
        var scroll=Math.abs(this.#elems.chats.scrollTop+this.#elems.chats.clientHeight-this.#elems.chats.scrollHeight)<this.#elems.chats.clientHeight/4;
        if(this.#commHide||scroll)this.#elems.chats.scrollTop=this.#elems.chats.scrollHeight;
        this.#commHide=false;
      }
    },1000);
  }
  #addMessage(text){
    var b=document.createElement("strong");
    b.innerText=text;
    var div=document.createElement("div");
    div.appendChild(b);
    this.#elems.chats.appendChild(div);
  }

  static oncuechangeB24Caption(cap,cues){
    var work=[];
    var dataList=[];
    for(var i=0;i<cues.length;i++){
      var ret=this.decodeB24CaptionFromCueText(cues[i].text,work);
      if(!ret){return;}
      for(var j=0;j<ret.length;j++){dataList.push({pts:cues[i].startTime,pes:ret[j]});}
    }
    dataList.reverse();
    (function pushCap(){
      for(var i=0;i<100;i++){
        var data=dataList.pop();
        if(!data){return;}
        cap.pushRawData(data.pts,data.pes);
      }
      setTimeout(pushCap,0);
    })();
  }

  #psiData;
  #psc={
    startRead:()=>{
      clearTimeout(this.#psc.readTimer);
      var startSec=this.#e.currentTime;
      this.#psc.videoLastSec=startSec;
      var ctx={};
      const read=()=>{
        var videoSec=this.#e.currentTime;
        if(videoSec<this.#psc.videoLastSec||this.#psc.videoLastSec+10<videoSec){
          this.#psc.startRead();
          return;
        }
        this.#psc.videoLastSec=videoSec;
        if(this.#psiData&&this.#readPsiData(this.#psiData,(sec,dict,code,pid)=>{
            if(!this.#loaded)this.#loaded=this.#e.getAttribute("src");
            dict[code]=bmlBrowserPlayTSSection(pid,dict[code],Math.floor(sec*90000))||dict[code];
            return sec<videoSec;
          },startSec,ctx)!==false){
          this.#psc.startRead();
          return;
        }
        this.#psc.readTimer=setTimeout(()=>read(),500);
      }
      this.#psc.readTimer=setTimeout(()=>read(),500);
    },
    clear:()=>{
      if(this.#psc.xhr){
        this.#psc.xhr.abort();
        this.#psc.xhr=null;
      }
      this.psiData=null;
      this.#psc.videoLastSec=0;
    },
    disable:()=>{
      this.#datacastState=this.#STATE.DISABLED;
      clearTimeout(this.#psc.readTimer);
      this.#psc.readTimer=0;
      bmlBrowserSetInvisible(true);
    },
    enable:()=>{
      if(!this.#e.getAttribute("src")||this.#e.getAttribute("src").startsWith('blob:'))return;
      if(this.#loaded&&this.#loaded!=this.#e.getAttribute("src")){
        this.#e.dispatchEvent(new Event('disabledDatacast'));
        return
      }
      this.#datacastState=this.#STATE.LOG;
      this.#psc.startRead();
      bmlBrowserSetVisibleSize(this.#elems.vcont.clientWidth,this.#elems.vcont.clientHeight);
      bmlBrowserSetInvisible(false);
      if(this.#psc.xhr)return;
      this.#psc.xhr=new XMLHttpRequest();
      this.#psc.xhr.open("GET",this.#e.getAttribute("src").replace(/\.[0-9A-Za-z]+$/,"")+".psc");
      this.#psc.xhr.responseType="arraybuffer";
      this.#psc.xhr.overrideMimeType("application/octet-stream");
      this.#psc.xhr.onloadend=()=>{
        if(!this.#psiData){
          if(this.#elems.indicator)this.#elems.indicator.innerText="Error! ("+this.#psc.xhr.status+")";
        }
      };
      this.#psc.xhr.onload=()=>{
        if(this.#psc.xhr.status!=200||!this.#psc.xhr.response)return;
        this.#psiData=this.#psc.xhr.response;
      };
      this.#psc.xhr.send();
      if(this.#elems.indicator)this.#elems.indicator.innerText="接続中...";
    },
  }

  #logText;
  #jklog={
    startRead:()=>{
      clearTimeout(this.#jklog.readTimer);
      var startSec=this.#e.currentTime+this.#jklog.offsetSec;
      this.#jklog.videoLastSec=startSec;
      var ctx={};
      const read=()=>{
        var videoSec=this.#e.currentTime+this.#jklog.offsetSec;
        if(videoSec<this.#jklog.videoLastSec||this.#jklog.videoLastSec+10<videoSec){
          this.#jklog.startRead();
          return;
        }
        this.#jklog.videoLastSec=videoSec;
        if(this.#logText){
          this.#readJikkyoLog(this.#logText,(sec,tag)=>{
            this.#jklog.stream(tag);
            return sec<videoSec;
          },startSec,ctx);
        }
        this.#jklog.readTimer=setTimeout(()=>read(),200);
      }
      this.#jklog.readTimer=setTimeout(()=>read(),200);
    },
    clear:()=>{
      if(this.#jklog.xhr){
        this.#jklog.xhr.abort();
        this.#jklog.xhr=null;
      }
      this.#jklog.videoLastSec=0;
      this.#logText=null;
      this.#fragment=null;
      this.#scatter=[];
      this.#scatterInterval=200;
      this.#closed=false;
      this.#jkID="?";
    },
    disable:()=>{
      this.#jikkyoState=this.#STATE.DISABLED;
      clearTimeout(this.#jklog.readTimer);
      this.#jklog.readTimer=0;
    },
    enable:()=>{
      if(!this.#e.getAttribute("src")||this.#e.getAttribute("src").startsWith('blob:'))return;
      this.#jikkyoState=this.#STATE.LOG;
      this.#chatsScroller();
      this.#jklog.startRead();
      if(this.#jklog.xhr)return;
      this.#jklog.xhr=new XMLHttpRequest();
      this.#jklog.xhr.open("GET",`${this.#api.jklog}?fname=${this.#fname().replace(/^(?:\.\.\/)+/,"")}`);
      this.#jklog.xhr.onloadend=()=>{
        if(!this.#logText){
          this.#jikkyo.error(this.#jklog.xhr.status,0);
        }
      };
      this.#jklog.xhr.onload=()=>{
        if(this.#jklog.xhr.status!=200||!this.#jklog.xhr.response)return;
        this.#logText=this.#jklog.xhr.response;
      };
      this.#jklog.xhr.send();
    }
  }
  
  #sendComment(){
    if(!this.#elems.commInput.value) return;

    if(/^@/.test(this.#elems.commInput.value)){
      if(this.#elems.commInput.value=="@sw"){
        this.#elems.commInput.className=this.#elems.commInput.className=="refuge"?"nico":"refuge";
      }
      return;
    }
    var xhr=new XMLHttpRequest();
    xhr.open("POST", this.#api.comment);
    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    xhr.onloadend=()=>{
      if(xhr.status!=200){
        this.#addMessage("Post error! ("+xhr.status+")");
      }
    };
    const params=new URLSearchParams(this.#e.initSrc.search);
    params.set('ctok',this.#ctok);
    if(this.#elems.commInput.classList.contains("refuge"))params.set("refuge", 1);
    params.set('comm',this.#elems.commInput.value);
    xhr.send(params);
    this.#elems.commInput.dispatchEvent(new Event('sentComment'));
    this.#elems.commInput.value="";
  }

  #reopen;
  #xhr;
  #openSubStream(){
    if(this.#reopen)return;
    if(this.#xhr){
      this.#xhr.abort();
      this.#xhr=null;
      if(this.#params.has('psidata')||this.#params.has('jikkyo')){
        this.#reopen=true;
        setTimeout(()=>{this.#reopen=false;this.#openSubStream();},5000);
      }
      return;
    }
    if(!this.#params.has('psidata')&&!this.#params.has('jikkyo'))return;
    var readCount=0;
    var ctx={};
    this.#xhr=new XMLHttpRequest();
    this.#xhr.open("GET",`${this.#e.initSrc}&${this.#e.params.toString()}&${this.#params.toString()}&ofssec=${(this.#e.ofssec || 0)+Math.floor(this.#e.currentTime * (this.#e.fast || 1))}`);
    this.#xhr.onloadend=()=>{
      if(this.#xhr&&(readCount==0||this.#xhr.status!=0)){
        if(this.#params.has('psidata'))this.#dataStream.error(this.#xhr.status,readCount);
        if(this.#params.has('jikkyo'))this.#jikkyo.error(this.#xhr.status,readCount);
      }
      this.#xhr=null;
    };
    this.#xhr.onprogress=()=>{
      if(this.#xhr&&this.#xhr.status==200&&this.#xhr.response){
        readCount=this.#progressPsiDataChatMixedStream(readCount,this.#xhr.response,ctx);
      }
    };
    this.#xhr.send();
  }

  #loaded;
  #dataStream={
    error:(status,readCount)=>{
      if(this.#elems.indicator)this.#elems.indicator.innerText="Error! ("+status+"|"+readCount+"Bytes)";
    },
    stream:(pid,dict,code,pcr)=>{
      if(!this.#loaded)this.#loaded=this.#e.initSrc.href;
      dict[code]=bmlBrowserPlayTSSection(pid,dict[code],pcr)||dict[code];
    },
    disable:()=>{
      this.#datacastState=this.#STATE.DISABLED;
      this.#params.delete('psidata');
      this.#openSubStream();
      bmlBrowserSetInvisible(true);
    },
    enable:()=>{
      if(this.#loaded&&this.#loaded!=this.#e.initSrc.href){
        this.#e.dispatchEvent(new Event('disabledDatacast'));
        return
      }
      this.#datacastState=this.#STATE.STREAM;
      this.#params.set('psidata', 1);
      bmlBrowserSetVisibleSize(this.#elems.vcont.clientWidth,this.#elems.vcont.clientHeight);
      bmlBrowserSetInvisible(false);
      this.#openSubStream();
      if(this.#elems.indicator)this.#elems.indicator.innerText="接続中...";
    }
  }
}
