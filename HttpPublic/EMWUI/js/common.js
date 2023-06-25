var PresetList, ReserveAutoaddList, Snackbar;
var isTouch = navigator.platform.indexOf("Win") != 0  && ('ontouchstart' in window);
var week = ['日', '月', '火', '水', '木', '金', '土'];

function showSpinner(visible){
	if (visible){
		$('#spinner').addClass('is-visible').children().addClass('is-active');
	}else{
		$('#spinner').removeClass('is-visible').children().removeClass('is-active');
	}
}

function errMessage(xml){
	xml.find('err').each(function(i){
		Snackbar.MaterialSnackbar.showSnackbar({message: (i==0 ? 'Error : ' : '')+$(this).text()});
	});
}

//検索バー表示
function saerchbar(){
	$('main>.mdl-layout__content').scroll(function(){
		if ($('main>.mdl-layout__content').scrollTop() > 0){
			$('.serch-bar').removeClass('scroll');
			$('main').addClass('serch-bar');
		}else{
			$('.serch-bar').addClass('scroll');
			$('main').removeClass('serch-bar');
		}
	});
}

//検索等のリンクを生成
function createSearchLinks(obj){
	var target = $(obj).find('.search-links');
	if (target.length == 1 && !target.is('.search-links-created')){
		var d = target.data();
		var title = encodeURIComponent(d.title);
		var service = encodeURIComponent(d.service);
		var dates = encodeURIComponent(d.dates);
		var details = encodeURIComponent(d.details.replace(/%br%/g, '\n'));
 		target.addClass('search-links-created').after('<a class="mdl-button mdl-button--icon" href="search.html?andkey=' + title + '"><i class="material-icons">search</i></a>'
			+ '<a class="mdl-button mdl-button--icon" href="https://www.google.co.jp/search?q=' + title + '" target="_blank"><img class="material-icons" src="img/google.png" alt="Google検索"></a>'
			+ '<a class="mdl-button mdl-button--icon" href="https://www.google.co.jp/search?q=' + title + '&amp;btnI=Im+Feeling+Lucky" target="_blank"><i class="material-icons">sentiment_satisfied</i></a>'
			+ '<a class="mdl-button mdl-button--icon mdl-cell--hide-phone mdl-cell--hide-tablet" href="https://www.google.com/calendar/render?action=TEMPLATE&amp;text=' + title + '&amp;location=' + service
				+ '&amp;dates=' + dates + '&amp;details=' + details + calendar_op +'" target="_blank"><i class="material-icons">event</i></a>');
	}
}

//タブ移動
function tab(tab){
	if (tab.length > 0 && !document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement){
		var panel = tab.attr('href');
		if (tab.hasClass('mdl-layout__tab')){
			$('.mdl-layout__tab, .mdl-layout__tab-panel').removeClass('is-active');
			$('main').scrollTop(0);
		}else{
			$('.mdl-tabs__tab, .mdl-tabs__panel').removeClass('is-active');
		}
		tab.addClass('is-active');
		$(panel).addClass('is-active');
		if (panel == '#movie' && !$('#video').data('load')){
			if (!$('#video').data('public')) loadMovie($('#video'));
			$('#video').trigger('load').data('load', true);
		}
	}
}

//通知バッチ
function badgeNotify(){
	var count = $('[id^=notify_]').length;
	if (count == 0){
		$('#notification i').removeClass('mdl-badge').text('notifications_none');
		$('#noNotify').show();
	}else{
		$('#notification i').addClass('mdl-badge').text('notifications');
		$('#noNotify').hide();
	}
	$('#notification i').attr('data-badge', count);
}

//通知保存
function saveNotify(data, remove){
	var list = localStorage.getItem('notifications') ? JSON.parse(localStorage.getItem('notifications')) : new Array();

	if (remove){
		list.some(function(v, i){
			if (v.eid == data.eid) list.splice(i,1);
		});
	}else{
		list.push(data);
	}

	localStorage.setItem('notifications', JSON.stringify(list));
}
//通知リスト削除
function delNotify(data, noSnack){
	clearTimeout(data.timer);
	saveNotify(data, true);
	$('.eid_' + data.eid + ' .notify_icon,#notify_' + data.eid).remove();
	$('.notify_'+ data.eid).data('notification', false).children().text('add_alert');

	badgeNotify();
	if (!noSnack) Snackbar.MaterialSnackbar.showSnackbar({message: '削除しました'});
}

//通知登録
var NotifySound = new Audio( root + "video/notification.mp3");
NotifySound.volume = 0.2;
function creatNotify(data, save){
	if (save){
		saveNotify(data);
		Snackbar.MaterialSnackbar.showSnackbar({message: '追加しました'});
	}

	data.timer = setTimeout(function(){
		delNotify(data, true);
		$('.notify_'+ data.eid).children().text('notifications');

		$.get(root + 'api/EnumEventInfo', {onid:data.onid, tsid:data.tsid, sid:data.sid, eid:data.eid}, function(result, textStatus, xhr){
			var e = ConvertEpgInfo($(xhr.responseXML).find('eventinfo').first());
			var options = {
				body: ConvertTime(e.starttime) + '～ ' + e.service + '\n' + e.text,
				tag: e.onid +'-'+ e.tsid +'-'+ e.sid +'-'+ e.eid,
				icon: 'img/apple-touch-icon.png'
			};

			var notification = new Notification(e.title, options);

			notification.onclick = function(event){
				event.preventDefault();
				window.open('epginfo.html?onid=' + e.onid + '&tsid=' + e.tsid + '&sid=' + e.sid + '&eid=' + e.eid, '_blank');
				notification.close();
			};

			NotifySound.play();

			//通知を閉じる
			setTimeout(function(){
				notification.close();
			}, 15*1000);
		});
	}, data.starttime - Date.now() - 30*1000);

	$('.eid_' + data.eid + ' .startTime').after($('<div class="notify_icon"><i class="material-icons">notifications_active</i></div>'));
	$('.notify_'+data.eid).data('notification', true).children().text('notifications_off');

	var date = createViewDate(data.starttime);
	date = ('0'+(date.getUTCMonth()+1)).slice(-2) + '/' + ('0'+date.getUTCDate()).slice(-2) + '(' + week[date.getUTCDay()] + ') ' + ('0'+date.getUTCHours()).slice(-2) + ':' + ('0'+date.getUTCMinutes()).slice(-2);

	var notifyList = $('<li>', {id: 'notify_' + data.eid, class: 'mdl-list__item mdl-list__item--two-line', data: {start: data.starttime}, append: [
		$('<span>', {class: 'mdl-list__item-primary-content', click: function(){window.open('epginfo.html?onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + '&eid=' + data.eid, '_blank');}, append: [
			$('<span>', {html: data.title}),
			$('<span>', {class: 'mdl-list__item-sub-title', text: date + ' ' + data.service}) ]}),
		$('<span>', {class: 'mdl-list__item-secondary-content', append: [
			$('<button>', {
				class: 'mdl-list__item-secondary-action mdl-button mdl-js-button mdl-button--icon',
				html: $('<i>', {class: 'material-icons', text: 'notifications_off'}),
				click: function(){delNotify(data); } }) ]}) ]});

	var done;
	$('#notifylist li').each(function(){
		//開始時間でソート
		if (data.starttime < $(this).data('starttime')){
			done = true;
			$(this).before(notifyList);
			return false;
		}
	});
	if (!done) $('#notifylist').append(notifyList);

	badgeNotify();
}

//マクロ一覧表示
function macro(obj){
	$(obj).prevAll('input').addClass('is-active');
	$('#macro').addClass('is-visible');
}

//表示用に時間シフトしたDateオブジェクトを生成
function createViewDate(value){
	if (value === undefined) value = new Date();
	if (typeof value !== 'object') value = new Date(value);
	return new Date(value.getTime() + 9 * 3600000);
}

function ConvertTime(t, show_sec, show_ymd){
	if (!t)	return '未定';
	t = createViewDate(t);
	return (show_ymd ? t.getUTCFullYear() + '/' + ('0'+(t.getUTCMonth()+1)).slice(-2) + '/' + ('0'+t.getUTCDate()).slice(-2) + '(' + week[t.getUTCDay()] + ') ' : '') +
	       ('0'+ t.getUTCHours()).slice(-2) +':'+ ('0'+ t.getUTCMinutes()).slice(-2) + ((show_sec && t.getUTCSeconds() != 0) ? '<small>:'+ ('0' + t.getUTCSeconds()).slice(-2) +'</small>' : '');
}
function ConvertText(a){
	return a.replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1" target="_blank">$1</a>').replace(/\n/g,'<br>');
}
function ConvertTitle(a){
	return a.replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g, '<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>');
}

