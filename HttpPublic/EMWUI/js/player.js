let readyToAutoPlay;
let hls,stream;
let Jikkyo = localStorage.getItem('Jikkyo') == 'true';
let DataStream = localStorage.getItem('DataStream') == 'true';
const danmaku = document.getElementById("danmaku-container");
const vid = document.getElementById("video");
const $vid = $(vid);

class HlsLoader{
	#e;
	#ctok;
	#hlsMp4Query;
	constructor(video, aribb24Option, alwaysUseHls, hls4, ctok){
		this.#ctok = ctok;
		this.#hlsMp4Query = hls4 ? `&hls4=${hls4}` : '';
		aribb24Option.enableAutoInBandMetadataTextTrackDetection = !alwaysUseHls || !Hls.isSupported();
		this.#addMethods(video);
		this.#initHls(alwaysUseHls);
	}

	get js(){return this.#hls}
	get clear(){return this.#clear}
	get loadSource(){return this.#loadSource}
	get load(){return this.#load}
	get reload(){return this.#reload}
	set setSeek(v){this.#setSeek(v)}
	set audioTrack(n){this.#setAudioTrack(n)}
	set detelecine(b){this.#setDetelecine(b)}


	#hls;
	#onload;
	#onstart;
	#addMethods(video){
		this.#e = video;
		video.params = new URLSearchParams();
		video.reset = () => this.clear();
		video.loadSource = src => this.#loadSource(src);
		video.setSeek = v => this.#setSeek(v);
		video.setAudioTrack = n => this.#setAudioTrack(n);
		video.setDetelecine = b => this.#setDetelecine(b);
	}
	#initHls(alwaysUseHls){
		if (alwaysUseHls){
			if (Hls.isSupported()){
				this.#hls = new Hls();
				this.#hls.attachMedia(this.#e);
				this.#hls.on(Hls.Events.MANIFEST_PARSED, () => this.#e.dispatchEvent(new Event('streamStarted')));
				this.#hls.on(Hls.Events.FRAG_PARSING_METADATA, (each, data) => data.samples.forEach(d => this.#e.cap&&this.#e.cap.pushID3v2Data(d.pts, d.data)));

				//Android版Firefoxは非キーフレームで切ったフラグメントMP4だとカクつくので避ける
				this.#onload = () => this.#waitForHlsStart(`${this.#e.initSrc}&${this.#e.params.toString()}&hls=${this.#createRandom()}${/Android.+Firefox/i.test(navigator.userAgent)?'':this.#hlsMp4Query}`);
				this.#onstart = src => this.#hls.loadSource(src);
			}else if (this.#e.canPlayType('application/vnd.apple.mpegurl')){
				this.#onload = () => this.#e.src = this.#e.initSrc.href;
			}
		}else{
			//AndroidはcanPlayTypeが空文字列を返さないことがあるが実装に個体差が大きいので避ける
			if (!/Android/i.test(navigator.userAgent)&&this.#e.canPlayType('application/vnd.apple.mpegurl')){
				this.#onload = () => this.#waitForHlsStart(`${this.#e.initSrc}&${this.#e.params.toString()}&hls=${this.#createRandom()}${this.#hlsMp4Query}`);
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

	#setAudioTrack(n){
		if (isNaN(n)) return;
		this.#e.params.set('audio2', n);
		this.reload();
	}
	#setDetelecine(b){
		if (typeof b !== 'boolean') return;
		if (b) this.#e.params.set('cinema', 1);
		else this.#e.params.delete('cinema');
		this.reload();
	}
	#reset(){
		this.#src = '';
		if (this.#hls) this.#hls.loadSource('');
		if (this.#e.cap) this.#e.cap.detachMedia();
		['ofssec','offset'].forEach(e => {
			this.#e[e] = null;
			this.#e.params.delete(e);
		});
	}
	#clear(){
		this.#reset();
		this.#e.src = '';
		this.#e.initSrc = null;
		['reload','audio2'].forEach(e => this.#e.params.delete(e));
	}
	#loadSource(src){
		if (!src){
			this.#clear();
			return;
		}
		this.#e.initSrc = new URL(src, location.href);
		this.#e.initSrc.searchParams.set('ctok', this.#ctok);
		this.#load();
	}
	#load(){
		this.#e.params.set('load', this.#createRandom());
		this.#onload();
	}
	#reload(seek = this.#e.currentTime * (this.#e.fast || 1) + (this.#e.ofssec || 0)){
		if (this.#e.params.has('load')){
			this.#e.params.set('reload', this.#e.params.get('load'));
			this.#e.params.delete('load');
		}

		this.#e.doNotAutoplay = this.#e.paused;
		this.#reset();
		if (seek){
			const key = seek<1 ? 'offset' : 'ofssec';
			this.#e[key] = Math.floor(seek*(seek<1?100:1));
			this.#e.params.set(key, this.#e[key]);
		}

		this.#onload();
	}
	#setSeek(value){
		if (1 < value && this.#e.ofssec < value && value < this.#e.ofssec + this.#e.duration)
			this.#e.currentTime = value - this.#e.ofssec;
		else this.#reload(this.value);
	}

	#method;
	#src;
	#waitForHlsStart(src){
		this.#method = 'POST';
		this.#src = src;
		this.#poll();
	}
	#interval = 200;
	#delay = 500;
	#poll(){
		if (!this.#src) return;

		var xhr = new XMLHttpRequest();
		xhr.open(this.#method, this.#src);
		if (this.#method == 'POST') xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		this.#method = 'GET';
		xhr.onloadend = () => {
			if (xhr.status == 200 && xhr.response){
				if (xhr.response.indexOf('#EXT-X-MEDIA-SEQUENCE:') < 0) setTimeout(() => this.#poll(), this.#interval);
				else setTimeout(() => {if (!this.#src) return;this.#onstart(this.#src);}, this.#delay);
			}else{
				this.#e.dispatchEvent(new Event('hlserror'));
			}
		}
		xhr.send(`ctok=${this.#ctok}&open=1`);
	}
}

customElements.define('ts-live', class extends HTMLCanvasElement{
	#error;
	#currentTime;
	#playbackRate;
	#paused;
	#muted;
	#volume;
	#detelecine;
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
	constructor(){
		super();
		this.#playbackRate = 1;
		this.#paused = true;
		this.#muted = this.hasAttribute('muted');
		this.#volume = 1;
		this.#detelecine = this.hasAttribute('autoCinema') ? 2 : 0;
		this.#statsTime = 0;
		this.#sameStatsCount = 0;
		this.#currentReader = null;
		this.#ctok = this.getAttribute('ctok');
		this.#params = new URLSearchParams();
		this.#initialize();
		if (this.#isUnsupported()) return;
		this.#createWasmModule();
	}


	get tslive(){return true}
	get params(){return this.#params}

	get loadSource(){return this.#loadSource}
	get load(){return this.#load}
	get play(){return this.#play}
	get pause(){return this.#pause}
	get reset(){return this.#reset}
	get setAudioTrack(){return this.#setAudioTrack}
	get setDetelecine(){return this.#setDetelecine}
	get setSeek(){return this.#setSeek}

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
	/*
	get poster(){return this.#poster??''}
	set poster(src){this.#setPoster(src)}
	//*/


	#createWasmModule(){
		navigator.gpu.requestAdapter().then(adapter => adapter.requestDevice().then(device => {
			createWasmModule({preinitializedWebGPUDevice:device}).then(mod => {
				this.#mod = mod;
				mod.setAudioGain(this.#muted?0:this.#volume);
				mod.setDetelecineMode(this.#detelecine);
				mod.pauseMainLoop();
				mod.setCaptionCallback((pts,ts,data) => this.cap&&this.cap.pushRawData(this.#statsTime+ts,data.slice()));
				mod.setStatsCallback(stats => {
					if(this.#statsTime!=stats[stats.length-1].time){
						this.#currentTime+=stats[stats.length-1].time-this.#statsTime;
						this.#statsTime=stats[stats.length-1].time;
						this.dispatchEvent(new Event('timeupdate'));
						this.cap&&this.cap.onTimeupdate(this.#statsTime);
						this.#sameStatsCount=0;
						//statsの中身がすべて同じ状態が続くとき、最後まで再生したとみなす
					}else if(stats.slice(1).every(e=>Object.keys(e).every(key=>stats[0][key]==e[key]))){
						if(++this.#sameStatsCount>=5){
							this.#sameStatsCount=0;
							this.pause();
							this.dispatchEvent(new Event('ended'));
						}
					}else{
						this.#sameStatsCount=0;
					}
					if(this.#detelecine==2)this.dispatchEvent(new Event(`${stats[stats.length-1].TelecineFlag?'enabled':'disabled'}Detelecine`));
					if(this.#done) return;
					this.dispatchEvent(new Event('canplay'));	//疑似的、MainLoopがpauseだと呼び出されない
					this.#done = true;
				});
			});
		})).catch(e => {
			this.#error = {code: 0, message: e.message};
			this.dispatchEvent(new Event('error'));
			throw e;
		});
	}

	#initialize(){
		this.#src = '';
		this.#error = null;
		this.#networkState = this.#networkStateCode.EMPTY;
		this.#currentTime = 0;
		this.#done = false;
		this.#wakeLock = null;
	}

	#loadSource(src){
		if (!src){
			this.#reset();
			return;
		}
		this.initSrc = new URL(src, location.href);
		this.initSrc.searchParams.set('ctok', this.#ctok);
		this.load();
	}
	#load(){
		this.#setSrc(`${this.initSrc}&option=${this.params.get('option')}`);
	}
	#play(){
		this.#paused = false;
		this.#mod.resumeMainLoop();
		this.dispatchEvent(new Event('play'));
	}
	#pause(){
		this.#paused = true;
		this.#mod.pauseMainLoop();
		this.dispatchEvent(new Event('pause'));
	}
	#clear(){
		this.src = '';
		this.removeAttribute('src');
		this.initSrc = null;
		this.offset = null;
		this.ofssec = null;
		if (this.cap) this.cap.detachMedia();
	}
	#reset(){
		this.#clear();
		this.#initialize();
		if (!this.#mod||!this.#ctrl) return;
		this.pause();
		this.#mod.reset();
		this.#ctrl.abort();
		//Androidでリセットすると再描画されないためとりあえず除外、モバイルでtsliveに対応してるのはAndroidのChromeだけなはずなのでisMobileで対応、他がwebgpu対応したら見直す
		if (!isMobile) this.getContext("webgpu").configure({device: this.#mod.preinitializedWebGPUDevice,format: navigator.gpu.getPreferredCanvasFormat(),alphaMode: "premultiplied",});
	}

	#setAudioTrack(n){
		if (isNaN(n)) return;
		this.#mod.setDualMonoMode(n);
	}
	#setMuted(b){
		this.#muted = b;
		this.#mod&&this.#mod.setAudioGain(b ? 0 : this.#volume);
		this.dispatchEvent(new Event('volumechange'));
	}
	#setVolume(n){
		if (isNaN(n)) return;
		this.#volume = Number(n);
		this.#mod&&this.#mod.setAudioGain(n);
		this.dispatchEvent(new Event('volumechange'));
	}
	#setPlaybackRate(n){
		if (isNaN(n)) return;
		this.#playbackRate = Number(n);
		this.#mod.setPlaybackRate(n);
		this.dispatchEvent(new Event('ratechange'));
	}
	#setDetelecine(n){
		//0=never,1=force,2=auto
		if (n==='boolean') n = n ? 1 : 0;
		if (isNaN(n)) return;
		this.#detelecine = Number(n);
		this.#mod.setDetelecineMode(n);
	}
	
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
	#setSeek(val){
		if (0<val&&val<1) this.#setOffset(val*100);
		else this.#setCurrentTime(val);
	}
	#setCurrentTime(ofssec){
		if (!Number(ofssec)) return;
		this.#currentTime = Math.floor(ofssec);
		this.#src.searchParams.set('ofssec', ofssec);
		this.#resetRead();
	}
	#setOffset(offset){
		if (!Number(offset)) return;
		this.#src.searchParams.set('offset', offset);
		this.#resetRead();
	}
	#isUnsupported(){
		if (!('createWasmModule' in window)) this.#error = {code: 0, message: 'Probably ts-live.js not found.'};
		if (!navigator.gpu) this.#error = {code: 0, message: 'WebGPU not available.'};
		if (this.#error){
			this.dispatchEvent(new Event('error'));
			return true;
		}
	}
	#setSrc(src){
		if (!src || this.#isUnsupported()) return;
		if (!this.#mod){
			setTimeout(() => this.#setSrc(src), 500);
			return;
		}
		this.#initialize();
		this.setAttribute('src', src);
		this.#src = new URL(src, location.href);
		this.#src.searchParams.set('throttle', 1);
		this.#startRead();
		this.#mod.resumeMainLoop();
		this.#paused = false;
	}
	#canPlayType(s){return document.createElement('video').canPlayType(s)}


	#readNext(reader,ret){
		if (reader==this.#currentReader&&ret&&ret.value){
			var inputLen=Math.min(ret.value.length,1e6);
			var buffer=this.#mod.getNextInputBuffer(inputLen);
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
				this.dispatchEvent(new Event('error'));
				return;
			}
			this.dispatchEvent(new Event('streamStarted'));
			this.#currentReader = response.body.getReader();
			this.#readNext(this.#currentReader,null);
			//Prevent screen sleep
			if (!this.#wakeLock) navigator.wakeLock.request("screen").then(lock => this.#wakeLock = lock);
		});
		['ofssec','offset'].forEach(e => this.#src.searchParams.delete(e));
	}
	#resetRead(){
		this.#ctrl.abort();
		this.#mod.reset();
		this.#startRead();
		this.play();
	}
}, {extends: 'canvas'});

vid.muted = localStorage.getItem('muted') == 'true';
vid.volume = localStorage.getItem('volume') || 1;
if (vid.tslive){
	//自動再生ポリシー対策
	const muted = vid.muted;
	vid.muted = true;
	$(document).one('click', () => {
		vid.muted = muted;
		document.querySelector('#volume').MaterialSlider.change(vid.muted?0:vid.volume);
	});	
}

class TsThumb{
	#mod;
	#url;
	#api;
	#e;
	#vid;
	constructor(api, canvas, video){
		if (api) this.#api = api;
		if (canvas) this.#e = canvas;
		if (video) this.#vid = video;
		this.#reset();
		if (!('createMiscWasmModule' in window)) return;
		createMiscWasmModule().then(mod => this.#mod = mod);
	}

	get setThumb(){return this.#setThumb}

	get hide(){return this.#hide}

	get seek(){return this.#seek}
	get reset(){return this.#reset}

	get roll(){return this.#roll}


	#reset(){
		this.#url = new URL(this.#api, location.href);
	}

	#id = 1;
	#loading;
	async #get(path, value, id){
		if (!this.#mod) return;
	
		const url = path ? new URL(this.#api, location.href) : this.#url;
		if (path) url.searchParams.set('fname', path);
		this.#value = value;

		this.#loading = true;
		const frame = await fetch(`${url}&${0<value&&value<1?'offset':'ofssec'}=${Math.floor(0<value&&value<1?value*100:value)||0}`).then(r => {
			if (id && id!=this.#id || !r.ok) throw r;
			return r.arrayBuffer();
		}).then(r => {
			const buffer = this.#mod.getGrabberInputBuffer(r.byteLength);
			buffer.set(new Uint8Array(r));
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

	async #setThumb(canvas, path, value){
		const frame = await this.#get(path, value);
		if (!frame) return;
		this.#putImage(frame, canvas);
		return true;
	}

	#value;
	#timerID = 0;
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
	#roll(canvas, path, offset = 0){
		this.#e = canvas;
		this.#url.searchParams.set('fname', path);
		this.#rollLoop(offset);
	}

	#hide(){
		clearTimeout(this.#timerID);
		this.#id++;
		this.#e.style.display = "none";
		this.#value = null;
	}
}

const thumb = 'createMiscWasmModule' in window && new TsThumb(`${ROOT}api/grabber`, document.querySelector('#vid-thumb'), vid);

const getVideoTime = t => {
	if (!t && t != 0) return '--:--'
	const h = Math.floor(t / 3600);
	const m = Math.floor((t / 60) % 60);
	const s = zero(Math.floor(t % 60));
	return `${h > 0 ? `${h}:` : ''}${zero(m, h > 0 || m > 9 ? 2 : 1)}:${s}`;
}

const $player = $('#player');
const $playerUI_titlebar = $('#playerUI,#titlebar');
const $contral = $('#control .mdl-menu__container');
const $subtitles = $('#subtitles');
const $vid_meta = $('#vid-meta');
let hoverID = 0;
const hideBar = (t = 0) => {
	if (hoverID) clearTimeout(hoverID);
	hoverID = setTimeout(() => {
		if (vid.paused) return;

		$playerUI_titlebar.removeClass('is-visible');
		$contral.removeClass('is-visible');
		$player.css('cursor', 'none');
	}, t);
}
const stopTimer = () => {
	if (hoverID) clearTimeout(hoverID);
	hoverID = 0;
	$player.css('cursor', 'default');
}

const createCap = () => {
	vid.cap ??= aribb24UseSvg ? new aribb24js.SVGRenderer(aribb24Option) : new aribb24js.CanvasRenderer(aribb24Option);
	if (vid.tslive) vid.cap.attachMedia(null,document.getElementById("vid-cont"));
	else vid.cap.attachMedia(vid);
	if (!$subtitles.hasClass('checked')) vid.cap.hide();
}

const resetVid = () => {
	vid.reset();
	stream.clear();

	$vid_meta.attr('src', '');
	$vid_meta.off('cuechange', oncuechangeB24Caption);
	if (thumb) thumb.reset();
}

const $audio = $('#audio');
const $cinema = $('#cinema');
const $remote = $('#remote');
const $remote_control = $('.remote-control');
const $danmaku = $('#danmaku');

const checkTslive = path => {
	const url = new URL(location.href);
	const isTs = !path || /\.(?:m?ts|m2ts?)$/.test(path);
	const tslive = isTs && $(`#${localStorage.getItem('quality')}`).hasClass('tslive');
	if (!vid.tslive && tslive){
		url.searchParams.set('tslive', 1);
		history.replaceState(null, null, url);
		location.reload();
		return true;
	}else if (vid.tslive && !tslive){
		url.searchParams.delete('tslive');
		history.replaceState(null, null, url);
		location.reload();
		return true;
	}
}

const seek = document.querySelector('#seek');
const $seek = $(seek);
const $duration = $('.duration');
const $quality = $('.quality');
const $audios = $('.audio');
const $titlebar = $('#titlebar');
const loadMovie = ($e = $('.is_cast')) => {
	const d = $e.data();
	d.canPlay = d.path ? vid.canPlayType(`video/${d.path.match(/[^\.]*$/)}`).length > 0 : false;
	if (checkTslive(d.path)) return;

	if ($e.hasClass('item')){
		$('#playprev').prop('disabled', $e.is('.item:first'));
		$('#playnext').prop('disabled', $e.is('.item:last' ));
	}
	if ($e.hasClass('onair')){
		$('#playprev').prop('disabled', $e.is('.is-active>.onair:first'));
		$('#playnext').prop('disabled', $e.is('.is-active>.onair:last'));
	}

	resetVid();
	$vid.addClass('is-loading');

	$seek.attr('disabled', false);
	$quality.attr('disabled', d.canPlay);
	if (d.canPlay){
		const path = `${ROOT}${!d.public ? `api/Movie?fname=${encodeURIComponent(d.path)}` : encodeURIComponent(d.path).replace('%2F','/')}`;
		$vid.attr('src', path);
		$vid_meta.on('cuechange', oncuechangeB24Caption);
		$vid_meta.attr('src', `${path.replace(/\.[0-9A-Za-z]+$/,'')}.vtt`);
		stream.toggleJikkyo($danmaku.hasClass('checked'), Jikkyo);
	}else{
		vid.loadSource(`${ROOT}api/${d.onid ? `view?n=${vid.nwtv||0}&id=${d.onid}-${d.tsid}-${d.sid}`
		                            		: `xcode?${d.path ? `fname=${encodeURIComponent(d.path)}` : d.id ? `id=${d.id}` : d.reid ? `reid=${d.reid}` : ''}` }`);

		if (!d.meta) return;

		if (d.meta.duration){
			$duration.text(getVideoTime(d.meta.duration));
			$seek.attr('max', d.meta.duration);
			$seek.attr('step', 1);
		}else{
			$duration.text(getVideoTime());
			$seek.attr('max', 1);
			$seek.attr('step', 0.01);
		}
	    if (d.meta.audio) $audios.attr('disabled', d.meta.audio == 1);
	}

	$remote.prop('disabled', stream.datacast.unavailable);
	if (stream.datacast.unavailable) $remote_control.addClass('disabled').find('button').prop('disabled', true);

	$titlebar.html(d.name || (!(`${d.onid}-${d.tsid}-${d.sid}-${d.eid}` in Info.EventInfo) ? '' :
		`${ConvertService(Info.EventInfo[`${d.onid}-${d.tsid}-${d.sid}-${d.eid}`])}<span>${ConvertTitle(Info.EventInfo[`${d.onid}-${d.tsid}-${d.sid}-${d.eid}`].title)}</span>`));
}

const $currentTime_duration = $('.currentTime,.duration');
const playMovie = $e => {
	if ($e.hasClass('playing')){
		hideBar(2000);
		vid.play();
	}else{
		seek.MaterialSlider&&seek.MaterialSlider.change(0);
		$currentTime_duration.text('0:00');
		$audios.attr('disabled', true);
		$('.playing').removeClass('is_cast playing');
		$e.addClass('is_cast playing');
		loadMovie($e);
	}
}

$(window).on('load resize', () => {
	$player.toggleClass('is-small', $vid.width() < 800);
	if (vid.fullscreen) return;

	if (vid.theater || isSmallScreen()){
		vid.theater = true;
		$('#movie-contner #player').prependTo('#movie-theater-contner');
	}else{
		$('#movie-theater-contner #player').prependTo('#movie-contner');
	}
});

$(function(){
	$('#autoplay').prop('checked', sessionStorage.getItem('autoplay') == 'true');
	$('#apk').prop('checked', localStorage.getItem('apk') == 'true');

	const $volume = $('#volume');
	$volume.on('mdl-componentupgraded', () => $volume.get(0).MaterialSlider.change(vid.muted ? 0 : vid.volume));
	$remote_control.insertAfter('#movie-contner');


	//閉じる
	$('.close.mdl-badge').click(() => {
		$('#popup').removeClass('is-visible');
		vid.pause();
		vid.playbackRate = 1;
	});

	const $play_icon = $('#play i');
	const $currentTime = $('.currentTime');
	const $playerUI = $('#playerUI');
	const $live = $('#live');
	$vid.on({
		pause(){$play_icon.text('play_arrow')},
		play(){$play_icon.text('pause')},
		ended(){
			const autoplay = sessionStorage.getItem('autoplay') == 'true';
			if (autoplay && !$('.playing').is('.item:last')){
				$('.playing').next().click();
				$titlebar.addClass('is-visible');
			}else{
				if (autoplay && $('.playing').is('.item:last')) Snackbar('最後のファイルを再生しました');
				$playerUI.addClass('is-visible');
			}
		},
		error(){
			if ($vid.attr('src') == '') return;

			$vid.removeClass('is-loading');
			$('.is_cast').removeClass('is_cast playing');
			const errorcode = vid.networkState == 3  ? 5 : vid.error.code;
			Snackbar(`Error : ${[vid.error.message,'MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED','NETWORK_NO_SOURCE'][errorcode]}`);
		},
		hlserror(){
			$vid.removeClass('is-loading');
			$('.is_cast').removeClass('is_cast playing');
			Snackbar('Error : HLS loading error');
		},
		volumechange(){
			this.onVolumeChange();
			localStorage.setItem('volume', this.volume);
			localStorage.setItem('muted', this.muted);
		},
		//ratechange(){if (sessionStorage.getItem('autoplay') == 'true') vid.defaultPlaybackRate = vid.playbackRate;},
		canplay(){
			hideBar(2000);
			$vid.removeClass('is-loading');

			if (!this.doNotAutoplay){
				const promise = this.play();
				//自動再生ポリシー対策 https://developer.chrome.com/blog/autoplay?hl=ja
				if (promise !== undefined){
					promise.catch(error => {
						this.muted = true;
						this.play();
						this.onVolumeChange();
						document.querySelector('#volume').MaterialSlider.change(0);
						$(document).one('click', () => {
							this.muted = false;
							document.querySelector('#volume').MaterialSlider.change(this.volume);
						});
					});
				}
			}
			const d = $('.is_cast').data();
			if (!d.canPlay) return;

			$duration.text(getVideoTime(this.duration));
			$seek.attr('max', this.duration);
		},
		timeupdate(){
			const d = $('.is_cast').data();
			if (!d) return;

			let currentTime;
			if (d.onid){
				currentTime = (Date.now() - d.meta.starttime) / 1000;
				seek.MaterialProgress.setProgress(currentTime / d.meta.duration * 100);
				$live.toggleClass('live', this.duration - this.currentTime < 2);
			}else if (d.path || d.id || d.reid){
				if ($seek.data('touched')) return;

				currentTime = this.currentTime * (this.fast || 1) + (this.ofssec || 0);
				if (!vid.offset) seek.MaterialSlider.change(currentTime);
			}
			$currentTime.text(getVideoTime(currentTime));
		},
		streamStarted(){
			if (DataStream && false || !$remote_control.hasClass('disabled')) stream.toggleDatacast(true);	//一度しか読み込めないため常時読み込みはオミット
			stream.toggleJikkyo($danmaku.hasClass('checked'), Jikkyo);
			createCap();
		},
		enabledDetelecine(){
			$('#cinema').mdl_prop('checked', true);
		},
		disabledDetelecine(){
			$('#cinema').mdl_prop('checked', false);
		},
		disabledDatacast(){
			$remote.prop('disabled', true);
			$remote_control.addClass('disabled').find('button').prop('disabled', true);
		}
	});

	$('#play').click(() => vid.paused ? vid.play() : vid.pause());
	
	const $quality_audio = $('.quality,.audio');
	const $stop = $('.stop');
	const $epginfo = $('#epginfo');
	$stop.click(() => {
		resetVid();
		const params = new URLSearchParams(location.search);
		params.delete('id');
		params.delete('play');
		history.replaceState(null,null,`${params.size>0?`?${params.toString()}`:location.pathname}`);
		$vid.removeClass('is-loading');
		$epginfo.addClass('hidden');
		$('.is_cast').removeClass('is_cast');
		$('.playing').removeClass('playing');
		$titlebar.empty();
		$seek.hasClass('mdl-progress') ? seek.MaterialProgress.setProgress(0) : seek.MaterialSlider.change(0);
		$currentTime_duration.text('0:00');
		$seek.attr('disabled', true);
		$quality_audio.attr('disabled', true);
	});

	$seek.on({
		change(){
			if ($('.is_cast').data('canPlay')) return;

			$vid.addClass('is-loading');
			vid.setSeek(this.value);
		},
		input(){
			$currentTime.text(getVideoTime(this.value));
			if ($('.is_cast').data('canPlay')) vid.currentTime = this.value;

			if (!thumb || $(this).data('hover')) return;
			thumb.seek(this.value, this.value/$(this).attr('max')*100);
		},
		mousedown(){$(this).data('touched', true)},
		mouseenter(e){
			if (!thumb) return;
			$(this).data('hover', true);
			document.querySelector('#vid-thumb').style.setProperty('--width', $player.width()+'PX');
			thumb.seek(Math.min(Math.max(0,$(this).attr('max')*e.offsetX/this.clientWidth),$(this).attr('max')), e.offsetX/this.clientWidth*100);
		},
		touchstart(){
			$(this).data('touched', true);
			if (!thumb) return;
			stopTimer();
			document.querySelector('#vid-thumb').style.setProperty('--width', $player.width()+'PX');
		},
		mousemove(e){
			if (!thumb) return;
			$(this).data('hover', false);
			thumb.seek(Math.min(Math.max(0,$(this).attr('max')*e.offsetX/this.clientWidth),$(this).attr('max')), e.offsetX/this.clientWidth*100);
		},
		mouseup(){$(this).data('touched', false)},
		touchend(){
			$(this).data('touched', false);
			if (thumb) thumb.hide();
		},
		mouseleave(){if (thumb) thumb.hide();}
	});

	$volume.on('input', () => {
		vid.muted = false;
		vid.volume = $volume.val();
	});

	const $volume_icon = $('#volume-icon');
	const $volume_icon_i = $('#volume-icon i');
	$volume_icon.click(() => {
		vid.muted = !vid.muted;
		$volume.get(0).MaterialSlider.change(vid.muted ? 0 : vid.volume);
	});
	vid.onVolumeChange = () => $volume_icon_i.text(`volume_${vid.muted ? 'off' : vid.volume == 0 ? 'mute' : vid.volume > 0.5 ? 'up' : 'down'}`);
	vid.onVolumeChange();

	$('#fullscreen').click(() => {
		const player = document.querySelector('#player');
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement){
			if (player.requestFullscreen) player.requestFullscreen();
			else if (player.msRequestFullscreen) player.msRequestFullscreen();
			else if (player.mozRequestFullScreen) player.mozRequestFullScreen();
			else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);

			vid.fullscreen = true;

			if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape');
			else if (window.screen.lockOrientation) window.screen.lockOrientation('landscape');
			else if (window.screen.mozLockOrientation) window.screen.mozLockOrientation('landscape');
			else if (window.screen.webkitLockOrientation) window.screen.webkitLockOrientation('landscape');

			$('#fullscreen i').text('fullscreen_exit');
			$('.mdl-js-snackbar').appendTo('#player');
			$('.remote-control,#comment-control').prependTo('.player-container');
		}else{
			if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
			else if (window.screen.unlockOrientation) window.screen.unlockOrientation();
			else if (window.screen.mozUnlockOrientation) window.screen.mozUnlockOrientation();
			else if (window.screen.webkitUnlockOrientation) window.screen.webkitUnlockOrientation();

			if (document.exitFullscreen) document.exitFullscreen();
			else if (document.msExitFullscreen) document.msExitFullscreen();
			else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
			else if (document.webkitExitFullscreen) document.webkitExitFullscreen();

			vid.fullscreen = false;
			$('#fullscreen i').text('fullscreen');
			$('.mdl-js-snackbar').appendTo('.mdl-layout');
			$remote_control.insertAfter('#movie-contner');
		}
	});
	const enableDocumentPIP = 'documentPictureInPicture' in window;
	if (!document.pictureInPictureEnabled || vid.tslive && !enableDocumentPIP) $('#PIP,#PIP_exit').hide();
	else{
		document.getElementById('PIP').addEventListener('click', async () => {
			if (!enableDocumentPIP){
				vid.requestPictureInPicture();
				return;
			}

			$('.remote-control,#comment-control').prependTo('.player-container');
			const content = document.getElementById('player');
			const container = content.parentNode;
			$(container).height($vid.height());
			const pipWindow = await documentPictureInPicture.requestWindow();

			// Copy style sheets over from the initial document
			// so that the player looks the same.
			[...document.styleSheets].forEach((styleSheet) => {
				try {
					const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
					const style = document.createElement('style');

					style.textContent = cssRules;
					pipWindow.document.head.appendChild(style);
				} catch (e) {
					const link = document.createElement('link');

					link.rel = 'stylesheet';

					link.type = styleSheet.type;
					link.media = styleSheet.media;
					link.href = styleSheet.href;
					pipWindow.document.head.appendChild(link);
				}
			});
			pipWindow.document.body.setAttribute('id','popup');
			pipWindow.document.body.setAttribute('class','is-visible');
			pipWindow.document.body.append(content);
			
			pipWindow.addEventListener('resize', () => setbmlBrowserSize());
			pipWindow.addEventListener("pagehide", (event) => {
				const pipContent = event.target.getElementById("player");
				container.append(pipContent);
				$remote_control.insertAfter('#movie-contner');
				if (vid.theater) $('#movie-theater-contner').height('');
				else $('#movie-contner').height('').width('');
			});
		});
		$('#PIP_exit').click(() => documentPictureInPicture.window.close())
	}
	$('#defult').click(() => {
		vid.theater = true;
		$player.prependTo($('#movie-theater-contner'));
		setbmlBrowserSize();
	});
	$('#theater').click(() => {
		vid.theater = false;
		$player.prependTo($('#movie-contner'));
		setbmlBrowserSize();
	});

	$('#autoplay').change(e => {
		sessionStorage.setItem('autoplay', $(e.currentTarget).prop('checked'));
		//vid.defaultPlaybackRate = $(e.currentTarget).prop('checked') ? vid.playbackRate : 1;
	});

	if (localStorage.getItem('quality')) $(`#${localStorage.getItem('quality')}`).prop('checked', true);
	vid.params.set('option', localStorage.getItem('quality') ? $(`#${localStorage.getItem('quality')}`).val() : 1);
	$('[name=quality]').change(e => {
		const $e = $(e.currentTarget);
		localStorage.setItem('quality', $e.attr('id'));
		vid.params.set('option', $e.val());

		if (checkTslive() || localStorage.getItem('apk') == 'true') return;		
		$vid.addClass('is-loading');
		hls.reload();
	});
	$('[name=audio]').change(e => {
		vid.setAudioTrack($(e.currentTarget).val());
	});
	const $cinema = $('#cinema');
	$cinema.change(e => {
		vid.setDetelecine(e.currentTarget.checked);
	});
	const $rate = $('.rate');
	$rate.change(e => {
		const $e = $(e.currentTarget);
		const isTs = !$('.is_cast').data('path') || /\.(?:m?ts|m2ts?)$/.test($('.is_cast').data('path'));
		//極力再読み込みは避けたい
		if (hls && isTs && $e.val()>1){	
			vid.fast = $e.val();
			vid.params.set('fast', $e.data('index'));
			stream.setFast(null);
			$vid.addClass('is-loading');
			hls.reload();
			return;
		}else if (vid.params.has('fast')){
			vid.params.delete('fast');
			$vid.addClass('is-loading');
			hls.reload();
		}

		vid.fast = 1;
		vid.playbackRate = $e.val();
		stream.setFast($e.val());
	});

	//TS-Live!有効時、非対応端末は画質選択無効
	$('.tslive').attr('disabled', !window.isSecureContext || !navigator.gpu);


	hideBar();
	$player_container = $('.player-container>*').not('.remote-control');
	if (!isMobile && !isTouch){
		$player_container.hover(() => {
			stopTimer();
			$playerUI.addClass('is-visible');
		}, () => hideBar());

		$player_container.mousemove(() => {
			stopTimer();
			hideBar(2000);
			$playerUI.addClass('is-visible');
		});
	}else{
		$('#playerUI').prepend('<div id="center">');
		$('#ctl-button .ctl-button').prependTo('#center');
		$('#volume-container').addClass('hidden');
		$('.player-container>*').not('.remote-control').click(() => {
			$('#playerUI').addClass('is-visible');
			stopTimer();
			hideBar(2000);
		});
	}

	$('#live:not(.live)').click(() => vid.currentTime = vid.duration);

	$subtitles.click(() => {
		$subtitles.toggleClass('checked', !$subtitles.hasClass('checked'));
		localStorage.setItem('subtitles', $subtitles.hasClass('checked'));
		if (!vid.cap) return;
		$subtitles.hasClass('checked') ? vid.cap.show() : vid.cap.hide();
	});
	if (localStorage.getItem('subtitles') == 'true') $subtitles.addClass('checked');

	if (DataStream) $remote.addClass('mdl-button--accent');
	$remote.on({
		'click': () => {
			if (!$remote.data('click')) return;

			clearTimeout($remote.data('click'));
			$remote.data('click', false);
			const disabled = !$remote_control.hasClass('disabled');
			$remote_control.toggleClass('disabled', disabled).find('button').prop('disabled', disabled);

			stream.toggleDatacast(!disabled);
		},
		'touchstart mousedown': e => {
			if (e.which > 1 || $remote.data('click')) return;

			$remote.data('click', setTimeout(() => {
				$remote.data('click', false);
				DataStream = !DataStream;
				localStorage.setItem('DataStream', DataStream);
				$remote.toggleClass('mdl-button--accent', DataStream);

				stream.toggleDatacast(!$remote_control.hasClass('disabled'));
			}, 1000));
		}
	});

	$('#num').change(e => $('.remote-control .num').toggleClass('hidden', !$(e.currentTarget).prop('checked')));

	if (localStorage.getItem('danmaku') == 'true') $danmaku.addClass('checked');
	if (Jikkyo) $danmaku.addClass('mdl-button--accent');

	$danmaku.on({
		'click': () => {
			if (!$danmaku.data('click')) return;

			clearTimeout($danmaku.data('click'));
			$danmaku.data('click', false).toggleClass('checked', !$danmaku.hasClass('checked'));
			localStorage.setItem('danmaku', $danmaku.hasClass('checked'));

			stream.toggleJikkyo($danmaku.hasClass('checked'), Jikkyo);
		},
		'touchstart mousedown': e => {
			if (e.which > 1 || $danmaku.data('click')) return;

			$danmaku.data('click', setTimeout(() => {
				$danmaku.data('click', false);
				Jikkyo = !Jikkyo;
				localStorage.setItem('Jikkyo', Jikkyo);
				$danmaku.toggleClass('mdl-button--accent', Jikkyo);

				stream.toggleJikkyo($danmaku.hasClass('checked'), Jikkyo);
			}, 1000));
		}
	});
	
	$("#jikkyo-comm").appendTo('#apps-contener>.contener>.contener');
	$('#apps').change(e => {
		($(e.currentTarget).prop('checked'))
			? $('#comment-control').insertAfter('#apps-contener>.contener>.contener')
			: $('#comment-control').prependTo('.player-container');
		localStorage.setItem('apps', $(e.currentTarget).prop('checked'));
	});
	if (localStorage.getItem('apps') == 'true') $('#apps').click();

	$('#comment-control').hover(e => $(e.currentTarget).addClass('is-visible'), e => $(e.currentTarget).removeClass('is-visible'));

	$('#comm').focus(() => $('#comment-control').addClass('is-focused')
		).blur(() => $('#comment-control').removeClass('is-focused')
		).change(e => $('#comment-control').toggleClass('is-dirty', $(e.currentTarget).val()!='')
	).on({
		sentComment(){
			$('#comment-control,#comment-control>div').removeClass('is-dirty');
		}
	});

	//準備できてから再生開始
	if (readyToAutoPlay) readyToAutoPlay();
});
