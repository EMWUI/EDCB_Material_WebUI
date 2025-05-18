let readyToAutoPlay;
const videoParams = new URLSearchParams();
const streamParams = new URLSearchParams();
const hls = window.Hls&&Hls.isSupported() && new Hls();
let Jikkyo = localStorage.getItem('Jikkyo') == 'true';
let DataStream = localStorage.getItem('DataStream') == 'true';
vid = document.getElementById("video");
const $vid = $(vid);

if (hls) hls.attachMedia(vid);
if (vid.tagName == "CANVAS") vid = new class {
	#e;
	#error;
	#currentTime;
	#playbackRate;
	#paused;
	#muted;
	#volume;
	#url;
	#networkState;
	#mod;
	#done;
	#statsTime;
	#sameStatsCount;
	#currentReader;
	#wakeLock;
	#ctrl;
	constructor(e){
		this.#e = e;
		this.#playbackRate = 1;
		this.#paused = true;
		this.#muted = false;
		this.#volume = 1;
		this.#statsTime = 0;
		this.#sameStatsCount = 0;
		this.#currentReader = null;
		this.#initialize();
		if(!window.createWasmModule || !navigator.gpu) return;
		navigator.gpu.requestAdapter().then(adapter => adapter.requestDevice().then(device => {
			createWasmModule({preinitializedWebGPUDevice:device}).then(mod => {
				this.#mod = mod;
				mod.setAudioGain(1);	//一発目無効対策
				setTimeout(() => mod.setAudioGain(this.#muted?0:this.#volume), 500);
				mod.pauseMainLoop();
				mod.setCaptionCallback((pts,ts,data) => this.cap&&this.cap.pushRawData(this.#statsTime+ts,data.slice()));
				mod.setStatsCallback(stats => {
					if(this.#statsTime!=stats[stats.length-1].time){
						this.#currentTime+=stats[stats.length-1].time-this.#statsTime;
						this.#statsTime=stats[stats.length-1].time;
						this.#e.dispatchEvent(new Event('timeupdate'));
						this.cap&&this.cap.onTimeupdate(this.#statsTime);
						this.#sameStatsCount=0;
						//statsの中身がすべて同じ状態が続くとき、最後まで再生したとみなす
					}else if(stats.slice(1).every(e=>Object.keys(e).every(key=>stats[0][key]==e[key]))){
						if(++this.#sameStatsCount>=5){
							this.#sameStatsCount=0;
							this.pause();
							this.#e.dispatchEvent(new Event('ended'));
						}
					}else{
						this.#sameStatsCount=0;
					}
					if(this.#done) return;
					this.#e.dispatchEvent(new Event('canplay'));	//疑似的、MainLoopがpauseだと呼び出されない
					this.#done = true;
				});
			});
		})).catch(e => {
			this.#error = {code: 0, message: e.message};
			this.#e.dispatchEvent(new Event('error'));
			throw e;
		});
	}
	#initialize(){
		this.#url = '';
		this.#error = null;
		this.#networkState = this.#networkStateCode.EMPTY;
		this.#currentTime = 0;
		this.#done = false;
		this.#wakeLock = null;
	}
	get e(){return this.#e}
	get tslive(){return true}
	play(){
		this.#paused = false;
		this.#mod.resumeMainLoop();
		this.#e.dispatchEvent(new Event('play'));
	}
	pause(){
		this.#paused = true;
		this.#mod.pauseMainLoop();
		this.#e.dispatchEvent(new Event('pause'));
	}
	stop(){
		if (!this.#mod||!this.#ctrl) return;
		this.pause();
		this.#mod.reset();
		this.#ctrl.abort();
		//Androidでリセットすると再描画されないためとりあえず除外、モバイルでtsliveに対応してるのはAndroidのChromeだけなはずなのでisMobileで対応、他がwebgpu対応したら見直す
		if (!isMobile) this.#e.getContext("webgpu").configure({device: this.#mod.preinitializedWebGPUDevice,format: navigator.gpu.getPreferredCanvasFormat(),alphaMode: "premultiplied",});
		this.#initialize();
	}
	get paused(){return this.#paused}
	set audioTrack(n){
		if (!Number(n)) return;
		this.#mod.setDualMonoMode(n);
	}
	get muted(){return this.#muted}
	set muted(b){
		this.#muted = b;
		this.#mod&&this.#mod.setAudioGain(b ? 0 : this.#volume);
		this.#e.dispatchEvent(new Event('volumechange'));
	}
	get volume(){return this.#volume}
	set volume(n){
		if (!Number(n)) return;
		this.#volume = Number(n);
		this.#mod&&this.#mod.setAudioGain(n);
		this.#e.dispatchEvent(new Event('volumechange'));
	}
	get playbackRate(){return this.#playbackRate}
	set playbackRate(n){
		if (!Number(n)) return;
		this.#playbackRate = Number(n);
		this.#mod.setPlaybackRate(n);
		this.#e.dispatchEvent(new Event('ratechange'));
	}

	get networkState(){return this.#networkState}
	#networkStateCode = {
		EMPTY: 0,
		IDLE: 1,
		LOADING: 2,
		NO_SOURCE: 3,
	}
	get error(){return this.#error}
	#errorCode = {
		ABORTED: 1,
		NETWORK: 2,
		DECODE: 3,
		SRC_NOT_SUPPORTED: 4,
	}
	get currentTime(){return this.#currentTime}
	set currentTime(ofssec){
		if (!Number(ofssec)) return;
		this.#currentTime = Math.floor(ofssec);
		this.#url.searchParams.set('ofssec', ofssec);
		this.#resetRead();
	}
	set offset(offset){
		if (!Number(offset)) return;
		this.#url.searchParams.set('offset', offset);
		this.#resetRead();
	}
	get src(){return this.#url.href??''}
	set src(src){
		if (!src) return;
		if (!window.createWasmModule) this.#error = {code: 0, message: 'Probably ts-live.js not found.'};
		if (!navigator.gpu) this.#error = {code: 0, message: 'WebGPU not available.'};
		if (this.#error){
			this.#e.dispatchEvent(new Event('error'));
			return;
		}
		if (!this.#mod){
			setTimeout(() => this.src = src, 500);
			return;
		}
		this.#initialize();
		this.#url = new URL(src, location.href);
		this.#startRead();
		this.#mod.resumeMainLoop();
		this.#paused = false;
	}
	canPlayType(s){return document.createElement('video').canPlayType(s)}

	get clientHeight(){return this.#e.clientHeight}
	get clientWidth(){return this.#e.clientWidth}
	get height(){return this.#e.height}
	get width(){return this.#e.width}

	onStreamStarted(){}

	#readNext(reader,ret){
		if(reader==this.#currentReader&&ret&&ret.value){
			var inputLen=Math.min(ret.value.length,1e6);
			var buffer=this.#mod.getNextInputBuffer(inputLen);
			if(!buffer){
			  setTimeout(() => this.#readNext(reader,ret),1000);
			  return;
			}
			buffer.set(new Uint8Array(ret.value.buffer,ret.value.byteOffset,inputLen));
			this.#mod.commitInputData(inputLen);
			if(inputLen<ret.value.length){
				//Input the rest.
				setTimeout(() => this.#readNext(reader,{value:new Uint8Array(ret.value.buffer,ret.value.byteOffset+inputLen,ret.value.length-inputLen)}),0);
				return;
			}
		}
		reader.read().then(r => {
			if(r.done){
				if(reader==this.#currentReader){
					this.#currentReader=null;
					if(this.#wakeLock){
						this.#wakeLock.release();
						this.#wakeLock=null;
					}
				}
			}else this.#readNext(reader,r);
		}).catch(e => {
			if(reader==this.#currentReader){
				this.#currentReader=null;
				if(this.#wakeLock){
					this.#wakeLock.release();
					this.#wakeLock=null;
				}
			}
			throw e;
		});
	}
	#startRead(){
		this.#ctrl = new AbortController();
		fetch(this.#url,{signal:this.#ctrl.signal}).then(response => {
			if(!response.ok){
				if (response.status == 404){
					this.#networkState = this.#networkStateCode.NO_SOURCE;
					this.#error = {code: this.#errorCode.SRC_NOT_SUPPORTED, message: 'MEDIA_ELEMENT_ERROR: Format error'};
				};
				this.#e.dispatchEvent(new Event('error'));
				return
			};
			this.onStreamStarted();
			this.#currentReader = response.body.getReader();
			this.#readNext(this.#currentReader,null);
			//Prevent screen sleep
			if(!this.#wakeLock) navigator.wakeLock.request("screen").then(lock => this.#wakeLock = lock);
		});
		['ofssec','offset'].forEach(e => this.#url.searchParams.delete(e));
	}
	#resetRead(){
		this.#ctrl.abort();
		this.#mod.reset();
		this.#startRead();
		this.play();
	}
}(vid);

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

class tsThumb {
	#mod;
	#url;
	#def;
	#e;
	constructor(url){
		if (!window.createMiscWasmModule) return;
		if (url) this.url = url;
		createMiscWasmModule().then(mod => this.#mod = mod);
	}
	attachMedia(e){
		this.#e = e;
	}
	set videoSrc(src){
		this.#url.search = new URL(src, location.href).search;
	}
	set url(url){
		this.#def = url;
		this.reset();
	}
	set path(path){
		this.#url.searchParams.set('fname', path);
	}
	reset(){
		this.#url = new URL(this.#def, location.href);
	}

	#id = 0;
	#loading;
	key = 'offset';
	async get(path, value, id){
		if (!this.#mod) return;
	
		const url = path ? new URL(this.#def, location.href) : this.#url;
		if (path) url.searchParams.set('fname', path);
		url.searchParams.set(this.key, Math.floor(value)||0);

		this.#loading = true;
		const frame = await fetch(url).then(r => {
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

	async set(e, path, value){
		const frame = await this.get(path, value);
		if (!frame) return;
		this.#putImage(frame, e);
		return true;
	}

	#timerID = 0;
	async seek(value, offset){
		if (!this.#url.searchParams.size>0||Math.floor(value)==this.#url.searchParams.get(this.key)) return;
		this.#e.style.setProperty('--offset', offset??value);
		if (this.#loading){
			clearTimeout(this.#timerID);
			this.#timerID = setTimeout(() => this.seek(value), 200);
			return;
		};
		const frame = await this.get(null, value, this.#id);
		if (frame) this.#putImage(frame);
	}

	#range = 5;
	max = 100;
	#roll(value){
		clearTimeout(this.#timerID);
		this.#timerID = setTimeout(async () => {
			if (value >= this.max) value = 0;
			const frame = await this.get(null, value, this.#id);
			if (frame){
				this.#putImage(frame);
				this.#roll(value+this.#range);
			}
		}, 1000);
	}
	roll(e, path, value = 0){
		this.#e = e;
		this.#url.searchParams.set('fname', path);
		this.#roll(value);
	}

	hide(){
		clearTimeout(this.#timerID);
		this.#id++;
		this.#e.style.display = "none";
		this.#url.searchParams.delete(this.key);
	}
}

const thumb = window.createMiscWasmModule && new tsThumb(`${ROOT}api/grabber`);
if (thumb) thumb.attachMedia(document.querySelector('#vid-thumb'));

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

vcont = document.getElementById("vid-cont");
const creatCap = () => {
	vid.cap ??= aribb24UseSvg ? new aribb24js.SVGRenderer(aribb24Option) : new aribb24js.CanvasRenderer(aribb24Option);
	if (vid.tslive){
		vid.cap.attachMedia(null,vcont);
	}else{
		aribb24Option.enableAutoInBandMetadataTextTrackDetection = window.Hls != undefined || !Hls.isSupported();
		vid.cap.attachMedia(vid);
	}
	if (!$subtitles.hasClass('checked')) vid.cap.hide();
}

vid.onStreamStarted = () => {
	if (DataStream && false || !$remote_control.hasClass('disabled')) toggleDataStream(true);	//一度しか読み込めないため常時読み込みはオミット
	if (Jikkyo || $danmaku.hasClass('checked')) toggleJikkyo(true);
	if (danmaku && !$danmaku.hasClass('checked')) danmaku.hide();
	creatCap();
}

const errorHLS = () => {
	$vid.removeClass('is-loadding');
	Snackbar('HLSエラー');
}

const startHLS = src => {
	if (!$('.is_cast').length) return;

	if (hls){
		hls.loadSource(src);
	}else if(vid.canPlayType('application/vnd.apple.mpegurl')){
		vid.src = src;
	}
}

if (hls){
	hls.on(Hls.Events.MANIFEST_PARSED, () => vid.onStreamStarted());
	hls.on(Hls.Events.FRAG_PARSING_METADATA, (each, data) => data.samples.forEach(d => vid.cap.pushID3v2Data(d.pts, d.data)));
}

const resetVid = reload => {
	if (hls) hls.loadSource('');
	if (vid.cap) vid.cap.detachMedia();
	if (vid.stop) vid.stop();
	toggleDataStream(false);
	toggleJikkyo(false);
	cbDatacast(false, true);
	Jikkyolog(false, true);
	if (reload) return;

	vid.src = '';
	$vid_meta.attr('src', '');
	$vid_meta.off('cuechange', oncuechangeB24Caption);
	vid.initSrc = null;
	if (thumb) thumb.reset();
}

const reloadHls = ($e = $('.is_cast')) => {
	const d = $e.data();
	if (!d) return;

	d.paused = vid.paused;
	const key = $Time_wrap.hasClass('offset') ? 'offset' : 'ofssec';
	d[key] = Math.floor($('input#seek').val());
	d[key] > 0 ? videoParams.set(key, d[key]) : videoParams.delete(key);
	$vid.addClass('is-loadding');
	resetVid(true);

	if (videoParams.has('load')){
		videoParams.set('reload', videoParams.get('load'));
		videoParams.delete('load');
	}
	loadHls();
}

const $audio = $('#audio');
const $cinema = $('#cinema');
const $remote = $('#remote');
const $remote_control = $('.remote-control');
const $danmaku = $('#danmaku');
const loadHls = () => {
	let dateNow = new Date();
	dateNow = (dateNow.getHours()*60+dateNow.getMinutes())*60+dateNow.getSeconds();
	const hls1 = `&hls=${1+dateNow}`;
	if (!videoParams.has('reload')) videoParams.set('load', dateNow);	//最初にユニークな値をつくりリロード時に値を引きつぐ

	const interval = onDataStream ? 5*1000 : 0;	//データ放送切ってから一定期間待たないと動画が出力されない？
	if (window.Hls != undefined){
		//Android版Firefoxは非キーフレームで切ったフラグメントMP4だとカクつくので避ける
		setTimeout(() => waitForHlsStart(`${vid.initSrc}&${videoParams.toString()}${hls1}${/Android.+Firefox/i.test(navigator.userAgent)?'':hls4}`, `ctok=${ctok}&open=1`, 200, 500, () => errorHLS(), src => startHLS(src)), interval);
		//AndroidはcanPlayTypeが空文字列を返さないことがあるが実装に個体差が大きいので避ける
	}else if(ALLOW_HLS&&!/Android/i.test(navigator.userAgent)&&vid.canPlayType('application/vnd.apple.mpegurl')){
		//環境がないためテスト出来ず
		setTimeout(() => waitForHlsStart(`${vid.initSrc}&${videoParams.toString()}${hls1}${hls4}`, `ctok=${ctok}&open=1`, 200, 500, () => errorHLS(), src => vid.src=src), interval);
	}else{
		vid.src = vid.initSrc;
	}
}

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
const $Time_wrap = $('.Time-wrap');
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
	$vid.addClass('is-loadding');
	if ($remote.hasClass('done')){	//一度読み込んだら最後、無効化
		$remote.prop('disabled', true);
		$remote_control.addClass('disabled').find('button').prop('disabled', true);
	}

	$seek.attr('disabled', false);
	$quality.attr('disabled', d.canPlay);
	if (d.canPlay){
		const path = `${ROOT}${!d.public ? `api/Movie?fname=${encodeURIComponent(d.path)}` : encodeURIComponent(d.path).replace('%2F','/')}`;
		$vid.attr('src', path);
		$vid_meta.on('cuechange', oncuechangeB24Caption);
		$vid_meta.attr('src', `${path.replace(/\.[0-9A-Za-z]+$/,'')}.vtt`);
		if (Jikkyo || $danmaku.hasClass('checked')) Jikkyolog(true);
		if (danmaku && !$danmaku.hasClass('checked')) danmaku.hide();
	}else{
		vid.initSrc = `${ROOT}api/${d.onid ? `view?n=0&id=${d.onid}-${d.tsid}-${d.sid}&ctok=${ctok}`
		                                   : `xcode?${d.path ? `fname=${encodeURIComponent(d.path)}` : d.id ? `id=${d.id}` : d.reid ? `reid=${d.reid}` : ''}` }`

		if (d.path??d.id??d.reid) thumb.videoSrc = vid.initSrc;
		if (vid.tslive){
			vid.src = `${vid.initSrc}&option=${videoParams.get('option')}`;
		}else{
			['ofssec','offset','reload','audio2'].forEach(e => videoParams.delete(e));
			loadHls();
		}
		if (!d.meta) return;

		if (d.meta.duration){
			$duration.text(getVideoTime(d.meta.duration));
			$seek.attr('max', d.meta.duration);
		}else{
			$duration.text(getVideoTime());
			$seek.attr('max', 100)
		};
		$Time_wrap.toggleClass('offset', !d.meta.duration);
	    if (d.meta.audio) $audios.attr('disabled', d.meta.audio == 1);
	}

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

			$vid.removeClass('is-loadding');
			$('.is_cast').removeClass('is_cast');
			const errorcode = vid.networkState == 3  ? 5 : vid.error.code;
			Snackbar(`Error : ${[vid.error.message,'MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED','NETWORK_NO_SOURCE'][errorcode]}`);
		},
		volumechange(){
			vid.onVolumeChange();
			localStorage.setItem('volume', vid.volume);
			localStorage.setItem('muted', vid.muted);
		},
		//ratechange(){if (sessionStorage.getItem('autoplay') == 'true') vid.defaultPlaybackRate = vid.playbackRate;},
		canplay(){
			hideBar(2000);
			$vid.removeClass('is-loadding');

			const d = $('.is_cast').data();
			if (!d.paused){
				const promise = vid.play();
				//自動再生ポリシー対策 https://developer.chrome.com/blog/autoplay?hl=ja
				if (promise !== undefined){
					promise.catch(error => {
						vid.muted = true;
						vid.play();
						vid.onVolumeChange();
						document.querySelector('#volume').MaterialSlider.change(0);
						$(document).one('click', () => {
							vid.muted = false;
							document.querySelector('#volume').MaterialSlider.change(vid.volume);
						});			
					});
				}
			}
			if (!d.canPlay) return;

			$duration.text(getVideoTime(vid.duration));
			$seek.attr('max', vid.duration);
		},
		timeupdate(){
			const d = $('.is_cast').data();
			if (!d) return;

			let currentTime;
			if (d.onid){
				currentTime = (Date.now() - d.meta.starttime) / 1000;
				seek.MaterialProgress.setProgress(currentTime / d.meta.duration * 100);
				$live.toggleClass('live', vid.duration - vid.currentTime < 2);
			}else if (d.path || d.id || d.reid){
				if ($seek.data('touched')) return;

				currentTime = vid.currentTime + (d.ofssec || 0);
				if (!$Time_wrap.hasClass('offset')) seek.MaterialSlider.change(currentTime);
			}
			$currentTime.text(getVideoTime(currentTime));
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
		$vid.removeClass('is-loadding');
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
			const d = $('.is_cast').data();
			if (d.canPlay) return;
			if (vid.tslive){
				vid[$Time_wrap.hasClass('offset')?'offset':'currentTime'] = this.value;
			}else{
				if (d.ofssec < this.value && this.value < d.ofssec + vid.duration)
					vid.currentTime = this.value - d.ofssec;
				else reloadHls();
			}
		},
		input(){
			$currentTime.text(getVideoTime(this.value));
			if ($('.is_cast').data('canPlay')) vid.currentTime = this.value;

			if (!thumb || $(this).data('hover')) return;
			thumb.seek(this.value/$(this).attr('max')*100);
		},
		mousedown(){$(this).data('touched', true)},
		mouseenter(e){
			if (!thumb) return;
			$(this).data('hover', true);
			document.querySelector('#vid-thumb').style.setProperty('--width', $player.width()+'PX');
			thumb.seek(e.offsetX/this.clientWidth*100);
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
			thumb.seek(e.offsetX/this.clientWidth*100);
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
				if(vid.theater) $('#movie-theater-contner').height('');
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
	videoParams.set('option', localStorage.getItem('quality') ? $(`#${localStorage.getItem('quality')}`).val() : 1);
	$('[name=quality]').change(e => {
		const $e = $(e.currentTarget);
		localStorage.setItem('quality', $e.attr('id'));
		videoParams.set('option', $e.val());

		checkTslive();

		if (!$vid.data('cast') || localStorage.getItem('apk') != 'true') reloadHls();
	});
	$('[name=audio]').change(e => {
		const val = $(e.currentTarget).val();
		videoParams.set('audio2', val);
		vid.tslive ? vid.audioTrack = val : reloadHls();
	});
	$('#cinema').change(e => {
		if ($(e.currentTarget).checked()) videoParams.set('cinema', 1);
		else videoParams.delete('cinema');
		reloadHls();
	});
	const $rate = $('.rate');
	$rate.change(e => {
		const $e = $(e.currentTarget);
		const isTs = !$('.is_cast').data('path') || /\.(?:m?ts|m2ts?)$/.test($('.is_cast').data('path'));
		//極力再読み込みは避けたい
		if (!vid.tslive && isTs && $e.val()>1){	
			videoParams.set('fast', $e.data('index'));
			streamParams.delete('fast');
			reloadHls();
			return;
		}else if (videoParams.has('fast')){
			videoParams.delete('fast');
			reloadHls();
		};

		vid.playbackRate = $e.val();
		streamParams.set('fast', $e.data('index'));
		openSubStream();
	});

	//TS-Live!有効時、非対応端末は画質選択無効
	$('.tslive').attr('disabled', !window.isSecureContext || !navigator.gpu);
	$('#rate1').attr('disabled', vid.tslive).parent().attr('disabled', vid.tslive);


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

			if ($('.is_cast').data('canPlay')){
				cbDatacast(!disabled);
				return;
			}

			if (disabled){
				if (!DataStream) toggleDataStream(false);
			}else{
				if (!onDataStream) toggleDataStream(true);
			}
		},
		'touchstart mousedown': e => {
			if (e.which > 1 || $remote.data('click')) return;

			$remote.data('click', setTimeout(() => {
				$remote.data('click', false);
				DataStream = !DataStream;
				localStorage.setItem('DataStream', DataStream);
				$remote.toggleClass('mdl-button--accent', DataStream);
				const disabled = $remote_control.hasClass('disabled');

				if ($('.is_cast').data('canPlay')){
					cbDatacast(!disabled);
					return;
				}
	
				if (DataStream){
					if (!onDataStream) toggleDataStream(true);
				}else{
					if (disabled) toggleDataStream(false);
				}
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

			if($danmaku.hasClass('checked')){
				if (!onJikkyoStream){
					if ($('.is_cast').data('canPlay')) Jikkyolog(true);
					else toggleJikkyo(true);
				}
				if (danmaku) danmaku.show();
			}else{
				if (!Jikkyo){
					toggleJikkyo(false);
					Jikkyolog(false);
				}
				if (danmaku) danmaku.hide();
			}
		},
		'touchstart mousedown': e => {
			if (e.which > 1 || $danmaku.data('click')) return;

			$danmaku.data('click', setTimeout(() => {
				$danmaku.data('click', false);
				Jikkyo = !Jikkyo;
				localStorage.setItem('Jikkyo', Jikkyo);
				if (Jikkyo){
					if (!onJikkyoStream){
						if ($('.is_cast').data('canPlay')) Jikkyolog(true);
						else toggleJikkyo(true);
					}
					$danmaku.addClass('mdl-button--accent');
				}else{
					if (!$danmaku.hasClass('checked')){
						toggleJikkyo(false);
						Jikkyolog(false);
					}
					$danmaku.removeClass('mdl-button--accent');
				}
			}, 1000));
		}
	});
	
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
	);

	//準備できてから再生開始
	if (readyToAutoPlay) readyToAutoPlay();
});