//プログラム予約
function progReserve(start, end, eid){
	start = createViewDate(start);
	end = end ? createViewDate(end) : start;
	$('#startdate').val(start.getUTCFullYear() +'-'+ ('0'+(start.getUTCMonth()+1)).slice(-2) +'-'+ ('0'+start.getUTCDate()).slice(-2));
	$('#starttime').val(('0'+start.getUTCHours()).slice(-2) +':'+ ('0'+start.getUTCMinutes()).slice(-2) +':'+ ('0'+start.getUTCSeconds()).slice(-2));
	$('#endtime').val(('0'+end.getUTCHours()).slice(-2) +':'+ ('0'+ end.getUTCMinutes()).slice(-2) +':'+ ('0'+ end.getUTCSeconds()).slice(-2));

	if (eid==65535){
	  $('#toprogres').text('プログラム予約');
	  $('#progres p').hide();
	}else{
	  $('#toprogres').text('プログラム予約化');
	  $('#progres p').show();
	}
}

//番組情報をオブジェクト化
function ConvertEpgInfo(e){
	var d = {
		onid: Number(e.children('ONID').text()),
		tsid: Number(e.children('TSID').text()),
		sid:  Number(e.children('SID').text()),
		eid:  Number(e.children('eventID').text()),
		service: e.children('service_name').text(),

		duration: Number(e.children('duration').text()),

		title: e.children('event_name').length > 0 ? e.children('event_name').text() : e.children('title').text(),
		text: e.children('event_text').text(),
		text_ext: e.children('event_ext_text').text(),

		freeCAFlag: e.children('freeCAFlag').first().text() == 1
	}
	d.starttime = new Date(e.children('startDate').text().replace(/\//g,'-')+'T'+e.children('startTime').text()+'+09:00').getTime();
	if (d.duration) d.endtime = new Date(d.starttime + d.duration*1000).getTime();

	if (e.children('contentInfo').length > 0){
		d.genre = [];
		e.children('contentInfo').each(function(i){
			d.genre[i] = {
				nibble1: Number($(this).children('nibble1').text()),
				nibble2: Number($(this).children('nibble2').text()),
				component_type_name: $(this).children('component_type_name').text()
			}
		});
	}

	if (e.children('videoInfo').length > 0){
		d.video = [];
		e.children('videoInfo').each(function(i){
			d.video[i] = {
				stream_content: Number($(this).children('stream_content').text()),
				component_type: Number($(this).children('component_type').text()),
				component_tag: Number($(this).children('component_tag').text()),
				text: $(this).find('text').text(),
				component_type_name: $(this).children('component_type_name').text()
			}
		});
	}

	if (e.children('audioInfo').length > 0){
		d.audio = [];
		e.children('audioInfo').each(function(i){
			d.audio[i] = {
				stream_content: Number($(this).find('stream_content').text()),
				component_type: Number($(this).find('component_type').text()),
				component_tag: Number($(this).find('component_tag').text()),
				stream_type: Number($(this).find('stream_type').text()),
				simulcast_group_tag: Number($(this).find('simulcast_group_tag').text()),
				ES_multi_lingual: $(this).find('ES_multi_lingual_flag').text() == '1',
				main_component: $(this).find('main_component_flag').text() == '1',
				quality_indicator: Number($(this).find('quality_indicator').text()),
				sampling_rate: Number($(this).children('sampling_rate').text()),
				text: $(this).find('text').text(),
				component_type_name: $(this).find('component_type_name').text()
			}
		});
	}
	return d;
}

//番組詳細を表示
function setEpgInfo(e, past){
	if (!e.onid) e = ConvertEpgInfo(e);

	$('#title').html( ConvertTitle(e.title) );

	if (e.starttime){
		$('#info_date').html(ConvertTime(e.starttime, true, true) +'～'+ ConvertTime(e.endtime, true));
		progReserve(e.starttime, e.endtime, e.eid)

		if (!e.end || Date.now()<e.end || e.recinfoid){
			$('#sidePanel .mdl-tabs__tab-bar').show();
			$('#sidePanel .mdl-dialog__actions').show();
		}else{
			$('#sidePanel .mdl-tabs__tab-bar').hide();
			$('#sidePanel .mdl-dialog__actions').hide();
		}
	}else{
		$('#info_date').html('未定');
		$('#sidePanel .mdl-tabs__tab-bar').show();
		$('#sidePanel .mdl-dialog__actions').show();
	}

	$('#service,#service_hedder').html(e.service);
	$('#links').html($('.open .links a').clone(true));
	$('#summary p').html( ConvertText(e.text) );
	$('#ext').html( ConvertText(e.text_ext) );

	var genre, video, audio, other = genre = video = audio = '';
	if (typeof e.genre == 'string'){
		genre = '<li>'+e.genre.replace(/\n/g,'<li>');
	}else{
		$(e.genre).each(function(){
			genre += '<li>'+ this.component_type_name;
		});
	}
	$('#genreInfo').html(genre);
	if (typeof e.video == 'string'){
		video = '<li>'+e.video.replace(/\n/g,'<li>');
	}else{
		$(e.video).each(function(){
			video += '<li>'+ this.component_type_name +' '+ this.text;
		});
	}
	$('#videoInfo').html(video);
	if (typeof e.audio == 'string'){
		audio = '<li>'+ e.audio.replace(/\n/g,'<li>');
	}else{
		$(e.audio).each(function(){
			audio += '<li>'+ this.component_type_name +' '+ this.text +'<li>サンプリングレート : '+ {1:'16',2:'22.05',3:'24',5:'32',6:'44.1',7:'48'}[this.sampling_rate] +'kHz';
		});
	}
	$('#audioInfo').html(audio);


	if (e.recinfoid){
		if (e.other) other = '<li>'+ e.other.replace(/\n/g,'<li>');
		$('#otherInfo').html(other);
	}else{
		if (e.onid<0x7880 || 0x7FE8<e.onid){
			if (e.freeCAFlag){
				other = '<li>有料放送';
			}else{
				other = '<li>無料放送';
			}
		}
		$('#otherInfo').html(other +
			'<li>OriginalNetworkID:' + e.onid +'(0x'+ ('000'+e.onid.toString(16).toUpperCase()).slice(-4) +')' +
			'<li>TransportStreamID:' + e.tsid +'(0x'+ ('000'+e.tsid.toString(16).toUpperCase()).slice(-4) +')' +
			'<li>ServiceID:'         + e.sid  +'(0x'+ ('000'+ e.sid.toString(16).toUpperCase()).slice(-4) +')' +
			'<li>EventID:'           + e.eid  +'(0x'+ ('000'+ e.eid.toString(16).toUpperCase()).slice(-4) +')' );

		$('[name=onid]').val(e.onid);
		$('[name=tsid]').val(e.tsid);
		$('[name=sid]').val(e.sid);
		$('[name=eid]').val(e.eid);

		$('#link_epginfo').attr('href', 'epginfo.html?onid='+ e.onid +'&tsid='+ e.tsid +'&sid='+ e.sid + (past ? '&startTime='+ past : '&eid='+ e.eid));
		$('#set').data('onid', e.onid).data('tsid', e.tsid).data('sid', e.sid).data('eid', e.eid);
	}
}

//番組詳細を取得、予約確認
function getEpgInfo(target, data, past){
	showSpinner(true);
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
	$('[href="#recset"], #recset, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$('[href="#detail"], #detail').addClass('is-active');
	target.addClass('open');
	$('.sidePanel-content').scrollTop(0);

	data = data || target.data();
	var id = data.id || target.find('.addreserve').data('id') || target.children('.flag').data('id');

	$.ajax({
		url: root + 'api/EnumEventInfo' + (past ? '?startTime='+ past : ''),
		data:  {basic: 0, onid: data.onid, tsid: data.tsid, sid: data.sid, eid: data.eid},
		success: function(result, textStatus, xhr){
			var info = $(xhr.responseXML);
			if (info.find('eventinfo').length > 0){
				info = info.find('eventinfo').first();

				function action(){
					var Reserve = ReserveAutoaddList[data.onid+'-'+data.tsid+'-'+data.sid+'-'+data.eid];
					if (Reserve){
						if (!id){//追加されてた
							id = Reserve.find('ID').text();
							if (target.hasClass('onair')){
								var next = data.next ? 'next' : '';
								target.data(next+'id', id);
							}else{
								addMark(info, $('.open .addreserve'), $('.open .content-wrap'));
							}
						}
						setEpgInfo(info);
						setReserve(Reserve, id);
					}else{
						if (id){//削除されてた
							if (target.hasClass('reserve')){
								target.remove();
							}else{
								if (target.hasClass('onair')){
									var next = data.next ? 'next' : '';
									target.removeData(next+'id');
								}

								setEpgInfo(info, past);
								setDefault(true);
								$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
							}
							if (!target.hasClass('onair')) Snackbar.MaterialSnackbar.showSnackbar({message: '予約が見つかりませんでした'});
						}else{
							setEpgInfo(info, past);
							setDefault();

							$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
						}
					}
					showSpinner();
				}

				$.get(root + 'api/Common', {notify: 2}, function(result, textStatus, xhr){
					var Count = $(xhr.responseXML).find('info').text();
					if (ReserveAutoaddList && Count == notifyCount){
						action();
					}else{
						notifyCount = Count;
						sessionStorage.setItem('notifyCount', notifyCount);
						$.get(root + 'api/EnumReserveInfo', function(result, textStatus, xhr){
							ReserveAutoaddList={};
							$(xhr.responseXML).find('reserveinfo').each(function(){
								var key;
								if ($(this).find('eventID').text()==65535){
									key=$(this).find('ID').text();
								}else{
									key=$(this).find('ONID').text()+'-'+$(this).find('TSID').text()+'-'+$(this).find('SID').text()+'-'+$(this).find('eventID').text();
								}
								ReserveAutoaddList[key]=$(this);
							});
							action();
						});
					}
				});
			}else{
				if (id){
				//プログラム予約または番組変更でなくなった
					function action(){
						var key;
						if (data.eid==65535){
							key = id;
						}else{
							key = data.onid+'-'+data.tsid+'-'+data.sid+'-'+data.eid
						}
						var Reserve = ReserveAutoaddList[key];
						if (Reserve){
							setEpgInfo(Reserve);

							$('#link_epginfo').attr('href', 'reserveinfo.html?id=' + id);
							$('[href="#detail"], #detail').removeClass('is-active');
							$('[href="#recset"], #recset').addClass('is-active');

							setReserve(Reserve, id);
						}else{
							target.remove();
							Snackbar.MaterialSnackbar.showSnackbar({message: '予約が見つかりませんでした'});
							showSpinner();
						}
					}

					$.get(root + 'api/Common', {notify: 2}, function(result, textStatus, xhr){
						var Count = $(xhr.responseXML).find('info').text();
						if (ReserveAutoaddList && Count == notifyCount){
							action();
						}else{
							notifyCount = Count;
							sessionStorage.setItem('notifyCount', notifyCount);
							$.get(root + 'api/EnumReserveInfo', function(result, textStatus, xhr){
								ReserveAutoaddList={};
								$(xhr.responseXML).find('reserveinfo').each(function(){
									var key;
									if ($(this).find('eventID').text()==65535){
										key=$(this).find('ID').text();
									}else{
										key=$(this).find('ONID').text()+'-'+$(this).find('TSID').text()+'-'+$(this).find('SID').text()+'-'+$(this).find('eventID').text();
									}
									ReserveAutoaddList[key]=$(this);
								});
								action();
							});
						}
					});
				}else{
					errMessage(info);
					showSpinner();
				}
			}
		}
	});
}

//予約をセット
function setReserve(Reserve, id){
	$('#set').attr('action', root + 'api/setReserve?id='+id);
	$('#del').attr('action', root + 'api/setReserve?id='+id);
	$('#progres').attr('action', root + 'api/setReserve?id='+id);
	$('#action').attr('name', 'change');
	$('#reserved, #delreseved, #toprogres').show();
	$('[name=presetID]').data('reseveid', id).val(65535);
	$('#reserve').text('変更');

	setRecSettting(Reserve);

	$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
	showSpinner();
}

//EGP予約をセット
function setAutoAdd(target){
	showSpinner(true);
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
	$('[href="#recset"], #recset, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$('[href="#search_"], #search_').addClass('is-active');
	target.addClass('open');
	$('.sidePanel-content').scrollTop(0);

	function action(){
		var id = target.data('id');
		var autoadd=ReserveAutoaddList[id];
		if (autoadd){
			$('#set').attr('action', root + 'api/SetAutoAdd?id='+id);
			$('#del').attr('action', root + 'api/SetAutoAdd?id='+id);
			$('#link_epginfo').attr('href', 'autoaddepginfo.html?id='+id);

			if (autoadd.find('disableFlag').text() == 1){
				$('#disable').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#disable').prop('checked', false).parent().removeClass('is-checked');
			}
			$('#andKey').val(autoadd.find('andKey').text());
			$('#notKey').val(autoadd.find('notKey').text());
			if (autoadd.find('regExpFlag').text() == 1){
				$('#reg').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#reg').prop('checked', false).parent().removeClass('is-checked');
			}
			if (autoadd.find('aimaiFlag').text() == 1){
				$('#aimai').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#aimai').prop('checked', false).parent().removeClass('is-checked');
			}
			if (autoadd.find('titleOnlyFlag').text() == 1){
				$('#titleOnly').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#titleOnly').prop('checked', false).parent().removeClass('is-checked');
			}
			if (autoadd.find('caseFlag').text() == 1){
				$('#caseFlag').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#caseFlag').prop('checked', false).parent().removeClass('is-checked');
			}
			var contentList=[];
			autoadd.find('contentList').each(function(){
				contentList.push($(this).find('content_nibble').text());
			});
			$('#contentList').val(contentList);
			if (autoadd.find('notContetFlag').text() == 1){
				$('#notcontet').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#notcontet').prop('checked', false).parent().removeClass('is-checked');
			}
			var service=[];
			autoadd.find('serviceList').each(function(){
				service.push($(this).find('onid').text()+'-'+$(this).find('tsid').text()+'-'+$(this).find('sid').text());
			});
			$('#service').val(service);
			$('#dateList_select,#dateList_touch').empty();
			$('[name=dateList]').val('');
			autoadd.find('dateList').each(function(){
				var DayOfWeek = ['日','月','火','水','木','金','土'];
				var time = {
					startDayOfWeek: DayOfWeek[$(this).find('startDayOfWeek').text()],
					startMin: $(this).find('startMin').text(),
					startHour: $(this).find('startHour').text(),
					endDayOfWeek: DayOfWeek[$(this).find('endDayOfWeek').text()],
					endHour: $(this).find('endHour').text(),
					endMin: $(this).find('endMin').text()
				};
				$('#dateList_select').append('<option value="' + time.startDayOfWeek + '-' + time.startHour + ':' + time.startMin + '-' + time.endDayOfWeek + '-' + time.endHour + ':' + time.endMin + '">' + time.startDayOfWeek + ' ' + time.startHour + ':' + time.startMin + ' ～ ' + time.endDayOfWeek + ' ' + time.endHour + ':' + time.endMin + '</otion>');
				var val;
				var html = '';

				$('#dateList_select option').each(function(i){
					if (val){ val += ','; }else{ val = ''; }
					val += $(this).val();
					html += '<li class="mdl-list__item" data-count="' + i + '"><span class="mdl-list__item-primary-content">' + $(this).text() + '</span></li>';
				});
				$('[name=dateList]').val(val);
				$("#dateList_touch").html(html);
			});
			if (autoadd.find('notDateFlag').text() == 1){
				$('#notdate').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#notdate').prop('checked', false).parent().removeClass('is-checked');
			}
			$('[name=freeCAFlag]').val(autoadd.find('freeCAFlag').text());
			$('#DurationMin').val(autoadd.find('chkDurationMin').text());
			$('#DurationMax').val(autoadd.find('chkDurationMax').text());
			if (autoadd.find('chkRecEnd').text() == 1){
				$('#chkRecEnd').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#chkRecEnd').prop('checked', false).parent().removeClass('is-checked');
			}
			if (autoadd.find('chkRecNoService').text() == 1){
				$('#chkRecNoService').prop('checked', true).parent().addClass('is-checked');
			}else{
				$('#chkRecNoService').prop('checked', false).parent().removeClass('is-checked');
			}
			$('#chkRecDay').val(autoadd.find('chkRecDay').text());
			$('[name=presetID]').data('autoaddid', id).val(65535);

			setRecSettting(autoadd);

			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
			showSpinner();
		}else{
			Snackbar.MaterialSnackbar.showSnackbar({message: 'Error : 自動予約が見つかりませんでした'});
			showSpinner();
		}
	}

	$.get(root + 'api/Common', {notify: 4}, function(result, textStatus, xhr){
		var Count = $(xhr.responseXML).find('info').text();
		if(ReserveAutoaddList && Count == notifyCount){
			action();
		}else{
			notifyCount = Count;
			sessionStorage.setItem('notifyCount', notifyCount);
			$.get(root + 'api/EnumAutoAdd', function(result, textStatus, xhr){
				ReserveAutoaddList={};
				$(xhr.responseXML).find('autoaddinfo').each(function(){
					ReserveAutoaddList[$(this).find('ID').text()]=$(this);
				});
				action();
			});
		}
	});
}

//録画結果をセット
function setRecInfo(target){
	showSpinner(true);
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
	$('[href="#error"], #error, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$('[href="#detail"], #detail').addClass('is-active');
	target.addClass('open');
	$('.sidePanel-content').scrollTop(0);

	$.get(root + 'api/EnumRecInfo?id='+target.data('recinfoid'), function(result, textStatus, xhr){
		var xml = $(xhr.responseXML);
		if (xml.find('recinfo').length > 0){
			xml = xml.find('recinfo').first();
			var e = ConvertEpgInfo(xml);

			e.recinfoid = Number(xml.children('ID').text());
			if (xml.children('programInfo').text().length>0){
				var programInfo=xml.children('programInfo').text().match(/^[\s\S]*?\n\n([\s\S]*?)\n+(?:詳細情報\n)?([\s\S]*?)\n+ジャンル : \n([\s\S]*)\n\n映像 : ([\s\S]*)\n音声 : ([\s\S]*?)\n\n([\s\S]*)\n$/);
				e.text = programInfo[1];
				e.text_ext = programInfo[2];
				e.genre = programInfo[3];
				e.video = programInfo[4];
				e.audio = programInfo[5];
				e.other = programInfo[6].replace(/\n\n/g,'\n');
			}

			setEpgInfo(e);

			$('#path').text(xml.children('recFilePath').text());
			$('#comment').text(xml.children('comment').text());
			$('#drops').text(xml.children('drops').text());
			$('#scrambles').text(xml.children('scrambles').text());

			$('pre').text(xml.children('errInfo').text());

			$('#del').attr('action', root + 'api/SetRecInfo?id='+ e.recinfoid).next('button').prop('disabled', xml.children('protect').text()=='1');
			$('#link_epginfo').attr('href', 'recinfodesc.html?id='+ e.recinfoid);

			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
			showSpinner();
		}else{
			errMessage(xml);
			showSpinner();
		}
	});
}

//録画フォルダパス作成
function recFolderInfo(i, val, partial){
	var div = '<div>';
	var cell = 'mdl-cell';
	var container = 'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing';
	var select = 'mdl-cell pulldown mdl-grid mdl-grid--no-spacing';
	var textfield = 'mdl-cell mdl-textfield mdl-js-textfield';
	var delbtn = 'delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button';
	var middle = 'mdl-cell mdl-cell--middle';
	var recNamePlugIn = val.recNamePlugIn.match(/^(.*\.dll)?(?:\?(.*))?/);
	partial = partial ? 'partial' : '';
	return $(div, {class: 'preset '+container, append: [
				$(div, {class: delbtn, click: function(){delPreset(this);}, html:
					$('<i>', {class: 'material-icons', text: 'delete'}) }),
				$(div, {class: container, append: [
					$(div, {class: cell, text: 'フォルダ'}),
					$(div, {class: cell, text: (val.recFolder=='' ? '!Default' : val.recFolder)}),
					$('<input>', {class: 'recFolderList', type: 'hidden', name: partial+'recFolder', value: val.recFolder}) ]}),
				$(div, {class: container, append: [
					$(div, {class: middle, text: '出力PlugIn'}),
					$(div, {class: select, html:
						$('<select>', {name: partial+'writePlugIn', html:
							$('#Write').html(), val: val.writePlugIn }) }) ]}),
				$(div, {class: container, append: [
					$(div, {class: middle, text: 'ファイル名PlugIn'}),
					$(div, {class: select, html:
						$('<select>', {name: partial+'recNamePlugIn', html:
							$('#RecName').html(), val: recNamePlugIn[1]}) }) ]}),
				$(div, {class: container, append: [
					$(div, {class: middle, text: 'オプション'}),
					$(div, {class: textfield, append: [
						$('<input>', {class: 'has-icon mdl-textfield__input', type: 'text', name: partial+'recName', id: partial+'recName'+i, val: recNamePlugIn[2]}),
						$('<label>', {class: 'mdl-textfield__label', for: partial+'recName'+i, text: 'ファイル名PlugIn'}),
						$('<i>', {class: 'addmacro material-icons', text: 'add', click: function(){macro(this);} }) ]}) ]}) ]});
}
//録画フォルダパス削除
function delPreset(obj){
	obj = $(obj).parent();
	var target = obj.next();
	var clone = obj.clone(true);
	obj.remove();
	var data = {
		message: '削除しました',
		timeout: 2000,
		actionHandler: function(){
			clone.insertBefore(target);
			Snackbar.MaterialSnackbar.showSnackbar({message: '元に戻しました'})
		},
		actionText: '元に戻す'
	};
	Snackbar.MaterialSnackbar.showSnackbar(data);
}

//録画設定をセット
function setRecSettting(self){
	var recset = self.children('recsetting');
	//録画モード
	$('[name=recMode]').val(recset.children('recMode').text());
	//追従
	if (recset.children('tuijyuuFlag').text() == 1){
		$('[name=tuijyuuFlag]').prop('checked', true).parent().addClass('is-checked');
	}else{
		$('[name=tuijyuuFlag]').prop('checked', false).parent().removeClass('is-checked');
	}
	//優先度
	$('[name=priority]').val(recset.children('priority').text());
	//ぴったり(？)録画
	if (recset.children('pittariFlag').text() == 1){
		$('[name=pittariFlag]').prop('checked', true).parent().addClass('is-checked');
	}else{
		$('[name=pittariFlag]').prop('checked', false).parent().removeClass('is-checked');
	}
	//録画後動作
	$('[name=suspendMode]').val(recset.children('suspendMode').text());
	//復帰後再起動
	if ($('[name=suspendMode]').val()==0){
		$('.reboot').addClass('is-disabled');
	}else{
		$('.reboot').removeClass('is-disabled');
	}
	if (recset.children('rebootFlag').text() == 1){
		$('[name=rebootFlag]').prop('checked', true).parent().addClass('is-checked');
	}else{
		$('[name=rebootFlag]').prop('checked', false).parent().removeClass('is-checked');
	}
	//録画マージン
	if (recset.children('useMargineFlag').text() == 0){
		$('[name=useDefMarginFlag]').prop('checked', true).parent().addClass('is-checked');
		$('.recmargin').addClass('is-disabled').find('.mdl-textfield').addClass('is-disabled').find('input').prop('disabled', true);
	}else{
		$('[name=useDefMarginFlag]').prop('checked', false).parent().removeClass('is-checked');
		$('.recmargin').removeClass('is-disabled').find('.mdl-textfield').removeClass('is-disabled').find('input').prop('disabled', false);
	}
	//開始
	$('[name=startMargin]').val(recset.children('startMargine').text());
	//終了
	$('[name=endMargin]').val(recset.children('endMargine').text());
	//指定サービス対象データ
	var serviceMode = recset.children('serviceMode').text();
	if (serviceMode%2 == 0){
		$('[name=serviceMode]').prop('checked', true).parent().addClass('is-checked');
		$('.smode').find('.mdl-checkbox').addClass('is-disabled').find('input').prop('checked', false).prop('disabled', true);
		serviceMode = recset.children('defserviceMode').text();
	}else{
		$('[name=serviceMode]').prop('checked', false).parent().removeClass('is-checked');
		$('.smode').find('.mdl-checkbox').removeClass('is-disabled').find('input').prop('disabled', false);
	}
	if ((Math.floor(serviceMode/16)%2) != 0){
		$('[name=serviceMode_1]').prop('checked', true).parent().addClass('is-checked');
	}else{
		$('[name=serviceMode_1]').prop('checked', false).parent().removeClass('is-checked');
	}
	if ((Math.floor(serviceMode/32)%2) != 0){
		$('[name=serviceMode_2]').prop('checked', true).parent().addClass('is-checked');
	}else{
		$('[name=serviceMode_2]').prop('checked', false).parent().removeClass('is-checked');
	}
	//連続録画動作
	if (recset.children('continueRecFlag').text() == 1){
		$('[name=continueRecFlag]').prop('checked', true).parent().addClass('is-checked');
	}else{
		$('[name=continueRecFlag]').prop('checked', false).parent().removeClass('is-checked');
	}
	//使用チューナー強制指定
	$('[name=tunerID]').val(recset.children('tunerID').text());

	//プリセット
	//録画後実行bat
	$('.preset').remove();

	var batFilePath = recset.children('batFilePath').text().match(/^([^*]*)\*?([\s\S]*)$/);
	if ($('[name="batFilePath"] option[value="' + batFilePath[1].replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&') + '"]').length == 0){
		$('[name="batFilePath"]').append($('<option>', {value: batFilePath[1], text: batFilePath[1]}));
	}
	$('[name="batFilePath"]').val(batFilePath[1]);
	$('[name="batFileTag"]').val(batFilePath[2]);
	var recFolderList = recset.children('recFolderList');
	if (recFolderList.text().length > 0){
		$(recFolderList).children('recFolderInfo').each(function(i){
			var val = {
				recFolder: $(this).children('recFolder').text(),
				writePlugIn: $(this).children('writePlugIn').text(),
				recNamePlugIn: $(this).children('recNamePlugIn').text()
			}
			$('#preset .addPreset').before(recFolderInfo(i, val));
		});
	}
	//部分受信プリセット
	var partialRecFolder = recset.children('partialRecFolder');
	if (partialRecFolder.text().length > 0){
		$(partialRecFolder).children('recFolderInfo').each(function(i){
			var val = {
				recFolder: $(this).children('recFolder').text(),
				writePlugIn: $(this).children('writePlugIn').text(),
				recNamePlugIn: $(this).children('recNamePlugIn').text()
			}
			$('#partialpreset .addPreset').before(recFolderInfo(i, val, true));
		});
	}
	componentHandler.upgradeDom();
	//部分受信サービス
	if (recset.children('partialRecFlag').text() == 1){
		$('[name=partialRecFlag]').prop('checked', true).parent().addClass('is-checked');
		$('#partialpreset').show();
	}else{
		$('[name=partialRecFlag]').prop('checked', false).parent().removeClass('is-checked');
		$('#partialpreset').hide();
	}

	if (self.children('name').text().length > 0){
		return self.children('name').text();
	}else{
		return $('[name=presetID] option:selected').text();
	}
}

//デフォルト読込
function setDefault(mark){
	if (PresetList){
		setRecSettting(PresetList['0']);

		$('#set').attr('action', root + 'api/setReserve');
		$('#action').attr('name', 'add');
		$('#reserved, #delreseved, #toprogres').hide();
		$('[name=presetID]').val(0);
		$('#reserve').text('予約追加');

		if (mark){
			$('.open .mark.reserve').remove();
			$('.open .addreserve').data('id', false).data('oneclick', 1).data('toggle', 0).text('予約追加');
			$('.open .reserve').removeClass('reserve disabled partially shortage view');
			$('.open .flag').data('id', false).data('oneclick', 1).data('toggle', 0).html($('<span>', {class:'search add mdl-button mdl-js-button mdl-button--fab mdl-button--colored',click:function(){reserve($(this));},html:'<i class="material-icons">add</i>'}));
		}
	}else{
		$.get(root + 'api/EnumRecPreset', function(result, textStatus, xhr){
			PresetList = {};
			$(xhr.responseXML).find('recpresetinfo').each(function(){
				PresetList[$(this).find('id').text()]=$(this);
			});
			setDefault(mark);
		});
	}
}

//予約処理
function reserve(obj){
	showSpinner(true);
	var data = obj.parents('td').data();
	data.ctok = ctok;

	$.ajax({
		url: root + 'api/setReserve',
		data: data,

		success: function(result, textStatus, xhr) {
			var xml = $(xhr.responseXML);
			if (xml.find('success').length > 0){
				var start = new Date(xml.find('startDate').text().replace(/\//g,'-')+'T'+xml.find('startTime').text()+'+09:00');
				var recmode = xml.find('recMode').text();
				var overlapmode = xml.find('overlapMode').text();
				var id = xml.find('ID').text();

				var mode = '';
				if (recmode == 5){//無効
					mode = 'disabled';
				}else if (overlapmode == 1){//チューナー不足
					mode = 'partially';
				}else if (overlapmode == 2){//一部録画
					mode = 'shortage';
				}

				var parents = obj.parents('tr');
				if (obj.hasClass('search')){//検索ページ向け
					parents = obj.parents('td').data('id', id);
					//スイッチ追加
					if (start < Date.now()){
						obj.removeClass().addClass('search recmark').empty();
						if (recmode != 5) obj.unbind('click');
					}else if (!obj.hasClass('addreserve')){
						var reserveid = 'reserve' + id;
						var label = $('<label>', {
							class: 'mdl-switch mdl-js-switch',
							for: reserveid,
							html: $('<input>', {
								id: reserveid,
								class: 'search addreserve mdl-switch__input',
								type: 'checkbox',
								checked: recmode != 5,
								change: function(){reserve($(this));}
							})
						});
						componentHandler.upgradeElement(label.get(0));

						var mark = $('<span>').html(label);
						parents.data('toggle', 1).data('oneclick', 0).html(mark);
						setTimeout(function(){
							parents.parent('tr').addClass('start');
							mark.addClass('recmark').empty();
						}, start-Date.now());
					}
				}
				parents.removeClass('disabled partially shortage').addClass(mode);
				if (recmode != 5 && obj.hasClass('mdl-switch__input')){
					obj.prop('checked', true).parent().addClass('is-checked');
				}else{
					obj.prop('checked', false).parent().removeClass('is-checked');
				}
			}else{
				if (obj.hasClass('mdl-switch__input')){
					if (obj.prop('checked')){
						obj.prop('checked', false).parent().removeClass('is-checked');
					}else{
						obj.prop('checked', true).parent().addClass('is-checked');
					}
				}
				errMessage(xml);
			}
			showSpinner();
		}
	});
}

//録画マーク追加
function addMark(xml, target, content){
	var recmode = xml.find('recMode').text();
	var overlapmode = xml.find('overlapMode').text();
	var id = xml.find('ID').text();
	var messege, button, mark;

	if (recmode == 5){
		messege = '無効';
		button = '有効';
		recmode = 'disabled';
		mark = '無';
	}else{
		messege = '有効';
		button = '無効';
		if (overlapmode == 1){
			recmode = 'partially';
			mark = '部';
		}else if (overlapmode == 2){
			recmode = 'shortage';
			mark = '不';
		}else if (recmode == 4){
			recmode = 'view';
			mark = '視';
		}else{
			recmode = '';
			mark = '録';
		}
	}
	target.data('id', id).data('toggle', 1).data('oneclick', 0).text(button);
	content.not('.reserve').find('.startTime').after('<span class="mark reserve"></span>');
	content.removeClass('disabled partially shortage view').addClass('reserve ' + recmode).find('.mark.reserve').text(mark);

	return messege;
}

function is_small_screen(){
	return window.matchMedia(window.MaterialLayout.prototype.Constant_.MAX_WIDTH).matches;
}

$(window).on('load resize', function(){
	var MAX_WIDTH = window.matchMedia('(max-width: 700px)').matches;
	$('#add_dateList').prop('disabled', MAX_WIDTH && !$('#dateList_edit').hasClass('is-visible'));
	//マクロ補助
	if (MAX_WIDTH){
		$('.shrink-phone').show();
		$('.check-shrink-phone').prop('checked', true);
		$('.drawer-separator.mdl-cell--hide-desktop').hide();
	}else{
		$('.shrink-phone').hide();
		$('.check-shrink-phone').prop('checked', false);
		$('.drawer-separator.mdl-cell--hide-desktop').show();
	}
});

//サービスワーカーの登録
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("serviceworker.js");
}

$(function(){
	Snackbar = document.querySelector('.mdl-js-snackbar');

	//スワイプ
	if (isTouch){
		delete Hammer.defaults.cssProps.userSelect;
		//drawer表示
		$('.drawer-swipe').hammer().on('swiperight', function(){
			$('.mdl-layout__drawer-button').click();
		});

		//タブ移動
		$('.tab-swipe').hammer().on('swiperight', function(){
			tab( $('.mdl-layout__tab.is-active').prev() );
		});
		$('.tab-swipe').hammer().on('swipeleft', function(){
			tab( $('.mdl-layout__tab.is-active').next() );
		});
		$('.panel-swipe').hammer().on('swiperight', function(){
			tab( $('.mdl-tabs__tab.is-active').prev() );
		});
		$('.panel-swipe').hammer().on('swipeleft', function(){
			tab( $('.mdl-tabs__tab.is-active').next() );
		});
	}

	//一覧の行をリンクに
	$('tr.epginfo').click(function(e){
		if (!$(e.target).is('.flag, .flag *, .count a')){
			if ($(this).data('onid')){
				createSearchLinks(this);
				getEpgInfo($(this));
			}else if($(this).data('id')){
				setAutoAdd($(this));
			}else if($(this).data('recinfoid')){
				setRecInfo($(this));
			}else{
				window.location = $(this).data('href');
			}
		}
	});
	$('.close_info').click(function(){
		$('#sidePanel, .close_info.mdl-layout__obfuscator, .open').removeClass('is-visible open');
	});

	//drawer ドロップダウン
	$('.drop-down').click(function(){
		$(this).next().slideToggle();
	});

	//ダイアログ
	if ($('dialog').length>0){
		$('.show_dialog').click(function(){
			var dialog = document.querySelector('dialog'+$(this).data('dialog'));
			if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
			dialog.showModal();
		});
	}
	//閉じ
	$('dialog .close').click(function(){
		var dialog = document.querySelector('dialog'+$(this).data('dialog'));
		if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
		dialog.close();
	});

	$('.mdl-layout__tab').click(function(){
		$('main').scrollTop(0);
	});
	//再生タブ
	$('#movie_tab').click(function(){
		if (!$('#video').data('load')){
			if (!$('#video').data('public')) loadMovie($('#video'));
			$('#video').trigger('load').data('load', true);
		}
	});

	//通知
	if (!isTouch && window.Notification){
		if (Notification.permission == 'granted'){
			$('.notification').removeClass('hidden');
			//通知リスト読み込み
			if (localStorage.getItem('notifications')){
				var list = JSON.parse(localStorage.getItem('notifications'));
				$.each(list, function(i, data){
					var start = data.starttime;
					if (start < Date.now()){
						//時間が過ぎてたらリストから削除
						saveNotify(data, true);
					}else{
						creatNotify(data);
					}
				});
			}
		}else if (Notification.permission == 'default'){
			//通知許可要求
			Notification.requestPermission(function(result){
				if (result == 'granted') $('.notification').removeClass('hidden');
			});
		}
	}
	if ($('h4 .notify').length > 0 && !$('h4 .notify').attr('disabled')){
		var timeout = $('.notify').data('starttime') - Date.now() - 30*1000;
		setTimeout(function(){
			$('.notify').attr('disabled', true).children().text('notifications');
		}, timeout);
	}
	$('.notify').click(function(){
		var notify = $(this);
		if (!notify.attr('disabled')){
			var data = notify.data();
			if (data.notification){
				//登録済み通知削除
				delNotify(data);
			}else{
				if (data.service){
					data.title = notify.prevAll('.title').html();
				}else{
					data.title = notify.parents('.popup').prevAll('.mdl-typography--body-1-force-preferred-font').html();
					data.service = notify.parents('.station').data('service');
				}

				creatNotify(data, true);
			}
		}
	});

	//録画後動作の抑制
	$('#nosuspend').click(function(){
		$.post(root + 'api/Common', $(this).data(), function(result, textStatus, xhr){
			var message = $(xhr.responseXML).find('info').text();
			Snackbar.MaterialSnackbar.showSnackbar({message: message});
			if (message.match('起動')){
				$('#nosuspend').data('nosuspend', 'n').addClass('n').removeClass('y');
			}else if (message.match('停止')){
				$('#nosuspend').data('nosuspend', 'y').addClass('y').removeClass('n');
			}
		});
	});
	//スタンバイ
	var suspend = document.querySelector('dialog#dialog');
	if (suspend){
		if (!suspend.showModal) dialogPolyfill.registerDialog(suspend);
		$('#suspend').click(function(){
			var self = $(this);
			$('#dialog .mdl-dialog__content').html('<span>' + self.text() + 'に移行します');
			$('#dialog .ok').unbind('click').click(function(){
				suspend.close();
				$.post(root + 'api/Common', self.data(), function(result, textStatus, xhr){
					Snackbar.MaterialSnackbar.showSnackbar({message: $(xhr.responseXML).find('info').text()});
				});
			});
		    suspend.showModal();
		});
	}

	//検索条件
	//詳細検索
	if (!$('#advanced').prop('checked')){
		$('.advanced').hide();
	}
	$('#advanced').change(function(){
		if ($(this).prop('checked')){
			$('.advanced').show();
			$('.network ').prop('disabled', true).hide();
			$('.g_celar').not('.advanced').hide().prev().removeClass('has-button');
		}else{
			$('.advanced').hide();
			$('.network ').prop('disabled', false).show().parent().removeClass('is-disabled');
			$('.g_celar').not('.advanced').show().prev().addClass('has-button');
		}
	});
	//ジャンル
	$('#content').change(function(){
		var val = $('#content').val();
		$('#contentList option').show();
		if (val != 'all'){
			$('#contentList option').not(val).prop('selected', false).hide();
			//サブジャンル表示設定保存
			$(this).data('subGenre', $('#subGenre').prop('checked'));
			$('#subGenre').prop('disabled', true).prop('checked', true).parent().addClass('is-disabled');
		}else{
			var subGenre = $(this).data('subGenre');
			$('#subGenre').prop('disabled', false).prop('checked', subGenre).parent().removeClass('is-disabled');
			if (!subGenre) $('.subGenre').hide();
		}
	});
	//全ジャンル選択解除
	$('.g_celar').click(function(){
		$('#contentList option').prop('selected', false);
	});
	//サブジャンル
	if (!$('#subGenre').prop('checked')){
			$(".subGenre").hide();
	}
	$('#subGenre').change(function(){
		if ($(this).prop('checked')){
			$('.subGenre').show();
		}else{
			$('.subGenre').hide();
		}
	});
	//サービス
	//全選択
	$('.all_select').click(function(){
		$('#service option').not('.hide').prop('selected', true);
	});
	//映像のみ表示
	$('#image').change(function(){
		if ($(this).prop('checked')){
			$('#service option.data').addClass('hide');
		}else{
			$('.extraction:checked').each(function(){
				$('#service ' + $(this).val()).removeClass('hide');
			});
		}
	});
	//ネットワーク表示
	$('.extraction').change(function(){
		if ($(this).prop('checked')){
			if ($('#image').prop('checked')){
				$( $(this).val() ).not('.data').removeClass('hide');
			}else{
				$( $(this).val() ).removeClass('hide');
			}
		}else{
			$($(this).val()).addClass('hide').prop('selected', false);
		}
	});
	//時間絞り込み
	//切替
	$('[name=dayList]').change(function(){
		$('[name=dayList]').each(function(){
			if ($(this).prop('checked')){
				$(this).next().find('select').prop('disabled', false);
				$(this).next().find('input').prop('disabled', false).parent().removeClass('is-disabled');
			}else{
				$(this).next().find('select').prop('disabled', true);
				$(this).next().find('input').prop('disabled', true).parent().addClass('is-disabled');
			}
		});
	});
	//[name=dateList]
	function dateList(){
		var val;
		var html = '';

		$('#dateList_select option').each(function(i){
			if (val){ val += ','; }else{ val = ''; }
			val += $(this).val();
			html += '<li class="mdl-list__item" data-count="' + i + '"><span class="mdl-list__item-primary-content">' + $(this).text() + '</span></li>';
		});
		$('[name=dateList]').val(val);
		$("#dateList_touch").html(html);
	}
	//追加
	function add_time(time){
		$('#dateList_select').append('<option value="'+ time.startDayOfWeek +'-'+ time.startTime +'-'+ time.endDayOfWeek +'-'+ time.endTime + '">' + time.startDayOfWeek +' '+ time.startTime +' ～ '+ time.endDayOfWeek +' '+ time.endTime + '</otion>');
	}
	$('#add_dateList').click(function(){
		var time = {
			startTime:$('#startTime').val(),
			endTime:$('#endTime').val()
		};

		if ($('#dayList').prop('checked')){
			time.startDayOfWeek = $('#startDayOfWeek').val();
			time.endDayOfWeek = $('#endDayOfWeek').val();
			add_time(time);
		}else{
			$('.DayOfWeek:checked').each(function(){
				time.startDayOfWeek = $(this).val();
				time.endDayOfWeek = $(this).val();
				add_time(time);
			});
		}
		dateList();
	});
	//削除
	$('#del_dateList').click(function(){
		$('#dateList_select option:selected').remove();
		dateList();
	});
	//選択
	$(document).on('click', '#dateList_touch .mdl-list__item', function(){
		$(this).toggleClass('mdl-color--accent mdl-color-text--accent-contrast');
		var option = $('#dateList_select option').eq( $(this).data('count') );
		if (option.prop('selected')){
			option.prop('selected', false);
		}else{
			option.prop('selected', true);
		}
	});
	//編集表示
	$('#edit_dateList').click(function(){
		if ($('#dateList_edit').hasClass('is-visible')){
			$('#edit_dateList .material-icons').text('expand_more');
			$('#add_dateList').prop('disabled', true);
		}else{
			$('#edit_dateList .material-icons').text('expand_less');
			$('#add_dateList').prop('disabled', false);
		}
		$('#dateList_edit').toggleClass('is-visible');
	});

	$('.addmacro').click(function(){
		macro(this);
	});
	$('.close.macro').click(function(){
		$('input.is-active').removeClass('is-active');
		$('#macro').removeClass('is-visible');
	});
	$('.macro-item').click(function(){
		var elem = document.querySelector('input.is-active');
		var start = elem.selectionStart;
		var end = elem.selectionEnd;
		var def = $('input.is-active').val();
		var val = def.substr(0, start) + $(this).data('macro') + def.substr(end, def.length);
		$('input.is-active').val(val).removeClass('is-active').parent().addClass('is-dirty');
		$('#macro').removeClass('is-visible');
	});



	//検索バーのアイコンクリックで検索
	$('[for=header-andKey]').click(function(){
		if ($(this).parent().hasClass('is-dirty')) $('#search-bar').submit();
	});
	//検索バー連動
	$('#search-bar').val($('#andKey').val());
	$('.andKey').change(function(){
		$('.andKey').val($(this).val());
	});
	//検索プリセット
	$('#save_preset').click(function(){
		if ($('#lock').prop('checked')) $('#search').append('<input type="hidden" name="lock" value="1">');
		$('#search').append('<input type="hidden" name="save" value="1">').attr('action', 'search.html?preset='+encodeURIComponent($('#preset_name').val())).submit();
	});



	//録画設定
	//プリセット読み込み
	$('[name=presetID]').change(function(){
		function action(list, key){
			var messege;
			var preset = list[key];
			if (preset){
				var name = setRecSettting(preset);
				messege = '"' + name + '" を読み込みました';
			}
			if (!messege) messege = 'プリセットの読み込に失敗しました';
			Snackbar.MaterialSnackbar.showSnackbar({message: messege});
		}


 		var key;
		if ($(this).val() != 65535){
			key = $(this).val();
			if (PresetList){
				action(PresetList, key);
			}else{
				$.get(root + 'api/EnumRecPreset', function(result, textStatus, xhr){
					PresetList = {};
					$(xhr.responseXML).find('recpresetinfo').each(function(){
						PresetList[$(this).find('id').text()]=$(this);
					});
					action(PresetList, key);
				});
			}
		}else if ($(this).data('reseveid')){
			var data=$('#set').data();
			if (data.eid==65535){
				key = $(this).data('reseveid');
			}else{
				key = data.onid+'-'+data.tsid+'-'+data.sid+'-'+data.eid;
			}
			if (ReserveAutoaddList){
				action(ReserveAutoaddList, key);
			}else{
				$.get(root + 'api/' + 'EnumReserveInfo', function(result, textStatus, xhr){
					ReserveAutoaddList={};
					$(xhr.responseXML).find('reserveinfo').each(function(){
						var key;
						if ($(this).find('eventID').text()==65535){
							key=$(this).find('ID').text();
						}else{
							key=$(this).find('ONID').text()+'-'+$(this).find('TSID').text()+'-'+$(this).find('SID').text()+'-'+$(this).find('eventID').text();
						}
						ReserveAutoaddList[key]=$(this);
					});
					action(ReserveAutoaddList, key);
				});
			}
		}else{
			key = $(this).data('autoaddid');
			if (ReserveAutoaddList){
				action(ReserveAutoaddList, key);
			}else{
				$.get(root + 'api/' + 'EnumAutoAdd', function(result, textStatus, xhr){
					ReserveAutoaddList={};
					$(xhr.responseXML).find('autoaddinfo').each(function(){
						ReserveAutoaddList[$(this).find('ID').text()]=$(this);
					});
					action(ReserveAutoaddList, key);
				});
			}
		}
	});
	//録画マージン
	$('#usedef').change(function(){
		if ($(this).prop('checked')){
			$('.recmargin').addClass('is-disabled').find('.mdl-textfield').addClass('is-disabled').find('input').prop('disabled', true);
		}else{
			$('.recmargin').removeClass('is-disabled').find('.mdl-textfield').removeClass('is-disabled').find('input').prop('disabled', false);
		}
	});
	//指定サービス対象データ
	$('#smode').change(function(){
		if ($(this).prop('checked')){
			$('.smode').find('.mdl-checkbox').addClass('is-disabled').find('input').prop('checked', false).prop('disabled', true);
		}else{
			$('.smode').find('.mdl-checkbox').removeClass('is-disabled').find('input').prop('disabled', false);
		}
	});
	$('[name=suspendMode]').change(function(){
		if ($(this).val()==0){
			$('.reboot').addClass('is-disabled').find('input').prop('checked', false).prop('disabled', true);
		}else{
			$('.reboot').removeClass('is-disabled').find('input').prop('disabled', false);
		}
	});
	//部分受信サービス
	$('#partial').change(function(){
		if ($(this).prop('checked')){
			$('#partialpreset').show();
		}else{
			$('#partialpreset').hide();
		}
	});

	//予約トグルスイッチ
	$('.flag input').change(function(){
		reserve( $(this) );
	});
	//録画無効マーク
	$('.disabled span').click(function(){
		if ($(this).hasClass('recmark')) reserve( $(this) );
	});
	//検索ページ追加ボタン
	$('.add').click(function(){
		reserve( $(this) );
	});

	//通信エラー
	$(document).ajaxError(function(e, xhr, textStatus, errorThrown){
		showSpinner();
		var message = 'Error : 通信エラー';
		if (xhr.status!=0){
			message = xhr.status + 'Error : ' + xhr.statusText;
		}else if (textStatus.url.match('api/set')){
			message = 'Error : トークン認証失敗';
		};
		Snackbar.MaterialSnackbar.showSnackbar({message: message});
	});

	//予約一覧マーク等処理
	$('tr.reserve').each(function(){
		var obj = $(this);
		setTimeout(function(){
			obj.addClass('start').children('.flag').children('span').empty().addClass('recmark');
			setTimeout(function (){obj.remove();}, obj.data('endtime')-Date.now());
		}, obj.data('starttime')-Date.now())
	});
	//検索ページ向け
	$('tr.search').each(function(){
		var obj = $(this);
		if (obj.data('starttime')) setTimeout(function(){obj.addClass('start').children('.flag').children('span').addClass('recmark').empty();}, obj.data('starttime')-Date.now())
		setTimeout(function (){obj.children('.flag').data('id', false).children('span').remove();}, obj.data('endtime')-Date.now());
	});

	//サブミット
	$('.submit').click(function(){
		if ($('dialog').attr('open')) {
			var dialog = document.querySelector('dialog'+$(this).data('dialog'));
			if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
			dialog.close();
		}
		showSpinner(true);
		var form = $( $(this).data('form') );
		var data = form.data();

		$.ajax({
			url: form.attr('action'),
			type: form.attr('method'),
			data: form.serialize(),

			success: function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);
				if (xml.find('success').length > 0){
					Snackbar.MaterialSnackbar.showSnackbar({message: xml.find('success').text(), timeout: 1500});
					if (data.redirect){
						setTimeout('location.href="'+data.redirect+'";', 1500);
					}else if (data.submit){
						setTimeout('$("'+ data.submit +'").submit();', 1500);
					}else if (data.reload || form.hasClass('reload')){
						Snackbar.MaterialSnackbar.showSnackbar({message: 'リロードします', timeout: 1000});
						setTimeout('location.reload()', 2500);
					}else if (data.action) {
						if (data.action == 'add' || data.action == 'reserve'){
							var id = xml.find('ID').text();

							$('#set').attr('action', root + 'api/setReserve?id='+id);
							$('#del').attr('action', root + 'api/setReserve?id='+id);
							$('#progres').attr('action', root + 'api/setReserve?id='+id);
							$('#action').attr('name', 'change');
							$('#reserved, #delreseved, #toprogres').show();
							$('[name=presetID]').data('reseveid', id).val(65535);
							$('#reserve').text('変更');

							addMark(xml, $('.open .addreserve'), $('.open .content-wrap'));

							var start = new Date(xml.find('startDate').text().replace(/\//g,'-')+'T'+xml.find('startTime').text()+'+09:00');
							var end = new Date(start.getTime() + Number(xml.find('duration').text())*1000);
							progReserve(start, end, xml.find('eventID').text());

							if (data.action == 'reserve'){
								var recmode = xml.find('recMode').text();
								var overlapmode = xml.find('overlapMode').text();

								var mode = '';
								if (recmode == 5){//無効
									mode = 'disabled';
								}else if (overlapmode == 1){//チューナー不足
									mode = 'partially';
								}else if (overlapmode == 2){//一部録画
									mode = 'shortage';
								}

								var obj = $('.open input');
								var parents = $('.open');
								if (parents.hasClass('search')){//検索ページ向け
									obj = $('.open .search');
									parents = $('.open .flag').data('id', id);
									//スイッチ追加
									if (start < Date.now()){
										obj.removeClass().addClass('search recmark').empty();
										if (recmode != 5) obj.unbind('click');
									}else if (!obj.hasClass('addreserve')){
										var reserveid = 'reserve' + id;
										var label = $('<label>', {
											class: 'mdl-switch mdl-js-switch',
											for: reserveid,
											html: $('<input>', {
												id: reserveid,
												class: 'search addreserve mdl-switch__input',
												type: 'checkbox',
												checked: recmode != 5,
												change: function(){reserve($(this));}
											})
										});
										componentHandler.upgradeElement(label.get(0));

										var mark = $('<span>').html(label);
										parents.data('toggle', 1).data('oneclick', 0).html(mark);
										setTimeout(function(){
											parents.parent('tr').addClass('start');
											mark.addClass('recmark').empty();
										}, start-Date.now());
									}
								}
								parents.removeClass('disabled partially shortage').addClass(mode);
								if (recmode != 5){
									obj.prop('checked', true).parent().addClass('is-checked');
								}else{
									obj.prop('checked', false).parent().removeClass('is-checked');
								}
							}
						}else if (data.action == 'autoadd'){
							$('.open .keyword').text($('#andKey').val());
							$('.open .notkeyword').text($('#notKey').val());
							var count = $('#service option:selected').length-1;
							$('.open .servicelist').html($('#service option:selected:first').text().replace(/^\(.*\)\s/g, '')+(count>0 ? '<small>.他'+count+'ch' : ''));
							count = $('#contentList option:selected').length;
							$('.open .category').html( (count==0 ? '全ジャンル' : $('#contentList option:selected:first').text()+(count>1 ? '<small>.他'+(count-1)+'ch' : '')) );
							$('.open .mode').text($('[name=recMode] option:selected').text());
						}else if (data.action == 'del'){
							setDefault(true);
							if ($('.open').hasClass('reserve')){
								$('.open.reserve').remove();
								$('#sidePanel, .close_info.mdl-layout__obfuscator').removeClass('is-visible');
							}
						}else if (data.action == 'close'){
							$('#actions').remove();
							//window.close();
						}
					}
				}else{
					errMessage(xml);
				}
				showSpinner();
			}
		});
	});

	$('.delPreset').click(function(){
		delPreset(this);
	});
	$('.addPreset').click(function(){
		$(this).before(recFolderInfo($(this).prevAll().length+1, {recFolder: '', writePlugIn: 'Write_Default.dll', recNamePlugIn: ''}, $(this).hasClass('partial')));

		componentHandler.upgradeDom();
	});

	//入力チェック
	$('form').on('input', function () {
		$('[data-form="#'+$(this).attr('id')+'"]').attr('disabled', !this.checkValidity());
	});
});
