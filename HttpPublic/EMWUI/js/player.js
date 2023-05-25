﻿var fullscreen, theater;
var VideoSrc;
var ALLOW_HLS;
var hls, cap;
var onDataStream=null;
var onJikkyoStream=null;
var setbmlBrowserSize, toggleDataStream, toggleJikkyo;
var Jikkyo = localStorage.getItem('Jikkyo') == 'true';
var DataStream = localStorage.getItem('DataStream') == 'true';
var video = document.querySelector('#video');
video.muted = localStorage.getItem('muted') == 'true';
video.volume = localStorage.getItem('volume') ? localStorage.getItem('volume') : 1;


function getVideoTime(Time){
	if (!Time) return '--:--';
	var h = Math.floor(Time / 3600);
	var m = Math.floor((Time / 60 ) % 60);
	var s = ('0'+ Math.floor(Time % 60)).slice(-2);
	if (h>0) m = h +':'+ ('0'+ m).slice(-2);
	return m +':'+ s;
}

function hideBar(time){
	hoverID = setTimeout(function(){
		if (!video.paused){
			$('#playerUI,#titlebar').removeClass('is-visible');
			$('#control .mdl-menu__container.is-visible').removeClass('is-visible');
			$('#player').css('cursor', 'none');
		}
	}, time);
}
function stopTimer(){
	clearInterval(hoverID);
	$('#player').css('cursor', 'default');
}

function caption(){
	if (window.Hls != undefined){
		capOption.enableAutoInBandMetadataTextTrackDetection = !Hls.isSupported();
	}else{
		capOption.enableAutoInBandMetadataTextTrackDetection = true;
	}

	switch(capRenderer){
		case 'SVG':
			cap = new aribb24js.CanvasRenderer(capOption);
		case 'Canvas':
			cap = new aribb24js.SVGRenderer(capOption);
	}
	cap.attachMedia(video);
}

function errorHLS(){
	$('#video').removeClass('is-loadding');
	Snackbar.MaterialSnackbar.showSnackbar({message: 'HLSエラー'});
}

function startHLS(src){
	if (!$('.is_cast').length > 0) return;
	if (Hls.isSupported()){
		hls = new Hls();
		hls.loadSource(src);
		hls.attachMedia(video);
		hls.on(Hls.Events.MANIFEST_PARSED,function(){
			var _DataStream; //一度しか読み込めないため常時読み込みはオミット
			if (_DataStream || !$('.remote-control').hasClass('hidden')) toggleDataStream();
			if ($('#subtitles').hasClass('checked')) caption();
			if (Jikkyo || $('#danmaku').hasClass('checked')) toggleJikkyo();
			if (!$('#danmaku').hasClass('checked')) danmaku.hide();
		});
		hls.on(Hls.Events.FRAG_PARSING_METADATA,function(event,data){
			for(var i=0;i<data.samples.length;i++){cap.pushID3v2Data(data.samples[i].pts,data.samples[i].data);}
		});
	}else if(video.canPlayType('application/vnd.apple.mpegurl')){
		video.src=src;
	}
}

function resetHls(){
	if (hls) hls.destroy();
	if (cap) cap.detachMedia();
	if (toggleDataStream) toggleDataStream(true);
	if (toggleJikkyo) toggleJikkyo(true);
	$('#subtitles').toggleClass('hidden', !$('#load_subtitles').prop('checked'));
	VideoSrc = null;
}

function reloadHls(){
	var d = $('.is_cast').data();
	if (!d) return;
	d.paused = video.paused;
	d.ofssec = Math.floor($('input#seek').val());
	loadHls(d);
}

