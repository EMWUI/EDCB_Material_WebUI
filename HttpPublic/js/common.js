var defRecSetting, PresetList, ReserveAutoaddList;
var isTouch = navigator.platform.indexOf("Win") != 0  && ('ontouchstart' in window);
if (isTouch){
	document.write('<link href="' + path + 'css/touch.css" rel="stylesheet" type="text/css">');
}else{
	document.write('<link href="' + path + 'css/pc.css" rel="stylesheet" type="text/css">');
}

function showSpinner(visible){
	if (visible){
		$('#spinner').addClass('is-visible').children().addClass('is-active');
	}else{
		$('#spinner').removeClass('is-visible').children().removeClass('is-active');
	}
}

//予約一覧
function rec(){
	var date = new Date().getTime();
	$('tr').each(function(){
		var obj = $(this);
		if (!obj.hasClass('start') && obj.data('start') < date){
			obj.addClass('start').children('.flag').children('span').empty().addClass('recmark');
		}else if (obj.data('end') < date){
			obj.remove();
		}
	});
}

//検索バー表示
function saerchbar(){
	$('main').on('scroll', function(){
		if ($('main').scrollTop() > 0){
			$('.serch-bar').removeClass('scroll');
			$('main').addClass('serch-bar');
		}else{
			$('.serch-bar').addClass('scroll');
			$('main').removeClass('serch-bar');
		}
	});
}

//タブ移動
function tab(tab){
	if (tab.length > 0){
		var panel = tab.attr('href');
		if (tab.hasClass('mdl-layout__tab')){
			$('.mdl-layout__tab, .mdl-layout__tab-panel').removeClass('is-active');
			$('main').scrollTop(0);
		}else{
			$('.mdl-tabs__tab, .mdl-tabs__panel').removeClass('is-active');
		}
		tab.addClass('is-active');
		$(panel).addClass('is-active');
		if (panel == '#movie' && !$('video').data('load')){
			$('video').load().data('load', true);
		}
	}
}

function delPreset(obj){
	obj = $(obj).parent().addClass('hidden');
	var target = obj.next();
	obj.appendTo('body');
	var clear = setTimeout(function(){obj.remove();}, 2500);
	var data = {
		message: '削除しました',
		timeout: 2000,
		actionHandler: function(){
			clearInterval(clear);
			obj.insertBefore(target).removeClass('hidden');
			$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: '元に戻しました'})
		},
    	actionText: '元に戻す'
	};
	$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar(data);
}

