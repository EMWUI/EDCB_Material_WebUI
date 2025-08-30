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
		document.querySelector('#volume').MaterialSlider&&document.querySelector('#volume').MaterialSlider.change(vid.muted?0:vid.volume);
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

const $vid_meta = $('#vid-meta');
const resetVid = () => {
	vid.reset();

	$vid_meta.attr('src', '');
	if (thumb) thumb.reset();
}

const toggleTslive = () => {
	const url = new URL(location.href);
	url.searchParams.has('tslive') ? url.searchParams.delete('tslive') : url.searchParams.set('tslive', 1);
	history.replaceState(null, null, url);
	location.reload();
}

const seek = document.querySelector('#seek');
const $seek = $(seek);
const $duration = $('.duration');
const $audios = $('.audio');
const $titlebar = $('#titlebar');
const $datacast = $('#datacast');
const $remocon = $('.remote-control');
const $jikkyo = $('#jikkyo');
const addClassLoadding = () => $vid.addClass('is-loading');
const loadMovie = ($e = $('.is_cast')) => {
	const d = $e.data();
	d.canPlay = d.path ? document.createElement('video').canPlayType(`video/${d.path.match(/[^\.]*$/)}`).length > 0 : false;

	if ((!d.canPlay&&vid.toTslive) || !vid.canPlayType(`video/${!d.path || /\.(?:m?ts|m2ts?)$/.test(d.path) ? 'mp2t' : d.path.match(/[^\.]*$/)}`)){
		toggleTslive();
		return;
	}

	if ($e.hasClass('item')){
		$('#playprev').prop('disabled', $e.is('.item:first'));
		$('#playnext').prop('disabled', $e.is('.item:last' ));
	}
	if ($e.hasClass('onair')){
		$('#playprev').prop('disabled', $e.is('.is-active>.onair:first'));
		$('#playnext').prop('disabled', $e.is('.is-active>.onair:last'));
	}

	resetVid();
	addClassLoadding();

	$seek.attr('disabled', false);
	if (d.canPlay){
		const path = `${ROOT}${!d.public ? `api/Movie?fname=${encodeURIComponent(d.path)}` : encodeURIComponent(d.path).replace('%2F','/')}`;
		$vid.attr('src', path);
		$vid_meta.attr('src', `${path.replace(/\.[0-9A-Za-z]+$/,'')}.vtt`);
		vid.loadSubData();
	}else{
		vid.loadSource(`${ROOT}api/${d.onid ? `view?n=${vid.nwtv}&id=${d.onid}-${d.tsid}-${d.sid}`
		                            		: `xcode?${d.path ? `fname=${encodeURIComponent(d.path)}` : d.id ? `id=${d.id}` : d.reid ? `reid=${d.reid}` : ''}` }`);

		if (d.meta){
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

const playerUI = document.querySelector('#playerUI');
const setbmlBrowserSize = () => {
	if (typeof bmlBrowserSetVisibleSize === 'undefined') return;
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

const initRemocon = remocon => {
	remocon.querySelectorAll('.mdl-button,.mdl-icon-toggle').forEach(e => componentHandler.upgradeElement(e));

	remocon.transform = {X: 0, Y: 0};
	$remocon.find('.draggable').on({
		pointerdown(e){
			if (e.button != 0) return;
			remocon.touched = true;
			e.currentTarget.style.cursor = 'grabbing';
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		pointermove(e){
			if (!remocon.touched) return;
			hideBar(3000);
			remocon.style.transform = `translate(${remocon.transform.X += e.originalEvent.movementX}px, ${remocon.transform.Y += e.originalEvent.movementY}px)`;
		},
		pointerup(e){
			remocon.touched = false;
			e.currentTarget.style.cursor = null;
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
	});
	$remocon.find('#num').change(e => $remocon.find('.num').toggleClass('hidden', !$(e.currentTarget).prop('checked')));
}

$(window).on('load resize', () => {
	setbmlBrowserSize();
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
	$remocon.insertAfter('#movie-contner');


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
				if (!this.offset) seek.MaterialSlider.change(currentTime);
			}
			$currentTime.text(getVideoTime(currentTime));
		},
		enabledDetelecine(){
			$('#cinema').mdl_prop('checked', true);
		},
		disabledDetelecine(){
			$('#cinema').mdl_prop('checked', false);
		}
	});

	$('#play').click(() => vid.paused ? vid.play() : vid.pause());
	
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
		$audios.attr('disabled', true);
	});

	const vid_thumb = document.querySelector('#vid-thumb');
	$seek.on({
		change(){
			if ($('.is_cast').data('canPlay')) return;

			vid.setSeek(this.value, addClassLoadding);
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
			vid_thumb.style.setProperty('--width', $player.width()+'PX');
			thumb.seek(Math.min(Math.max(0,$(this).attr('max')*e.offsetX/this.clientWidth),$(this).attr('max')), e.offsetX/this.clientWidth*100);
		},
		touchstart(){
			$(this).data('touched', true);
			if (!thumb) return;
			stopTimer();
			vid_thumb.style.setProperty('--width', $player.width()+'PX');
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
			$('.remote-control,#comment-control').prependTo(playerUI);
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
			$remocon.insertAfter('#movie-contner');
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

			$('.remote-control,#comment-control').prependTo(playerUI);
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
				$remocon.insertAfter('#movie-contner');
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

	$('#autoplay').change(e => sessionStorage.setItem('autoplay', $(e.currentTarget).prop('checked')));

	(() => {
		const $e = localStorage.getItem('quality') ? $(`#${localStorage.getItem('quality')}`) : $('[name=quality]:first');
		$e.prop('checked', true);
		vid.setOption($e.val(), $e.hasClass('tslive'), vid.readyToAutoPlay ? () => vid.toTslive=true : toggleTslive);
	})()
	
	$('[name=quality]').change(e => {
		const $e = $(e.currentTarget);
		localStorage.setItem('quality', $e.attr('id'));

		vid.setOption($e.val(), $e.hasClass('tslive'), toggleTslive, ()=>{if(localStorage.getItem('apk') != 'true')addClassLoadding();});
	});
	$('[name=audio]').change(e => vid.setAudioTrack($(e.currentTarget).val(), addClassLoadding));
	$('#cinema').change(e => vid.setDetelecine(e.currentTarget.checked, addClassLoadding));
	$('.rate').change(e => {
		const $e = $(e.currentTarget);
		vid.setFast($e.val(), $e.data('index'), addClassLoadding);
	});

	vid.nwtv = $('[name=nwtv]:checked').val();
	$('[name=nwtv]').change(e => {
		vid.nwtv = $(e.currentTarget).val();

		const url = new URL(location.href);
		url.searchParams.set('n', vid.nwtv);
		history.replaceState(null, null, url);
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
			hideBar(3000);
			$playerUI.addClass('is-visible');
		});
	}else{
		$('#playerUI').prepend('<div id="center">');
		$('#ctl-button .ctl-button').prependTo('#center');
		$('#volume-container').addClass('hidden');
		$('.player-container>*').not('.remote-control').click(() => {
			$('#playerUI').addClass('is-visible');
			stopTimer();
			hideBar(3000);
		});
	}

	$('#live:not(.live)').click(() => vid.currentTime = vid.duration);

	const $subtitles = $('#subtitles');
	$subtitles.click(() => {
		$subtitles.toggleClass('checked', !$subtitles.hasClass('checked'));
		localStorage.setItem('subtitles', $subtitles.hasClass('checked'));
		if (!vid.cap) return;
		$subtitles.hasClass('checked') ? vid.cap.show() : vid.cap.hide();
	});
	if (localStorage.getItem('subtitles') == 'true') $subtitles.addClass('checked');

	if (localStorage.getItem('datacast') == 'true') {
		vid.datacast.enable();
		$remocon.removeClass('disabled').find('button').prop('disabled', false);
	}
	$datacast.click(() => {
		const enabled = vid.toggleDatacast();
		$remocon.toggleClass('disabled', !enabled).find('button').prop('disabled', !enabled);
		localStorage.setItem('datacast', enabled);
	});

	if (localStorage.getItem('danmaku') == 'true') $jikkyo.addClass('checked');
	if (localStorage.getItem('Jikkyo') == 'true') $jikkyo.addClass('mdl-button--accent');
	vid.toggleJikkyo($jikkyo.hasClass('checked'), $jikkyo.hasClass('mdl-button--accent'));
	$jikkyo.on({
		click(){
			if (!this.longClick) return;
			clearTimeout(this.longClick);
			this.longClick = 0;

			const enabled = vid.toggleJikkyo();
			$jikkyo.toggleClass('checked', enabled);
			localStorage.setItem('danmaku', enabled);
		},
		pointerdown(e){
			if (e.button != 0 || this.longClick) return;

			this.longClick = setTimeout(() => {
				this.longClick = 0;

				const enabled = !vid.jikkyo.loading;
				$jikkyo.toggleClass('mdl-button--accent', enabled);
				localStorage.setItem('Jikkyo', enabled);

				vid.toggleJikkyo(vid.jikkyo.showing, enabled);
			}, 1000);
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
	if (!vid.readyToAutoPlay) return;
	vid.readyToAutoPlay();
	vid.readyToAutoPlay = null;
});