function loadHls(d){
	$('#video').addClass('is-loadding');

	var interval = 0;
	if ($('#remote').hasClass('done')){	//一度読み込んだら最後、無効化
		 $('#remote').prop('disabled', true);
		 $('.remote-control').addClass('hidden');
	}
	if (onDataStream) interval = 5*1000;	//データ放送切ってから一定期間待たないと動画が出力されない？
	resetHls();

	var hls1;
	VideoSrc = root + 'api/'
	if (d.onid){
		hls1 = '&hls=' +(1+d.onid+d.tsid+d.sid);
		VideoSrc += 'view?n=0&id='+ d.onid +'-'+ d.tsid +'-'+ d.sid +'&ctok='+ ctok;
	}else{
		hls1 = new Date();
		hls1 = '&hls=' +(1+(hls1.getHours()*60+hls1.getMinutes())*60+hls1.getSeconds());
		VideoSrc += 'xcode?'
		if (d.path){
			VideoSrc += 'fname=' +d.path;
		}else if (d.id){
			VideoSrc += 'id=' +d.id;
		}else if (d.reid){
			VideoSrc += 'reid=' +d.reid;
		}
		VideoSrc += (d.ofssec > 0 ? '&ofssec=' +d.ofssec : '');
	}

	VideoSrc += '&option=' + $('[name=quality]:checked').val();
	VideoSrc += $('#audio').attr('disabled') ? '' : '&audio2=' + $('[name=audio]:checked').val();
	VideoSrc += $('#cinema').prop('checked') ? '&cinema=1' : '';
	VideoSrc += $('#fast').prop('checked') ? '&fast=1' : '';

	if (window.Hls != undefined){
		setTimeout(function(){
			//Android版Firefoxは非キーフレームで切ったフラグメントMP4だとカクつくので避ける
			waitForHlsStart(VideoSrc +hls1 +(/Android.+Firefox/i.test(navigator.userAgent)?'':hls4) + ($('#load_subtitles').prop('checked') ? '&caption=1' : ''),1000,2000,function(){errorHLS()},function(src){startHLS(src)})
		}, interval);
		//AndroidはcanPlayTypeが空文字列を返さないことがあるが実装に個体差が大きいので避ける
	}else if(ALLOW_HLS&&!/Android/i.test(navigator.userAgent)&&video.canPlayType('application/vnd.apple.mpegurl')){
		setTimeout(function(){
			//環境がないためテスト出来ず
			waitForHlsStart(VideoSrc +hls1 +hls4 + ($('#load_subtitles').prop('checked') ? '&caption=1' : ''),1000,2000,function(){errorHLS()},function(src){video.src=src;})
		}, interval);
	}else{
		video.src = VideoSrc;
	}
}

function loadMovie(obj){
	var d = obj.data();
	if (d.path) d.canPlay = video.canPlayType('video/' + d.path.match(/[^\.]*$/)).length > 0;
	$('#seek').attr('disabled', false);
	if (d.canPlay){
		if (d.public){
			path = root + d.path;
		}else{
			path = root + 'api/Movie?fname=' + d.path;
		}
		$('#video').addClass('is-loadding').attr('src', path);
		$('.quality').attr('disabled', true);
	}else{
		loadHls(d);
		$('.quality').attr('disabled', false);

		if (d.duration){
			$('.duration').text(getVideoTime(d.duration));
			$('#seek').attr('max', d.duration);
		}else if (d.path){
			$.get(root + 'api/Movie?fname=' + d.path + '&meta=' + (d.public ? '&public=' : ''), function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);
				if (xml.find('duration').length > 0){
					var duration = Number(xml.find('duration').text());
					$('.is_cast').data('duration', duration);
					$('.duration').text(getVideoTime(duration));
					$('#seek').attr('max', duration);
					$('.Time-wrap').removeClass('is-disabled');
				}else{
	        		$('.Time-wrap').addClass('is-disabled');
	      		}
	      		$('.audio').attr('disabled', Number(xml.find('audio').text()) == 1);
	    	});
	  	}
	}

	$('#titlebar').html(d.name || (d.service +' - '+ (d.title ? ConvertTitle(d.title) : '')));

	if (obj.hasClass('item')){
		$('.ctl-button').removeClass('is-disabled');
		if (obj.is('.item:first')) $('#playprev').addClass('is-disabled');
		if (obj.is('.item:last' )) $('#playnext').addClass('is-disabled');
	}
	if (obj.hasClass('onair')){
		$('.ctl-button').removeClass('is-disabled');
		if (obj.is('.is-active>.onair:first')) $('#playprev').addClass('is-disabled');
		if (obj.is('.is-active>.onair:last' )) $('#playnext').addClass('is-disabled');
	}
}