//通知バッチ
function badgeNotify(i){
	i = i ? 1 : -1;
	var count = Number($('#notification i').attr('data-badge')) + i;
	if (count == 0){
		$('#notification i').removeClass('mdl-badge').text('notifications_none');
		$('#noNotify').show();
	}else{
		$('#notification i').addClass('mdl-badge').text('notifications');
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
		list.push({onid: data.onid, tsid: data.tsid, sid: data.sid, eid: data.eid, start: data.start, title: data.title, name: data.name});
	}

	localStorage.setItem('notifications', JSON.stringify(list));
}
//通知リスト削除
function delNotify(notify, data, noSnack){
	badgeNotify();
	saveNotify(data, true);

	$('.eid_' + data.eid + ' .notify_icon').remove();
	$('.notify_'+data.eid).data('notification', false).children().text('add_alert');

	if (!noSnack) $('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: '削除しました'});
}

//通知登録
var NotifySound = $('<audio src="' + path + 'video/notification.mp3">')[0];
NotifySound.volume = 0.2;
function creatNotify(notify, data, save){
	var notification = $('.mdl-js-snackbar').get(0);
	var notifyList;
	var notifyIcon = $('<div class="notify_icon"><i class="material-icons">notifications_active</i></div>');
	var timeout = data.start*1000 - new Date().getTime() - 30*1000;

	badgeNotify(true);

	//リストを保存
	if (save){
		saveNotify(data);

		notification.MaterialSnackbar.showSnackbar({message: '追加しました'});
	}

	var timer = setTimeout(function(){
		delNotify(notify, data, true);
		notifyIcon.remove();
		notifyList.remove();
		notify.children().text('notifications');

		$.get(root + 'api/GetEventInfo', data, function(result, textStatus, xhr){
			var xml = $(xhr.responseXML);
			var title = xml.find('event_name').text();
			var options = {
				body: xml.find('startTime').text().match(/(\d+:\d+):\d+/)[1] + '～ ' + xml.find('service_name').text() + '\n' + xml.find('event_text').text(),
				tag: data.onid + '-' + data.tsid + '-' + data.sid + '-' + data.eid,
				icon: 'img/apple-touch-icon.png'
			};

			var notification = new Notification(title, options);

			notification.onclick = function(event){
				event.preventDefault();
				window.open('epginfo.html?onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + '&eid=' + data.eid, '_blank');
				notification.close();
			};

			NotifySound.play(); //Notification.soundはどこも未対応

			//通知を閉じる
			setTimeout(function(){
				notification.close();
			}, 15*1000);
		});
	}, timeout);

	$('.eid_' + data.eid + ' .startTime').after(notifyIcon);
	$('.notify_'+data.eid).data('notification', true).click(function(){
		clearTimeout(timer);
		notifyList.remove();
	}).children().text('notifications_off');

	$('#noNotify').hide();

	var date = new Date(data.start*1000);
	var week = ['日', '月', '火', '水', '木', '金', '土'];
	date = ('0'+(date.getMonth()+1)).slice(-2) + '/' + ('0'+date.getDate()).slice(-2) + '(' + week[date.getDay()] + ') ' + ('0'+date.getHours()).slice(-2) + ':' + ('0'+date.getMinutes()).slice(-2);

	notifyList = $('<li>', {class: 'mdl-list__item mdl-list__item--two-line', data: {start: data.start}, append: [
		$('<span>', {class: 'mdl-list__item-primary-content', click: function(){window.open('epginfo.html?onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + '&eid=' + data.eid, '_blank');}, append: [
			$('<span>', {html: data.title}),
			$('<span>', {class: 'mdl-list__item-sub-title', text: date + ' ' + data.name}) ]}),
		$('<span>', {class: 'mdl-list__item-secondary-content', append: [
			$('<button>', {
				class: 'mdl-list__item-secondary-action mdl-button mdl-js-button mdl-button--icon',
				html: $('<i>', {class: 'material-icons', text: 'notifications_off'}),
				click: function(){
					clearTimeout(timer);
					delNotify(notify, data);

					notifyList.remove();
					notifyIcon.remove();
					notify.data('notification', false).children().text('add_alert'); } }) ]}) ]});

	var done;
	$('#notifylist li').each(function(){
		//開始時間でソート
		if (data.start < $(this).data('start')){
			done = true;
			$(this).before(notifyList);
			return false;
		}
	});
	if (!done) $('#notifylist').append(notifyList);
}

//マクロ一覧表示
function macro(obj){
	$(obj).prevAll('input').addClass('is-active');
	$('#popup').addClass('is-visible');
}

//番組詳細を表示
function setEpgInfo(info, past){
	var onid = Number(info.find('ONID').first().text());
	var tsid = Number(info.find('TSID').first().text());
	var sid = Number(info.find('SID').first().text());
	var eid = Number(info.find('eventID').first().text());

	var startDate = info.find('startDate').text();
	var startTime = info.find('startTime').text();
	var start = new Date(startDate+' '+startTime);
	var endTime = start.getTime() + Number(info.find('duration').text())*1000;

	var genre = '';
	var video = '';
	var audio = '';
	var other = '';
	info.find('contentInfo').each(function(){
		genre = genre + '<li>' + $(this).find('component_type_name').text();
	});
	info.find('videoInfo').each(function(){
		video = video + '<li>' + info.find('videoInfo').find('component_type_name').text() + ' ' + $(this).find('videoInfo').find('text').text();
	});
	info.find('audioInfo').each(function(){
		audio = audio + '<li>'+ $(this).find('component_type_name').text() + ' '+ $(this).find('text').text() + '<li>サンプリングレート : ' + {1:'16',2:'22.05',3:'24',5:'32',6:'44.1',7:'48'}[$(this).find('sampling_rate').text()] + 'kHz';
	});
	if (onid<0x7880 || 0x7FE8<onid){
		if (info.find('freeCAFlag').first().text() == 0){
			other = '<li>無料放送';
		}else{
			other = '<li>有料放送';
		}
	}

	endTime = new Date(endTime);

	if (endTime>new Date()){
		$('#sidePanel .mdl-tabs__tab-bar').show();
		$('#sidePanel .mdl-dialog__actions').show();
	}else{
		$('#sidePanel .mdl-tabs__tab-bar').hide();
		$('#sidePanel .mdl-dialog__actions').hide();
	}

	var title = info.find('event_name').length > 0 ? info.find('event_name').text() : info.find('title').text() ;
	$('#title').html(title.replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g,'<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>'));
	$('#sidePanel_date').html(startDate+' '+startTime.match(/(\d+:\d+):\d+/)[1] + '～' + ('0'+endTime.getHours()).slice(-2) + ':' + ('0'+endTime.getMinutes()).slice(-2));
	$('#service').html(info.find('service_name').text());
	$('#links').html($('.open .links a').clone(true));
	$('#summary p').html(info.find('event_text').text().replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1" target="_blank">$1</a> ').replace(/\n/g,'<br>'));
	$('#ext').html(info.find('event_ext_text').text().replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1" target="_blank">$1</a> ').replace(/\n/g,'<br>'));
	$('#genreInfo').html(genre);
	$('#videoInfo').html(video);
	$('#audioInfo').html(audio);
	$('#otherInfo').html(other +
		'<li>OriginalNetworkID:' + onid + '(0x' + ('000'+onid.toString(16).toUpperCase()).slice(-4) + ')' +
		'<li>TransportStreamID:' + tsid + '(0x' + ('000'+tsid.toString(16).toUpperCase()).slice(-4) + ')' +
		'<li>ServiceID:'         + sid  + '(0x' + ('000'+ sid.toString(16).toUpperCase()).slice(-4) + ')' +
		'<li>EventID:'           + eid  + '(0x' + ('000'+ eid.toString(16).toUpperCase()).slice(-4) + ')' );

	$('[name=onid]').val(onid);
	$('[name=tsid]').val(tsid);
	$('[name=sid]').val(sid);
	$('[name=eid]').val(eid);

	$('#startDate').val(startDate);
	$('#startTime').val(startTime);
	$('#endTime').val(('0'+endTime.getHours()).slice(-2) + ':' + ('0'+endTime.getMinutes()).slice(-2) + ':' + ('0'+endTime.getSeconds()).slice(-2));

	$('#epginfo').attr('href', 'epginfo.html?onid=' + onid + '&tsid=' + tsid + '&sid=' + sid + (past ? '&startTime=' + past : '&eid=' + eid));
}

function getEpgInfo(target, data, past){
	showSpinner(true);
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
	$('[href="#recset"], #recset, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$('[href="#detail"], #detail').addClass('is-active');
	target.addClass('open');
	$('.sidePanel-content').scrollTop(0);
	var id;
	if (target.hasClass('cell')){
		id = target.find('.addreserve').data('id');
	}else{
		id = target.children('.flag').data('id');
	}

	$.ajax({
		url: root + 'api/GetEventInfo',
		data: data,
		success: function(result, textStatus, xhr){
			var xml = $(xhr.responseXML);
			if (id){
				function searchReserve(){
					var done;
					ReserveAutoaddList.find('reserveinfo').each(function(){
						if (id == $(this).find('ID').text()){
							done=true;
							if ($(this).find('eventID').text() == 65535){
								//プログラム予約向け
								setEpgInfo($(this));
								$('#epginfo').attr('href', 'reserveinfo.html?id=' + id);
								$('[href="#detail"], #detail').removeClass('is-active');
								$('[href="#recset"], #recset').addClass('is-active');
							}else{
								setEpgInfo(xml, past);
							}

							$('#set').attr('action', root + 'api/ReserveChg?id='+id);
							$('#del').attr('action', root + 'api/ReserveDel?id='+id);
							$('#progres').attr('action', root + 'api/ReserveChg?id='+id);
							$('#reserved, #delreseved, #toprogres').show();
							$('[name=presetID]').data('reseveid', id).val(65535);
							$('#reserve').text('変更');

							setRecSettting($(this));

							$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');

							return false;
						}
					});
					if (!done){
						if (xml.find('eventinfo').length > 0){
							setEpgInfo(xml, past);
							setDefault(true);
							$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
						}

						$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: 'Error : 予約が見つかりませんでした'});
					}

					showSpinner();
				}

				$.get(root + 'api/Common', {notify: 2}, function(result, textStatus, xhr){
					var Count = $(xhr.responseXML).find('info').text();
					if(ReserveAutoaddList && Count == notifyCount){
						searchReserve();
					}else{
						notifyCount = Count;
						sessionStorage.setItem('notifyCount', notifyCount);
						$.get(root + 'api/EnumReserveInfo', function(result, textStatus, xhr){
							ReserveAutoaddList = $(xhr.responseXML);
							searchReserve();
						});
					}
				});
			}else if (xml.find('eventinfo').length > 0){
					setEpgInfo(xml, past);
					setDefault();

					$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
					showSpinner();
			}else{
				$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: 'Error : ' + xml.find('err').text()});
				showSpinner();
			}
		}
	});
}

//EGP予約をセット
function setAutoAdd(target){
	showSpinner(true);
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
	$('[href="#recset"], #recset, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$('[href="#detail"], #detail').addClass('is-active');
	target.addClass('open');
	$('.sidePanel-content').scrollTop(0);

	function searchAutoadd(){
		var done;
		ReserveAutoaddList.find('recpresetinfo').each(function(){
			var id = target.data('id');
			if ($(this).find('id').text() == id){
				done=true;
				$('#set').attr('action', root + 'api/AutoAddEPGAddChgKey?id='+id);
				$('#del').attr('action', root + 'api/AutoAddEPGDelKey?id='+id);
				$('#epginfo').attr('href', 'autoaddepginfo.html?id='+id);

			    if ($(this).find('disableFlag').text() == 1){
			        $('#disable').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#disable').prop('checked', false).parent().removeClass('is-checked');
			    }
				$('#andKey').val($(this).find('andKey').text());
				$('#notKey').val($(this).find('notKey').text());
			    if ($(this).find('regExpFlag').text() == 1){
			        $('#reg').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#reg').prop('checked', false).parent().removeClass('is-checked');
			    }
			    if ($(this).find('aimaiFlag').text() == 1){
			        $('#aimai').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#aimai').prop('checked', false).parent().removeClass('is-checked');
			    }
			    if ($(this).find('titleOnlyFlag').text() == 1){
			        $('#titleOnly').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#titleOnly').prop('checked', false).parent().removeClass('is-checked');
			    }
			    var contentList=[];
		        $(this).find('contentList').each(function(){
		        	contentList.push($(this).find('content_nibble').text());
		        });
			    $('#contentList').val(contentList);
			    if ($(this).find('notContetFlag').text() == 1){
			        $('#notcontet').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#notcontet').prop('checked', false).parent().removeClass('is-checked');
			    }
			    var service=[];
		        $(this).find('serviceList').each(function(){
		        	service.push($(this).find('onid').text()+'-'+$(this).find('tsid').text()+'-'+$(this).find('sid').text());
		        });
			    $('#service').val(service);
				$('#dateList_select,#dateList_touch').empty();
				$('[name=dateList]').val('');
		        $(this).find('dateList').each(function(){
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
			    if ($(this).find('notDateFlag').text() == 1){
			        $('#notdate').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#notdate').prop('checked', false).parent().removeClass('is-checked');
			    }
			    $('[name=freeCAFlag]').val($(this).find('freeCAFlag').text());
				$('#DurationMin').val($(this).find('chkDurationMin').text());
				$('#DurationMax').val($(this).find('chkDurationMax').text());
			    if ($(this).find('chkRecEnd').text() == 1){
			        $('#chkRecEnd').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#chkRecEnd').prop('checked', false).parent().removeClass('is-checked');
			    }
			    if ($(this).find('chkRecNoService').text() == 1){
			        $('#chkRecNoService').prop('checked', true).parent().addClass('is-checked');
			    }else{
			        $('#chkRecNoService').prop('checked', false).parent().removeClass('is-checked');
			    }
				$('#chkRecDay').val($(this).find('chkRecDay').text());
				$('[name=presetID]').data('autoaddid', id).val(65535);

				setRecSettting($(this));

				$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
				showSpinner();

				return false;
			}
		});
		if (!done){
			$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: 'Error : 見つかりませんでした'});
			showSpinner();
		}
	}

	$.get(root + 'api/Common', {notify: 4}, function(result, textStatus, xhr){
		var Count = $(xhr.responseXML).find('info').text();
		if(ReserveAutoaddList && Count == notifyCount){
			searchAutoadd();
		}else{
			notifyCount = Count;
			sessionStorage.setItem('notifyCount', notifyCount);
			$.get(root + 'api/EnumAutoAdd', function(result, textStatus, xhr){
				ReserveAutoaddList = $(xhr.responseXML);
				searchAutoadd();
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

	$.get(root + 'api/GetRecInfo?id='+target.data('recinfoid'), function(result, textStatus, xhr){
		var xml = $(xhr.responseXML);
		if (xml.find('recinfo').length > 0){
			var onid = Number(xml.find('ONID').first().text());
			var tsid = Number(xml.find('TSID').first().text());
			var sid = Number(xml.find('SID').first().text());
			var eid = Number(xml.find('eventID').first().text());

			var startDate = xml.find('startDate').text();
			var startTime = xml.find('startTime').text();
			var endTime = new Date(new Date(startDate+' '+startTime).getTime() + Number(xml.find('duration').text())*1000);

			$('#title').html(xml.find('title').text().replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g,'<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>'));
			$('#sidePanel_date').html(startDate+' '+startTime.match(/(\d+:\d+):\d+/)[1] + '～' + ('0'+endTime.getHours()).slice(-2) + ':' + ('0'+endTime.getMinutes()).slice(-2));
			$('#service').html(xml.find('service_name').text());

			$('#comment').text(xml.find('comment').text());
			$('#drops').text('ドロップ '+xml.find('drops').text());
			$('#scrambles').text('スクランブル '+xml.find('scrambles').text());

			if (xml.find('programInfo').text().length>0){
				var programInfo=xml.find('programInfo').text().match(/^[\s\S]*?\n\n([\s\S]*?)\n+(?:詳細情報\n)?([\s\S]*?)\n+ジャンル : \n([\s\S]*)\n\n映像 : ([\s\S]*)\n音声 : ([\s\S]*?)\n\n([\s\S]*)\n$/);
				$('#summary p').text(programInfo[1].replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1" target="_blank">$1</a> ').replace(/\n/g,'<br>'));
				$('#ext').html(programInfo[2].replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1" target="_blank">$1</a> ').replace(/\n/g,'<br>'));
				$('#genreInfo').html('<li>'+programInfo[3].replace(/\n/g,'</li><li>')+'</li>');
				$('#videoInfo').html('<li>'+programInfo[4].replace(/\n/g,'</li><li>')+'</li>');
				$('#audioInfo').html('<li>'+programInfo[5].replace(/\n/g,'</li><li>')+'</li>');
				$('#otherInfo').html('<li>'+programInfo[6].replace(/\n\n/g,'\n').replace(/\n/g,'</li><li>')+'</li>');
			}else{
				$('#summary p, #ext, #genreInfo, #videoInfo, #audioInfo, #otherInfo').html('');
			}

			$('pre').text(xml.find('errInfo').text());

			$('#epginfo').attr('href', 'recinfodesc.html?id=' + xml.find('id').first().text());

			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
			showSpinner();
		}else{
			$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: 'Error : ' + xml.find('err').text()});
			showSpinner();
		}
	});
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
        $('.smode').find('.mdl-checkbox').addClass('is-disabled').removeClass('is-checked').find('input').prop('checked', false).prop('disabled', true);
    }else{
        $('[name=serviceMode]').prop('checked', false).parent().removeClass('is-checked');
        $('.smode').find('.mdl-checkbox').removeClass('is-disabled').find('input').prop('disabled', false);

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
    var batFilePath = recset.children('batFilePath').text();

    var div = '<div>';
    var cell = 'mdl-cell';
    var container = 'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing';
    var select = 'mdl-cell pulldown mdl-grid mdl-grid--no-spacing';
    var textfield = 'mdl-cell mdl-textfield mdl-js-textfield';
    var delbtn = 'delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button';
    var middle = 'mdl-cell mdl-cell--middle';
    $('.preset').remove();
    if ($('#preset').data('lfs')){
        if ($('[name="batFilePath"] option[value="' + batFilePath.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&') + '"]').length == 0){
            $('[name="batFilePath"]').append($('<option>', {value: batFilePath, text: batFilePath}));
        }
        $('[name="batFilePath"]').val(batFilePath);
        var recFolderList = recset.children('recFolderList');
        if (recFolderList.text().length > 0){
            $(recFolderList).children('recFolderInfo').each(function(i){
                var recFolder = $(this).children('recFolder').text();
                var writePlugIn = $(this).children('writePlugIn').text();
                var recNamePlugIn = $(this).children('recNamePlugIn').text();
                var recNamePlugInoption;

                if ($('#preset').data('option')){
                    recNamePlugIn = $(this).children('recNamePlugIndll').text();
                    recNamePlugInoption = $(this).children('recNamePlugInoption').text();

                    recNamePlugInoption = $(div, {class: container, append: [
                        $(div, {class: middle, text: 'オプション'}),
                        $(div, {class: textfield, append: [
                            $('<input>', {class: 'has-icon mdl-textfield__input', type: 'text', name: 'recName', value: recNamePlugInoption, id: 'recName'+i}),
                            $('<label>', {class: 'mdl-textfield__label', for: 'recName'+i, text: 'ファイル名PlugIn'}),
                            $('<i>', {class: 'addmacro material-icons', text: 'add', click: function(){macro(this);} }) ]}) ]});
                }

                $('#preset .addPreset').before(
                    $(div, {class: 'preset '+container, append: [
                        $(div, {class: delbtn, click: function(){delPreset(this);}, html:
                                $('<i>', {class: 'material-icons', text: 'delete'}) }),
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: 'フォルダ'}),
                            $(div, {class: cell, text: recFolder}),
                            $('<input>', {class: 'recFolderList', type: 'hidden', name: 'recFolder', value: recFolder}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: middle, text: '出力PlugIn'}),
                            $(div, {class: select, html:
                                    $('<select>', {name: 'writePlugIn', html:
                                                   $('#Write').html(), val: writePlugIn})}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: middle, text: 'ファイル名PlugIn'}),
                            $(div, {class: select, html:
                                    $('<select>', {name: 'recNamePlugIn', html:
                                                   $('#RecName').html(), val: recNamePlugIn})}) ]}),
                        recNamePlugInoption ]}) );
            });
        }
        //部分受信プリセット
        var partialRecFolder = recset.children('partialRecFolder');
        if (partialRecFolder.text().length > 0){
            $(partialRecFolder).children('recFolderInfo').each(function(i){
                var recFolder = $(this).children('recFolder').text();
                var writePlugIn = $(this).children('writePlugIn').text();
                var recNamePlugIn = $(this).children('recNamePlugIn').text();
                var recNamePlugInoption;

                if ($('#preset').data('option')){
                    recNamePlugIn = $(this).children('recNamePlugIndll').text();
                    recNamePlugInoption = $(this).children('recNamePlugInoption').text();

                    recNamePlugInoption = $(div, {class: container, append: [
                        $(div, {class: middle, text: 'オプション'}),
                        $(div, {class: textfield, append: [
                            $('<input>', {class: 'has-icon mdl-textfield__input', type: 'text', name: 'partialrecName', value: recNamePlugInoption, id: 'partialrecName'+i}),
                            $('<label>', {class: 'mdl-textfield__label', for: 'partialrecName'+i, text: 'ファイル名PlugIn'}),
                            $('<i>', {class: 'addmacro material-icons', text: 'add', click: function(){macro(this);} }) ]}) ]});
                }

                $('#partialpreset .addPreset').before(
                    $(div, {class: 'preset '+container, append: [
                        $(div, {class: delbtn, click: function(){delPreset(this);}, html:
                                $('<i>', {class: 'material-icons', text: 'delete'}) }),
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: 'フォルダ'}),
                            $(div, {class: cell, text: recFolder}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: middle, text: '出力PlugIn'}),
                            $(div, {class: select, html:
                                    $('<select>', {name: 'partialwritePlugIn', html:
                                                   $('#Write').html(), val: writePlugIn})}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: middle, text: 'ファイル名PlugIn'}),
                            $(div, {class: select, html:
                                    $('<select>', {name: 'partialrecNamePlugIn', html:
                                                   $('#RecName').html(), val:recNamePlugIn})}) ]}),
                        recNamePlugInoption ]}) );
            });
        }
    }else{
        var recFolderList = recset.children('recFolderList');

        $('#preset').append(
            $(div, {class: 'preset '+container, append: [
                $(div, {class: container, append: [
                    $(div, {class: cell, text: '録画後実行bat'}),
                    $(div, {class: cell, text: (batFilePath != '' ? batFilePath : '－')}),
                    $('<input>', {type: 'hidden', name: 'batFilePath', value: batFilePath}) ]}) ]}) );

        if (recFolderList.text().length > 0){
            $(recFolderList).children('recFolderInfo').each(function(i){
                var recFolder = $(this).children('recFolder').text();
                var writePlugIn = $(this).children('writePlugIn').text();
                var recNamePlugIn = $(this).children('recNamePlugIn').text();
                var recNamePlugInoption;

                if ($('#preset').data('option') && recNamePlugIn != ''){
                    recNamePlugIn = $(this).children('recNamePlugIndll').text();
                    recNamePlugInoption = $(this).children('recNamePlugInoption').text();

                    recNamePlugInoption = $(div, {class: container, append: [
                        $(div, {class: middle, text: 'オプション'}),
                        $(div, {class: textfield, append: [
                            $('<input>', {class: 'mdl-textfield__input', type: 'text', name: 'recName', value: recNamePlugInoption, id: 'recName'+i}),
                            $('<label>', {class: 'mdl-textfield__label', for: 'recName'+i, text: 'ファイル名PlugIn'}),
                            $('<i>', {class: 'addmacro material-icons', text: 'add', click: function(){macro(this);} }) ]}) ]});
                }

                $('#preset').append(
                    $(div, {class: 'preset '+container, append: [
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: 'フォルダ'}),
                            $(div, {class: cell, text: recFolder}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: '出力PlugIn'}),
                            $(div, {class: cell, text: writePlugIn}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: 'ファイル名PlugIn'}),
                            $(div, {class: cell, text: (recNamePlugIn != '' ? recNamePlugIn : '－')}) ]}).
                        recNamePlugInoption,
                        $('<input>', {type: 'hidden', name: 'recFolder', value: recFolder}),
                        $('<input>', {type: 'hidden', name: 'writePlugIn', value: writePlugIn}),
                        $('<input>', {type: 'hidden', name: 'recNamePlugIn', value: recNamePlugIn}) ]}) );
            });
        }else{
            $('#preset').append(
                $(div, {class: 'preset '+container, append: [
                    $(div, {class: container, append: [
                        $(div, {class: cell, text: 'フォルダ'}),
                        $(div, {class: cell, text: '－'}) ]}),
                    $(div, {class: container, append: [
                        $(div, {class: cell, text: '出力PlugIn'}),
                        $(div, {class: cell, text: '－'}) ]}),
                    $(div, {class: container, append: [
                        $(div, {class: cell, text: 'ファイル名PlugIn'}),
                        $(div, {class: cell, text: '－'}) ]}) ]}) );
        }

        //部分受信プリセット
        var partialRecFolder = recset.children('partialRecFolder');
        if (partialRecFolder.text().length > 0){
            $(partialRecFolder).children('recFolderInfo').each(function(i){
                var recFolder = $(this).children('recFolder').text();
                var writePlugIn = $(this).children('writePlugIn').text();
                var recNamePlugIn = $(this).children('recNamePlugIn').text();
                var recNamePlugInoption;

                if ($('#preset').data('option') && recNamePlugIn != ''){
                    recNamePlugIn = $(this).children('recNamePlugIndll').text();
                    recNamePlugInoption = $(this).children('recNamePlugInoption').text();

                    recNamePlugInoption = $(div, {class: container, append: [
                        $(div, {class: middle, text: 'オプション'}),
                        $(div, {class: textfield, append: [
                            $('<input>', {class: 'mdl-textfield__input', type: 'text', name: 'partialrecName', value: recNamePlugInoption, id: 'recName'+i}),
                            $('<label>', {class: 'mdl-textfield__label', for: 'recName'+i, text: 'ファイル名PlugIn'}),
                            $('<i>', {class: 'addmacro material-icons', text: 'add', click: function(){macro(this);} }) ]}) ]});
                }

                $('#partialpreset').append(
                    $(div, {class: 'preset '+container, append: [
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: 'フォルダ'}),
                            $(div, {class: cell, text: recFolder}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: '出力PlugIn'}),
                            $(div, {class: cell, text: writePlugIn}) ]}),
                        $(div, {class: container, append: [
                            $(div, {class: cell, text: 'ファイル名PlugIn'}),
                            $(div, {class: cell, text: (recNamePlugIn != '' ? recNamePlugIn : '－')}) ]}),
                        recNamePlugInoption,
                        $('<input>', {type: 'hidden', name: 'partialrecFolder', value: recFolder}),
                        $('<input>', {type: 'hidden', name: 'partialwritePlugIn', value: writePlugIn}),
                        $('<input>', {type: 'hidden', name: 'partialrecNamePlugIn', value: recNamePlugIn}) ]}) );
            });
        }else{
            $('#partialpreset').append(
                $(div, {class: 'preset '+container, append: [
                    $(div, {class: container, append: [
                        $(div, {class: cell, text: 'フォルダ'}),
                        $(div, {class: cell, text: '－'}) ]}),
                    $(div, {class: container, append: [
                        $(div, {class: cell, text: '出力PlugIn'}),
                        $(div, {class: cell, text: '－'}) ]}),
                    $(div, {class: container, append: [
                        $(div, {class: cell, text: 'ファイル名PlugIn'}),
                        $(div, {class: cell, text: '－'}) ]}) ]}) );
        }
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
    function getDefault(){
        PresetList.find('recpresetinfo').each(function(){
            if ($(this).find('id').text() == '0'){
                defRecSetting = $(this);
                return false;
            }
        });
        setDefault(mark);
    }

	if (defRecSetting){
		setRecSettting(defRecSetting);

		$('#set').attr('action', root + 'api/ReserveAdd');
		$('#reserved, #delreseved, #toprogres').hide();
		$('[name=presetID]').val(0);
		$('#reserve').text('予約追加');

		if (mark){
			$('.open .mark.reserve').remove();
			$('.open .addreserve').removeData('id').text('予約追加');
			$('.open .reserve').removeClass('reserve disabled partially shortage view');
		}
	}else{
		if (PresetList){
			getDefault();
		}else{
			$.get(root + 'api/EnumRecPreset', function(result, textStatus, xhr){
				PresetList = $(xhr.responseXML);
				getDefault();
			});
		}
	}
}

