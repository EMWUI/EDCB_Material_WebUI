let fullscreen, theater;
let VideoSrc;
let hls, cap;
let Jikkyo = localStorage.getItem('Jikkyo') == 'true';
let DataStream = localStorage.getItem('DataStream') == 'true';
vid = {e:document.getElementById("video")};
const $vid = $(vid.e);
vid.e.muted = localStorage.getItem('muted') == 'true';
vid.e.volume = localStorage.getItem('volume') || 1;
const canvas = vid.e.tagName=="CANVAS";
if(canvas){
    //Behave like HTMLMediaElement.
    vid.currentTime=0;
    vid.muted=vid.e.muted;
    vid.volume=vid.e.volume;
    vid.c=vid;
}

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
const hideBar = (t = 0) => {
	hoverID = setTimeout(() => {
		if (vid.e.paused) return;

		$playerUI_titlebar.removeClass('is-visible');
		$contral.removeClass('is-visible');
		$player.css('cursor', 'none');
	}, t);
}
const stopTimer = () => {
	clearInterval(hoverID);
	$player.css('cursor', 'default');
}

vcont = document.getElementById("vid-cont");
const creatCap = () => {
	cap = aribb24UseSvg ? new aribb24js.SVGRenderer(aribb24Option) : new aribb24js.CanvasRenderer(aribb24Option);
	if (canvas){
		cap.attachMedia(null,vcont);
	}else{
		aribb24Option.enableAutoInBandMetadataTextTrackDetection = window.Hls != undefined || !Hls.isSupported();
		cap.attachMedia(vid.e);
	}
}

const errorHLS = () => {
	$vid.removeClass('is-loadding');
	Snackbar('HLSエラー');
}

const startHLS= src => {
	if (!$('.is_cast').length) return;

	if (Hls.isSupported()){
		hls = new Hls();
		hls.loadSource(src);
		hls.attachMedia(vid.e);
		hls.on(Hls.Events.MANIFEST_PARSED,function(){
			if (DataStream && false || !$remote_control.hasClass('disabled')) toggleDataStream(true);	//一度しか読み込めないため常時読み込みはオミット
			if ($subtitles.hasClass('checked')) creatCap();
			if (Jikkyo || $danmaku.hasClass('checked')) $danmaku.data('log') ? Jikkyolog() : toggleJikkyo();
			if (danmaku && !$danmaku.hasClass('checked')) danmaku.hide();
		});
		hls.on(Hls.Events.FRAG_PARSING_METADATA, (each, data) => {
			for(var i=0;i<data.samples.length;i++){cap.pushID3v2Data(data.samples[i].pts,data.samples[i].data);}
		});
	}else if(vid.e.canPlayType('application/vnd.apple.mpegurl')){
		vid.e.src = src;
	}
}

const resetVid = () => {
	if (hls) hls.destroy();
	if (cap) cap.detachMedia();
	if (vid.stop) vid.stop();
	toggleDataStream(false);
	toggleJikkyo(false);
	$vid_meta.attr('src', '');
	VideoSrc = null;
}

const reloadHls = ($e = $('.is_cast')) => {
	const d = $e.data();
	if (!d) return;

	d.paused = vid.e.paused;
	d.ofssec = Math.floor($('input#seek').val());
	$vid.addClass('is-loadding');
	resetVid();

	const matchReload = (VideoSrc || '').match(/&(?:re)?load=([0-9]+)/);
	loadHls($e, matchReload && matchReload[1]);
}

