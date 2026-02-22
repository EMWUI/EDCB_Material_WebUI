const video = document.getElementById("video");
const $vid = $(video);

//safariがis属性に対応しないための
const vid = isSafari == 1 ? new TsLiveDatacast(video) : video;	//HTMLMediaElementメソッド用
const ts  = isSafari == 2 ? new HlsDatacast(video) : vid;		//拡張メソッド用

vid.muted = localStorage.getItem('muted') == 'true';
vid.volume = localStorage.getItem('volume') || 1;
if (ts.tslive){
	//自動再生ポリシー対策
	const muted = vid.muted;
	vid.muted = true;
	$(document).one('click', () => {
		vid.muted = muted;
		document.querySelector('#volume').MaterialSlider&&document.querySelector('#volume').MaterialSlider.change(vid.muted?0:vid.volume);
	});	
}

const thumb = 'createMiscWasmModule' in window && new TsThumb(`${ROOT}api/grabber`, document.querySelector('#vid-thumb'), video);

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
	ts.reset();

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

	if ((!d.canPlay&&ts.toTslive) || !ts.canPlayType(`video/${!d.path || /\.(?:m?ts|m2ts?)$/.test(d.path) ? 'mp2t' : d.path.match(/[^\.]*$/)}`)){
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
		ts.loadSubData();
	}else{
		ts.loadSource(`${ROOT}api/${d.onid ? `view?n=${ts.nwtv}&id=${d.onid}-${d.tsid}-${d.sid}`
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
	if (!width||!height) return;
	bmlBrowserSetVisibleSize(width,height);
}

ts.setRemoconEvent = remocon => {
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
		$('#movie-container #player').prependTo('#movie-theater-container');
	}else{
		$('#movie-theater-container #player').prependTo('#movie-container');
	}
});

$(function(){
	$('#autoplay').prop('checked', sessionStorage.getItem('autoplay') == 'true');
	$('#apk').prop('checked', localStorage.getItem('apk') == 'true');

	const $volume = $('#volume');
	$volume.on('mdl-componentupgraded', () => $volume.get(0).MaterialSlider.change(vid.muted ? 0 : vid.volume));


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
			const errorcode = ts.networkState == 3  ? 5 : ts.error.code;
			Snackbar(`Error : ${[ts.error.message,'MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED','NETWORK_NO_SOURCE'][errorcode]}`);
		},
		volumechange(){
			vid.onVolumeChange();
			localStorage.setItem('volume', vid.volume);
			localStorage.setItem('muted', vid.muted);
		},
		//ratechange(){if (sessionStorage.getItem('autoplay') == 'true') vid.defaultPlaybackRate = vid.playbackRate;},
		canplay(){
			hideBar(2000);
			$vid.removeClass('is-loading');

			if (!vid.doNotAutoplay){
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
			const d = $('.is_cast').data();
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
				if (seek.seeking) return;

				currentTime = vid.currentTime * (vid.fast || 1) + (vid.ofssec || 0);
				if (!vid.offset) seek.MaterialSlider.change(currentTime);
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

			ts.setSeek(this.value, addClassLoadding);
		},
		input(){
			$currentTime.text(getVideoTime(this.value));
			if ($('.is_cast').data('canPlay')) vid.currentTime = this.value;
		},
		pointerenter(e){
			if (!thumb || this.disabled) return;

			vid_thumb.style.setProperty('--width', $player.width()+'PX');
			thumb.seek(Math.min(Math.max(0,$(this).attr('max')*e.offsetX/this.clientWidth),$(this).attr('max')), e.offsetX/this.clientWidth*100);
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		pointerdown(e){
			if (e.button != 0 || this.disabled) return;

			this.seeking = true;
			stopTimer();
		},
		pointermove(e){
			if (!thumb || this.disabled) return;

			thumb.seek(Math.min(Math.max(0,$(this).attr('max')*(e.offsetX-6)/(this.clientWidth-12)),$(this).attr('max')), e.offsetX/this.clientWidth*100);
		},
		pointerup(){
			this.seeking = false;
			hideBar(2000);
		},
		pointerleave(e){
			if (thumb) thumb.hide();
			e.currentTarget.releasePointerCapture(e.pointerId);
		},
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
			$remocon.appendTo('.remocon-container');
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
				container.prepend(content);
				$remocon.appendTo('.remocon-container');
				$(container).height('');
			});
		});
		$('#PIP_exit').click(() => documentPictureInPicture.window.close())
	}
	$('#defult').click(() => {
		vid.theater = true;
		$player.prependTo($('#movie-theater-container'));
		setbmlBrowserSize();
	});
	$('#theater').click(() => {
		vid.theater = false;
		$player.prependTo($('#movie-container'));
		setbmlBrowserSize();
	});

	$('#autoplay').change(e => sessionStorage.setItem('autoplay', $(e.currentTarget).prop('checked')));

	(() => {
		const $e = localStorage.getItem('quality') ? $(`#${localStorage.getItem('quality')}`) : $('[name=quality]:first');
		$e.prop('checked', true);
		ts.setOption($e.val(), $e.hasClass('tslive'), vid.readyToAutoPlay ? () => ts.toTslive=true : toggleTslive);
	})()
	
	$('[name=quality]').change(e => {
		const $e = $(e.currentTarget);
		localStorage.setItem('quality', $e.attr('id'));

		ts.setOption($e.val(), $e.hasClass('tslive'), toggleTslive, ()=>{if(localStorage.getItem('apk') != 'true')addClassLoadding();});
	});
	$('[name=audio]').change(e => ts.setAudioTrack($(e.currentTarget).val(), addClassLoadding));
	$('#cinema').change(e => ts.setDetelecine(e.currentTarget.checked, addClassLoadding));
	$('.rate').change(e => {
		const $e = $(e.currentTarget);
		ts.setFast($e.val(), $e.data('index'), addClassLoadding);
	});

	ts.nwtv = $('[name=nwtv]:checked').val();
	$('[name=nwtv]').change(e => {
		ts.nwtv = $(e.currentTarget).val();

		const url = new URL(location.href);
		url.searchParams.set('n', ts.nwtv);
		history.replaceState(null, null, url);
	});

	//TS-Live!有効時、非対応端末は画質選択無効
	$('.tslive').attr('disabled', !window.isSecureContext || !navigator.gpu);


	hideBar();
	const $player_container = $('.player-container>*').not('.remote-control');
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
		$player_container.click(() => {
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
		if (!ts.cap) return;
		$subtitles.hasClass('checked') ? ts.cap.show() : ts.cap.hide();
	});
	if (localStorage.getItem('subtitles') == 'true') $subtitles.addClass('checked');
	else if (ts.cap) ts.cap.hide();

	if (localStorage.getItem('datacast') == 'true') {
		ts.datacast.enable();
		$remocon.removeClass('disabled').find('button').prop('disabled', false);
	}
	$datacast.click(() => {
		const enabled = ts.toggleDatacast();
		$remocon.toggleClass('disabled', !enabled).find('button').prop('disabled', !enabled);
		localStorage.setItem('datacast', enabled);
	});

	if (localStorage.getItem('danmaku') == 'true') $jikkyo.addClass('checked');
	if (localStorage.getItem('Jikkyo') == 'true') $jikkyo.addClass('mdl-button--accent');
	ts.toggleJikkyo($jikkyo.hasClass('checked'), $jikkyo.hasClass('mdl-button--accent'));
	$jikkyo.on({
		click(){
			if (!this.longClick) return;
			clearTimeout(this.longClick);
			this.longClick = 0;

			const enabled = ts.toggleJikkyo();
			$jikkyo.toggleClass('checked', enabled);
			localStorage.setItem('danmaku', enabled);
		},
		pointerdown(e){
			if (e.button != 0 || this.longClick) return;

			this.longClick = setTimeout(() => {
				this.longClick = 0;

				const enabled = !ts.jikkyo.loading;
				$jikkyo.toggleClass('mdl-button--accent', enabled);
				localStorage.setItem('Jikkyo', enabled);

				ts.toggleJikkyo(ts.jikkyo.showing, enabled);
			}, 1000);
		}
	});
	
	$("#jikkyo-comm").appendTo('#apps-container>.container>.container');
	$('#apps').change(e => {
		($(e.currentTarget).prop('checked'))
			? $('#comment-control').insertAfter('#apps-container>.container>.container')
			: $('#comment-control').prependTo('.player-container');
		localStorage.setItem('apps', $(e.currentTarget).prop('checked'));
	});
	if (localStorage.getItem('apps') == 'true') $('#apps').click();

	$('#comment-control').hover(e => $(e.currentTarget).addClass('is-visible'), e => $(e.currentTarget).removeClass('is-visible'));

	$('#jikkyo-config select[name=id]').change(e => ts.jkID = $(e.currentTarget).val());
	$('#jikkyo-opacity').on({input:e => ts.jikkyo.danmaku.opacity($(e.currentTarget).val())});
	$('#jikkyo-fontsize').on({input:e => ts.jikkyo.danmaku.options.height = $(e.currentTarget).val()});
	$('#comm').focus(() => $('#comment-control').addClass('is-focused')
		).blur(() => $('#comment-control').removeClass('is-focused')
		).change(e => $('#comment-control').toggleClass('is-dirty', $(e.currentTarget).val()!='')
	).on({
		sentComment(){
			$('#comment-control,#comment-control>div').removeClass('is-dirty');
		}
	});

	$('.toggle-info').click(e => {
		const $e = $($(e.currentTarget).attr('for'));
		$e.slideToggle(() => $(e.currentTarget).children().text(`expand_${$e.is(':hidden') ? 'more' : 'less'}`));
	});

	//再生タブ
	$('#movie_tab').click(() => {
		if (vid.loaded) return;

		if (!$('.is_cast').data('public')) loadMovie($('.is_cast'));
		else $vid.trigger('load');
		vid.loaded = true;
		setTimeout(setbmlBrowserSize, 100);
	});

	//準備できてから再生開始
	if (!vid.readyToAutoPlay) return;
	vid.readyToAutoPlay();
	vid.readyToAutoPlay = null;
});
