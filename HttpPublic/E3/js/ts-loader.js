/*
Legacy WebUI script.jsをベースに作成。

以下必須ライブラリ
ts-live
【TS-Live!】ts-live.js https://github.com/xtne6f/ts-live

HlsLoader
【HLS.js】hls.min.js https://github.com/video-dev/hls.js

TsThumb
【TS-Live!】ts-live-misc.js https://github.com/xtne6f/ts-live

Datacast
【DPlayer】danmaku.js https://github.com/DIYgod/DPlayer
【web-bml】web_bml_play_ts.js https://github.com/xtne6f/web-bml
*/

const tsliveMixin = (Base = class {}) => class extends Base{
	#e;
	#error;
	#currentTime;
	#playbackRate;
	#paused;
	#muted;
	#volume;
	#detelecine;
	#deinterlace;
	#src;
	#networkState;
	#mod;
	#done;
	#statsTime;
	#sameStatsCount;
	#currentReader;
	#wakeLock;
	#ctrl;
	#ctok;
	#params;
	constructor(video){
		super(video);
		this.#playbackRate = 1;
		this.#paused = true;
		this.#volume = 1;
		this.#statsTime = 0;
		this.#sameStatsCount = 0;
		this.#currentReader = null;
		this.#params = new URLSearchParams();
		this.#e = video || this;
		this.#initCap();
		this.#ctok = this.#e.getAttribute('ctok');
		this.#muted = this.#e.hasAttribute('muted');
		this.#detelecine = this.#e.hasAttribute('autoCinema') ? 2 : 0;
		this.#deinterlace = this.#e.getAttribute('deinterlace');
		this.#initialize();
		if (this.#isUnsupported()) return;
		this.#createWasmModule();

		document.addEventListener("visibilitychange", () => {
			if (this.#wakeLock && document.visibilityState === 'visible') this.#requestWakeLock();
		});
	}


	get tslive(){return true}
	get params(){return this.#params}
	get cap(){return this.#cap}
	get createCap(){return this.#initCap}

	get loadSource(){return this.#loadSource}
	get load(){return this.#load}
	get play(){return this.#play}
	get pause(){return this.#pause}
	get reset(){return this.#reset}

	get setSeek(){return this.#setSeek}
	get setFast(){return this.#setFast}
	get setOption(){return this.#setOption}
	get setAudioTrack(){return this.#setAudioTrack}
	get setDetelecine(){return this.#setDetelecine}

	get src(){return this.#src.href??''}
	set src(src){this.#setSrc(src)}

	get paused(){return this.#paused}
	get muted(){return this.#muted}
	set muted(b){this.#setMuted(b)}
	get volume(){return this.#volume}
	set volume(n){this.#setVolume(n)}
	set audioTrack(n){this.#setAudioTrack(n)}
	get playbackRate(){return this.#playbackRate}
	set playbackRate(n){this.#setPlaybackRate(n)}
	get detelecine(){return this.#detelecine}
	set detelecine(n){this.#setDetelecine(n)}

	get currentTime(){return this.#currentTime}
	set currentTime(ofssec){this.#setCurrentTime(ofssec)}
	set offset(offset){this.#setOffset(offset)}

	get networkState(){return this.#networkState}
	get error(){return this.#error}
	get canPlayType(){return this.#canPlayType}
	//get poster(){return this.#poster??''}
	//set poster(src){this.#setPoster(src)}



	#createWasmModule(){
		navigator.gpu.requestAdapter().then(adapter => adapter.requestDevice().then(device => {
			createWasmModule({preinitializedWebGPUDevice:device}).then(mod => {
				this.#mod = mod;
				mod.setAudioGain(this.#muted?0:this.#volume);
				mod.setDetelecineMode(this.#detelecine);
				mod.setDeinterlace&&this.#deinterlace&&mod.setDeinterlace(this.#deinterlace);
				mod.pause();
				mod.setCaptionCallback((pts,ts,data) => this.#cap&&this.#cap.pushRawData(this.#statsTime+ts,data.slice()));
				mod.setStatsCallback(stats => {
					if(this.#statsTime!=stats[stats.length-1].time){
						this.#currentTime+=stats[stats.length-1].time-this.#statsTime;
						this.#statsTime=stats[stats.length-1].time;
						this.#e.dispatchEvent(new Event('timeupdate'));
						this.#cap&&this.#cap.onTimeupdate(this.#statsTime);
						this.#sameStatsCount=0;
						//statsの中身がすべて同じ状態が続くとき、最後まで再生したとみなす
					}else if(stats.slice(1).every(e=>Object.keys(e).every(key=>stats[0][key]==e[key]))){
						if(++this.#sameStatsCount>=5){
							this.#sameStatsCount=0;
							this.#pause();
							this.#e.dispatchEvent(new Event('ended'));
						}
					}else{
						this.#sameStatsCount=0;
					}
					if(this.#detelecine==2)this.#e.dispatchEvent(new Event(`${stats[stats.length-1].TelecineFlag?'enabled':'disabled'}Detelecine`));
					if(this.#done) return;
					this.#e.dispatchEvent(new Event('canplay'));	//疑似的、pauseしてると呼び出されない
					this.#done = true;
				});
			});
		})).catch(e => {
			this.#error = {code: 0, message: e.message};
			this.#e.dispatchEvent(new Event('error'));
			throw e;
		});
	}

	async #requestWakeLock() {
		this.#wakeLock = await navigator.wakeLock.request('screen');
	}

	#initialize(){
		this.#src = '';
		this.#error = null;
		this.#networkState = this.#networkStateCode.EMPTY;
		this.#currentTime = 0;
		this.#done = false;
		if (!this.#wakeLock) return;
		this.#wakeLock.release();
		this.#wakeLock = null;
	}

	#cap;
	#container = document.getElementById("vid-cont");
	#initCap(useSvg = this.#e.dataset.aribb24UseSvg, option = JSON.parse(decodeURIComponent(this.#e.dataset.aribb24OptionJson||'{}')), container){
		try{
			this.#cap = useSvg ? new aribb24js.SVGRenderer(option) : new aribb24js.CanvasRenderer(option);
			if (container) this.#container = container;
		}catch(e){
			this.#cap = null;
			console.warn("aribb24js:",e);
		}	
	}

	#loadSource(src){
		if (!src){
			this.#reset();
			return;
		}
		this.#e.initSrc = new URL(src, location.href);
		this.#e.initSrc.searchParams.set('ctok', this.#ctok);
		this.#load();
	}
	#load(){
		this.#setSrc(`${this.#e.initSrc}&${this.params.toString()}`);
	}
	#play(){
		this.#paused = false;
		this.#mod.resume();
		this.#e.dispatchEvent(new Event('play'));
	}
	#pause(){
		this.#paused = true;
		this.#mod.pause();
		this.#e.dispatchEvent(new Event('pause'));
	}
	#clear(){
		this.#e.src = '';
		this.#e.removeAttribute('src');
		this.#e.initSrc = null;
		this.#cap&&this.#cap.detachMedia();
	}
	#reset(){
		this.#clear();
		this.#initialize();
		super.clear&&super.clear();
		if (!this.#mod||!this.#ctrl) return;
		this.#pause();
		this.#mod.reset();
		this.#ctrl.abort();
		//Androidでリセットすると再描画されないためとりあえず除外、モバイルでtsliveに対応してるのはAndroidのChromeだけなはずなのでisMobileで対応、他がwebgpu対応したら見直す
		if (navigator.userAgentData ? !navigator.userAgentData.mobile : !navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/)) this.#e.getContext("webgpu").configure({device: this.#mod.preinitializedWebGPUDevice,format: navigator.gpu.getPreferredCanvasFormat(),alphaMode: "premultiplied",});
	}

	#setSrc(src){
		if (!src || this.#isUnsupported()) return;
		if (!this.#mod){
			setTimeout(() => this.#setSrc(src), 500);
			return;
		}
		this.#initialize();
		this.#e.setAttribute('src', src);
		this.#src = new URL(src, location.href);
		this.#src.searchParams.set('throttle', 1);
		this.#startRead();
		this.#mod.resume();
		this.#paused = false;
	}
	#setOption(val, isTslive, onFallback = ()=>{}){
		if (isTslive) this.#params.set('option', val);
		else onFallback();
		return isTslive;
	}
	#setAudioTrack(n){
		if (isNaN(n)) return;
		this.#mod.setDualMonoMode(n);
	}
	#setMuted(b){
		this.#muted = b;
		this.#mod&&this.#mod.setAudioGain(b ? 0 : this.#volume);
		this.#e.dispatchEvent(new Event('volumechange'));
	}
	#setVolume(n){
		if (isNaN(n)) return;
		this.#volume = Number(n);
		this.#mod&&this.#mod.setAudioGain(n);
		this.#e.dispatchEvent(new Event('volumechange'));
	}
	#setPlaybackRate(n){
		if (isNaN(n)) return;
		this.#playbackRate = Number(n);
		this.#mod.setPlaybackRate(n);
		this.#e.dispatchEvent(new Event('ratechange'));
	}
	#setDetelecine(n){
		//0=never,1=force,2=auto
		if (isNaN(n) || n === 'boolean') return;
		this.#detelecine = Number(n);
		this.#mod.setDetelecineMode(n);
	}
	#setSeek(val){
		if (0<val&&val<1) this.#setOffset(val*100);
		else this.#setCurrentTime(val);
	}
	#setFast(val, index){
		super.setFast&&super.setFast(val, index);
		this.#setPlaybackRate(val);

		if (!this.#src.searchParams.has('throttle')) return;
		//転送速度のスロットリングのため
		if (val == 1) this.#src.searchParams.delete('fast');
		else this.#src.searchParams.set('fast', index);
		this.#setCurrentTime(Math.floor(this.#currentTime));
	}
	#setCurrentTime(ofssec){
		if (ofssec==null || isNaN(ofssec)) return;
		this.#currentTime = Math.floor(ofssec);
		this.#src.searchParams.set('ofssec', ofssec);
		this.#resetRead();
	}
	#setOffset(offset){
		if (offset==null || isNaN(offset)) return;
		this.#src.searchParams.set('offset', offset);
		this.#resetRead();
	}
	#canPlayType(s){return /video\/mp2t/.test(s) ? 'maybe' : ''}

	#networkStateCode = {
		EMPTY: 0,
		IDLE: 1,
		LOADING: 2,
		NO_SOURCE: 3,
	}
	#errorCode = {
		ABORTED: 1,
		NETWORK: 2,
		DECODE: 3,
		SRC_NOT_SUPPORTED: 4,
	}

	#isUnsupported(){
		if (!('createWasmModule' in window)) this.#error = {code: 0, message: 'Probably ts-live.js not found.'};
		if (!navigator.gpu) this.#error = {code: 0, message: 'WebGPU not available.'};
		if (this.#error){
			this.#e.dispatchEvent(new Event('error'));
			return true;
		}
	}
	#readNext(reader,ret){
		if (reader==this.#currentReader&&ret&&ret.value){
			const inputLen=Math.min(ret.value.length,1e6);
			const buffer=this.#mod.getNextInputBuffer(inputLen);
			if (!buffer){
			  setTimeout(() => this.#readNext(reader,ret),1000);
			  return;
			}
			buffer.set(new Uint8Array(ret.value.buffer,ret.value.byteOffset,inputLen));
			this.#mod.commitInputData(inputLen);
			if (inputLen<ret.value.length){
				//Input the rest.
				setTimeout(() => this.#readNext(reader,{value:new Uint8Array(ret.value.buffer,ret.value.byteOffset+inputLen,ret.value.length-inputLen)}),0);
				return;
			}
		}
		reader.read().then(r => {
			if (r.done){
				if (reader==this.#currentReader){
					this.#currentReader=null;
					if (this.#wakeLock){
						this.#wakeLock.release();
						this.#wakeLock=null;
					}
				}
			}else this.#readNext(reader,r);
		}).catch(e => {
			if (reader==this.#currentReader){
				this.#currentReader=null;
				if (this.#wakeLock){
					this.#wakeLock.release();
					this.#wakeLock=null;
				}
			}
			throw e;
		});
	}
	#startRead(){
		this.#ctrl = new AbortController();
		fetch(this.#src,{signal:this.#ctrl.signal}).then(response => {
			if (!response.ok){
				if (response.status == 404){
					this.#networkState = this.#networkStateCode.NO_SOURCE;
					this.#error = {code: this.#errorCode.SRC_NOT_SUPPORTED, message: 'MEDIA_ELEMENT_ERROR: Format error'};
				}
				this.#e.dispatchEvent(new Event('error'));
				return;
			}
			super.loadSubData?super.loadSubData():this.#e.dispatchEvent(new Event('streamStarted'));
			this.#cap&&this.#cap.attachMedia(null, this.#container);
			this.#currentReader = response.body.getReader();
			this.#readNext(this.#currentReader,null);
			//Prevent screen sleep
			if (!this.#wakeLock) this.#requestWakeLock();
		});
		['ofssec','offset'].forEach(e => this.#src.searchParams.delete(e));
	}
	#resetRead(){
		this.#ctrl.abort();
		this.#mod.reset();
		this.#startRead();
		this.#play();
	}
}

class TsLive extends tsliveMixin(){
	constructor(video){
		super(video);
	}
}

const hlsMixin = (Base = class {}) => class extends Base{
	#e;
	#error;
	#ctok;
	#hlsMp4Query;
	#alwaysUseHls;
	#params;
	#fast;
	constructor(video){
		super(video);
		this.#fast = 1;
		this.#params = new URLSearchParams();
		this.#e = video || this;
		if (video){
			this.#e.params = this.params;
			this.#e.fast = this.fast;
		}
		this.#initCap();
		this.#ctok = this.#e.getAttribute('ctok');
		this.#hlsMp4Query = this.#e.hasAttribute('hls4') ? `&hls4=${this.#e.getAttribute('hls4')}` : '';
		this.#alwaysUseHls = this.#e.hasAttribute('alwaysUseHls');
		this.#initHls();
		this.#e.addEventListener('loadedmetadata', () => {
			// 映像の幅と高さが0なら音声のみとみなす
			if (this.#e.videoWidth === 0 && this.#e.videoHeight === 0) this.#poster('SOUND ONLY');
		});
	}


	get hls(){return this.#hls}
	get params(){return this.#params}
	get fast(){return this.#e.initSrc?this.#fast:1}
	get error(){return super.error||this.#error}
	get cap(){return this.#cap}
	get createCap(){return this.#initCap}
	get canPlayType(){return this.#canPlayType}
	get apk(){return this.#apk}

	get loadSource(){return this.#loadSource}
	//get load(){if (!super.load) return this.#load}
	get reload(){return this.#reload}
	get reset(){return this.#clear}

	get setSeek(){return this.#setSeek}
	get setFast(){return this.#setFast}
	get setOption(){return this.#setOption}
	get setAudioTrack(){return this.#setAudioTrack}
	get setDetelecine(){return this.#setDetelecine}

	get fixedCurrentTime(){return this.#currentTime()}
	set audioTrack(n){this.#setAudioTrack(n)}
	set detelecine(b){this.#setDetelecine(b)}



	#hls;
	#onload;
	#onstart;
	#initHls(){
		if (this.#alwaysUseHls){
			if (Hls.isSupported()){
				this.#hls = new Hls();
				this.#hls.attachMedia(this.#e);
				this.#hls.on(Hls.Events.MANIFEST_PARSED, () => {super.loadSubData?super.loadSubData():this.#e.dispatchEvent(new Event('streamStarted')); this.#cap&&this.#cap.attachMedia(this.#e);});
				this.#hls.on(Hls.Events.FRAG_PARSING_METADATA, (each, data) => data.samples.forEach(d => this.#cap&&this.#cap.pushID3v2Data(d.pts, d.data)));

				//Android版Firefoxは非キーフレームで切ったフラグメントMP4だとカクつくので避ける
				this.#onload = () => this.#waitForHlsStart(`${this.#e.initSrc}&${this.#params.toString()}&hls=${this.#createRandom()}${/Android.+Firefox/i.test(navigator.userAgent)?'':this.#hlsMp4Query}`);
				this.#onstart = src => this.#hls.loadSource(src);
			}else if (this.#e.canPlayType('application/vnd.apple.mpegurl')){
				this.#onload = () => this.#e.src = this.#e.initSrc.href;
			}
		}else{
			//AndroidはcanPlayTypeが空文字列を返さないことがあるが実装に個体差が大きいので避ける
			if (!/Android/i.test(navigator.userAgent)&&this.#e.canPlayType('application/vnd.apple.mpegurl')){
				this.#onload = () => this.#waitForHlsStart(`${this.#e.initSrc}&${this.#params.toString()}&hls=${this.#createRandom()}${this.#hlsMp4Query}`);
				this.#onstart = src => this.#e.src = src;
			}else{
				this.#onload = () => this.#e.src = this.#e.initSrc.href;
			}
		}
	}
	#createRandom(bytes = 8) {
		const array = new Uint8Array(bytes);
		crypto.getRandomValues(array);

		let hex = '';
		for (const num of array) hex += num.toString(16).padStart(2, '0');

		return hex;
	}

	#cap;
	#cue;
	#initCap(useSvg = this.#e.dataset.aribb24UseSvg, option = JSON.parse(decodeURIComponent(this.#e.dataset.aribb24OptionJson)||'{}'), vidMeta = document.getElementById('vid-meta')){
		try{
			option.enableAutoInBandMetadataTextTrackDetection = !this.#alwaysUseHls || !Hls.isSupported();
			this.#cap = useSvg ? new aribb24js.SVGRenderer(option) : new aribb24js.CanvasRenderer(option);
			if (vidMeta) vidMeta.oncuechange = e => this.#cuechangeB24Caption(e);
		}catch(e){
			this.#cap = null;
			console.warn("aribb24js:",e);
		}	
	}
	#cuechangeB24Caption(e){
		if (this.#cue) return;
		this.#cue = true;
		this.#cap.attachMedia(this.#e);
		Datacast.oncuechangeB24Caption(this.#cap, e.target.track.cues);
	}

	#ofssec = 0;
	#offset = 0;
	#reset(){
		this.#src = '';
		this.#hls&&this.#hls.loadSource('');
		this.#cap&&this.#cap.detachMedia();
		this.#ofssec = 0;
		this.#offset = 0;
		['ofssec','offset'].forEach(e => this.#params.delete(e));
	}
	#clear(){
		this.#reset();
		this.#e.src = '';
		this.#e.poster = '';
		this.#e.initSrc = null;
		this.#e.defaultPlaybackRate = this.#fast;
		this.#error = null;
		this.#cue = false;
		['reload','audio2'].forEach(e => this.#params.delete(e));
		super.clear&&super.clear();
	}
	#loadSource(src){
		if (!src){
			this.#clear();
			return;
		}
		this.#e.initSrc = new URL(src, location.href);
		this.#e.initSrc.searchParams.set('ctok', this.#ctok);
		this.#e.defaultPlaybackRate = 1;
		this.#params.set('load', this.#createRandom());
		this.#onload();
	}
	#reload(onload = ()=>{}, seek = this.#currentTime()){
		if (!this.#e.initSrc) return;
		onload();

		if (this.#params.has('load')){
			this.#params.set('reload', this.#params.get('load'));
			this.#params.delete('load');
		}

		this.#reset();
		if (seek){
			if (seek < 1){
				this.#offset = Math.floor(seek*100);
				this.#params.set('offset', this.#offset);
			}else{
				this.#ofssec = Math.floor(seek);
				this.#params.set('ofssec', this.#ofssec);
			}
		}

		this.#onload();
	}

	#setSeek(val, onload){
		if (1 < val && this.#ofssec < val && val < this.#ofssec + this.#e.duration){
			this.#e.currentTime = val - this.#ofssec;
			return;
		}
		this.#reload(onload, val);
	}
	#setOption(val, isTslive, onFallback = ()=>{}, onload){
		this.#params.set('option', val);
		if (isTslive) onFallback();
		else this.#reload(onload);
	}
	#setAudioTrack(n, onload){
		if (isNaN(n)) return;
		this.#params.set('audio2', n);
		this.#reload(onload);
	}
	#setDetelecine(b, onload){
		if (typeof b !== 'boolean') return;
		if (b) this.#params.set('cinema', 1);
		else this.#params.delete('cinema');
		this.#reload(onload);
	}
	#setFast(val, index, onload){
		super.setFast&&super.setFast(val, index);

		if (val == 1) this.#params.delete('fast');
		else this.#params.set('fast', index);

		this.#fast = val;
		if (!this.#e.initSrc) this.#e.playbackRate = val;
		
		this.#reload(onload);
	}
	#canPlayType(s){
		if (/video\/mp2t/.test(s)) return 'maybe';
		else return super.canPlayType ? super.canPlayType(s) : this.#e.canPlayType(s);
	}
	#currentTime(){
		return this.#e.currentTime * (this.#e.initSrc?this.#fast:1) + this.#ofssec;
	}
	#poster(text = 'Loading...', width = 1280, height = 720){
		try{
			const canvas=document.createElement("canvas");
			canvas.width=width;
			canvas.height=height;
			const ctx=canvas.getContext("2d");
			ctx.fillStyle="#121212";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.shadowColor = '#ff0000';
			ctx.shadowBlur = 10;
			ctx.fillStyle="#ff1a1a";
			ctx.textAlign="center";
			ctx.font=canvas.height/10+"px sans-serif";
			ctx.fillText(text,canvas.width/2,canvas.height/2);
			this.#e.poster=canvas.toDataURL(); 
		}catch(e){
			console.warn("poster:",e);
		}
	}
	#apk(src, onerror, onstart){
		src = new URL(src, location.href);
		src.searchParams.set('ctok', this.#ctok);
		src.searchParams.set('load', this.#createRandom());
		this.#waitForHlsStart(`${src}&${this.#params.toString()}&hls=${this.#createRandom()}${this.#hlsMp4Query}`, onerror, onstart);
	}

	#method;
	#src;
	#interval = 200;
	#delay = 500;
	#onerror = () => {
		this.#error = {code: 0, message: 'HLS loading error'};
		this.#e.dispatchEvent(new Event('error'));
	}
	#waitForHlsStart(src, onerror = this.#onerror, onstart = this.#onstart){
		this.#method = 'POST';
		this.#src = src;
		const poll = () => {
			if (!this.#src) return;

			const xhr = new XMLHttpRequest();
			xhr.open(this.#method, this.#src);
			if (this.#method == 'POST') xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			this.#method = 'GET';
			xhr.onloadend = () => {
				if (xhr.status == 200 && xhr.response){
					if (xhr.response.indexOf('#EXT-X-MEDIA-SEQUENCE:') < 0) setTimeout(() => poll(), this.#interval);
					else setTimeout(() => {if(this.#src)onstart(this.#src);}, this.#delay);
				}else{
					onerror();
				}
			}
			xhr.send(`ctok=${this.#ctok}&open=1`);
		}
		poll();
	}
}

class HlsLoader extends hlsMixin(){
	constructor(video){
		super(video);
	}
}

class TsThumb{
	#mod;
	#url;
	#api;
	#e;
	#vid;
	#key ='fname';
	constructor(api, canvas, video){
		if (api) this.#api = api;
		if (canvas) {
			if (typeof canvas == 'string') this.#key = canvas;
			else this.#e = canvas;
		}
		if (video) this.#vid = video;
		this.#reset();
		if (!('createMiscWasmModule' in window)) return;
		createMiscWasmModule().then(mod => {
			this.#mod = mod;
			window.dispatchEvent(new Event('createdMiscWasmModule'));
		});
	}

	get setThumb(){return this.#setThumb}
	get testThumbs(){return this.#testThumbs}

	get hide(){return this.#hide}

	get seek(){return this.#seek}
	get reset(){return this.#reset}

	get roll(){return this.#roll}


	async #setThumb(canvas, path, value){
		const frame = await this.#get(path, value);
		if (!frame) return;
		this.#putImage(frame, canvas);
		return true;
	}

	async #testThumbs(pathList){
		//trueを返した項目はサムネを取得できる"かもしれない"。効率のため2項目以下は特別扱い
		const tests = pathList.length == 2 ? [true, true] : pathList.length == 1 ? [true] : [];
		if (pathList.length > 2){
			const url = new URL(this.#api, location.href);
			for (let i = 0; i < pathList.length; i++){
				url.searchParams.append('test', `${this.#key}-${pathList[i]}`);
				//APIの制限により100個まで
				if (i == pathList.length - 1 || url.searchParams.size >= 100 || url.searchParams.toString().length >= 1000){
					const r = await fetch(url).catch(() => null);
					if (r && r.ok) tests.push(...JSON.parse(await r.text().catch(() => '[]')));
					if (tests.length != i + 1) return null; //失敗
					url.searchParams.delete('test');
				}
			}
		}
		return tests;
	}

	async #seek(value, offset){
		if (!this.#vid.initSrc||Math.floor(value)==this.#value) return;
		if (!this.#url.searchParams.size) this.#url.search = this.#vid.initSrc.search;
		if (offset) this.#e.style.setProperty('--offset', offset);
		if (this.#loading){
			clearTimeout(this.#timerID);
			this.#timerID = setTimeout(() => this.seek(value), 200);
			return;
		}
		const frame = await this.#get(null, value, this.#id);
		if (frame) this.#putImage(frame);
	}
	#reset(){
		this.#url = new URL(this.#api, location.href);
	}

	#roll(canvas, path, offset = 0){
		this.#e = canvas;
		this.#url.searchParams.set(this.#key, path);
		this.#rollLoop(offset);
	}
	#rollLoop(offset, range = 10){
		clearTimeout(this.#timerID);
		this.#timerID = setTimeout(async () => {
			if (offset >= 100) offset = 0;
			const frame = await this.#get(null, offset/100, this.#id);
			if (frame){
				this.#putImage(frame);
				this.#rollLoop(offset+range);
			}
		}, 700);
	}

	#id = 1;
	#loading;
	#timerID = 0;
	#value;
	async #get(path, value, id){
		if (!this.#mod) return;
	
		const url = path ? new URL(this.#api, location.href) : this.#url;
		if (path) url.searchParams.set(this.#key, path);
		this.#value = value;

		this.#loading = true;
		const frame = await fetch(`${url}&${0<value&&value<1?'offset':'ofssec'}=${Math.floor(0<value&&value<1?value*100:value)||0}`).then(r => {
			if (id && id!=this.#id || !r.ok) throw r;
			return r.arrayBuffer();
		}).then(r => {
			const buffer = this.#mod.getGrabberInputBuffer(r.byteLength);
			buffer.set(new Uint8Array(r));
			if (id && id!=this.#id) return null;
			return this.#mod.grabFirstFrame(r.byteLength);
		}).catch(e => null);
		this.#loading = false;

		return frame;
	}
	#putImage(frame, e = this.#e){
		e.width = frame.width;
		e.height = frame.height;
		e.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(frame.buffer),frame.width,frame.height),0,0);
		e.style.display = null;
	}
	#hide(){
		if (!this.#e) return;
		clearTimeout(this.#timerID);
		this.#id++;
		this.#e.style.display = "none";
		this.#value = null;
	}
}

const datacastMixin = (Base = class {}) => class extends Base{
	#e;
	#params;
	#fast;
	#elems = {
		vcont: document.getElementById("vid-cont"),
		comm: document.getElementById("jikkyo-comm"),
		chats: document.getElementById("jikkyo-chats"),
		commInput: document.getElementById("comm"),
		commBtn: document.getElementById("commSend"),
		bcomm: document.getElementById("comment-control"),
		shiftJikkyo: document.querySelectorAll(".jikkyo-shift"),
		selectID: document.querySelector('#jikkyo-config select[name="id"]'),
		inputTM: document.querySelector('#jikkyo-config input[name="tm"]'),
		inputTMSec: document.querySelector('#jikkyo-config select[name="tmsec"]'),
		btnConfig: document.querySelector("#jikkyo-TM button"),
		kakolog: document.getElementById("kakolog"),
		webBmlContainer: document.querySelector(".data-broadcasting-browser-container"),
		remocon: document.querySelector(".remote-control"),
		indicator: document.querySelector(".remote-control-indicator"),
		indicatorName: ".remote-control-indicator",
	}
	get #webBmlSrc(){return document.getElementById('webBml').getAttribute('src')};
	get #noWebBml(){return typeof bmlBrowserSetVisibleSize === 'undefined'}
	get #noDanmaku(){return typeof Danmaku === 'undefined'}
	constructor(video){
		super();
		this.#e = video || this;
		this.#fast = 1;
		this.#params = new URLSearchParams();
		Datacast.setNvramDef(this.#e.dataset.absentZip, this.#e.dataset.absentPrefecture, this.#e.dataset.absentRegion);
		if (this.#noDanmaku) return;
		this.#initDanmaku();
		this.#ctok = this.#e.dataset.commentCtok;
		Object.assign(this.#api, JSON.parse(decodeURIComponent(this.#e.dataset.commentApi||'{}')));
	}


	get clear(){return this.#clear}
	get datacast(){return this.#datacast}
	get jikkyo(){return this.#jikkyo}
	get toggleDatacast(){return this.#toggleDatacast}
	get toggleJikkyo(){return this.#toggleJikkyo}
	get loadSubData(){return this.#loadSubData}
	get setFast(){return this.#setFast}

	set setRemoconEvent(fn){this.#setRemoconEvent(fn)}
	get shiftJikkyo(){return this.#shiftJikkyo}
	set jkID(id){this.#setJK(id)}
	set jkTM(tm){this.#setJK(null,tm)}

	get setElemsList(){return this.#setElems}

	static get prefix(){return "nvram_prefix=receiverinfo%2F"}
	static setNvramZip(zip){
		if (!zip) return;
		if (/^[0-9]{7}$/.test(zip)) localStorage.setItem(`${this.prefix}zipcode`,btoa(zip));
		else localStorage.removeItem(`${this.prefix}zipcode`);
	}
	static setNvramPrefecture(prefecture){
		if (!prefecture) return;
		if (prefecture!=="0") localStorage.setItem(`${this.prefix}prefecture`,btoa(String.fromCharCode(prefecture)));
		else localStorage.removeItem(`${this.prefix}prefecture`);
	}
	static setNvramRegioncode(regioncode){
		if (!regioncode) return;
		if (regioncode!=="0") localStorage.setItem(`${this.prefix}regioncode`,btoa(String.fromCharCode(regioncode>>8,regioncode&0xff)));
		else localStorage.removeItem(`${this.prefix}regioncode`);
	}
	static setNvramDef(zip, prefecture, regioncode){
		if(!localStorage.getItem(`${this.prefix}zipcode`)) this.setNvramZip(zip);
		if(!localStorage.getItem(`${this.prefix}prefecture`)) this.setNvramPrefecture(prefecture);
		if(!localStorage.getItem(`${this.prefix}regioncode`)) this.setNvramRegioncode(regioncode);
	}



	#ctok;
	#customReplace;
	#danmaku;
	#api = {
		jklog: 'jklog',
		comment: 'comment',
	}
	#initDanmaku(){
		try{
			this.#customReplace = JSON.parse(decodeURIComponent(this.#e.dataset.customReplaceJson||'[]'));
			for(const rep of this.#customReplace){
				rep.regex = new RegExp(rep.pattern,rep.flags);
			}
		}catch(e){
			console.warn("customReplaceJson:",e);
			this.#customReplace = [];
		}
		this.#danmaku = new Danmaku({
			container:document.getElementById("danmaku-container")||this.#elems.vcont,
			opacity:1,
			callback:function(){},
			error:function(msg){},
			apiBackend:{read:function(opt){opt.success([]);}},
			height:+this.#e.dataset.commentHeight||32,
			duration:+this.#e.dataset.commentDuration||5,
			paddingTop:10,
			paddingBottom:10,
			unlimited:false,
			api:{id:"noid",address:"noad",token:"noto",user:"nous",speedRate:1}
		});
		this.#addJikkyoEvent();
	}
	#replaceTag = tag => {
		for(const rep of this.#customReplace){
			tag = tag.replace(rep.regex,rep.replace);
		}
		return tag;
	}
	#initRemocon = () => {}
	#setRemoconEvent(fn){
		this.#initRemocon = fn;
		fn(this.#elems.remocon);
	}
	async #initWebBml(){
		return new Promise((resolve, reject) => {
			//bmlブラウザを空に、リモコンのイベントを消し去る
			[...this.#elems.webBmlContainer.children, ...this.#elems.remocon.children].forEach(e => e.replaceWith(e.cloneNode(true)));
			this.#elems.indicator = this.#elems.remocon.querySelector(this.#elems.indicatorName);
			this.#initRemocon(this.#elems.remocon);
			const script = document.createElement('script');
			script.src = this.#webBmlSrc;
			script.onload = () => {
				this.#loaded = null;
				this.#noWebBml = typeof bmlBrowserSetVisibleSize === 'undefined';
				if (!this.#noWebBml) bmlBrowserSetVisibleSize(this.#elems.vcont.clientWidth,this.#elems.vcont.clientHeight);
				return resolve();
			}
			script.onerror = () => reject();
			document.body.append(script);
		});
	}
	#clear(){
		if (!this.#noDanmaku){
			this.#jklog.disable();
			this.#jkStream.clear();
		}
		if (!this.#noWebBml){
			this.#psc.disable();
			this.#dataStream.clear();
		}
		this.#closeSubStream();
	}
	#STATE = {
		DISABLED: 0,
		ENABLED: 1,
		STREAM: 2,
		LOG: 3,
	}
	get #datacast(){
		return {
			enabled: this.#datacastState ? true : false,
			enable: () => this.#enableDatacast(),
			disable: () => this.#disableDatacast(),
		}
	}
	#datacastState = this.#STATE.DISABLED;
	#enableDatacast(){
		this.#datacastState = this.#STATE.ENABLED;
		if (this.#noWebBml) return;
		if (this.#e.initSrc) this.#dataStream.enable(true);
		else this.#psc.enable();
	}
	#disableDatacast(){
		if (!this.#noWebBml){
			if (this.#datacastState==this.#STATE.STREAM) this.#dataStream.disable();
			else this.#psc.disable();
		}
		this.#datacastState=this.#STATE.DISABLED;
	}
	#toggleDatacast(enabled){
		if (enabled===false || enabled===undefined&&this.#datacastState)
			this.#disableDatacast();
		else this.#enableDatacast();
		return this.#datacastState ? true : false;
	}
	get #jikkyo(){
		return {
			danmaku: this.#danmaku,
			enabled: this.#jikkyoState ? true : false,
			showing: this.#jikkyoState && this.#jkStream.showing ? true : false,
			loading: this.#jkStream.loading ? true : false,
			show: () => this.#showJikkyo(),
			hide: () => this.#hideJikkyo(),
			enable: () => this.#enableJikkyo(),
			disable: () => this.#disableJikkyo(),
		}
	}
	#jikkyoState = this.#STATE.DISABLED;
	#enableJikkyo(){
		this.#jikkyoState = this.#STATE.ENABLED;
		if (this.#noDanmaku) return;
		if (this.#e.initSrc&&!this.#shiftable) this.#jkStream.enable(true);
		else this.#jklog.enable();
	}
	#disableJikkyo(){
		if (!this.#noDanmaku){
			if (this.#jikkyoState==this.#STATE.STREAM) this.#jkStream.disable();
			else this.#jklog.disable();
		}
		this.#jikkyoState=this.#STATE.DISABLED;
		this.#jkStream.showing = false;
	}
	#showJikkyo(){
		this.#jkStream.showing = true;
		if (this.#noDanmaku) return;
		if (!this.#jikkyoState) this.#enableJikkyo();
		this.#danmaku.show();
	}
	#hideJikkyo(){
		this.#jkStream.showing = false;
		if (this.#noDanmaku) return;
		if (!this.#jikkyoState) this.#enableJikkyo();
		this.#danmaku.hide();
	}
	#toggleJikkyo(enabled, load = this.#jkStream.loading){
		this.#jkStream.loading = load;
		if (!load && (enabled===false || enabled===undefined&&this.#jikkyoState))
			this.#disableJikkyo();
		else if (enabled===false || enabled===undefined&&this.jikkyo.showing) this.#hideJikkyo();
		else this.#showJikkyo();
		return this.jikkyo.showing;
	}
	#loadSubData(){
		this.#shiftable=this.#e.initSrc&&this.#e.initSrc.searchParams.has('shiftable');
		if (!this.#noWebBml && this.#datacastState!=this.#STATE.DISABLED)
			if (this.#e.initSrc) this.#dataStream.enable();
			else this.#psc.enable();
		if (!this.#noDanmaku && this.#jikkyoState!=this.#STATE.DISABLED)
			if (this.#e.initSrc&&!this.#shiftable) this.#jkStream.enable();
			else this.#jklog.enable();
		if (this.#e.initSrc) this.#openSubStream();
	}
	#setFast(val, index){
		if (val == 1) this.#params.delete('fast');
		else this.#params.set('fast', index);
		this.#fast = val;
		this.#openSubStream();
	}

	#fname(){
		const src = this.#e.initSrc||new URL(this.#e.getAttribute('src'), location.href);
		return src.searchParams.has('recid') ? `recid=${src.searchParams.get('recid')}`
			: src.searchParams.has('rid') ? `rid=${src.searchParams.get('rid')}`
			: `fname=${src.searchParams.has('fname') ? encodeURIComponent(src.searchParams.get('fname')) : src.pathname.replace(/^(?:\/)+/,"")}`;
	}
	#setElems(elems){
		Object.assign(this.#elems, elems);
		this.#addJikkyoEvent();
	}
	#addJikkyoEvent(){
		this.#elems.shiftJikkyo.forEach(e=>e.onclick=()=>this.#shiftJikkyo(+e.dataset.sec));
		if (this.#elems.selectID) this.#elems.selectID.onchange=()=>this.#setJK(this.#elems.selectID.value);
		if (this.#elems.btnConfig) this.#elems.btnConfig.onclick=()=>this.#setJK(null,this.#elems.inputTM.value?Math.floor(Date.parse(this.#elems.inputTM.value+"Z")/60000)*60+this.#elems.inputTMSec.selectedIndex-32400:0);
		if (this.#elems.kakolog) this.#elems.kakolog.onclick=()=>this.#jklog.kakolog();
		if (!this.#elems.commInput) return;
		this.#elems.commInput.onkeydown = e => {if(!e.isComposing&&e.keyCode!=229&&e.key=="Enter") this.#sendComment();}
		this.#elems.commBtn.onclick = () => this.#sendComment();
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
			let pos=ctx.pos+ctx.trailerSize;
			const timeListLen=data.getUint16(pos+10,true);
			const dictionaryLen=data.getUint16(pos+12,true);
			const dictionaryWindowLen=data.getUint16(pos+14,true);
			const dictionaryDataSize=data.getUint32(pos+16,true);
			const dictionaryBuffSize=data.getUint32(pos+20,true);
			const codeListLen=data.getUint32(pos+24,true);
			if(data.getUint32(pos)!=0x50737363||
				data.getUint32(pos+4)!=0x0d0a9a0a||
				dictionaryWindowLen<dictionaryLen||
				dictionaryBuffSize<dictionaryDataSize||
				dictionaryWindowLen>65536-4096){
				return null;
			}
			const chunkSize=32+timeListLen*4+dictionaryLen*2+Math.ceil(dictionaryDataSize/2)*2+codeListLen*2;
			if(data.byteLength-pos<chunkSize)break;
			let timeListPos=pos+32;
			pos+=32+timeListLen*4;
			if(ctx.timeListCount<0){
				const pids=[];
				const dict=[];
				let sectionListPos=0;
				for(let i=0;i<dictionaryLen;i++,pos+=2){
					const codeOrSize=data.getUint16(pos,true)-4096;
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
				for(let i=0;i<dictionaryLen;i++){
					if(pids[i]>=0)continue;
					dict[i]=new Uint8Array(data.buffer.slice(sectionListPos,sectionListPos+pids[i]+4097));
					sectionListPos+=pids[i]+4097;
					pids[i]=data.getUint16(pos,true)&0x1fff;
					pos+=2;
				}
				for(let i=dictionaryLen,j=0;i<dictionaryWindowLen;j++){
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
				let initTime=ctx.initTime;
				let currTime=ctx.currTime;
				const absTime=data.getUint32(timeListPos,true);
				if(absTime==0xffffffff){
					currTime=-1;
				}else if(absTime>=0x80000000){
					currTime=absTime&0x3fffffff;
					if(initTime<0)initTime=currTime;
				}else{
					const n=data.getUint16(timeListPos+2,true)+1;
					if(currTime>=0){
						currTime+=data.getUint16(timeListPos,true);
						const sec=((currTime+0x40000000-initTime)&0x3fffffff)/11250;
						if(sec>=(startSec||0)){
							for(;ctx.codeCount<n;ctx.codeCount++,pos+=2,ctx.codeListPos+=2){
								const code=data.getUint16(pos,true)-4096;
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
		const ret=data.buffer.slice(ctx.pos);
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
			let i=response.indexOf("<",readCount);
			if(i==readCount){
				i=response.indexOf("\n",readCount);
				if(i<0)break;
				const s=response.substring(readCount,i);
				if(!this.#mHeader&&!!(this.#mHeader=s.match(/^<!-- J=([0-9]+)(?:;T=([0-9]+))?/))){
					for(const opt of this.#elems.selectID.options){
						if(opt.value==this.#mHeader[1]){
							opt.selected=true;
							break;
						}
					}
					if(this.#mHeader[2]){
						const tm=this.#mHeader[2]-Math.floor(this.#e.fixedCurrentTime||this.#e.currentTime);
						if(this.#elems.inputTM)this.#elems.inputTM.value==new Date(1000*tm+32400000).toISOString().substring(0,16);
						if(this.#elems.inputTMSec)this.#elems.inputTMSec.options[tm%60].selected=true;
					}
				}
				this.#jkStream.stream(s);
				readCount=i+1;
			}else{
				i=i<0?response.length:i;
				const n=Math.floor((i-readCount+ctx.atobRemain.length)/4)*4;
				if(n){
					const addData=atob(ctx.atobRemain+response.substring(readCount,readCount+n-ctx.atobRemain.length));
					ctx.atobRemain=response.substring(readCount+n-ctx.atobRemain.length,i);
					const concatData=new Uint8Array(ctx.psiData.length+addData.length);
					for(let j=0;j<ctx.psiData.length;j++)concatData[j]=ctx.psiData[j];
					for(let j=0;j<addData.length;j++)concatData[ctx.psiData.length+j]=addData.charCodeAt(j);
					ctx.psiData=this.#readPsiData(concatData.buffer,(sec,dict,code,pid)=>{
						this.#dataStream.stream(pid,dict,code,Math.floor(sec*90000));
						return true;
					},0,ctx.ctx);
					if(ctx.psiData)ctx.psiData=new Uint8Array(ctx.psiData);
				}else{
					ctx.atobRemain+=response.substring(readCount,i);
				}
				readCount=i;
			}
		}
		return readCount;
	}

	static decodeB24CaptionFromCueText(text,work){
		work=work||[];
		text=text.replace(/\r?\n/g,"");
		const re=/<v b24caption[0-8]>(.*?)<\/v>/g;
		let src,ret=null;
		while((src=re.exec(text))!==null){
			src=src[1].replace(/<.*?>/g,"").replace(/&(?:amp|lt|gt|quot|apos);/g,
				m=>m=="&amp;"?"&":m=="&lt;"?"<":m=="&gt;"?">":m=="&quot;"?'"':"'");
			const brace=[];
			let wl=0,hi=0;
			for(let i=0;i<src.length;){
				if(src[i]=="%"){
					if((++i)+2>src.length)return null;
					const c=src[i++];
					const d=src[i++];
					if(c=="^"){
						work[wl++]=0xc2;
						work[wl++]=d.charCodeAt(0)+64;
					}else if(c=="="){
						if(d=="{"){
							work[wl++]=0;
							work[wl++]=0;
							work[wl++]=0;
							brace.push(wl);
						}else if(d=="}"&&brace.length>0){
							const pos=brace.pop();
							work[pos-3]=wl-pos>>16&255;
							work[pos-2]=wl-pos>>8&255;
							work[pos-1]=wl-pos&255;
						}else return null;
					}else if(c=="+"){
						if(d=="{"){
							const pos=src.indexOf("%+}",i);
							if(pos<0)return null;
							try{
								const buf=atob(src.substring(i,pos));
								for(let j=0;j<buf.length;j++)work[wl++]=buf.charCodeAt(j);
							}catch(e){return null;}
							i=pos+3;
						}else return null;
					}else{
						const x=c.charCodeAt(0);
						const y=d.charCodeAt(0);
						work[wl++]=(x>=97?x-87:x>=65?x-55:x-48)<<4|(y>=97?y-87:y>=65?y-55:y-48);
					}
				}else{
					let x=src.charCodeAt(i++);
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
				const r=new Uint8Array(wl+7);
				r[0]=0x80;
				r[1]=0xff;
				r[2]=0xf0;
				r[3]=work[0];
				r[4]=work[1];
				r[5]=work[2];
				r[6]=wl-3>>8&255;
				r[7]=wl-3&255;
				for(let i=3;i<wl;i++)r[i+5]=work[i];
				ret=ret||[];
				ret.push(r);
			}
		}
		return ret;
	}

	#unescapeHtml(s){
		return s.replace(/&(?:amp|lt|gt|quot|apos|#10|#13);/g,
			m=>m[1]=="l"?"<":m[1]=="g"?">":m[1]=="q"?'"':m[3]=="p"?"&":m[3]=="o"?"'":m[3]=="0"?"\n":"\r");
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
		let m=tag.match(/^<chat(?= )(.*)>(.*?)<\/chat>$/);
		if(m){
			const a=m[1];
			const r={text:this.#unescapeHtml(m[2])};
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
			const i=text.indexOf("\n",ctx.pos);
			if(i<0)break;
			const tag=text.substring(ctx.pos,i);
			let sec=ctx.currSec;
			if(/^<!-- J=/.test(tag))sec++;
			if(sec>=(startSec||0)&&!proc(sec,tag))break;
			ctx.pos=i+1;
			ctx.currSec=sec;
		}
	}

	#getJikkyoLogStats(text){
		let sec=0;
		for(let pos=0;;){
			const i=text.indexOf("\n",pos);
			if(i<0)break;
			if(text.startsWith("<!-- J=",pos))++sec;
			pos=i+1;
		}
		const windowSec=Math.max(Math.floor(sec/400),5);
		sec=0;
		let counts=[0],maxCount=0;
		for(let pos=0;;){
			const i=text.indexOf("\n",pos);
			if(i<0)break;
			if(text.startsWith("<!-- J=",pos)){
			if(++sec%windowSec==0){
				maxCount=Math.max(counts[counts.length-1],maxCount);
				counts.push(0);
			}
			}else if(text.startsWith("<chat ",pos)){
			counts[counts.length-1]++;
			}
			pos=i+1;
		}
		return {sec,windowSec,counts,maxCount};
	}

	#drawStatsGraph(stats,now,ofs){
		if(!stats||!(stats.maxCount>0))return;
		const w=stats.counts.length;
		const h=50;
		now/=stats.sec;
		now=Math.floor((now>0?Math.min(now,1):0)*w);
		ofs/=stats.sec;
		ofs=Math.floor((ofs>0?Math.min(ofs,1):ofs<0?Math.max(ofs,-1):0)*w);
		if(!stats.canvas){
			stats.canvas=document.createElement("canvas");
			stats.canvas.width=w;
			stats.canvas.height=h;
		}else if(stats.now==now&&stats.ofs==ofs){
			//No redraw required
			return;
		}
		stats.now=now;
		stats.ofs=ofs;
		const ctx=stats.canvas.getContext("2d");
		ctx.clearRect(0,0,w,h);
		ctx.fillStyle="#888";
		if(ofs>0)ctx.fillRect(0,0,ofs,h);
		else if(ofs<0)ctx.fillRect(w+ofs,0,w,h);
		ctx.strokeStyle="#07d";
		ctx.lineWidth=1;
		for(let x=0;x<w;x++){
			ctx.beginPath();
			ctx.moveTo(x+0.5,h);
			ctx.lineTo(x+0.5,h-Math.floor(stats.counts[x]/stats.maxCount*h));
			ctx.closePath();
			ctx.stroke();
		}
		ctx.strokeStyle="#f00";
		ctx.lineWidth=2;
		ctx.beginPath();
		ctx.moveTo(now,0);
		ctx.lineTo(now,h);
		ctx.closePath();
		ctx.stroke();
	}

	#commHide;
	#checkScrollID;
	#fragment;
	#scatter=[];
	#scatterInterval=200;
	#closed;
	#jkID="?";
	#jkStream = {
		clear: () => {
			this.#params.delete('jkID');
			this.#params.delete('jkTM');
			if(this.#stats&&this.#stats.canvas){
				this.#elems.comm.removeChild(this.#stats.canvas);
				this.#stats=null;
			}
			clearInterval(this.#checkScrollID);
			this.#checkScrollID=0;
			if (this.#elems.bcomm) this.#elems.bcomm.style.display="none";
			while (this.#elems.chats.firstChild) this.#elems.chats.removeChild(this.#elems.chats.firstChild);
		},
		disable: () => {
			this.#params.delete('jikkyo');
			this.#jkStream.clear();
			this.#openSubStream();
		},
		enable: open => {
			this.#jikkyoState=this.#STATE.STREAM;
			this.#params.set('jikkyo', 1);
			this.#fragment=null;
			this.#scatter=[];
			this.#scatterInterval=200;
			this.#closed=false;
			this.#jkID="?";
			if (this.#elems.bcomm){
				this.#elems.bcomm.style.display=null;
				this.#chatsScroller();
			}
			if (open) this.#openSubStream();
		},
		error: (status, readCount) => {
			this.#addMessage("Error! ("+status+"|"+readCount+"Bytes)");
		},
		stream: tag => {
			if(tag.startsWith("<chat ")){
				const c=this.#parseChatTag(this.#replaceTag(tag));
				if(c){
					if(c.yourpost)c.border="2px solid #c00";
					this.#scatter.push(c);
					const dateSpan=document.createElement("span");
					dateSpan.innerText=String(100+(Math.floor(c.date/3600)+9)%24).substring(1)+":"+
										String(100+Math.floor(c.date/60)%60).substring(1)+":"+
										String(100+c.date%60).substring(1);
					const userSpan=document.createElement(c.yourpost?"b":"span");
					userSpan.innerText="("+c.user.substring(c.user.substring(0,2)=="a:"?2:0).substring(0,3)+")";
					userSpan.className=c.refuge?"refuge":"nico";
					const span=document.createElement("span");
					span.innerText=c.text;
					if(c.color!=0xffffff){
						span.style.backgroundColor=c.colorcode;
						span.className=(c.color>>16)*3+(c.color>>8)%256*6+c.color%256<255?"dark":"light";
					}
					const div=document.createElement("div");
					if(this.#closed){
						div.className="closed";
						this.#closed=false;
					}
					div.appendChild(dateSpan);
					div.appendChild(userSpan);
					div.appendChild(span);
					if(!this.#fragment)this.#fragment=document.createDocumentFragment();
					this.#fragment.appendChild(div);
				}
				return;
			}else if(tag.startsWith("<chat_result ")){
				const m=tag.match(/^[^>]*? status="(\d+)"/);
				if(m&&m[1]!="0")this.#addMessage("Error! (chat_result="+m[1]+")");
				return;
			}else if(tag.startsWith("<x_room ")){
				const m=tag.match(/^[^>]*? nickname="(.*?)"/);
				const nickname=m?m[1]:"";
				const loggedIn=/^[^>]*? is_logged_in="1"/.test(tag);
				const refuge=/^[^>]*? refuge="1"/.test(tag);
				this.#addMessage("Connected to "+(refuge?"refuge":"nicovideo")+" jk"+this.#jkID+" ("+(loggedIn?"login=":"")+nickname+")");
				return;
			}else if(tag.startsWith("<x_disconnect ")){
				const m=tag.match(/^[^>]*? status="(\d+)"/);
				const refuge=/^[^>]*? refuge="1"/.test(tag);
				if(m)this.#addMessage("Disconnected from "+(refuge?"refuge":"nicovideo")+" (status="+m[1]+")");
				return;
			}else if(tag.startsWith("<!-- M=")){
				if(tag.substring(7,22)=="Closed logfile.")this.#closed=true;
				else if(tag.substring(7,31)!="Started reading logfile:")this.#addMessage(tag.substring(7,tag.length-4));
				return;
			}else if(!tag.startsWith("<!-- J=")){
				return;
			}
			this.#jkID=tag.match(/^<!-- J=(\d*)/)[1]||"?";
			if(tag.indexOf(";T=")<0)this.#scatterInterval=90;
			else this.#scatterInterval=Math.min(Math.max(this.#scatterInterval+(this.#scatter.length>0?-10:10),100),200);
			setTimeout(()=>{
				const scroll=Math.abs(this.#elems.chats.scrollTop+this.#elems.chats.clientHeight-this.#elems.chats.scrollHeight)<this.#elems.chats.clientHeight/4;
				if(this.#fragment){
					this.#elems.chats.appendChild(this.#fragment);
					this.#fragment=null;
				}
				if(this.#scatterInterval<100){
					this.#danmaku.draw(this.#scatter);
					this.#scatter.splice(0);
				}
				const n=Math.ceil(this.#scatter.length/5);
				if(n>0){
					for(let i=0;i<5;i++){
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
	#shiftJikkyo(sec){
		this.#jklog.offsetSec+=sec;
		this.#addMessage("Offset "+this.#jklog.offsetSec+"sec");
	}
	#setJK(id, tm){
		if (this.#jklog.xhr&&this.#jklog.xhr.readyState!=4) return;
		if (id) this.#params.set('jkID', id);
		if (tm) this.#params.set('jkTM', tm);
		if (this.#e.initSrc&&!this.#shiftable) this.#openSubStream();
		else{
			this.#logText=null;
			this.#jklog.xhr=null;
			this.#jklog.enable();
		}
	}
	#chatsScroller(){
		clearInterval(this.#checkScrollID);
		this.#commHide=true;
		this.#checkScrollID=setInterval(()=>{
			if(getComputedStyle(this.#elems.comm).display=="none"){
				this.#commHide=true;
			}else{
				const scroll=Math.abs(this.#elems.chats.scrollTop+this.#elems.chats.clientHeight-this.#elems.chats.scrollHeight)<this.#elems.chats.clientHeight/4;
				if(this.#commHide||scroll)this.#elems.chats.scrollTop=this.#elems.chats.scrollHeight;
				this.#commHide=false;
			}
		},1000);
	}
	#addMessage(text){
		const b=document.createElement("strong");
		b.innerText=text;
		const div=document.createElement("div");
		div.appendChild(b);
		this.#elems.chats.appendChild(div);
	}

	static oncuechangeB24Caption(cap,cues){
		const work=[];
		const dataList=[];
		for(const cue of cues){
			const ret=this.decodeB24CaptionFromCueText(cue.text,work);
			if(!ret)return;
			for(const pes of ret){dataList.push({pts:cue.startTime,pes});}
		}
		dataList.reverse();
		const pushCap=()=>{
			for(let i=0;i<100;i++){
			const data=dataList.pop();
			if(!data)return;
			cap.pushRawData(data.pts,data.pes);
			}
			setTimeout(pushCap,0);
		};
		pushCap();
	}

	#psiData;
	#psc = {
		startRead: () => {
			clearTimeout(this.#psc.readTimer);
			const startSec=this.#e.currentTime;
			this.#psc.videoLastSec=startSec;
			const ctx={};
			const read=()=>{
				const videoSec=this.#e.currentTime;
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
		disable: () => {
			clearTimeout(this.#psc.readTimer);
			this.#psc.readTimer=0;
			bmlBrowserSetInvisible(true);
			if (this.#elems.indicator) this.#elems.indicator.innerText = '';
			if(this.#psc.xhr){
				this.#psc.xhr.abort();
				this.#psc.xhr=null;
			}
			this.#psiData=null;
			this.#psc.videoLastSec=0;
		},
		enable: async () => {
			if(!this.#e.getAttribute("src")||this.#e.getAttribute("src").startsWith("blob")&&!this.#e.initSrc)return;
			if(this.#loaded&&this.#loaded!=this.#e.getAttribute("src"))await this.#initWebBml();
			this.#datacastState=this.#STATE.LOG;
			this.#psc.startRead();
			bmlBrowserSetInvisible(false);
			if(this.#psc.xhr)return;
			this.#psc.xhr=new XMLHttpRequest();
			this.#psc.xhr.open("GET",this.#e.getAttribute("src").replace(/\.[0-9A-Za-z]+$/,"")+".psc");
			this.#psc.xhr.responseType="arraybuffer";
			this.#psc.xhr.overrideMimeType("application/octet-stream");
			this.#psc.xhr.onloadend=()=>{
				if(!this.#psiData&&this.#elems.indicator)this.#elems.indicator.innerText="Error! ("+this.#psc.xhr.status+")";
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
	#mHeader;
	#stats;
	#shiftable;
	#jklog = {
		offsetSec: 0,
		startRead: () => {
			clearTimeout(this.#jklog.readTimer);
			const startSec=(this.#e.fixedCurrentTime||this.#e.currentTime)+this.#jklog.offsetSec;
			this.#jklog.videoLastSec=startSec;
			const ctx={};
			const read=()=>{
				const videoSec=(this.#e.fixedCurrentTime||this.#e.currentTime)+this.#jklog.offsetSec;
				if(videoSec<this.#jklog.videoLastSec||this.#jklog.videoLastSec+10<videoSec){
					this.#jklog.startRead();
					return;
				}
				this.#jklog.videoLastSec=videoSec;
				if(this.#logText){
					this.#readJikkyoLog(this.#logText,(sec,tag)=>{
						this.#jkStream.stream(tag);
						return sec<videoSec;
					},startSec,ctx);
					this.#drawStatsGraph(this.#stats,videoSec,this.#jklog.offsetSec);
				}
				this.#jklog.readTimer=setTimeout(()=>read(),200);
			}
			this.#jklog.readTimer=setTimeout(()=>read(),200);
		},
		disable: () => {
			clearTimeout(this.#jklog.readTimer);
			this.#jklog.readTimer=0;
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
		enable: () => {
			if(!this.#e.getAttribute("src")||this.#e.getAttribute("src").startsWith("blob")&&!this.#e.initSrc)return;
			this.#jikkyoState=this.#STATE.LOG;
			this.#chatsScroller();
			this.#jklog.startRead();
			if(this.#jklog.xhr)return;
			this.#mHeader=null;
			this.#jklog.xhr=new XMLHttpRequest();
			this.#jklog.xhr.open("GET",`${this.#api.jklog}?${this.#fname()}&jkID=${this.#params.get('jkID')||0}&jkTM=${this.#params.get('jkTM')||0}`);
			this.#jklog.xhr.onloadend=()=>{
				if(!this.#logText){
					this.#jkStream.error(this.#jklog.xhr.status,0);
				}
			};
			this.#jklog.xhr.onload=()=>{
				if(this.#jklog.xhr.status!=200||!this.#jklog.xhr.response)return;
				this.#logText=this.#jklog.xhr.response;
				const m=this.#logText.match(/^<!-- J=([0-9]+);T=([0-9]+)/);
				if(m){
				for(const opt of this.#elems.selectID.options){
					if(opt.value==m[1]){
						opt.selected=true;
						break;
					}
				}
				if(this.#elems.inputTM)this.#elems.inputTM.value=new Date(1000*m[2]+32400000).toISOString().substring(0,16);
				if(this.#elems.inputTMSec)this.#elems.inputTMSec.options[m[2]%60].selected=true;
				}
				if(this.#stats&&this.#stats.canvas){
					this.#elems.comm.removeChild(this.#stats.canvas);
				}
				this.#stats=this.#getJikkyoLogStats(this.#logText);
				this.#drawStatsGraph(this.#stats);
				if(this.#stats.canvas){
					this.#elems.comm.insertBefore(this.#stats.canvas,this.#elems.comm.firstChild);
				}
			};
			this.#jklog.xhr.send();
		},
		kakolog: () => {
			if(!this.#e.getAttribute("src")&&!this.#e.initSrc)return;
			const text=this.#elems.kakolog.innerText;
			this.#elems.kakolog.innerText="取得中...";
			this.#elems.kakolog.disabled=true;
			const xhr=new XMLHttpRequest();
			xhr.open("GET",`${this.#api.jklog}?${this.#fname()}&jkID=${this.#params.get('jkID')||0}&jkTM=${this.#params.get('jkTM')||0}&kakolog=1`);
			xhr.onloadend=()=>{
				if(xhr.status==200||xhr.response){
					this.#logText=null;
					this.#jklog.xhr=null;
					this.#jklog.enable();
				}
				this.#elems.kakolog.innerText=text;
				this.#elems.kakolog.disabled=false;
			}
			xhr.send();
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
		const xhr=new XMLHttpRequest();
		xhr.open("POST", this.#api.comment);
		xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		xhr.onloadend=()=>{
			if(xhr.status!=200){
				this.#addMessage("Post error! ("+xhr.status+")");
			}
		};

		const params = new URLSearchParams(this.#e.initSrc.search);
		params.set('ctok',this.#ctok);
		if (this.#elems.commInput.classList.contains("refuge")) params.set("refuge", 1);
		params.set('comm', this.#elems.commInput.value);

		xhr.send(params);

		this.#elems.commInput.dispatchEvent(new Event('sentComment'));
		this.#elems.commInput.value="";
	}

	#reopen;
	#xhr;
	#closeSubStream(){
		if (!this.#xhr) return;
		this.#xhr.abort();
		this.#xhr=null;
	}
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
		if(!this.#e.initSrc||!this.#params.has('psidata')&&!this.#params.has('jikkyo'))return;
		let readCount=0;
		const ctx={};
		this.#mHeader=null;
		this.#xhr=new XMLHttpRequest();
		this.#xhr.open("GET",`${this.#e.initSrc}&${this.#params.toString()}&ofssec=${Math.floor(this.#e.fixedCurrentTime||this.#e.currentTime)}`);
		this.#xhr.onloadend=()=>{
			if(this.#xhr&&(readCount==0||this.#xhr.status!=0)){
				if(this.#params.has('psidata'))this.#dataStream.error(this.#xhr.status,readCount);
				if(this.#params.has('jikkyo'))this.#jkStream.error(this.#xhr.status,readCount);
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
	#dataStream = {
		error: (status,readCount) => {
			if(this.#elems.indicator)this.#elems.indicator.innerText="Error! ("+status+"|"+readCount+"Bytes)";
		},
		stream: (pid,dict,code,pcr) => {
			if(!this.#loaded)this.#loaded=this.#e.initSrc.href;
			dict[code]=bmlBrowserPlayTSSection(pid,dict[code],pcr)||dict[code];
		},
		clear: () => {
			bmlBrowserSetInvisible(true);
			if (this.#elems.indicator) this.#elems.indicator.innerText = '';
		},
		disable: () => {
			this.#params.delete('psidata');
			this.#dataStream.clear();
			this.#openSubStream();
		},
		enable: async open => {
			if(this.#loaded&&this.#loaded!=this.#e.initSrc.href)await this.#initWebBml();
			this.#datacastState=this.#STATE.STREAM;
			this.#params.set('psidata', 1);
			bmlBrowserSetInvisible(false);
			if(this.#elems.indicator)this.#elems.indicator.innerText="接続中...";
			if (open) this.#openSubStream();
		}
	}
}

class Datacast extends datacastMixin(){
	constructor(video){
		super(video);
	}
}

class TsLiveDatacast extends tsliveMixin(datacastMixin()){
	constructor(video){
		super(video);
	}
}

class HlsDatacast extends hlsMixin(datacastMixin()){
	constructor(video){
		super(video);
	}
}

customElements.define('ts-live', class extends tsliveMixin(datacastMixin(HTMLCanvasElement)){
	constructor(){
		super();
	}
}, {extends: 'canvas'});

customElements.define('ts-hls', class extends hlsMixin(datacastMixin(HTMLVideoElement)){
	constructor(){
		super();
	}
}, {extends: 'video'});


/*
TvtPlayのチャプターによるループやスキップ機能

本家と以下の違いに注意
＊スキップ区間(ix-ox)ではループしない
＊次のチャプターを検索する際、スキップ開始(ix)を無視する
（OP-CM-Aのような構成でCMを無視）
*/
class chapterTvt{
	#vid;
	#disabled = false;
	#repeat = true;
	#skip = true;
	#ignoreXIN = true;
	#hasSeeked;
	#lastTime = 0;
	#container = document.getElementById('chapMaker-container');
	#currentTime(){return this.#vid.fixedCurrentTime || this.#vid.currentTime}
	constructor(video){
		this.#vid = video;
		document.getElementById('nextChap').addEventListener('click', () => this.#navigate());
		document.getElementById('prevChap').addEventListener('click', () => this.#navigate(false));
		video.addEventListener('timeupdate', () => {
			if (this.#disabled || !this.#chapters) return;

			const currentTime = this.#currentTime();

			// 判定内に手動シークした場合に移動されるのを防ぐ
			if (this.#hasSeeked){
				if (this.#hasSeeked.isLoop ? currentTime < this.#hasSeeked.end || currentTime >= this.#hasSeeked.end + 1 : currentTime >= this.#hasSeeked.start + 1)
					this.#hasSeeked = null; // 判定を抜けたのでリセット
				else return;
			}

			const diff = currentTime - this.#lastTime;
			this.#lastTime = currentTime;

			//シークを検出
			if (Math.abs(diff) > 1){
				this.#hasSeeked = this.#intervals.find(inter => Math.ceil(currentTime) >= inter.start - 1 && Math.floor(currentTime) < inter.end + 1);
				return;
			}

			for (const interval of this.#intervals){
				// 現在の再生時間が1秒以内で移動判定
				if (this.#repeat && interval.isLoop){
					if (currentTime >= interval.end && currentTime < interval.end + 1){
						this.#seek(interval.start);
						break;
					}
				}else if (this.#skip && currentTime >= interval.start && currentTime < interval.start + 1){
					this.#seek(interval.end);
					break;
				}
			}
		});
		//公開フォルダ内はここで直接取得すべきだが。。。
	}

	get reset(){return this.#reset}
	get setChapters(){return this.#parse}
	get navigate(){return this.#navigate}
	set setSeek(fn){this.#setSeek(fn)}

	#reset(){
		this.#lastTime = 0;
		this.#chapters = null;
		this.#intervals = [];
		while (this.#container.firstChild) this.#container.removeChild(this.#container.firstChild);
	}
	#setSeek(fn){this.#seek = fn}
	#seek = val => this.#vid.currentTime = val;

	#TYPE = {
		IN: 1,
		OUT: 2,
		XIN: 3,
		XOUT: 4,
	}
	#raw;
	#chapters;
	#intervals;
	#parse(chap = '', dur){
		this.#raw = chap;
		if (dur) this.#container.style=`--dur:${dur};`;

		this.#chapters = this.#parseOgm(chap) || this.#parseTvt(chap, dur) || [];

		this.#intervals = this.#chapters.map((e,i)=>[e,i]).filter(e => e[0].type === this.#TYPE.XIN || e[0].type === this.#TYPE.IN).map(e => {
			const startCh = e[0];
			const endCh = this.#chapters.slice(e[1]).find(ch => startCh.type === this.#TYPE.XIN && ch.type === this.#TYPE.XOUT || startCh.type === this.#TYPE.IN && ch.type === this.#TYPE.OUT) || {sec: dur, last: true};
			return {
				// 頭、尻切れしないように丸める
				start: Math.ceil(startCh.sec),
				end: Math.floor(endCh.sec - (endCh.last ? 2 : 0.5)),
				isLoop: (startCh.type === this.#TYPE.IN)
			}
		// 開始と終了が同じ秒になった場合は不要（あるいは最低1秒確保）
		}).filter(e => e.end > e.start);

		return [this.#chapters, this.#intervals];
	}

	#parseTvt(chap, dur){
		if (!chap.startsWith('c-')) return;
		// 前後の 'c' を除去して '-' で各セグメントに分割
		const segments = chap.replace(/^c|c$/g, '').split('-').filter(s => s.length > 0);

		return segments.map(segment => {
			const match = segment.match(/^(\d+)([cd])/);
			
			let timePart, unitChar, infoPart;

			if (!match){
				// 数字+単位の形式ではないイレギュラーなケース
				timePart = segment;
				unitChar = 'c'; // デフォルト
				infoPart = "";
			}else{
				timePart = match[1]; // 数字部分
				unitChar = match[2]; // 'c' または 'd'
				infoPart = segment.substring(match[0].length); // 単位文字より後ろすべて
			}

			let time;
			let info = infoPart;
			let last = false;

			// 1. 時間の判定と 0e (終端) の処理
			if (timePart.includes('0e')){
				time = dur;
				// 0e 以外の文字（oxなど）があれば info の先頭に結合
				info = timePart.replace('0e', '') + info;
				last = true;
			}else{
				const divisor = (unitChar === 'c') ? 1000 : 10;
				time = Number(timePart) / divisor;
			}

			// 2. 属性とチャプター名の分離
			const [type, label] = this.#chapterType(info);

			this.#addMarker(time, label, type);

			return {
				sec: time,
				type: type,
				name: label,
				last: last
			};
		});
	}
	#parseOgm(chap){
		if (!chap.startsWith('CHAPTER')) return;

		const lines = chap.split(/\r?\n/).filter(line => line.trim() !== "");
		const chapters = [];

		// 2行1組（時間設定と名前設定）でループを回す
		for (let i = 0; i < lines.length; i += 2){
			const timeLine = lines[i];     // CHAPTER01=00:00:00.000
			const nameLine = lines[i + 1]; // CHAPTER01NAME=Opening

			if (!timeLine || !nameLine) break;

			// 値の部分を抽出
			const timeStr = timeLine.split('=')[1];
			const nameStr = nameLine.split('=')[1];

			if (timeStr && nameStr){
				const [h, m, s] = timeStr.split(':');
				const time = (parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s));
				const [type, label] = this.#chapterType(nameStr);
				this.#addMarker(time, label, type);
				chapters.push({
					sec: time,
					type: type,
					name: label
				});
			}
		}
		return chapters;
	}

	#chapterType(info){
		// 属性判定（長い順）
		if (info.startsWith('ix')) return [this.#TYPE.XIN, info.substring(2)];
		else if (info.startsWith('ox')) return [this.#TYPE.XOUT, info.substring(2)];
		else if (info.startsWith('i')) return [this.#TYPE.IN ,info.substring(1)];
		else if (info.startsWith('o')) return [this.#TYPE.OUT ,info.substring(1)];
		return [0, info]
	}

	#addMarker(sec, label, type = 0){
		const marker = document.createElement('div');
		marker.className = `chapMaker c-${['point','in','out','start','end'][type]}`;
		marker.style = `--sec:${sec??'var(--dur)'};`
		marker.onclick = () => this.#seek(Math.floor(sec - 0.5));
		marker.appendChild(document.createElement('div'));
		const name = document.createElement('span')
		name.innerText = label;
		marker.appendChild(name);
		this.#container.appendChild(marker);
	}

	#navigate(next = true){
		if (!this.#chapters || this.#chapters.length === 0) return;

		const currentTime = this.#currentTime();
		let ch = null;

		// 現在地より「後ろ」にあるチャプターの中で、一番近いものを探す スキップ開始は無視する
		if (next) ch = this.#chapters.find(ch => ch.last || ch.sec > currentTime + 0.5 && !(this.#ignoreXIN && ch.type === this.#TYPE.XIN)); 
			// +0.5s しているのは、チャプター地点にいる時に連打して同じ場所に留まらないようにするため
		// 配列を後ろから検索して、現在地より前のものを見つける
		else ch = this.#chapters.toReversed().find(ch => ch.sec < currentTime - 2);
			// -2s しているのは、チャプター開始直後に「前」を押したら
			// 同じチャプターの頭ではなく、さらに一つ前に戻るため

		if (ch) this.#seek(Math.floor(ch.sec != null ? ch.sec - 0.5 : this.#vid.duration - 2));
		else if(!next) this.#seek(0);	// 前にチャプターがない場合は動画の先頭へ
	}

}

