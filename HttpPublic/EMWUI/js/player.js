function getVideoTime(Time){
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

var seek = 0;
function loadMovie(obj){
	var canPlay;
	var path= obj.data('path');
	if (path) canPlay = video.canPlayType('video/' + path.match(/[^\.]*$/)).length > 0;
	var quality = localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '';
	seek = $('#seek').val();
	var offset = seek > 0 ? '&offset=' + seek : '';
	var audio = '&audio='+$('[name=audio]:checked').val();

	if (obj.data('public') && canPlay){
		path = root + path;
	}else if (obj.data('rec')){
		path = path + quality + offset + ($('.audio:checked').length>0 ? audio : '');
	}else if ($('#video').data('cast')){
		path = root + 'api/TvCast?onid=' + obj.data('onid') +'&tsid='+ obj.data('tsid') +'&sid='+ obj.data('sid') + quality + ($('#audio').attr('disabled') ? '' : audio) +'&null='+ Math.floor(Math.random()*1000); //再生失敗時のキャッシュ対策
	}else{
		path = root + 'api/Movie?fname=' + path + (canPlay ? '&xcode=0' : '') + quality + offset + (obj.data('public') ? '&public=' : '') + ($('.audio:checked').length>0 ? audio : '');
	}

	if (canPlay){
		$('#HD').prop('disabled', true).parents('.mdl-menu__item').attr('disabled', true);
	}else{
		$('#HD').prop('disabled', false).parents('.mdl-menu__item').attr('disabled', false);
	}

	$('#video').addClass('is-loadding').attr('src', path).data(obj.data()).data('xcode', !canPlay);
	$('#titlebar').html(obj.data('name') +' - '+ (obj.data('title') ? ConvertTitle(obj.data('title')) : ''));

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
	}else{
		$('#seek').get(0).MaterialSlider.change(0);
		$('.currentTime,.duration').text('0:00');
		loadMovie(obj);
	}
	video.play();
	$('.item').removeClass('playing');
	obj.addClass('playing');
}

function playerResize() {
	if ($('#video').width() < 800){
		$('#player').addClass('is-small');
	}else{
		$('#player').removeClass('is-small');
	}
}