function playMovie(obj){
	if (obj.hasClass('playing')){
		hideBar(2000);
		video.play();
	}else{
		video.src = '';
		document.querySelector('#seek').MaterialSlider.change(0);
		$('.currentTime,.duration').text('0:00');
		$('.audio').attr('disabled', true);
		$('.playing').removeClass('is_cast playing');
		obj.addClass('is_cast playing');
		loadMovie(obj);
	}
}

$(window).on('load resize', function(){
	if (!fullscreen){
		if (theater || is_small_screen()){
			theater = true;
			$('#movie-contner #player').prependTo('#movie-theater-contner');
		}else{
			$('#movie-theater-contner #player').prependTo('#movie-contner');
		}
	}
	if ($('#video').width() < 800){
		$('#player').addClass('is-small');
	}else{
		$('#player').removeClass('is-small');
	}
});

$(function(){
	$('#autoplay').prop('checked', sessionStorage.getItem('autoplay') == 'true');
	$('#apk').prop('checked', localStorage.getItem('apk') == 'true');

	$('#volume').on('mdl-componentupgraded', function() {
		if (video.muted){
			this.MaterialSlider.change(0);
		}else{
			this.MaterialSlider.change(video.volume);
		}
	});
	if(!is_small_screen()){
		$('.remote-control').prependTo('#apps-contener>.contener>.contener');
	}else{
		$('.remote-control .num').addClass('hidden');
		$('.remote-control,#apps-contener').prependTo('#main-column');
	}


	//閉じる
	$('.close.mdl-badge').click(function(){
		$('#popup').removeClass('is-visible');
		video.pause();
		video.playbackRate = 1;
	});

	$('#video').on({
		'pause': function(){
			$('#play i').text('play_arrow');
		},
		'play': function(){
			$('#play i').text('pause');
		},
		'ended': function(){
			var autoplay = sessionStorage.getItem('autoplay') == 'true';
			if (autoplay && !$('.playing').is('.item:last')){
				playMovie($('.playing').next());
				$('#titlebar').addClass('is-visible');
			}else{
				if (autoplay && $('.playing').is('.item:last')){
					Snackbar.MaterialSnackbar.showSnackbar({message: '最後のファイルを再生しました'});
				}
				$('#playerUI').addClass('is-visible');
			}
		},
		'error': function(){
			if ($('#video').attr('src') != ''){
				$(this).removeClass('is-loadding');
				$('.is_cast').removeClass('is_cast');
				var errorcode = this.error.code;
				if (this.networkState == 3){
					errorcode = 5;
				}
				var url = this.currentSrc;
				var data = {
					message: 'Error : ' + ['MEDIA_ERR_ABORTED','MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED','NETWORK_NO_SOURCE'][errorcode]
				}
				Snackbar.MaterialSnackbar.showSnackbar(data);
			}
		},
		'volumechange': function(){
			if (this.muted){
				$('#volume-icon i').text('volume_off');
			}else if (this.volume == 0){
				$('#volume-icon i').text('volume_mute');
			}else if (this.volume > 0.5){
				$('#volume-icon i').text('volume_up');
			}else{
				$('#volume-icon i').text('volume_down');
			}
			localStorage.setItem('volume', this.volume);
			localStorage.setItem('muted', this.muted);
		},
		'ratechange': function(){
			//if (sessionStorage.getItem('autoplay') == 'true') this.defaultPlaybackRate = this.playbackRate;
		},
		'canplay': function(){
			hideBar(2000);
			$(this).removeClass('is-loadding');

			var d = $('.is_cast').data();
			if (!d.paused) this.play();
			if (d.canPlay){
				$('.duration').text(getVideoTime(this.duration));
				$('#seek').attr('max', this.duration);
			}
		},
		'timeupdate': function(){
			var d = $('.is_cast').data();
			if (!d)return;
			var currentTime;
			if (d.onid){
				currentTime = (Date.now() - d.starttime)/1000;
				document.querySelector('#seek').MaterialProgress.setProgress(currentTime / d.duration * 100);
				if (this.duration - this.currentTime < 2) {$('#live').addClass('live');}else{$('#live').removeClass('live');}
			}else if (d.path || d.id || d.reid){
				if (!$('#seek').data('touched')){
					currentTime = this.currentTime + (d.ofssec ? d.ofssec : 0);
					document.querySelector('#seek').MaterialSlider.change(currentTime);
				}
			}
			if (currentTime)$('.currentTime').text(getVideoTime(currentTime));
		}
	});

	$('#play').click(function(){
		if (video.paused){
			video.play();
		}else{
			video.pause();
		}
	});
	$('.stop').click(function(){
		resetHls();
		$(video).removeClass('is-loadding');
		$('#epginfo').addClass('hidden');
		$('.is_cast').removeClass('is_cast');
		if ($('#seek').hasClass('mdl-progress')) document.querySelector('#seek').MaterialProgress.setProgress(0);
		$('.currentTime,.duration').text('0:00');
		$('.quality,.audio').attr('disabled', true);
	});

	$('#seek').on({
		'touchstart mousedown': function(){
			$(this).data('touched', true);
		},
		'touchend mouseup': function(){
			$(this).data('touched', false);
		},
		'change': function(){
			var d = $('.is_cast').data();
			if (!d.canPlay){
				if (d.ofssec < $(this).val() && $(this).val() < d.ofssec + video.duration){
					video.currentTime = $(this).val() - d.ofssec;
				}else{
					reloadHls();
				}
			}
		},
		'input': function(){
			$('.currentTime').text(getVideoTime($(this).val()));
			if ($('.is_cast').data('canPlay'))video.currentTime = $(this).val();
		}
	});

	$('#volume').on('input', function(){
		video.muted = false;
		video.volume = $(this).val();
	});

	$('#volume-icon').click(function(){
		if (video.muted){
			video.muted = false;
			document.querySelector('#volume').MaterialSlider.change(video.volume);
		}else{
			video.muted = true;
			document.querySelector('#volume').MaterialSlider.change(0);
		}
	});

	$('#fullscreen').click(function(e){
		var player = document.querySelector('#player');
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
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
			if(theater || is_small_screen()){
				$('.remote-control').prependTo('#main-column');
				$('.remote-control .num').addClass('hidden');
			}else{
				$('#comment-control').insertAfter('#apps-contener>.contener');
				$('.remote-control').prependTo('#apps-contener>.contener>.contener');
			}

		}
	});
	$('#defult').click(function(){
		theater = true;
		$('#player').prependTo($('#movie-theater-contner'));
		$('.remote-control').prependTo('#main-column');
		$('.remote-control .num').addClass('hidden');
		if (setbmlBrowserSize) setbmlBrowserSize();
	});
	$('#theater').click(function(){
		theater = false;
		$('#player').prependTo($('#movie-contner'));
		$('.remote-control').prependTo('#apps-contener>.contener>.contener');
		$('.remote-control .num').removeClass('hidden');
		if (setbmlBrowserSize) setbmlBrowserSize();
	});

	$('#autoplay').change(function(){
		sessionStorage.setItem('autoplay', $(this).prop('checked'));
		//video.defaultPlaybackRate = $(this).prop('checked') ? video.playbackRate : 1;
	});

	$('#'+ localStorage.getItem('quality')).prop('checked', true);
	$('[name=quality]').change(function(){
		if ($(this).prop('checked')){
			localStorage.setItem('quality', $(this).attr('id'));
		}else{
			localStorage.removeItem('quality');
		}
		if (!$('#video').data('cast') || localStorage.getItem('apk') != 'true'){
			reloadHls();
		}
	});
	$('[name=audio],#cinema,#load_subtitles,#fast').change(function(){
		reloadHls();
	});
	$('.rate').change(function(){
		video.playbackRate = $(this).val();
	});

	hideBar(0);
	if (!isTouch){
		$('.player-container>*').not('.remote-control').hover(function(){
			stopTimer();
			$('#playerUI').addClass('is-visible');
		}, function(){
			hideBar(0);
		});

		$('.player-container>*').not('.remote-control').mousemove(function(e){
			stopTimer();
			hideBar(2000);
			$('#playerUI').addClass('is-visible');
		});
	}else{
		$('#ctl-button .ctl-button').prependTo('#center');
		$('#center').removeClass('hidden');
		$('#volume-container').addClass('hidden');
		$('.player-container>*').not('.remote-control').click(function(){
			$('#playerUI').addClass('is-visible');
			stopTimer();
			hideBar(2000);
		});
	}


	$('#live:not(.live)').click(function(){
		video.currentTime = video.duration;
	});

	$('#load_subtitles').change(function(){
		localStorage.setItem('load_subtitles', $(this).prop('checked'));
	});
	if (localStorage.getItem('load_subtitles')) $('#load_subtitles').prop('checked', localStorage.getItem('load_subtitles') == 'true');

	$('#subtitles').click(function(){
		if($(this).hasClass('checked')){
			cap.hide();
		}else{
			if (!cap) caption();
			cap.show();
		}
		$(this).toggleClass('checked', !$(this).hasClass('checked'));
		localStorage.setItem('subtitles', $(this).hasClass('checked'));
	});
	if (localStorage.getItem('subtitles') == 'true') $('#subtitles').addClass('checked');

	if (DataStream) $('#remote').addClass('mdl-button--accent');
	$('#remote').on({
		'click': function(e){
			if($(this).data('click')){
				clearTimeout($(this).data('click'));
				if(!$('.remote-control').hasClass('hidden')){
					if (!DataStream) toggleDataStream(true);
				}else{
					if (!onDataStream) toggleDataStream();
					if (!theater)$('#apps').prop('checked', true);
				}
				$('.remote-control').toggleClass('hidden', !$('.remote-control').hasClass('hidden'));
			}
			$(this).data('click', false);
		},
		'touchstart mousedown': function(e){
			if (e.which > 1 || $(this).data('click')) return;
			$(this).data('click', setTimeout(function(){
				$('#remote').data('click', false);
				DataStream = !DataStream;
				localStorage.setItem('DataStream', DataStream);
				if (DataStream){
					if (!onDataStream) toggleDataStream();
					$('#remote').addClass('mdl-button--accent');
				}else{
					if ($('#remote').hasClass('hidden')) toggleDataStream(true);
					$('#remote').removeClass('mdl-button--accent');
				}
			}, 1000));
		}
	});

	$('#num').change(function(){
		$('.remote-control .num').toggleClass('hidden', !$(this).prop('checked'));
	});

	if (localStorage.getItem('danmaku') == 'true') $('#danmaku').addClass('checked');
	if (Jikkyo) $('#danmaku').addClass('mdl-button--accent');
	$('#danmaku').on({
		'click': function(){
			if($(this).data('click')){
				clearTimeout($(this).data('click'));
				if($(this).hasClass('checked')){
					if (!Jikkyo) toggleJikkyo(true);
					if (danmaku) danmaku.hide();
				}else{
					if (!onJikkyoStream) toggleJikkyo();
					if (danmaku) danmaku.show();
				}
				$(this).toggleClass('checked', !$(this).hasClass('checked'));
				localStorage.setItem('danmaku', $(this).hasClass('checked'));
			}
			$(this).data('click', false);
		},
		'touchstart mousedown': function(e){
			if (e.which > 1 || $(this).data('click')) return;
			$(this).data('click', setTimeout(function(){
				$('#danmaku').data('click', false);
				Jikkyo = !Jikkyo;
				localStorage.setItem('Jikkyo', Jikkyo);
				if (Jikkyo){
					if (!onJikkyoStream) toggleJikkyo();
					$('#danmaku').addClass('mdl-button--accent');
				}else{
					if (!$('#danmaku').hasClass('checked')) toggleJikkyo(true);
					$('#danmaku').removeClass('mdl-button--accent');
				}
			}, 1000));
		}
	});
	
	$('#apps').change(function(){
		if ($(this).prop('checked')){
			$('#comment-control').insertAfter('#apps-contener>.contener>.contener');
		}else{
			$('#comment-control').prependTo('.player-container');
		}
		localStorage.setItem('apps', $(this).prop('checked'));
	});
	if (localStorage.getItem('apps') == 'true') $('#apps').click();

	$('#comment-control').hover(function(){
		$(this).addClass('is-visible');
	}, function(){
		$(this).removeClass('is-visible');
	});

	$('#comm').focus(function(){
		$('#comment-control').addClass('is-focused');
	}).blur(function(){
		$('#comment-control').removeClass('is-focused');
	}).change(function(){
		if($(this).val()==''){
			$('#comment-control').removeClass('is-dirty');
		}else{
			$('#comment-control').addClass('is-dirty');
		}
	});
});
