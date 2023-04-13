var fullscreen, theater;
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

var seek = 0;
function loadMovie(obj){
	var canPlay = false;
	var d = obj.data();
	var path= d.path;
	if (path) canPlay = video.canPlayType('video/' + path.match(/[^\.]*$/)).length > 0;
	var quality = localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '';
	seek = $('#seek').val();
	var offset = seek > 0 ? '&offset=' + seek : '';
	var multi = $('.multi').attr('disabled') ? '' : '&audio2='+$('[name=audio]:checked').val();
	var dual = $('.dual').attr('disabled') ? '': '&dual='+$('[name=audio]:checked').val();
	var cinema = $('#cinema').prop('checked') ? '&cinema=1': '';

	if (d.public && canPlay){
		path = root + path;
	}else if (d.rec){
		path = path + quality + offset + ($('.multi').length > 0 ? multi : '') + ($('.dual').length > 0 ? dual : '') + cinema;
	}else if ($('#video').data('cast')){
		path = root + 'api/TvCast?ctok=' + ctok + '&onid=' + d.onid +'&tsid='+ d.tsid +'&sid='+ d.sid + quality + multi + dual + cinema +'&n='+ Math.floor(Math.random()*1000);
	}else{
		path = root + 'api/Movie?fname=' + path + (canPlay ? '&xcode=0' : '') + quality + multi + dual + cinema + offset + (d.public ? '&public=' : '');
	}

	$('#HD').prop('disabled', canPlay);
	$('.quality').attr('disabled', canPlay);

	$('#video').addClass('is-loadding').attr('src', path).data(obj.data()).data('xcode', !canPlay);
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
	}else{
		document.querySelector('#seek').MaterialSlider.change(0);
		$('.currentTime,.duration').text('0:00');
		$('.multi,.dual').attr('disabled', true);
		$('#video').removeData('duration');
		loadMovie(obj);
	}
	video.play();
	$('.item').removeClass('playing');
	obj.addClass('playing');
}

$(window).on('load resize', function(){
	if (!fullscreen){
		if (theater || is_small_screen()){
			$('#player').prependTo('#movie-theater-contner');
		}else{
			$('#player').prependTo('#movie-contner');
		}
	}
	if ($('#video').width() < 800){
		$('#player').addClass('is-small');
	}else{
		$('#player').removeClass('is-small');
	}
});

$(function(){
	var xcode, duration;

	var video = document.querySelector('#video');
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

	if ($('#video').data('public')) $('.quality,._audio').attr('disabled', true);
	$('#video').on({
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
					Snackbar.MaterialSnackbar.showSnackbar({message: '最後のファイルを再生しました'});
				}
				$('#playerUI').addClass('is-visible');
			}
		},
		'error': function(){
			$(this).removeClass('is-loadding');
			$('.is_cast').removeClass('is_cast');
			if ($('#video').attr('src') != ''){
				var errorcode = this.error.code;
				if (this.networkState == 3){
					errorcode = 5;
				}
				var url = this.currentSrc;
				var data = {
					message: 'Error : ' + ['MEDIA_ERR_ABORTED','MEDIA_ERR_ABORTED','MEDIA_ERR_NETWORK','MEDIA_ERR_DECODE','MEDIA_ERR_SRC_NOT_SUPPORTED','NETWORK_NO_SOURCE'][errorcode],
					actionHandler: function(){
						window.open(url+ '&debug=' + errorcode);
					},
					actionText: 'デバッグ'
				}
				Snackbar.MaterialSnackbar.showSnackbar(data);
			}
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
					var currentTime = (Date.now() - data.starttime)/1000;
					$('.currentTime').text(getVideoTime(currentTime));
					document.querySelector('#seek').MaterialProgress.setProgress(currentTime / data.duration * 100);
				});
			}else{
				var self = $(this);
				function timeupdate(duration){
					self.on('timeupdate', function(){
						if (!self.data('touched')){
							var currentTime = video.currentTime + seek * (duration / 99);
							$('.currentTime').text(getVideoTime(currentTime));
							document.querySelector('#seek').MaterialSlider.change(currentTime / duration * 100);
						}
					});
					$('.Time-wrap').removeClass('is-disabled');
					$('.duration').text(getVideoTime(duration));
				};

				xcode = $(this).data('xcode');
				if (xcode){
					duration = $(this).data('duration');
					if (duration){
						timeupdate(duration);
					}else{
						$.get(root + 'api/Movie?fname=' + $(this).data('path') + '&meta=' + ($(this).data('public') ? '&public=' : ''), function(result, textStatus, xhr){
							$('#audio').prop('disabled', false);
							var xml = $(xhr.responseXML);
							if (xml.find('duration').length > 0){
								duration = xml.find('duration').text();
								$('#video').data('duration', duration);
								timeupdate(duration);
							}else{
								duration = false;
								$(this).off('timeupdate');
								$('.Time-wrap').addClass('is-disabled');
							}
							if (xml.find('audio').length > 0){
								if (xml.find('audio').text() == 1){
									$('#RAW').prop('checked', true);
									$('.dual').attr('disabled', false).show();
									$('.multi').attr('disabled', true).hide();
								}else{
									$('#multi1').prop('checked', true);
									$('.multi').attr('disabled', false).show();
									$('.dual').attr('disabled', true).hide();
								}
							}
						});
					}
				}else{
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
	$('.stop').click(function(){
		$('#video').attr('src', '').unbind('timeupdate');
		$('#epginfo').addClass('hidden');
		$('.is_cast').removeClass('is_cast');
		if ($('#seek').hasClass('mdl-progress')) document.querySelector('#seek').MaterialProgress.setProgress(0);
		$('.currentTime,.duration').text('0:00');
		$('.quality,._audio').attr('disabled', true);
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
			fullscreen = false;
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
	$('.audio,#cinema').change(function(){
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
		$('#ctl-button .ctl-button').prependTo('#center');
		$('#volume-container').addClass('hidden');
		$('#player').click(function(){
			$('#playerUI').addClass('is-visible');
			stopTimer();
			hideBar(2000);
		});
	}
});