const loadTslive = ($e = $('.is_cast')) => {
	const d = $e.data();
	VideoSrc = `${ROOT}api/${d.onid ? `view?n=0&id=${d.onid}-${d.tsid}-${d.sid}&ctok=${ctok}` : `xcode?${
		d.path ? `fname=${d.path}` : d.id ? `id=${d.id}` : d.reid ? `reid=${d.reid}` : ''}&`}&option=${quality}${
		!$audio.attr('disabled') ? `&audio2=${audioVal}` : ''}${
		$cinema.prop('checked') ? '&cinema=1' : ''}${
		$fast.prop('checked') ? '&fast=1' : ''
	}`;

	var wakeLock=null;
	var modBufferSize=0;
	var seekParam="";
	function readNext(mod,reader,ret){
		if(ret&&ret.value){
			var inputLen=Math.min(ret.value.length,1e6);
			//Limit input amount to reduce "Buffer overflow" console output.
			var buffer=modBufferSize<14&&mod.getNextInputBuffer(inputLen);
			if(!buffer){
			  setTimeout(function(){readNext(mod,reader,ret);},1000);
			  return;
			}
			buffer.set(new Uint8Array(ret.value.buffer,ret.value.byteOffset,inputLen));
			mod.commitInputData(ret.value.length);
			if(inputLen<ret.value.length){
				//Input the rest.
				setTimeout(function(){readNext(mod,reader,{value:new Uint8Array(ret.value.buffer,ret.value.byteOffset+inputLen,ret.value.length-inputLen)});},0);
				return;
			}
		}
		reader.read().then(function(r){
			if(r.done){
				if(wakeLock)wakeLock.release();
				vid.seekWithoutTransition=null;
				if(seekParam){
					mod.reset();
					startRead(mod);
				}
			}else{
				setTimeout(function(){readNext(mod,reader,r);},0);
			}
		}).catch(function(e){
			if(wakeLock)wakeLock.release();
			vid.seekWithoutTransition=null;
			if(seekParam){
				mod.reset();
				startRead(mod);
			}
			throw e;
		});
	}
	if ($subtitles.hasClass('checked')) creatCap();

	function startRead(mod){
		var ctrl=new AbortController();
		var uri=VideoSrc+seekParam;
		seekParam="";
		if(uri.indexOf("&audio2=1")>=0){
			//2nd audio channel
			mod.setDualMonoMode(1);
		}
		fetch(uri,{signal:ctrl.signal}).then(function(response){
			if(!response.ok)return;
			//Reset caption
			if(cap)cap.attachMedia(null,vcont);
			vid.currentTime=0;
			vid.seekWithoutTransition=function(ofssec){
				vid.seekWithoutTransition=null;
				seekParam="&ofssec="+ofssec;
				ctrl.abort();
			};
			vid.stop = () => {
				mod.pauseMainLoop();
				ctrl.abort();
			};
			readNext(mod,response.body.getReader(),null);
			//Prevent screen sleep
			navigator.wakeLock.request("screen").then(function(lock){wakeLock=lock;});
		});
	}
	function notify(s){
		var ctx=vid.e.getContext("2d");
		ctx.fillStyle="black";
		ctx.fillText(s,10,30);
		ctx.fillStyle="white";
		ctx.fillText(s,10,50);
	}
	if(!window.createWasmModule){
		Snackbar({message: "Error! Probably ts-live.js not found."});
		return;
	}
	if(!navigator.gpu){
		Snackbar({message: "Error! WebGPU not available."});
		return;
	}
	navigator.gpu.requestAdapter().then(function(adapter){
		adapter.requestDevice().then(function(device){
			createWasmModule({preinitializedWebGPUDevice:device}).then(function(mod){
				var statsTime=0;
				mod.setCaptionCallback(function(pts,ts,data){
					if(cap)cap.pushRawData(statsTime+ts,data.slice());
				});
				var rangeVolume=document.getElementById("volume");
				mod.setAudioGain(vid.muted?0:vid.volume);
				$vid.trigger('volumechange');
				document.getElementById("volume-icon").onclick = () => {
					mod.setAudioGain(vid.muted?0:vid.volume);
					$vid.trigger('volumechange');
				};
				rangeVolume.onchange=function(){
					vid.muted=false;
					vid.volume=rangeVolume.value;
					mod.setAudioGain(vid.volume);
					$vid.trigger('volumechange');
				};
				mod.setStatsCallback(function(stats){
					modBufferSize=stats[stats.length-1].InputBufferSize;
					if(statsTime!=stats[stats.length-1].time){
					vid.currentTime+=stats[stats.length-1].time-statsTime;
					statsTime=stats[stats.length-1].time;
					$vid.trigger('timeupdate');
					if(cap)cap.onTimeupdate(statsTime);
					}
				});
				vid.pause = () => {
					$vid.trigger('pause');
					vid.e.paused = true;
					mod.pauseMainLoop();
				};
				vid.play = () => {
					$vid.trigger('play');
					vid.e.paused = false;
					mod.resumeMainLoop();
				};
				$vid.trigger('play');
				vid.e.paused = false;
				setTimeout(function(){
					//vbitrate.innerText="|?Mbps";
					startRead(mod);
				},500);
			});
		});
	}).catch(function(e){
		notify(e.message);
		throw e;
	});
}

