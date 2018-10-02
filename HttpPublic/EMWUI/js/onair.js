function getTime(time){
	var date = new Date(time);
	return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2)
}

function getEvent(event){
	var startTime = event.children('startTime').text();
	var start = new Date(event.children('startDate').text()+' '+startTime).getTime();
	var duration = Number(event.children('duration').text());
	var audio;
	if (event.children('audioInfo').length > 0){
		audio = [];
		event.children('audioInfo').each(function(i){
			audio[i] = {
				text: $(this).find('text').text(),
				component_type: Number($(this).find('component_type').text()),
				main_component_flag: $(this).find('main_component_flag').text() == '1'
			}
		});
	}

 	return {
 		audio: audio,
		eid: event.children('eventID').text(),
		title: event.children('event_name').text(),
		start: (duration==0 ? Date.now() : start),
		end: (duration==0 ? Date.now()+5*60*1000 : start+duration*1000) ,
		startTime: startTime.match(/(\d+:\d+):\d+/)[1],
		endTime: (duration==0 ? '未定' : getTime(start+duration*1000)),
		duration: (duration==0 ? 5*60 : duration)
	}
}

function getEPG(obj){
	var data = obj.data();
	$.get(root + 'api/EnumEventInfo?onair=&onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + (obj.hasClass('is_cast') ? '&basic=0' : '')).done(function(xhr){
		if ($(xhr).find('eventinfo').length > 0){
			var x=getEvent( $($(xhr).find('eventinfo')[0]) );
			var y=getEvent( $($(xhr).find('eventinfo')[1]) );
			var data = {
				audio: false,
				eid: x.eid,
		    	nexteid: y.eid,
				duration: x.duration,
		    	start: x.start,
		    	end: x.end
			};
			if (obj.hasClass('is_cast')) {
				audio(x.audio, true);
				$('.duration').text(getVideoTime(x.duration));
				$('#titlebar').html(obj.data('name') +' - '+ ConvertTitle(x.title)).addClass('is-visible');
				hideBar(2500);
				var video = $('#video').data();
				video.title = data.title = x.title;
				video.audio = data.audio = x.audio;
			}
			obj.data(data).find('.startTime').text(x.startTime).next('.endTime').text('～' + x.endTime);
			obj.find('.title').html(ConvertTitle(x.title));
			obj.find('.nextstartTime').text(y.startTime).next('.nextendTime').text('～' + y.endTime);
			obj.find('.nexttitle').html(y.title);
		}
	});
}

function audio(audio, update){
	if (audio.length >= 2){
		//多重音声
		$('#audio').attr('disabled', false);
		$('.multi').show();
		$('.dual').hide();
		$('#multi1~label:last').text(audio[0].text=='' ? '主音声' : audio[0].text);
		$('#multi2~label:last').text(audio[1].text=='' ? '副音声' : audio[1].text);
		if (!update){
			if (audio[0].main_component_flag){
				$('#multi1').prop('checked', true);
			}else{
				$('#multi2').prop('checked', true);
			}
		}
	}else if (audio[0].component_type == 2){
		//デュアルモノ
		$('#audio').attr('disabled', false);
		$('.dual').show();
		$('.multi').hide();
		var text = audio[0].text.split('\n');
		if (text.length<2) text = ['日本語','英語'];
		$('#dual1~label:last').text('[二] '+ text[0]);
		$('#dual2~label:last').text('[二] '+ text[1]);
		$('#RAW~label:last').text('[二] '+ text[0] +'+'+ text[1]);
		if (!update){
			if (audio[0].main_component_flag){
				$('#dual1').prop('checked', true);
			}else{
				$('#dual2').prop('checked', true);
			}
		}
	}else{
		$('#audio').attr('disabled', true);
	}
}

var updateTimer;
function SetInfo(data, play){
	$.get(root + 'api/EnumEventInfo?onair=&onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + (play ? '&basic=0' : '')).done(function(xhr){
		if ($(xhr).find('eventinfo').length > 0){
			var info = $($(xhr).find('eventinfo')[0]);
			var event = getEvent( info );
			$('#epginfo').data('end', event.end).data('start', event.start).data('duration', event.duration);
			$('#title').html(ConvertTitle(event.title));
			$('#sidePanel_date').html(info.find('startDate').text() +'('+ week[info.find('startDayOfWeek').text()] +') '+ FormatTime(info.find('startTime').text(), event.end));
			$('#service').html(info.find('service_name').text());
			$('h4+p').html( ConvertTitle(info.find('event_text').text()) );
			if (!updateTimer) update();
			if (play) {
				audio(event.audio);
				if (play==2)loadMovie($('#serviceList option:selected'));
			}
		}
	}).fail(function(xhr){
		setTimeout(function(){SetInfo(data, play);}, 5*1000);
	});
}

function update(){
	var data = $('#epginfo').data();
	updateTimer = setTimeout(function(){
		updateTimer = null;
		SetInfo(data, 1);
	}, data.end-Date.now());
}