$(function(){
	var xcode, duration;
	var notification = document.querySelector('.mdl-js-snackbar');

	var video = $('#video').get(0);
	video.muted = localStorage.getItem('muted') == 'true';
	video.volume = localStorage.getItem('volume') ? localStorage.getItem('volume') : 1;
	$('#autoplay').prop('checked', sessionStorage.getItem('autoplay') == 'true');
	$('#apk').prop('checked', localStorage.getItem('apk') == 'true');

	$('#volume').on('mdl-componentupgraded', function() {
		if (video.muted){
			this.MaterialSlider.change(0);
		}else{
			this.MaterialSlider.change(video.volume);
		}
	});

	//閉じる
	$('.close.mdl-badge').click(function(){
		$('#popup').removeClass('is-visible');
		video.pause();
		video.playbackRate = 1;
	});

	$(window).on('resize', function(){
		playerResize();
	});

	$('#video').on({
		'resize': function(){
			playerResize();
		},
		'pause': function(){
			$('#play').text('play_arrow');
		},
		'play': function(){
			$('#play').text('pause');
		},
		'ended': function(){
			var autoplay = sessionStorage.getItem('autoplay') == 'true';
			if (autoplay && !$('.playing').is('.item:last')){
				playMovie($('.playing').next());
				$('#titlebar').addClass('is-visible');
			}else{
				if (autoplay && $('.playing').is('.item:last')){
					notification.MaterialSnackbar.showSnackbar({message: '最後のファイルを再生しました'});
				}
				$('#playerUI').addClass('is-visible');
			}
		},
		'error': function(){
			var messege;
			var errorcode = this.error.code;
			if (errorcode == 1){
				messege = 'MEDIA_ERR_ABORTED';
			}else if (errorcode == 2){
				messege = 'MEDIA_ERR_NETWORK';
			}else if (errorcode == 3){
				messege = 'MEDIA_ERR_DECODE';
			}else if (errorcode == 4){
				if ($('#video').attr('src')!='') messege = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
			}
			$(this).removeClass('is-loadding');
			if (messege) notification.MaterialSnackbar.showSnackbar({message: 'Error : ' + messege});
		},
		'volumechange': function(){
			if (this.muted){
				$('#volume-icon').text('volume_off');
			}else if (this.volume == 0){
				$('#volume-icon').text('volume_mute');
			}else if (this.volume > 0.5){
				$('#volume-icon').text('volume_up');
			}else{
				$('#volume-icon').text('volume_down');
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

			if ($(this).data('cast')){
				this.play();

				var data = $('.is_cast').data();
				$('.duration').text(getVideoTime(data.duration));

				$(this).on('timeupdate', function(){
					var currentTime = (Date.now() - data.start)/1000;
					$('.currentTime').text(getVideoTime(currentTime));
					$('#seek').get(0).MaterialProgress.setProgress(currentTime / data.duration * 100);
				});
			}else{
				var self = $(this);
				function timeupdate(duration){
					self.on('timeupdate', function(){
						if (!self.data('touched')){
							var currentTime = video.currentTime + seek * (duration / 99);
							$('.currentTime').text(getVideoTime(currentTime));
							$('#seek').get(0).MaterialSlider.change(currentTime / duration * 100);
						}
					});
					$('.Time-wrap').removeClass('is-disabled');
					$('.duration').text(getVideoTime(duration));
				};

				xcode = $(this).data('xcode');
				if (xcode){
					$('#seek').attr('max', 99);
					$('#audio').prop('disabled', false);
					duration = $(this).data('duration');
					if (duration){
						timeupdate(duration);
					}else{
						$.get(root + 'api/Movie?fname=' + $(this).data('path') + '&meta=', function(result, textStatus, xhr){
							var xml = $(xhr.responseXML);
							if (xml.find('duration').length > 0){
								duration = xml.find('duration').text();
								timeupdate(duration);
							}else{
								duration = false;
								$(this).off('timeupdate');
								$('.Time-wrap').addClass('is-disabled');
							}
							if (xml.find('audio').length > 0){
								if (xml.find('audio').text() == 1){
									$('#RAW').prop('checked', true);
									$('.dual').show();
									$('.multi').hide();
								}else{
									$('#multi1').prop('checked', true);
									$('.multi').show();
									$('.dual').hide();
								}
							}
						});
					}
				}else{
					$('#seek').attr('max', 100);
					$('#audio').prop('disabled', true);
					duration = this.duration;
					timeupdate(duration);
				}
			}
		}
	});

	$('#play').click(function(){
		if (video.paused){
			video.play();
		}else{
			video.pause();
		}
	});

	$('#seek').on({
		'touchstart mousedown': function(){
			$('#video').data('touched', true);
		},
		'touchend mouseup': function(){
			$('#video').data('touched', false);
		},
		'change': function(){
			if (xcode){
				var paused = video.paused;
				loadMovie($('#video'));
				if (!paused) video.play();
			}
		},
		'input': function(){
			if (duration){
				var currentTime = video.currentTime + $(this).val() * (duration / 99);
				$('.currentTime').text(getVideoTime(currentTime));
			}
			if (!xcode) video.currentTime = (video.duration / 100) * $(this).val();
		}
	});

	$('#volume').on('input', function(){
		video.muted = false;
		video.volume = $(this).val();
	});

	$('#volume-icon').click(function(){
		if (video.muted){
			video.muted = false;
			$('#volume').get(0).MaterialSlider.change(video.volume);
		}else{
			video.muted = true;
			$('#volume').get(0).MaterialSlider.change(0);
		}
	});

	$('#fullscreen').click(function(e){
		var player = $('#player').get(0);
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
			screen.orientation.lock('landscape');
			$('#fullscreen').text('fullscreen_exit');
			$('.mdl-js-snackbar').appendTo('#player');
		} else {
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
			$('#fullscreen').text('fullscreen');
			$('.mdl-js-snackbar').appendTo('.mdl-layout');
		}
	});

	$('#autoplay').change(function(){
		sessionStorage.setItem('autoplay', $(this).prop('checked'));
		//video.defaultPlaybackRate = $(this).prop('checked') ? video.playbackRate : 1;
	});

	$('#'+ localStorage.getItem('quality')).prop('checked', true);
	$('.quality').change(function(){
		if ($(this).prop('checked')){
			localStorage.setItem('quality', $(this).attr('id'));
		}else{
			localStorage.removeItem('quality');
		}
		if (!$('#video').data('cast') || localStorage.getItem('apk') != 'true'){
			var paused = video.paused;
			loadMovie($('#video'));
			if (!paused) video.play();
		}
	});
	$('.audio').change(function(){
		var paused = video.paused;
		loadMovie($('#video'));
		if (!paused) video.play();
	});
	$('.rate').change(function(){
		video.playbackRate = $(this).val();
	});

	hideBar(0);
	if (!isTouch){
		$('#player').hover(function(){
			stopTimer();
			$('#playerUI').addClass('is-visible');
		}, function(){
			hideBar(0);
		});

		$('#player').mousemove(function(e){
			stopTimer();
			hideBar(2000);
			$('#playerUI').addClass('is-visible');
		});
	}else{
		$('#player').click(function(){
			$('#playerUI').addClass('is-visible');
			stopTimer();
			hideBar(2000);
		});
	}
});