const $audio = $('#audio');
const $cinema = $('#cinema');
const $fast = $('#fast');
const $remote = $('#remote');
const $remote_control = $('.remote-control');
const $danmaku = $('#danmaku');
let quality = localStorage.getItem('quality') ? $(`#${localStorage.getItem('quality')}`).val() : 1;
let audioVal = 0;
const loadHls = ($e, reload) => {
	const d = $e.data();

	let dateNow = new Date();
	dateNow = (dateNow.getHours()*60+dateNow.getMinutes())*60+dateNow.getSeconds();
	const hls1 = `&hls=${1+dateNow}`;

	VideoSrc = `${ROOT}api/${d.onid ? `view?n=0&id=${d.onid}-${d.tsid}-${d.sid}&ctok=${ctok}` : `xcode?${
		d.path ? `fname=${d.path}` : d.id ? `id=${d.id}` : d.reid ? `reid=${d.reid}` : ''}&${
		d.ofssec > 0 ? `ofssec=${d.ofssec}&` : ''}${
		reload ? `reload=${reload}` : `load=${dateNow}`	//最初にユニークな値をつくりリロード時に値を引きつぐ
	}`}&option=${quality}${
		!$audio.attr('disabled') ? `&audio2=${audioVal}` : ''}${
		$cinema.prop('checked') ? '&cinema=1' : ''}${
		$fast.prop('checked') ? '&fast=1' : ''
	}`;

	const interval = onDataStream ? 5*1000 : 0;	//データ放送切ってから一定期間待たないと動画が出力されない？
	if (window.Hls != undefined){
		//Android版Firefoxは非キーフレームで切ったフラグメントMP4だとカクつくので避ける
		setTimeout(() => waitForHlsStart(`${VideoSrc}${hls1}${/Android.+Firefox/i.test(navigator.userAgent)?'':hls4}`, `ctok=${ctok}&open=1`, 200, 500, () => errorHLS(), src => startHLS(src)), interval);
		//AndroidはcanPlayTypeが空文字列を返さないことがあるが実装に個体差が大きいので避ける
	}else if(ALLOW_HLS&&!/Android/i.test(navigator.userAgent)&&vid.e.canPlayType('application/vnd.apple.mpegurl')){
		//環境がないためテスト出来ず
		setTimeout(() => waitForHlsStart(`${VideoSrc}${hls1}${hls4}`, `ctok=${ctok}&open=1`, 200, 500, () => errorHLS(), src => vid.e.src=src), interval);
	}else{
		vid.e.src = VideoSrc;
	}
}

const checkTslive = () => {
	const url = new URL(location.href);
	const tslive = $(`#${localStorage.getItem('quality')}`).data('tslive');
	if (tslive && !canvas){
		url.searchParams.append('tslive', 1);
		location.replace(url);
		return true;
	}else if (!tslive && canvas){
		url.searchParams.delete('tslive');
		location.replace(url);
		return true;
	}
};

const seek = document.querySelector('#seek');
const $seek = $(seek);
const $duration = $('.duration');
const $quality = $('.quality');
const $Time_wrap = $('.Time-wrap');
const $audios = $('.audio');
const $titlebar = $('#titlebar');
const loadMovie = ($e = $('.is_cast')) => {
	if (checkTslive()) return;
	const d = $e.data();

	resetVid();
	$vid.addClass('is-loadding');
	if ($remote.hasClass('done')){	//一度読み込んだら最後、無効化
		$remote.prop('disabled', true);
		$remote_control.addClass('disabled').find('button').prop('disabled', true);
	}

	d.canPlay = !canvas && d.path ? (vid.c||vid.e).canPlayType(`video/${d.path.match(/[^\.]*$/)}`).length > 0 : false;
	$seek.attr('disabled', false);
	$quality.attr('disabled', d.canPlay);
	if (d.canPlay){
		const path = `${ROOT}${!d.public ? 'api/Movie?fname=' : ''}${d.path}`;
		$vid.attr('src', path);
		$vid_meta.attr('src', `${path.replace(/\.[0-9A-Za-z]+$/,'')}.vtt`);
		if (Jikkyo || $danmaku.hasClass('checked')) Jikkyolog();
		if (danmaku && !$danmaku.hasClass('checked')) danmaku.hide();
	}else{
		if (canvas){
			loadTslive($e);
		}else{
			loadHls($e);
		}
		if (!d.info) return;

		if (d.info.duration){
			$duration.text(getVideoTime(d.info.duration));
			$seek.attr('max', d.info.duration);
		}
		$Time_wrap.toggleClass('is-disabled', !d.info.duration);
	    if (d.info.audio) $audios.attr('disabled', d.info.audio == 1);
	}

	$titlebar.html(d.name || `${ConvertService(d.info)}<span>${ConvertTitle(d.info.title)}</span>`);

	if ($e.hasClass('item')){
		$('#playprev').prop('disabled', $e.is('.item:first'));
		$('#playnext').prop('disabled', $e.is('.item:last' ));
	}
	if ($e.hasClass('onair')){
		$('#playprev').prop('disabled', $e.is('.is-active>.onair:first'));
		$('#playnext').prop('disabled', $e.is('.is-active>.onair:last'));
	}
}