$(function(){
    $('.mdl-progress').first().on('mdl-componentupgraded', function() {
		setInterval(function(){
			$('.is-active>.onair').each(function(){
				var data = $(this).data();
				if (data.end < Date.now()){
					getEPG($(this));
				}else{
					var progress = (Date.now() - data.start) / data.duration / 10;
					$(this).children('.mdl-progress').get(0).MaterialProgress.setProgress(progress);
				}
			});
		},1000);
    });

	$('span.epginfo').click(function(){
		var data = $(this).parents('li').clone(true).data();
		if ($(this).hasClass('next')){
			data.next = true;
			data.id = data.nextid;
			data.eid = data.nexteid;
		}

		if (data.eid!=0){
			if ($(this).hasClass('panel')){
				getEpgInfo($(this).parents('li'), data);
			}else{
				window.open('epginfo.html?onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + '&eid=' + data.eid, '_blank');
			}
		}else{
			$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: 'この時間帯の番組情報がありません'});
			$('#sidePanel, .open').removeClass('is-visible open');
		}
	});
	
	$('#seek,#autoplay').prop('disabled', true);
	$('#menu_autoplay').attr('disabled', true);
	$('#video').data('keepdisk', true).data('cast', true);
	$('#popup .close').click(function(){
		$('.is_cast').removeClass('is_cast');
		$('.duration,.currentTime').text('0:00');
		$('#seek').get(0).MaterialProgress.setProgress(0);
		$('#video').attr('src', '').unbind('timeupdate');
	});

	var apk, Magnezio;
	if (navigator.userAgent.indexOf('Android') > 0){
		apk = localStorage.getItem('apk') == 'true';
		//Magnezio = true;	//Magnezioで視聴
		$('#menu_video').removeClass('hidden');
		if (apk){
			$('[for=quality] li').appendTo('[for=menu_quality]');
			$('#menu_quality').prop('disabled', false);
		}
	}

	$('#apk').change(function(){
		apk = $(this).prop('checked');
		localStorage.setItem('apk', apk);
		if (apk){
			$('[for=quality] li').appendTo('[for=menu_quality]');
			$('#menu_quality').prop('disabled', false);
		}else{
			$('[for=menu_quality] li').appendTo('[for=quality]');
			$('#menu_quality').prop('disabled', true);
		}
	});

	$('.cast').click(function(){
		var obj = $(this).parents('li').addClass('is_cast');
		var data = obj.data();
		if (data.eid!=0){
			if (Magnezio){
				$.get(root + 'api/TvCast?mode=1&onid=' + obj.data('onid') +'&tsid='+ obj.data('tsid') +'&sid='+ obj.data('sid'));
				location.href = 'intent:#Intent;scheme=arib;package=com.mediagram.magnezio;end;'
			}else{
				if (data.audio){
					if (apk){
						location.href = 'intent:http://'+location.host+ '/api/TvCast?onid=' + data.onid +'&tsid='+ data.tsid +'&sid='+ data.sid + (localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '') + (data.audio.length >= 2 ? '&audio=0' : (data.audio[0].component_type == 2 ? '&audio=10' : '')) + '#Intent;type=video/*;end;'
					}else{
						$('#popup,#playerUI').addClass('is-visible');
						audio(data.audio);
						loadMovie(obj);
					}
				}else{
					$.get(root + 'api/EnumEventInfo?basic=0&onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + '&eid=' + data.eid).done(function(xhr){
						if ($(xhr).find('eventinfo').length > 0){
							data.title = $(xhr).find('event_name').text();
							data.audio = [];
							$(xhr).find('audioInfo').each(function(i){
								data.audio[i] = {
									text: $(this).find('text').text(),
									component_type: Number($(this).find('component_type').text()),
									main_component_flag: $(this).find('main_component_flag').text() == '1'
								}
							});
							if (apk){
								location.href = 'intent:http://'+location.host+ '/api/TvCast?onid=' + data.onid +'&tsid='+ data.tsid +'&sid='+ data.sid + (localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '') + (data.audio.length >= 2 ? '&audio=0' : (data.audio[0].component_type == 2 ? '&audio=10' : '')) + '#Intent;type=video/*;end;'
							}else{
								$('#popup,#playerUI').addClass('is-visible');
								audio(data.audio);
								loadMovie(obj);
							}
						}
					});
				}
			}
		}else{
			$('#titlebar').text(data.name+' - 放送休止');
			$('.duration,.currentTime').text('0:00');
			$('#seek').get(0).MaterialSlider.change(0);
			$('#video').attr('src', '').unbind('timeupdate');
			$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: '放送休止'});
		}
	});
	$('#playprev').click(function(){
		if (!$(this).hasClass('is-disabled')) $('.is_cast').removeClass('is_cast').prev().find('.cast').click();
	});
	$('#playnext').click(function(){
		if (!$(this).hasClass('is-disabled')) $('.is_cast').removeClass('is_cast').next().find('.cast').click();
	});

	$('#serviceList option').not($('#category option:selected').data('val')).hide();
	$('#category').change(function(){
		$('#serviceList option').show().not($('#category option:selected').data('val')).hide();
	});
	var tempTimer;
	$('#serviceList').change(function(){
		clearTimeout(tempTimer);
		tempTimer = setTimeout(function(){SetInfo($('#epginfo').data());}, 3*1000);
		SetInfo($('#serviceList option:selected').data());
	});

	$('#view').click(function(){
		clearTimeout(tempTimer);
		clearTimeout(updateTimer);
		updateTimer = null;

		var data = $('#serviceList option:selected').data();
		$('#epginfo').data('onid', data.onid).data('tsid', data.tsid).data('sid', data.sid);
		SetInfo(data, 2);
	});
});

