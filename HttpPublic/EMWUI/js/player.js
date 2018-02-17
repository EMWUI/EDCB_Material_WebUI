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
			$('.bar').removeClass('is-visible');
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
	var path = obj.data('path');
	var canPlay = video.canPlayType('video/' + path.match(/[^\.]*$/)).length > 0;
	var quality = localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '';
	seek = $('#seek').val();
	var offset = seek > 0 ? '&offset=' + seek : '';

	if (obj.data('public') && canPlay){
		path = root + path;
	}else if (obj.data('rec')){
		path = path + quality + offset;
	}else{
		path = root + 'api/Movie?fname=' + path + (canPlay ? '&xcode=0' : '') + quality + offset + (obj.data('public') ? '&public=' : '');
	}

	if (canPlay){
		$('#HD').prop('disabled', true).parents('.mdl-menu__item').attr('disabled', true);
	}else{
		$('#HD').prop('disabled', false).parents('.mdl-menu__item').attr('disabled', false);
	}

	$('#video').addClass('is-loadding').attr('src', path).data(obj.data()).data('xcode', !canPlay);
	$('#titlebar').text(obj.data('name'));

	$('.ctl-button').removeClass('is-disabled');
	if (obj.is('.item:first')) $('#playprev').addClass('is-disabled');
	if (obj.is('.item:last' )) $('#playnext').addClass('is-disabled');
}

function playMovie(obj){
	if (obj.hasClass('playing')){
		hideBar(2000);
	}else{
		$('#titlebar').addClass('is-visible');
		$('#seek').get(0).MaterialSlider.change(0);
		$('#volume').get(0).MaterialSlider.change(video.volume);
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
			}else if (autoplay && $('.playing').is('.item:last')){
				notification.MaterialSnackbar.showSnackbar({message: '最後のファイルを再生しました'});
			}else{
				$('.bar').addClass('is-visible');
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
				messege = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
			}
			notification.MaterialSnackbar.showSnackbar({message: 'Error : ' + messege});
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
			$('#rate').text(this.playbackRate);
			//if (sessionStorage.getItem('autoplay') == 'true') this.defaultPlaybackRate = this.playbackRate;
		},
		'loadeddata': function(){
			hideBar(1000);
		},
		'canplay': function(){
			hideBar(2000);
			$(this).removeClass('is-loadding');
			$('#seek').prop('disabled', false);
			
			xcode = $(this).data('xcode');
			duration= $(this).data('duration') || this.duration;
			
			if (xcode && !$(this).data('rec')){
				$(this).off('timeupdate');
				$('#seek').attr('max', 99).attr('step', 1);
				$('.videoTime').addClass('is-disabled');
				$('.currentTime,.duration').text('0:00');
			}else{
				$(this).on('timeupdate', function(){
					if(!$(this).data('touched')){
						var currentTime = video.currentTime + seek * (duration / 99);
						$('.currentTime').text(getVideoTime(currentTime));
						$('#seek').get(0).MaterialSlider.change(currentTime / (duration / 100));
					}
				});
				$('#seek').attr('max', 100).attr('step', 0.01);
				$('.videoTime').removeClass('is-disabled');
				$('.duration').text(getVideoTime(duration));
				//if (!$(this).data('public') && !$(this).data('duration')) $('#seek').prop('disabled', true);  //Firefoxだとシークできたので
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
			if (!xcode || $('#video').data('rec')){
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

	$('#playprev').click(function(){
		if (!$(this).hasClass('is-disabled')) playMovie($('.playing').prev());
	});
	$('#playnext').click(function(){
		if (!$(this).hasClass('is-disabled')) playMovie($('.playing').next());
	});

	$('#fullscreen').click(function(e){
		var player = $('#player').get(0);
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
			if (player.requestFullscreen) {
				player.requestFullscreen();
			} else if (video.msRequestFullscreen) {
				player.msRequestFullscreen();
			} else if (video.mozRequestFullScreen) {
				player.mozRequestFullScreen();
			} else if (video.webkitRequestFullscreen) {
				player.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
			$('#fullscreen').text('fullscreen_exit');
		} else {
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
		}
	});

	$('#autoplay').change(function(){
		sessionStorage.setItem('autoplay', $(this).prop('checked'));
		//video.defaultPlaybackRate = $(this).prop('checked') ? video.playbackRate : 1;
	});

	$('#'+ localStorage.getItem('quality')).prop('checked', true);
	$('.quality').change(function(){
		var paused = video.paused;
		$('.quality').not($(this)).prop('checked', false);
		if ($(this).prop('checked')){
			localStorage.setItem('quality', $(this).attr('id'));
		}else{
			localStorage.removeItem('quality');
		}
		loadMovie($('#video'));
		if (!paused) video.play();
	});

	hideBar(0);
	if (!isTouch){
		$('#player').hover(function(){
			stopTimer();
			$('.bar').addClass('is-visible');
		}, function(){
			hideBar(500);
		});

		clientX = clientY = 0;
		$('#player').mousemove(function(e){
			if (!$(e.target).is('#control, #control *') && clientX == e.clientX && clientY == e.clientY){
				hideBar(1000);
			}else{
				stopTimer();
				$('.bar').addClass('is-visible');
			}
			clientX = e.clientX;
			clientY = e.clientY;
		});

		$('#rewind').click(function(){
			video.playbackRate = video.playbackRate - 0.25;
		});
		$('#rate').click(function(){
			video.playbackRate = 1;
		});
		$('#forward').click(function(){
			video.playbackRate = video.playbackRate + 0.25;
		});
	}else{
		$('#volume-container').hide();

		$('#rate-container').attr('disabled', true);

		$('#video').click(function(){
			if ($('.bar').hasClass('is-visible')){
				stopTimer();
				hideBar(0);
			}else{
				$('.bar').addClass('is-visible');
				stopTimer();
				hideBar(2500);
			}
		});
		$('#control').click(function(){
			stopTimer();
			hideBar(2500);
		});
	}
});