const $currentTime_duration = $('.currentTime,.duration');
const playMovie = $e => {
	if ($e.hasClass('playing')){
		hideBar(2000);
		vid.e.play();
	}else{
		vid.e.src = '';
		seek.MaterialSlider.change(0);
		$currentTime_duration.text('0:00');
		$audios.attr('disabled', true);
		$('.playing').removeClass('is_cast playing');
		$e.addClass('is_cast playing');
		loadMovie($e);
	}
}

$(window).on('load resize', () => {
	$player.toggleClass('is-small', $vid.width() < 800);
	if (fullscreen) return;

	if (theater || isSmallScreen()){
		theater = true;
		$('#movie-contner #player').prependTo('#movie-theater-contner');
	}else{
		$('#movie-theater-contner #player').prependTo('#movie-contner');
	}
});

$(function(){
	$('#autoplay').prop('checked', sessionStorage.getItem('autoplay') == 'true');
	$('#apk').prop('checked', localStorage.getItem('apk') == 'true');

	const $volume = $('#volume');
	$volume.on('mdl-componentupgraded', () => $volume.get(0).MaterialSlider.change(vid.e.muted ? 0 : vid.e.volume));
	if (!isSmallScreen()){
		$remote_control.prependTo('#apps-contener>.contener>.contener');
	}else{
		$('.remote-control .num').addClass('hidden');
		$('.remote-control,#apps-contener').prependTo('#main-column');
	}


	//閉じる
	$('.close.mdl-badge').click(() => {
		$('#popup').removeClass('is-visible');
		vid.e.pause();
		vid.e.playbackRate = 1;
	});

	const $play_icon = $('#play i');
	const $volume_icon_i = $('#volume-icon i');
	const $currentTime = $('.currentTime');
	const $playerUI = $('#playerUI');
	const $live = $('#live');
	$vid.on({
		'pause': () => $play_icon.text('play_arrow'),
		'play': () => $play_icon.text('pause'),
		'ended': () => {
			const autoplay = sessionStorage.getItem('autoplay') == 'true';
			if (autoplay && !$('.playing').is('.item:last')){
				$('.playing').next().click();
				$titlebar.addClass('is-visible');
			}else{
				if (autoplay && $('.playing').is('.item:last')) Snackbar('最後のファイルを再生しました');
				$playerUI.addClass('is-visible');
			}
		},
		'error': () => {
			if ($vid.attr('src') == '') return;

			$vid.removeClass('is-loadding');
			$('.is_cast').removeClass('is_cast');
			const errorcode = vid.networkState == 3  ? 5 : vid.error.code;
			Snackbar(`Error : ${['MEDIA_ERR_ABORTED','MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED','NETWORK_NO_SOURCE'][errorcode]}`);
		},
		'volumechange': () => {
			$volume_icon_i.text(`volume_${(vid.c||vid.e).muted ? 'off' : (vid.c||vid.e).volume == 0 ? 'mute' : (vid.c||vid.e).volume > 0.5 ? 'up' : 'down'}`);
			localStorage.setItem('volume', (vid.c||vid.e).volume);
			localStorage.setItem('muted', (vid.c||vid.e).muted);
		},
		//'ratechange': e => {if (sessionStorage.getItem('autoplay') == 'true') video.defaultPlaybackRate = this.playbackRate;},
		'canplay': () => {
			hideBar(2000);
			$vid.removeClass('is-loadding');

			const d = $('.is_cast').data();
			if (!d.paused) {
				const promise = vid.e.play();
				//自動再生ポリシー対策 https://developer.chrome.com/blog/autoplay?hl=ja
				if (promise !== undefined) {
					promise.catch(error => {
						vid.e.muted = true;
						vid.e.play();
						$(document).one('click', () => {
							vid.e.muted = false;
							document.querySelector('#volume').MaterialSlider.change(vid.e.volume);
						});			
					});
				}
			}
			if (!d.canPlay) return;

			if ($subtitles.hasClass('checked')) loadVtt();
			$duration.text(getVideoTime(vid.e.duration));
			$seek.attr('max', vid.e.duration);
		},
		'timeupdate': () => {
			const d = $('.is_cast').data();
			if (!d) return;

			let currentTime;
			if (d.onid){
				currentTime = (Date.now() - d.info.starttime) / 1000;
				seek.MaterialProgress.setProgress(currentTime / d.info.duration * 100);
				$live.toggleClass('live', (vid.c||vid.e).duration - (vid.c||vid.e).currentTime < 2);
			}else if (d.path || d.id || d.reid){
				if ($seek.data('touched')) return;

				currentTime = (vid.c||vid.e).currentTime + (d.ofssec || 0);
				seek.MaterialSlider.change(currentTime);
			}
			$currentTime.text(getVideoTime(currentTime));
		}
	});

	$('#play').click(() => vid.e.paused ? (vid.c||vid.e).play() : (vid.c||vid.e).pause());
	
	const $quality_audio = $('.quality,.audio');
	const $stop = $('.stop');
	const $epginfo = $('#epginfo');
	$stop.click(() => {
		resetVid();
		vid.e.src = '';
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
		'touchstart mousedown': () => $seek.data('touched', true),
		'touchend mouseup': () => $seek.data('touched', false),
		'change': () => {
			const d = $('.is_cast').data();
			if (canvas){
				d.ofssec = Math.floor($seek.val());
				vid.seekWithoutTransition(d.ofssec);
			}else{
				if (d.canPlay) return

				d.ofssec < $seek.val() && $seek.val() < d.ofssec + vid.e.duration ? vid.e.currentTime = $seek.val() - d.ofssec : reloadHls();
			}
		},
		'input': () => {
			$currentTime.text(getVideoTime($seek.val()));
			if ($('.is_cast').data('canPlay'))vid.e.currentTime = $seek.val();
		}
	});

	$volume.on('input', () => {
		vid.e.muted = false;
		vid.e.volume = $volume.val();
	});

	const $volume_icon = $('#volume-icon');
	$volume_icon.click(() => {
		e = vid.c ?? vid.e;
		e.muted = !e.muted;
		$volume.get(0).MaterialSlider.change(e.muted ? 0 : e.volume);
	});

	$('#fullscreen').click(() => {
		const player = document.querySelector('#player');
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement){
			if (player.requestFullscreen) {
				player.requestFullscreen();
			} else if (player.msRequestFullscreen) {
				player.msRequestFullscreen();
			} else if (player.mozRequestFullScreen) {
				player.mozRequestFullScreen();
			} else if (player.webkitRequestFullscreen) {
				player.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
			fullscreen = true;
			screen.orientation.lock('landscape');
			$('#fullscreen i').text('fullscreen_exit');
			$('.mdl-js-snackbar').appendTo('#player');
			$('.remote-control,#comment-control').prependTo('.player-container');
		}else{
			screen.orientation.unlock('landscape');
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
			fullscreen = false;
			$('#fullscreen i').text('fullscreen');
			$('.mdl-js-snackbar').appendTo('.mdl-layout');
			if(theater || isSmallScreen()){
				$remote_control.prependTo('#main-column');
				$('.remote-control .num').addClass('hidden');
			}else{
				$('#comment-control').insertAfter('#apps-contener>.contener');
				$remote_control.prependTo('#apps-contener>.contener>.contener');
			}

		}
	});
	if (document.pictureInPictureEnabled){
		document.getElementById('PIP').addEventListener('click', async () => {
			if ('documentPictureInPicture' in window) {
				$('.remote-control,#comment-control').prependTo('.player-container');
				const content = document.getElementById('player');
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
				
				pipWindow.addEventListener("pagehide", (event) => {
					const container = document.getElementById((theater ? "movie-theater-contner" : "movie-contner"));
					const pipContent = event.target.getElementById("player");
					container.append(pipContent);
					if(theater){
						$remote_control.prependTo('#main-column');
						$('.remote-control .num').addClass('hidden');
					}else{
						$('#comment-control').insertAfter('#apps-contener>.contener');
						$remote_control.prependTo('#apps-contener>.contener>.contener');
					}
				});
			}else 
				vid.e.requestPictureInPicture();
		});
		$('#PIP_exit').click(() => documentPictureInPicture.window.close())
	}else{
		$('#PIP,#PIP_exit').hide();
	}
	$('#defult').click(() => {
		theater = true;
		$player.prependTo($('#movie-theater-contner'));
		$remote_control.prependTo('#main-column');
		$('.remote-control .num').addClass('hidden');
		setbmlBrowserSize();
	});
	$('#theater').click(() => {
		theater = false;
		$player.prependTo($('#movie-contner'));
		$remote_control.prependTo('#apps-contener>.contener>.contener');
		$('.remote-control .num').removeClass('hidden');
		setbmlBrowserSize();
	});

	$('#autoplay').change(e => {
		sessionStorage.setItem('autoplay', $(e.currentTarget).prop('checked'));
		//video.defaultPlaybackRate = $(e.currentTarget).prop('checked') ? video.playbackRate : 1;
	});

	if (localStorage.getItem('quality')) $(`#${localStorage.getItem('quality')}`).prop('checked', true);
	$('[name=quality]').change(e => {
		const $e = $(e.currentTarget);
		if ($e.prop('checked')){
			quality = $e.val();
			localStorage.setItem('quality', $e.attr('id'));
		}else{
			localStorage.removeItem('quality');
		}

		checkTslive();

		if (!$vid.data('cast') || localStorage.getItem('apk') != 'true') reloadHls();
	});
	$('[name=audio]').change(e => {
		audioVal = $(e.currentTarget).val();
		if (canvas){
			loadTslive();
		}else{
			reloadHls();
		}
	});
	$('#cinema,#fast').change(() => reloadHls());
	const $rate = $('.rate');
	$rate.change(e => vid.e.playbackRate = $(e.currentTarget).val());

	hideBar(0);
	$player_container = $('.player-container>*').not('.remote-control');
	if (!isMobile && !isTouch){
		$player_container.hover(() => {
			stopTimer();
			$playerUI.addClass('is-visible');
		}, () => hideBar(0));

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

	$('#live:not(.live)').click(() => vid.e.currentTime = vid.e.duration);

	$subtitles.click(() => {
		if (!$subtitles.hasClass('checked')){
			if (!cap) creatCap();
			cap.show();
		}else if (cap){
			cap.hide();
		}
		$subtitles.toggleClass('checked', !$subtitles.hasClass('checked'));
		localStorage.setItem('subtitles', $subtitles.hasClass('checked'));
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
				cbDatacast();
				return;
			}

			if (disabled){
				if (!DataStream) toggleDataStream(false);
			}else{
				if (!onDataStream) toggleDataStream(true);
				if (!theater) $('#apps').prop('checked', true);
			}
		},
		'touchstart mousedown': e => {
			if (e.which > 1 || $remote.data('click')) return;

			$remote.data('click', setTimeout(() => {
				$remote.data('click', false);
				DataStream = !DataStream;
				localStorage.setItem('DataStream', DataStream);
				$remote.toggleClass('mdl-button--accent', DataStream);

				if ($('.is_cast').data('canPlay')){
					cbDatacast();
					return;
				}
	
				if (DataStream){
					if (!onDataStream) toggleDataStream(true);
				}else{
					if ($remote_control.hasClass('disabled')) toggleDataStream(false);
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

			if ($danmaku.data('log')){
				if (!$('.is_cast').data('path')) return;
				Jikkyolog();
				return;
			}

			if($danmaku.hasClass('checked')){
				if (!onJikkyoStream) toggleJikkyo(true);
				if (danmaku) danmaku.show();
			}else{
				if (!Jikkyo) toggleJikkyo(false);
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
					if (!onJikkyoStream) toggleJikkyo();
					$danmaku.addClass('mdl-button--accent');
				}else{
					if (!$danmaku.hasClass('checked')) toggleJikkyo(false);
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
});
