function updateEPGtitle(obj){
	var d = obj.data();
	$.get(root + 'api/EnumEventInfo' + (obj.hasClass('is_cast') ? '?basic=0' : ''), {onair: 0, onid: d.onid, tsid: d.tsid, sid: d.sid}).done(function(xhr){
		if ($(xhr).find('eventinfo').length > 0){
			var a = ConvertEpgInfo( $(xhr).find('eventinfo').first() );
			var b = ConvertEpgInfo( $(xhr).find('eventinfo').eq(1) );
			a.nexteid = b.eid;

			if (obj.hasClass('is_cast')) {
				setEpgInfo(a);
				audio(a.audio, true);
				$('.duration').text(getVideoTime(a.duration));
				$('#titlebar').html(a.service +' - '+ ConvertTitle(a.title)).addClass('is-visible');
				hideBar(2500);
				$('#video').data(title, a.title).data(audio, a.audio);
			}

			var endtime = ConvertTime(a.endtime);
			if (!a.duration){
				a.duration = (Date.now() - a.starttime)/1000 + 5*60;
				a.endtime = new Date(Date.now() + 5*60*1000).getTime();
			}
			obj.data(a).find('.startTime').text(ConvertTime(a.starttime)).next('.endTime').text('～' + endtime);
			obj.find('.title').html(ConvertTitle(a.title));
			obj.find('.event_text').html(a.text);
			obj.find('.nextstartTime').text(ConvertTime(b.starttime)).next('.nextendTime').text('～' + ConvertTime(b.endtime));
			obj.find('.nexttitle').html(ConvertTitle(b.title));
		}
	});
}

function audio(audio, update){
	if (audio.length >= 2){
		//多重音声
		$('._audio,.multi').attr('disabled', false).show();
		$('.dual').attr('disabled', true).hide();
		$('#multi1~label:last').text(audio[0].text=='' ? '主音声' : audio[0].text);
		$('#multi2~label:last').text(audio[1].text=='' ? '副音声' : audio[1].text);
		if (!update){
			if (audio[0].main_component){
				$('#multi1').prop('checked', true);
			}else{
				$('#multi2').prop('checked', true);
			}
		}
	}else if (audio.length > 0 && audio[0].component_type == 2){
		//デュアルモノ
		$('._audio,.dual').attr('disabled', false).show();
		$('.multi').attr('disabled', true).hide();
		var text = audio[0].text.split('\n');
		if (text.length<2) text = ['日本語','英語'];
		$('#dual1~label:last').text('[二] '+ text[0]);
		$('#dual2~label:last').text('[二] '+ text[1]);
		$('#RAW~label:last').text('[二] '+ text[0] +'+'+ text[1]);
		if (!update){
			if (audio[0].main_component){
				$('#dual1').prop('checked', true);
			}else{
				$('#dual2').prop('checked', true);
			}
		}
	}else{
		$('._audio,.multi,.dual').attr('disabled', true);
	}
}

function updateEpgInfo(d, play){
	$.get(root + 'api/EnumEventInfo', {onair: 0, basic: 0, onid: d.onid, tsid: d.tsid, sid: d.sid}).done(function(xhr){
		if ($(xhr).find('eventinfo').length > 0){
			var e = ConvertEpgInfo( $(xhr).find('eventinfo').first() );

			setEpgInfo(e);
			$('#epginfo').removeClass('hidden');

			if (play) {
				audio(e.audio);
				if (play==2)loadMovie($('.is_cast'));
			}
		}
	}).fail(function(xhr){
		setTimeout(function(){updateEpgInfo(d, play);}, 5*1000);
	});
}

