let readyToAutoPlay;
let hls,stream;
let Jikkyo = localStorage.getItem('Jikkyo') == 'true';
let DataStream = localStorage.getItem('DataStream') == 'true';
const danmaku = document.getElementById("danmaku-container");
const vid = document.getElementById("video");
const $vid = $(vid);

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

const oncuechangeB24Caption = e => {
  $(e.target).off('cuechange',oncuechangeB24Caption);
  createCap();
  Datacast.oncuechangeB24Caption(vid.cap, e.target.track.cues);
};

$(window).on('load resize', () => {
	$player.toggleClass('is-small', $vid.width() < 800);
	if (vid.fullscreen) return;

	if (vid.theater || isSmallScreen()){
		vid.theater = true;
		$('#movie-contner #player').prependTo('#movie-theater-contner');
	}else{
		$('#movie-theater-contner #player').prependTo('#movie-contner');
	}
	setbmlBrowserSize();
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
