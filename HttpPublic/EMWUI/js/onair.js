$(function(){
	const $audio1 = $('#audio1');
	const $audio2 = $('#audio2');
	const $audioText1 = $('#audio1~label:last');
	const $audioText2 = $('#audio2~label:last');
	const audioMemu = (audio, update) => {
		if (audio.length >= 2){
			//多重音声
			$audios.attr('disabled', false);
			$audioText1.text(audio[0].text == '' ? '主音声' : audio[0].text);
			$audioText2.text(audio[1].text == '' ? '副音声' : audio[1].text);
			if (!update) audio[0].main_component ? $audio1.prop('checked', true) : $audio2.prop('checked', true);
		}else if (audio.length && audio[0].component_type == 2){
			//デュアルモノ
			$audios.attr('disabled', false);
			const text = audio[0].text.split('\n');
			if (text.length < 2) text = ['日本語','英語'];
			$audioText1.text(`[二] ${text[0]}`);
			$audioText2.text(`[二] ${text[1]}`);
			if (!update) audio[0].main_component ? $audio1.prop('checked', true) : $audio2.prop('checked', true);
		}else{
			$audios.attr('disabled', true);
		}
	}

	const updateEPGtitle = $e => {
		const d = $e.data();
		if (d.update) return;

		d.update = true; 
		$.get(`${ROOT}api/EnumEventInfo`, {onair: 1, basic: 0, id: `${d.onid}-${d.tsid}-${d.sid}`}).done(xml => {
			d.update = false;
			if (!$(xml).find('eventinfo').length) return;

			$.map($(xml).find('eventinfo'), e => toObj.EpgInfo($(e))).map((_d, i) => {
				Info.EventInfo[`${_d.onid}-${_d.tsid}-${_d.sid}-${_d.eid}`] = _d;
				if (i>0){
					d._eid = _d.eid;
					$e.find('.nextstartTime').text(ConvertTime(_d.starttime)).next('.nextendTime').text(`～${ConvertTime(_d.endtime)}`);
					$e.find('.nexttitle').html(ConvertTitle(_d.title));
					return;
				}

				d.eid = _d.eid;
				if ($e.hasClass('is_cast')){
					setEpgInfo(_d);
					$('#epginfo').removeClass('hidden');
					audioMemu(_d.audio, true);
					$duration.text(getVideoTime(_d.duration));
					$titlebar.html(`${ConvertService(_d)}<span>${ConvertTitle(_d.title)}</span>`).addClass('is-visible');
					hideBar(2500);
					$vid.data('title', _d.title).data('audio', _d.audio);
				}

				d.meta = {
					starttime: _d.starttime,
					endtime: _d.endtime ?? new Date(Date.now() + 5*60*1000).getTime(),
					duration: _d.duration ?? (Date.now() - d.starttime)/1000 + 5*60,
					audio: _d.audio
				}

				$e.find('.startTime').text(ConvertTime(_d.starttime)).next('.endTime').text(`～${ConvertTime(_d.endtime)}`);
				$e.find('.title').html(ConvertTitle(_d.title));
				$e.find('.event_text').html(_d.text);
			});
		}).fail(() => d.update = false);
	}

	setInterval(() => {
		$('.onair:visible,.onair.is_cast').each((i, e) => {
			const d = $(e).data('meta');
			const $progress = $(e).children('.mdl-progress');
			const end = !d || d.endtime < Date.now();
			if (end) updateEPGtitle($(e));
			if (!$progress.hasClass('is-upgraded')) return true;

			$progress.toggleClass('mdl-progress__indeterminate', end).get(0).MaterialProgress.setProgress(end ? 0 : (Date.now() - d.starttime) / d.duration / 10);
		});
	}, 500);

	$('span.epginfo').click(e => {
		const $e = $(e.currentTarget);
		const d = $e.parents('li').data();
		d.next = $e.hasClass('next');
		const eid = d.next ? d._eid : d.eid;

		if (eid != 0){
			$e.hasClass('panel') ? getEpgInfo($e.parents('li'), d) : location.href = `epginfo.html?id=${d.onid}-${d.tsid}-${d.sid}-${eid}`;
		}else{
			Snackbar('この時間帯の番組情報がありません');
			$('#sidePanel, .open').removeClass('is-visible open');
		}
	});

	let apk, Magnezio;
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

	$('#apk').change(e => {
		apk = $(e.currentTarget).prop('checked');
		localStorage.setItem('apk', apk);
		$('#open_popup').prop('disabled', apk);
		$('#menu_popup').attr('disabled', apk);
		$('#menu_quality').attr('disabled', !apk);
		$(`[for=${apk ? '' : 'menu_'}quality] li`).appendTo(`[for=${apk ? '' : 'menu_'}quality]`);
		$('[for=open_popup]').toggleClass('is-disabled', apk);
	});
	$('#open_popup').change(e => localStorage.setItem('popup', $(e.currentTarget).prop('checked')));
	$('#open_popup').prop('checked', localStorage.getItem('popup') == 'true');
	if (localStorage.getItem('popup') == 'true') $('[for=open_popup]').addClass('is-checked');
	if (apk) $('[for=open_popup]').addClass('is-disabled');

	$('#ServiceList .onair').click(e => {
		const $e = $(e.currentTarget);
		const d = $e.data();
		const fn = () => {
			$('.is_cast').removeClass('is_cast');
			$e.addClass('is_cast');

			const params = new URLSearchParams(location.search);
			params.set('id', `${d.onid}-${d.tsid}-${d.sid}`);
			history.replaceState(null,null,`?${params.toString()}`);
			loadMovie($e);
			audioMemu(d.meta.audio);
			setEpgInfo(Info.EventInfo[`${d.onid}-${d.tsid}-${d.sid}-${d.eid}`]);
			$('#epginfo').removeClass('hidden');
			$('#tvcast').animate({scrollTop:0}, 500, 'swing');
		}

		if ($e.hasClass('is_cast') || !d.eid){
			if (!d.eid) Snackbar({message: '番組情報がありませんが、視聴リクエストしますか？', actionHandler: fn, actionText: 'はい'});
			return;
		}

		fn();
	});
	$('.cast').click(e => {
		const $e = $(e.currentTarget).parents('li').addClass('is_cast');
		const d = $e.data();
		if (!d.eid){
			Snackbar('番組情報がありません');
		}else if (Magnezio){
			$.get(`${ROOT}api/TvCast`, {mode: 1, ctok: ctok, id: `${d.onid}-${d.tsid}-${d.sid}`}).done(xml =>
				!$(xml).find('success').length ? Snackbar('失敗') : location.href = 'intent:#Intent;scheme=arib;package=com.mediagram.magnezio;end;'
			);
		}else if (apk){
			showSpinner(true);
			Snackbar('準備中');
			const src = `${ROOT}api/view?n=0&id=${d.onid}-${d.tsid}-${d.sid}&ctok=${ctok}&hls=${1+d.onid+d.tsid+d.sid}${hls4}&option=${quality}${
				!$audio.attr('disabled') ? `&audio2=${audioVal}` : ''}${$cinema.prop('checked') ? '&cinema=1' : ''
			}`;

			waitForHlsStart(src, `ctok=${ctok}&open=1`, 1000, 1000, () => {
				showSpinner();
				Snackbar('エラー');
			}, src => {
				showSpinner();
				location.href = `intent:${new URL(src, document.baseURI).href}#Intent;type=video/*;end;`;
			});
		}else if ($('#open_popup').prop('checked')){
			$('#popup,#playerUI').addClass('is-visible');
			loadMovie($e);
			audioMemu(Info.EventInfo[`${d.onid}-${d.tsid}-${d.sid}-${d.eid}`].audio);
		}else{
			location.href = `tvcast.html?id=${d.onid}-${d.tsid}-${d.sid}`;
		}
	});
	$('#playprev').click(e => $('.is_cast').removeClass('is_cast').prevAll(':visible').first().find('.cast').click());
	$('#playnext').click(e => $('.is_cast').removeClass('is_cast').nextAll(':visible').first().find('.cast').click());

	if ($('.onair.is_cast').length) readyToAutoPlay = loadMovie;
	$('.toggle').click(e => {
		const $e = $(e.currentTarget).children();
		const flag = $e.hasClass('flag');
		$($(e.currentTarget).attr('for')).slideToggle(() => $e.text(`expand_${flag ? 'more' : 'less'}`).toggleClass('flag', !flag));
	});
	$('#subCH').change(e => $('.subCH').toggleClass('hidden', !$(e.currentTarget).prop('checked')));

	$('#forced').click(e => {
		$.post(`${ROOT}api/TvCast`, {ctok: $(e.currentTarget).data('ctok'), n: 0, id: '1-1-0'}).done(xhr => Snackbar($(xhr).find('success').text()));
		$('#stop').click();
	});
});