$(function(){
	setInterval(function(){
		$('.onair:visible').each(function(){
			var d = $(this).data();
			var progress = $(this).children('.mdl-progress');
			if (d.endtime < Date.now()){
				if (progress.hasClass('is-upgraded')) progress.addClass('mdl-progress__indeterminate').get(0).MaterialProgress.setProgress(0);
				updateEPGtitle($(this));
			}else{
				if (progress.hasClass('is-upgraded')) progress.removeClass('mdl-progress__indeterminate').get(0).MaterialProgress.setProgress((Date.now() - d.starttime) / d.duration / 10);
			}
		});
	},500);

	$('span.epginfo').click(function(){
		var d = $(this).parents('li').data();
		if ($(this).hasClass('next')){
			d.next = true;
			d.id = d.nextid;
			d.eid = d.nexteid;
		}

		if (d.eid!=0){
			if ($(this).hasClass('panel')){
				getEpgInfo($(this).parents('li'), d);
			}else{
				window.open('epginfo.html?onid=' + d.onid + '&tsid=' + d.tsid + '&sid=' + d.sid + '&eid=' + d.eid, '_blank');
			}
		}else{
			Snackbar.MaterialSnackbar.showSnackbar({message: 'この時間帯の番組情報がありません'});
			$('#sidePanel, .open').removeClass('is-visible open');
		}
	});
	
	$('#video').data('keepdisk', true).data('cast', true);

	var apk, Magnezio;
	if (navigator.userAgent.indexOf('Android') > 0){
		apk = localStorage.getItem('apk') == 'true';
		//Magnezio = true;	//Magnezioで視聴
		$('[for=menu] .mdl-menu__item').removeClass('hidden');
		$('#open_popup').prop('disabled', apk);
		$('#menu_popup').attr('disabled', apk);
		$('#menu_quality').attr('disabled', !apk);
		if (apk){
			$('[for=quality] li').appendTo('[for=menu_quality]');
			$('[for=apk]').addClass('is-checked');
		}
	}

	$('#apk').change(function(){
		apk = $(this).prop('checked');
		localStorage.setItem('apk', apk);
		$('#open_popup').prop('disabled', apk);
		$('#menu_popup').attr('disabled', apk);
		$('#menu_quality').attr('disabled', !apk);
		if (apk){
			$('[for=quality] li').appendTo('[for=menu_quality]');
			$('[for=open_popup]').addClass('is-disabled');
		}else{
			$('[for=menu_quality] li').appendTo('[for=quality]');
			$('[for=open_popup]').removeClass('is-disabled');
		}
	});
	$('#open_popup').change(function(){
		localStorage.setItem('popup', $(this).prop('checked'));
	});
	$('#open_popup').prop('checked',localStorage.getItem('popup') == 'true');
	if (localStorage.getItem('popup') == 'true') $('[for=open_popup]').addClass('is-checked');
	if (apk) $('[for=open_popup]').addClass('is-disabled');

	$('#ServiceList .onair').click(function(){
		if (!$(this).hasClass('is_cast')){
			updateEpgInfo($(this).data(), 2);
			$('.is_cast').removeClass('is_cast');
			$(this).addClass('is_cast');
			$('#tvcast').animate({scrollTop:0}, 500, 'swing');
		}
	});
	$('.cast').click(function(){
		var obj = $(this).parents('li').addClass('is_cast');
		var data = obj.data();
		if (data.eid!=0){
			if (Magnezio){
				$.get(root + 'api/TvCast', {mode: 1, ctok: ctok, onid: data.onid, tsid: data.tsid, sid: data.sid}).done(function(xhr){
					if ($(xhr).find('success').length > 0){
						location.href = 'intent:#Intent;scheme=arib;package=com.mediagram.magnezio;end;'
					}else{
						Snackbar.MaterialSnackbar.showSnackbar({message: '失敗'});
					}
				});
			}else if (!apk && !$('#open_popup').prop('checked')){
				location.href = 'tvcast.html?onid='+ data.onid +'&tsid='+ data.tsid +'&sid='+ data.sid;
			}else{
				if (data.audio){
					if (apk){
						location.href = 'intent:' + location.origin + '/api/TvCast?ctok=' + ctok + '&onid=' + data.onid +'&tsid='+ data.tsid +'&sid='+ data.sid + (localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '') + (data.audio.length >= 2 ? '&audio=0' : (data.audio[0].component_type == 2 ? '&audio=10' : '')) + '#Intent;type=video/*;end;'
					}else{
						$('#popup,#playerUI').addClass('is-visible');
						audio(data.audio);
						loadMovie(obj);
					}
				}else{
					$.get(root + 'api/EnumEventInfo', {basic: 0, onid: data.onid, tsid: data.tsid, sid: data.sid, eid: data.eid}).done(function(xhr){
						if ($(xhr).find('eventinfo').length > 0){
							obj.data( ConvertEpgInfo( $(xhr).find('eventinfo').first() ) );
							if (apk){
								location.href = 'intent:' + location.origin + '/api/TvCast?ctok=' + ctok + '&onid=' + data.onid +'&tsid='+ data.tsid +'&sid='+ data.sid + (localStorage.getItem('quality') ? '&quality=' + localStorage.getItem('quality') : '') + (data.audio.length >= 2 ? '&audio=0' : (data.audio[0].component_type == 2 ? '&audio=10' : '')) + '#Intent;type=video/*;end;'
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
			$('#titlebar').text(data.service+' - 放送休止');
			$('.duration,.currentTime').text('0:00');
			$('#video').attr('src', '').unbind('timeupdate');
			document.querySelector('#seek').MaterialSlider.change(0);
			Snackbar.MaterialSnackbar.showSnackbar({message: '放送休止'});
		}
	});
	$('#playprev').click(function(){
		if (!$(this).hasClass('is-disabled')) $('.is_cast').removeClass('is_cast').prevAll(':visible').first().find('.cast').click();
	});
	$('#playnext').click(function(){
		if (!$(this).hasClass('is-disabled')) $('.is_cast').removeClass('is_cast').nextAll(':visible').first().find('.cast').click();
	});
	$('#defult').click(function(){
		theater = true;
		$('#player').prependTo($('#movie-theater-contner'));
	});
	$('#theater').click(function(){
		theater = false;
		$('#player').prependTo($('#movie-contner'));
	});

	if($('.onair.is_cast').length > 0){
		var data = $('.onair.is_cast').data();
		updateEpgInfo(data, 2);
	}
	$('.toggle').click(function(){
		var target = $(this).children();
		$($(this).attr('for')).slideToggle(function(){
			if ($(this).css('display') == 'none'){
				target.text('expand_more');
			}else{
				target.text('expand_less');
			}
		});
	});
	$('#subCH').change(function(){
		if ($(this).prop('checked')){
			$('.subCH').removeClass('hidden');
		}else{
			$('.subCH').addClass('hidden');
		}
	});
});