//録画マーク追加
function addMark(xml, target, content){
	var recmode = xml.find('recMode').text();
	var overlapmode = xml.find('overlapMode').text();
	var id = xml.find('ID').text();
	var messege, button, mark;

	if (recmode == 5){
		messege = '予約を無効にしました';
		button = '有効';
		recmode = 'disabled';
		mark = '無';
	}else{
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
			mark = '録';
		}
	}
	target.data('id', id).text(button);
	content.not('.reserve').find('.startTime').after('<span class="mark reserve"></span>');
	content.removeClass('disabled partially shortage view').addClass('reserve ' + recmode).find('.mark.reserve').text(mark);

	return messege;
}

$(function(){
	var notification = $('.mdl-js-snackbar').get(0);

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
		if (!$(e.target).is('.flag, .flag *, .count li')){
			if ($(this).data('onid')){
				getEpgInfo($(this), $(this).data());
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
	//検索ページ用
	$('[data-search]').click(function(e){
		if (!$(e.target).is('.flag, .flag *')){
			if ($('#advanced').prop('checked')) $('#hidden').append( $('<input>', { type: 'hidden', name: 'advanced', value: '1' }) );
			$('#hidden').attr('action', $(this).data('search')).submit();
		}
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

	//再生タブ
	$('.mdl-layout__tab').click(function(){
		$('main').scrollTop(0);
		if ($(this).hasClass('play') && !$('video').data('load')){
			loadMovie($('#video'));
			$('#video').load().data('load', true);
			$('#volume').get(0).MaterialSlider.change(localStorage.getItem('volume'));
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
					var now = new Date().getTime();
					var start = data.start*1000;
					if (start < now){
						//時間が過ぎてたらリストから削除
						saveNotify(data, true);
					}else{
						var notify = $('.start_' + data.start/10 + ' .notify_' + data.eid);
						creatNotify(notify, data);
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
		var timeout = $('.notify').data('start')*1000 - new Date().getTime() - 30*1000;
		setTimeout(function(){
			$('.notify').attr('disabled', true).children().text('notifications');
		}, timeout);
	}
	$('h4 .notify').click(function(){
		var notify = $(this);
		if (!notify.attr('disabled')){
			var data = notify.data();
			if (data.notification){
				//登録済み通知削除
				delNotify(notify, data);
			}else{
				data.title = notify.prevAll('.title').html();

				creatNotify(notify, data, true);
			}
		}
	});

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
		$('#dateList_select').append('<option value="' + time.startDayOfWeek + '-' + time.startHour + ':' + time.startMin + '-' + time.endDayOfWeek + '-' + time.endHour + ':' + time.endMin + '">' + time.startDayOfWeek + ' ' + time.startHour + ':' + time.startMin + ' ～ ' + time.endDayOfWeek + ' ' + time.endHour + ':' + time.endMin + '</otion>');
	}
	$('#add_dateList').click(function(){
		var time = {
			startMin: $('#startMin').val(),
			startHour: $('#startHour').val(),
			endHour: $('#endHour').val(),
			endMin: $('#endMin').val()
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
	$(window).on('load resize', function(){
		if (window.innerWidth < 700 && !$('#dateList_edit').hasClass('is-visible')){
			$('#add_dateList').prop('disabled', true);
		}else{
			$('#add_dateList').prop('disabled', false);
		}
	});

	//マクロ補助
	$(window).on('load resize', function(){
		if ($(window).width() > 700){
			$('.shrink-phone').show();
			$('.check-shrink-phone').prop('checked', true);
			$('.drawer-separator.mdl-cell--hide-desktop').hide();
		}else{
			$('.shrink-phone').hide();
			$('.check-shrink-phone').prop('checked', false);
			$('.drawer-separator.mdl-cell--hide-desktop').show();
		}
	});
	$('.addmacro').click(function(){
		macro(this);
	});
	$('.close.macro').click(function(){
		$('input.is-active').removeClass('is-active');
		$('#popup').removeClass('is-visible');
	});
	$('.macro-item').click(function(){
		var elem = $('input.is-active').get(0);
		var start = elem.selectionStart;
		var end = elem.selectionEnd;
		var def = $('input.is-active').val();
		var val = def.substr(0, start) + $(this).data('macro') + def.substr(end, def.length);
		$('input.is-active').val(val).removeClass('is-active').parent().addClass('is-dirty');
		$('#popup').removeClass('is-visible');
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
		$('#search').append('<input type="hidden" name="save" value="1">').attr('action', 'search.html?preset='+$('#preset_name').val()).submit();
	});



	//録画設定
	//プリセット読み込み
	$('[name=presetID]').change(function(){
		function searchReserve(list, id, tag, tagid){
			var messege;
			list.find(tag).each(function(){
				if ($(this).find(tagid).text() == id){
					var name = setRecSettting($(this));
					messege = '"' + name + '" を読み込みました';

					return false;
				}
			});
			if (!messege) messege = 'プリセットの読み込に失敗しました';
			notification.MaterialSnackbar.showSnackbar({message: messege});
		}


 		var id;
 		var tag = 'recpresetinfo';
 		var tagid = 'id';

		if ($(this).val() != 65535){
			id = $(this).val();
			if (PresetList){
				searchReserve(PresetList, id, tag, tagid);
			}else{
				$.get(root + 'api/EnumRecPreset', function(result, textStatus, xhr){
					PresetList = $(xhr.responseXML);
					searchReserve(PresetList, id, tag, tagid);
				});
			}
		}else{
			var url;
			if ($(this).data('reseveid')){
				url = 'EnumReserveInfo';
				id = $(this).data('reseveid');
				tag = 'reserveinfo';
				tagid = 'ID';
			}else{
				url = 'EnumAutoAdd';
				id = $(this).data('autoaddid');
			}
			if (ReserveAutoaddList){
				searchReserve(ReserveAutoaddList, id, tag, tagid);
			}else{
				$.get(root + 'api/' + url, function(result, textStatus, xhr){
					ReserveAutoaddList = $(xhr.responseXML);
					searchReserve(ReserveAutoaddList, id, tag, tagid);
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
			$('.smode').find('.mdl-checkbox').addClass('is-disabled').removeClass('is-checked').find('input').prop('checked', false).prop('disabled', true);
		}else{
			$('.smode').find('.mdl-checkbox').removeClass('is-disabled').find('input').prop('disabled', false);
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

	//予約処理
	function reserve(obj){
		showSpinner(true);
		var url;
		var data = obj.parents('td').data();

		if (data.id){
			url = root + 'api/reservetoggle';
		}else{
			url = root + 'api/oneclickadd';
		}
		$.ajax({
			url: url,
			data: data,

			success: function(result, textStatus, xhr) {
				var xml = $(xhr.responseXML);
				if (xml.find('success').length > 0){
					var start = new Date(xml.find('startDate').text()+' '+xml.find('startTime').text()).getTime() < new Date();
					var recmode = xml.find('recMode').text();
					var overlapmode = xml.find('overlapMode').text();
					var id = xml.find('ID').text();

					var mode = '';
					if (recmode == 5){
						//無効
						mode = 'disabled';
					}else if (overlapmode == 1){
						//チューナー不足
						mode = 'partially';
					}else if (overlapmode == 2){
						//一部録画
						mode = 'shortage';
					}

					var parents;
					//検索ページ向け
					if (obj.hasClass('search')){
						parents = obj.parents('td');
						//スイッチ追加
						if (start){
							obj.removeClass().addClass('search recmark').empty().parent('td').data('id', id);
							if (recmode != 5) obj.unbind('click');
						}else if (!obj.hasClass('addreserve')){
							var reserveid = 'reserve' + id;
							var label = document.createElement('label');
							label.setAttribute('for', reserveid);
							label.className = 'mdl-switch mdl-js-switch';

							var input = document.createElement('input');
							input.id = reserveid;
							input.setAttribute('type', 'checkbox');
							input.setAttribute('checked', (recmode != 5 ? true : false));
							input.className = 'search addreserve mdl-switch__input';

							//予約イベント追加
							$(input).change(function(){
								reserve($(this));
							});

							label.appendChild(input);
							componentHandler.upgradeElement(label);

							var add = document.createElement('span');
							add.appendChild(label);
							obj.parent('td').data('id', id).html(add).parent('tr').data('start', xml.find('startTime').text()*1000);
						}
					}else{
						parents = obj.parents('tr');
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
					notification.MaterialSnackbar.showSnackbar({message: xml.find('err').text()});
				}
				showSpinner();
			}
		});
	}

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
		notification.MaterialSnackbar.showSnackbar({message: xhr.status + 'Error : ' + xhr.statusText});
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
					notification.MaterialSnackbar.showSnackbar({message: xml.find('success').text(), timeout: 1500});
					if (data.redirect){
						setTimeout('location.href="'+data.redirect+'";', 1500);
					}else if (data.submit){
						setTimeout('$("'+ data.submit +'").submit();', 1500);
					}else if (data.reload || form.hasClass('reload')){
						notification.MaterialSnackbar.showSnackbar({message: 'リロードします', timeout: 1000});
						setTimeout('location.reload()', 2500);
					}else if (data.action) {
						if (data.action == 'add' || data.action == 'reserve'){
							var id = xml.find('ID').text();

							$('#set').attr('action', root + 'api/ReserveChg?id='+id);
							$('#del').attr('action', root + 'api/ReserveDel?id='+id);
							$('#progres').attr('action', root + 'api/ReserveChg?id='+id);
							$('#reserved, #delreseved, #toprogres').show();
							$('[name=presetID]').data('reseveid', id).val(65535);
							$('#reserve').text('変更');

							addMark(xml, $('.open .addreserve'), $('.open .content'));

							var startDate = xml.find('startDate').text();
							var startTime = xml.find('startTime').text();
							var start = new Date(startDate+' '+startTime);
							var endTime = new Date(start.getTime() + Number(xml.find('duration').text())*1000);
							$('#startDate').val(startDate);
							$('#startTime').val(startTime);
							$('#endTime').val(('0'+endTime.getHours()).slice(-2) + ':' + ('0'+endTime.getMinutes()).slice(-2) + ':' + ('0'+endTime.getSeconds()).slice(-2));

						    if (data.action == 'reserve'){
								var start = new Date(xml.find('startDate').text()+' '+xml.find('startTime').text()).getTime() < new Date();
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

								var parents;
								var obj = $('.open input');
								if ($('.open .search').length>0){//検索ページ向け
									var obj = $('.open  .search');
									parents = obj.parents('td');
									//スイッチ追加
									if (start){
										obj.removeClass().addClass('search recmark').empty().parent('td').data('id', id);
										if (recmode != 5) obj.unbind('click');
									}else if (!obj.hasClass('addreserve')){
										var reserveid = 'reserve' + id;
										var label = document.createElement('label');
										label.setAttribute('for', reserveid);
										label.className = 'mdl-switch mdl-js-switch';

										var input = document.createElement('input');
										input.id = reserveid;
										input.setAttribute('type', 'checkbox');
										input.setAttribute('checked', (recmode != 5 ? true : false));
										input.className = 'search addreserve mdl-switch__input';

										//予約イベント追加
										$(input).change(function(){
											reserve($(this));
										});

										label.appendChild(input);
										componentHandler.upgradeElement(label);

										var add = document.createElement('span');
										add.appendChild(label);
										obj.parent('td').data('id', id).html(add).parent('tr').data('start', xml.find('startTime').text()*1000);
									}
								}else{
									parents = obj.parents('tr');
								}
								parents.removeClass('disabled partially shortage').addClass(mode);
								if (recmode != 5 && obj.hasClass('mdl-switch__input')){
										obj.prop('checked', true).parent().addClass('is-checked');
								}else{
										obj.prop('checked', false).parent().removeClass('is-checked');
								}
							}
						}else if (data.action == 'autoadd'){
							$('.open .keyword').text($('#andKey').val());
							$('.open .notkeyword').text($('#notKey').val());
							var count = $('#service option:selected').length-1;
							$('.open .servicelist').html($('#service option:selected:first').text()+(count>0 ? '<small>.他'+count+'ch' : ''));
							count = $('#contentList option:selected').length;
							$('.open .category').html( (count==0 ? '全ジャンル' : $('#contentList option:selected:first').text()+(count>1 ? '<small>.他'+(count-1)+'ch' : '')) );
							$('.open .mode').text($('[name=recMode] option:selected').text());

							$.get(root + 'api/EnumAutoAdd', function(result, textStatus, xhr){
								ReserveAutoaddList = $(xhr.responseXML);
								searchReserve(ReserveAutoaddList);
							});
						}else if (data.action == 'del'){
							setDefault(true);
							if ($('.open').hasClass('epginfo')){
								$('#sidePanel, .close_info.mdl-layout__obfuscator').removeClass('is-visible');
								if ($('.open').hasClass('search')){
									$('.open .flag').removeClass('open').data('id',false).html($('<span>', {class:'search add mdl-button mdl-js-button mdl-button--fab mdl-button--colored',html:'<i class="material-icons">add</i>'}));
									$('.add').click(function(){reserve( $(this) );});
								}else{
									$('.open').remove();
								}
							}
						}else if (data.action == 'close'){
							$('#actions').remove();
							//window.close();
						}
					}
				}else{
					notification.MaterialSnackbar.showSnackbar({message: 'Error : ' + xml.find('err').text()});
				}
				showSpinner();
			}
		});
	});

	$('.delPreset').click(function(){
		delPreset(this);
	});
	$('.addPreset').click(function(){
		var div = '<div>';
		var cell = 'mdl-cell';
		var container = 'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing';
		var select = 'mdl-cell pulldown mdl-grid mdl-grid--no-spacing';
		var textfield = 'mdl-cell mdl-textfield mdl-js-textfield';
		var delbtn = 'delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button';
		var middle = 'mdl-cell mdl-cell--middle';
		var recNamePlugInoption;

		var partial = $(this).hasClass('partial') ? 'partial' : '';

		if ($('#preset').data('option')){
			recNamePlugIn = $(this).children('recNamePlugIndll').text();
			recNamePlugInoption = $(this).children('recNamePlugInoption').text();

			recNamePlugInoption = $(div, {class: container, append: [
				$(div, {class: middle, text: 'オプション'}),
				$(div, {class: textfield, append: [
					$('<input>', {class: 'has-icon mdl-textfield__input', type: 'text', name: partial+'recName', value: recNamePlugInoption, id: 'recName'}),
					$('<label>', {class: 'mdl-textfield__label', for: 'recName', text: 'ファイル名PlugIn'}),
					$('<i>', {class: 'addmacro material-icons', text: 'add', click: function(){macro(this);} }) ]}) ]});
		}

		$(this).before(
			$(div, {class: 'preset '+container, append: [
				$(div, {class: delbtn, click: function(){delPreset(this);}, html:
					$('<i>', {class: 'material-icons', text: 'delete'}) }),
				$(div, {class: container, append: [
					$(div, {class: cell, text: 'フォルダ'}),
					$(div, {class: cell, text: '!Default'}),
					$('<input>', {class: 'recFolderList', type: 'hidden', name: partial+'recFolder', value: ''}) ]}),
				$(div, {class: container, append: [
					$(div, {class: middle, text: '出力PlugIn'}),
					$(div, {class: select, html:
						$('<select>', {name: partial+'writePlugIn', html:
							$('#Write').html(), val: 'Write_Default.dll' }) }) ]}),
				$(div, {class: container, append: [
					$(div, {class: middle, text: 'ファイル名PlugIn'}),
					$(div, {class: select, html:
						$('<select>', {name: partial+'recNamePlugIn', html:
							$('#RecName').html() }) }) ]}),
				recNamePlugInoption ]}) );

		componentHandler.upgradeDom();
	});
});
