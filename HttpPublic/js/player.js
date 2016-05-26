function getVideoTime(Time){
		var m = Math.floor(Time / 60);
		var s = ('0' + Math.floor(Time - m * 60)).slice(-2);
		return m + ':' + s;
}

function hideBar(time){
	hoverID = setTimeout(function(){
		if (!video.paused){
			$('.bar').removeClass('is-visible');
			$('#control .mdl-menu__container.is-visible').removeClass('is-visible');
			$('#player').css('cursor', 'none');
		}
	}, time);
};
function stopTimer(){
	clearInterval(hoverID);
	$('#player').css('cursor', 'default');
}

function loadMovie(obj){
	var path = obj.data('path');
	var MIME = video.canPlayType('video/' + path.match(/[^\.]*$/)).length > 0;
	var quality = localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '';
	seek = $('#seek').val();
	var offset = seek > 0 ? '&offset=' + seek : '';

	if (obj.data('public') && MIME){
		path = obj.data('public');
	}else if (obj.data('rec')){
		path = path + quality + offset;
	}else{
		path = root + 'api/Movie?fname=' + path + (MIME ? '&xcode=' : '') + quality + offset;
	}
	
	if (MIME){
		$('#HD').prop('disabled', true).parents('.mdl-menu__item').attr('disabled', true);
	}else{
		$('#HD').prop('disabled', false).parents('.mdl-menu__item').attr('disabled', false);
	}

	$('#video').addClass('is-loadding').attr('src', path).data(obj.data());
	$('#titlebar').text(obj.data('name'));

	$('.ctl-button').removeClass('is-disabled');
	if (obj.is('.item:first')){
		$('#playprev').addClass('is-disabled');
	}
	if (obj.is('.item:last')){
		$('#playnext').addClass('is-disabled');
	}
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
};

$(function(){
	var notification = document.querySelector('.mdl-js-snackbar');

	var video = $('#video').get(0);
	var autoplay = sessionStorage.getItem('autoplay') == 'true' ? true : false;
	video.muted = localStorage.getItem('muted') == 'true' ? true : false;
	video.volume = localStorage.getItem('volume') ? localStorage.getItem('volume') : 1;
	if (autoplay){
		$('#autoplay').prop('checked', true);
	}


	//閉じる
	$('.close.mdl-badge').click(function(){
		$('#popup').removeClass('is-visible');
		video.pause();
		video.playbackRate = 1;
	});

	$('#video').on('resize', function(){
		playerResize();
	});
	$(window).on('resize', function(){
		playerResize();
	});

	$('#video').on('pause', function(){
		$('#play').text('play_arrow');
	});

	$('#video').on('play', function(){
		$('#play').text('pause');
	});

	$('#video').on('ended', function(){
		var autoplay = sessionStorage.getItem('autoplay') == 'true' ? true : false;
		if (autoplay && !$('.playing').is('.item:last')){
			playMovie($('.playing').next());
		}else if(autoplay && $('.playing').is('.item:last')){
			notification.MaterialSnackbar.showSnackbar({message: '最後のファイルを再生しました'});
		}else{
			$('.bar').addClass('is-visible');
		}
	});

	$('#video').on('error', function(){
		var messege
		var errorcode = video.error.code;
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
	});
	
	$('#video').on('volumechange', function(){
		if(video.muted){
			$('#volume-icon').text('volume_off');
		}else if (video.volume == 0){
			$('#volume-icon').text('volume_mute');
		}else if (video.volume > 0.5){
			$('#volume-icon').text('volume_up');
		}else{
			$('#volume-icon').text('volume_down');
		}
		localStorage.setItem('volume', video.volume);
		localStorage.setItem('muted', video.muted);
	});

	$('#video').on('ratechange', function(){
		$('#rate').text(video.playbackRate);
		if (sessionStorage.getItem('autoplay') == 'true'){
			video.defaultPlaybackRate = video.playbackRate;
		}
	});

	$('#video').on('loadeddata', function(){
		hideBar(1000);
	});

	$('#video').on('canplay', function(){
		var duration;
		if ($(this).data('duration')){
			duration = $('#video').data('duration');
		}else{
			duration = video.duration;
		}
		hideBar(2000);
		$(this).removeClass('is-loadding')
		$('#seek').prop('disabled', false);
		if (duration == 'Infinity' || duration == 0){
			xcode = true;
			$(this).off('timeupdate');
			$('#seek').attr('max', 99).attr('step', 1);
			$('.videoTime').addClass('is-disabled');
			$('.duration').text('0:00');
			$('.currentTime').text('0:00');
			if ($(this).data('keepdisk')){
				$('#seek').prop('disabled', true);
			}
		}else{
			xcode = $(this).data('duration') ? true : false;
			var adjust = seek * (duration / 99);
			$(this).on('timeupdate', function(){
				var currentTime = video.currentTime + adjust;
				$('.currentTime').text(getVideoTime(currentTime));
				$('#seek').get(0).MaterialSlider.change(currentTime / (duration / 100));
			});
			$('#seek').attr('max', 100).attr('step', 0.01);
			$('.videoTime').removeClass('is-disabled');
			$('.duration').text(getVideoTime(duration));
			if (!$(this).data('public') && !$(this).data('duration')){
				$('#seek').prop('disabled', true);
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

	$('#seek').change(function(){
		if (xcode){
			loadMovie($('#video'));
			video.play();
		}else{
			video.currentTime = (video.duration / 100)* $(this).val();
		}
	});

	$('#volume').change(function(){
		video.muted = false;
		video.volume = $(this).val();
	});

	$('#volume-icon').click(function(){
		if(video.muted){
			video.muted = false;
			$('#volume').get(0).MaterialSlider.change(video.volume);
		}else{
			video.muted = true;
			$('#volume').get(0).MaterialSlider.change(0);
		}
	});

	$('#playprev').click(function(){
		if (!$(this).hasClass('is-disabled')){
			playMovie($('.playing').prev());
		}
	});
	$('#playnext').click(function(){
		if (!$(this).hasClass('is-disabled')){
			playMovie($('.playing').next());
		}
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
		if ($(this).prop('checked')){
			video.defaultPlaybackRate = video.playbackRate;
			sessionStorage.setItem('autoplay', true);
		}else{
			video.defaultPlaybackRate = 1;
			sessionStorage.setItem('autoplay', false);
		}
	});

	if (localStorage.getItem('quality') == 'HD'){
		$('#HD').prop('checked', true);
	}
	$('#HD').change(function(){
		if ($(this).prop('checked')){
			localStorage.setItem('quality', 'HD');
		}else{
			localStorage.removeItem('quality');
		}
		loadMovie($('#video'));
		video.play();
	});

	hideBar(0);
	if (!isTouch){
		$('#player').hover(function(){
			stopTimer();
			$('.bar').addClass('is-visible');
		},function(){
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
