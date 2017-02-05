isTouch = navigator.platform.indexOf("Win") != 0  && ('ontouchstart' in window);
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

//プリセット取得
function getpreset(url){
	$.ajax({
		url: root + 'api/EnumRecPreset',
		success: function(result, textStatus, xhr){
			$('html').data('preset', xhr.responseXML);
		}
	});
	$.ajax({
		url: url,
		success: function(result, textStatus, xhr){
			$('html').data('xml', xhr.responseXML);
		}
	});
}

//タブ移動
function tab(tab){
	if (tab.length > 0){
		var panel = tab.attr('href');
		$('.mdl-layout__tab').removeClass('is-active');
		$('.mdl-layout__tab-panel').removeClass('is-active');
		$('main').scrollTop(0);
		tab.addClass('is-active');
		$(panel).addClass('is-active');
		if (panel == '#movie' && !$('video').data('load')){
			$('video').load().data('load', true);
		}
	}
}

function delPreset(obj){
	obj = $(obj).parent();
	obj.addClass('hidden');
	var remove = function(){obj.remove();};
	var clear = setTimeout(remove, 2500);
	var data = {
		message: '削除しました',
		timeout: 2000,
		actionHandler: function(){
			clearInterval(clear);
			obj.removeClass('hidden');
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
		delete data['upgraded'];
		delete data['notification'];

		list.push(data);
	}

	localStorage.setItem('notifications', JSON.stringify(list));
}
//通知リスト削除
function delNotify(notify, data, noSnack){
	badgeNotify();
	saveNotify(data, true);

	notify.parents('.content').find('.notify_icon').remove();
	notify.data('notification', false).children().text('add_alert');

	if (!noSnack) document.querySelector('.mdl-js-snackbar').MaterialSnackbar.showSnackbar({message: '削除しました'});
}

//通知登録
var NotifySound = $('<audio src="' + path + 'video/notification.mp3">')[0];
NotifySound.volume = 0.2;
function creatNotify(notify, data, save){
	var notification = document.querySelector('.mdl-js-snackbar');
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

	notify.parents('.mdl-layout-spacer').prev().append(notifyIcon);
	notify.click(function(){
		clearTimeout(timer);
		notifyList.remove();
	}).data('notification', true).children().text('notifications_off');

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

$(function(){
	var notification = document.querySelector('.mdl-js-snackbar');

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
	}

	//一覧の行をリンクに
	$('tr[data-href]').click(function(e){
		if (!$(e.target).is('.flag, .flag *, .count li')) window.location = $(this).data('href');
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

	//ダイアログ閉じ
	$('dialog .close').click(function(){
		document.querySelector('dialog').close();
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
						var notify = $('.start_' + data.start/10 + ' #notify_' + data.eid);
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
	function macro(obj){
		$(obj).prevAll('input').addClass('is-active');
		$('#popup').addClass('is-visible');
	}
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



	//録画設定
	//プリセット読み込み
	$('[name=presetID]').change(function(){
		var preset, messege;
 		var tag = 'recpresetinfo';
 		var tagid = 'id';

		if ($(this).val() != 65535){
			preset = $($('html').data('preset'));
			id = $(this).val();
		}else{
			preset = $($('html').data('xml'));
			if ($(this).data('reseveid')){
				id = $(this).data('reseveid');
				tag = 'reserveinfo';
				tagid = 'ID';
			}else{
				id = $(this).data('autoaddid');
			}
		}

		if (preset){
			preset.find(tag).each(function(){
				if ($(this).find(tagid).text() == id){
					recset = $(this).children('recsetting');
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
					var name;
					if ($(this).children('name').text().length > 0){
						name = $(this).children('name').text();
					}else{
						name = $('[name=presetID] option:selected').text();
					}
					messege = '"' + name + '" を読み込みました';
				}
			});
		}
		if (!messege) messege = 'プリセットの読み込に失敗しました';
		notification.MaterialSnackbar.showSnackbar({message: messege});
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
						if (!obj.hasClass('addreserve') && !start){
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
					}else if (form.hasClass('reload')){
						notification.MaterialSnackbar.showSnackbar({message: 'リロードします', timeout: 1000});
						setTimeout('location.reload()', 2500);
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
