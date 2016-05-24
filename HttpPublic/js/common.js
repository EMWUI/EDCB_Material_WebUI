isTouch = ('ontouchstart' in window);
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
	obj=$(obj).parent();
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
	}
	$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar(data);
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
		if (!$(e.target).is('.flag,.flag *,.count li')){
			window.location = $(this).data('href');
		};
	});
	//検索ページ用
	$('[data-search]').click(function(e){
		if (!$(e.target).is('.flag,.flag *')){
			if ($('#advanced').prop('checked')) {
				$('#hidden').append( $('<input>', { type:'hidden', name:'advanced', value:'1' }) );
			}
			$('#hidden').attr('action', $(this).data('search')).submit();
		}
	});

	//drawer ドロップダウン
	$('.drop-down').click(function(){
		$(this).next().slideToggle()
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
			if (!subGenre){ $('.subGenre').hide(); }
		}
	});
	//全ジャンル選択解除
	$('.g_celar').click(function(){
		$('#contentList option').prop('selected', false);
	});
	//サブジャンル
	if (!$('#subGenre').prop('checked')){
			$(".subGenre").hide();
	};
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
			html += '<li class="mdl-list__item" data-count="' + i + '"><span class="mdl-list__item-primary-content">' + $(this).text() + '</span></li>'
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
		var option=$('#dateList_select option').eq( $(this).data('count') );
		if(option.prop('selected') == true){
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



	//検索バーのアイコンクリックで検索
	$('[for=header-andKey]').click(function(){
		if ($(this).parent().hasClass('is-dirty')){
			$('#search-bar').submit();
		}
	});
	//検索バー連動
	$('#search-bar').val($('#andKey').val());
	$('.andKey').change(function(){
		$('.andKey').val($(this).val());
	});



	//ポップアップ閉じ
	$('.close.mdl-badge').click(function(){
		$('#popup').removeClass('is-visible');
		$('#video').get(0).pause();
		video.playbackRate = 1;
	});



	//録画設定
	//プリセット読み込み
	$('[name=presetID]').change(function(){
		var preset, messege;
 		var tag='recpresetinfo';
 		var tagid='id';

		if ($(this).val() != 65535){
			preset = $($('html').data('preset'));
			id = $(this).val();
		}else{
			preset = $($('html').data('xml'));
			if($(this).data('reseveid')){
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
					if (serviceMode%2==0){
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

					var div = '<div>'
					var container = 'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing';
					var head = 'mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet';
					var content = 'mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop';
					var select = content + ' pulldown mdl-grid mdl-grid--no-spacing';
					var textfield = content + ' mdl-textfield mdl-js-textfield';
					var delbtn = 'delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button';
					var middle = ' mdl-cell--middle';
					$('.preset').remove();
					if ($('#preset').data('lfs')){
						if (!$('[name="batFilePath"] option[value="' + batFilePath.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&') + '"]').length > 0){
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

									recNamePlugInoption = $(div, {class: container}).append(
											$(div, {class: head + middle, text: 'オプション'}) ).append(
											$(div, {class: textfield}).append(
												$('<input>', {class: 'mdl-textfield__input', type: 'text', name: 'recName', value: recNamePlugInoption, id: 'recName'+i}) ).append(
												$('<label>', {class: 'mdl-textfield__label', for: 'recName'+i, text: 'ファイル名PlugIn'}) ) );
								}

								$('#preset .addPreset').before(
									$(div, {class: 'preset '+container}).append(
										$(div, {class: delbtn, on: {click: function(){delPreset(this)}} }).append(
											$('<i>', {class: 'material-icons', text: 'delete'}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: 'フォルダ'}) ).append(
											$(div, {class: content, text: recFolder}) ).append(
											$('<input>', {class: 'recFolderList', type: 'hidden', name:'recFolder', value: recFolder}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head + middle, text: '出力PlugIn'}) ).append(
											$(div, {class: select}).append(
												$('<select>', {name: 'writePlugIn'}).append(
													$('#Write').html()).val(writePlugIn) ) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head + middle, text: 'ファイル名PlugIn'}) ).append(
											$(div, {class: select}).append(
												$('<select>', {name: 'recNamePlugIn'}).append(
													$('#RecName').html() ).val(recNamePlugIn) ) ) ).append(
										recNamePlugInoption ) );
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

									recNamePlugInoption = $(div, {class: container}).append(
											$(div, {class: head + middle, text: 'オプション'}) ).append(
											$(div, {class: textfield}).append(
												$('<input>', {class: 'mdl-textfield__input', type: 'text', name: 'partialrecName', value: recNamePlugInoption, id: 'partialrecName'+i}) ).append(
												$('<label>', {class: 'mdl-textfield__label', for: 'partialrecName'+i, text: 'ファイル名PlugIn'}) ) );
								}

								$('#partialpreset .addPreset').before(
									$(div, {class: 'preset '+container}).append(
										$(div, {class: delbtn, on: {click: function(){delPreset(this)}} }).append(
											$('<i>', {class: 'material-icons', text: 'delete'}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: 'フォルダ'}) ).append(
											$(div, {class: content, text: recFolder}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head + middle, text: '出力PlugIn'}) ).append(
											$(div, {class: select}).append(
												$('<select>', {name: 'partialwritePlugIn'}).append(
													$('#Write').html() ).val(writePlugIn) ) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head + middle, text: 'ファイル名PlugIn'}) ).append(
											$(div, {class: select}).append(
												$('<select>', {name: 'partialrecNamePlugIn'}).append(
													$('#RecName').html() ).val(recNamePlugIn) ) ) ).append(
										recNamePlugInoption ) );
							});
						}
					}else{
						var recFolderList = recset.children('recFolderList');

						$('#preset').append(
							$(div, {class: 'preset '+container}).append(
								$(div, {class: container}).append(
									$(div, {class: head, text: '録画後実行bat'}) ).append(
									$(div, {class: content, text: (batFilePath != '' ? batFilePath : '－')}) ).append(
									$('<input>', {type: 'hidden', name: 'batFilePath', value: batFilePath}) ) ) );

						if (recFolderList.text().length > 0){
							$(recFolderList).children('recFolderInfo').each(function(i){
								var recFolder = $(this).children('recFolder').text();
								var writePlugIn = $(this).children('writePlugIn').text();
								var recNamePlugIn = $(this).children('recNamePlugIn').text();
								var recNamePlugInoption;

								if ($('#preset').data('option') && recNamePlugIn != ''){
									recNamePlugIn = $(this).children('recNamePlugIndll').text();
									recNamePlugInoption = $(this).children('recNamePlugInoption').text();

									recNamePlugInoption = $(div, {class: container}).append(
											$(div, {class: head + middle, text: 'オプション'}) ).append(
											$(div, {class: textfield}).append(
												$('<input>', {class: 'mdl-textfield__input', type: 'text', name: 'recName', value: recNamePlugInoption, id: 'recName'+i}) ).append(
												$('<label>', {class: 'mdl-textfield__label', for: 'recName'+i, text: 'ファイル名PlugIn'}) ) );
								}

								$('#preset').append(
									$(div, {class: 'preset '+container}).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: 'フォルダ'}) ).append(
											$(div, {class: content, text: recFolder}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: '出力PlugIn'}) ).append(
											$(div, {class: content, text: writePlugIn}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: 'ファイル名PlugIn'}) ).append(
											$(div, {class: content, text: (recNamePlugIn != '' ? recNamePlugIn : '－')}) ) ).append(
										recNamePlugInoption ).append(
										$('<input>', {type: 'hidden', name:'recFolder', value: recFolder}) ).append(
										$('<input>', {type: 'hidden', name:'writePlugIn', value: writePlugIn}) ).append(
										$('<input>', {type: 'hidden', name:'recNamePlugIn', value: recNamePlugIn}) ) );
							});
						}else{
							$('#preset').append(
								$(div, {class: 'preset '+container}).append(
									$(div, {class: container}).append(
										$(div, {class: head, text: 'フォルダ'}) ).append(
										$(div, {class: content, text: '－'}) ) ).append(
									$(div, {class: container}).append(
										$(div, {class: head, text: '出力PlugIn'}) ).append(
										$(div, {class: content, text: '－'}) ) ).append(
									$(div, {class: container}).append(
										$(div, {class: head, text: 'ファイル名PlugIn'}) ).append(
										$(div, {class: content, text: '－'}) ) ) );
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

									recNamePlugInoption = $(div, {class: container}).append(
											$(div, {class: head + middle, text: 'オプション'}) ).append(
											$(div, {class: textfield}).append(
												$('<input>', {class: 'mdl-textfield__input', type: 'text', name: 'partialrecName', value: recNamePlugInoption, id: 'recName'+i}) ).append(
												$('<label>', {class: 'mdl-textfield__label', for: 'recName'+i, text: 'ファイル名PlugIn'}) ) );
								}

								$('#partialpreset').append(
									$(div, {class: 'preset '+container}).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: 'フォルダ'}) ).append(
											$(div, {class: content, text: recFolder}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: '出力PlugIn'}) ).append(
											$(div, {class: content, text: writePlugIn}) ) ).append(
										$(div, {class: container}).append(
											$(div, {class: head, text: 'ファイル名PlugIn'}) ).append(
											$(div, {class: content, text: (recNamePlugIn != '' ? recNamePlugIn : '－')}) ) ).append(
										recNamePlugInoption ).append(
										$('<input>', {type: 'hidden', name:'partialrecFolder', value: recFolder}) ).append(
										$('<input>', {type: 'hidden', name:'partialwritePlugIn', value: writePlugIn}) ).append(
										$('<input>', {type: 'hidden', name:'partialrecNamePlugIn', value: recNamePlugIn}) ) );
							});
						}else{
							$('#partialpreset').append(
								$(div, {class: 'preset '+container}).append(
									$(div, {class: container}).append(
										$(div, {class: head, text: 'フォルダ'}) ).append(
										$(div, {class: content, text: '－'}) ) ).append(
									$(div, {class: container}).append(
										$(div, {class: head, text: '出力PlugIn'}) ).append(
										$(div, {class: content, text: '－'}) ) ).append(
									$(div, {class: container}).append(
										$(div, {class: head, text: 'ファイル名PlugIn'}) ).append(
										$(div, {class: content, text: '－'}) ) ) );
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
					if($(this).children('name').text().length > 0){
						name = $(this).children('name').text();
					}else{
						name = $('[name=presetID] option:selected').text();
					}
					messege = '"' + name + '" を読み込みました';
				}
			});
		}
		if (!messege){ messege = 'プリセットの読み込に失敗しました';}
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
					var start = xml.find('start').text();
					var recmode = xml.find('recmode').text();
					var overlapmode = xml.find('overlapmode').text();
					var id = xml.find('reserveid').text();
					
					var mode = '';
					if (recmode==5){
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
						if (!obj.hasClass('addreserve') && start != 1){
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
								reserve($(this))
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
				showSpinner(false);
			}
		});
	}

	//予約トグルスイッチ
	$('.flag input').change(function(){
		reserve( $(this) );
	});
	//録画無効マーク
	$('.disabled span').click(function(){
		if ($(this).hasClass('recmark')){
			reserve( $(this) );
		}
	});
	//検索ページ追加ボタン
	$('.add').click(function(){
		reserve( $(this) );
	});

	//通信エラー
	$(document).ajaxError(function(e,xhr, textStatus, errorThrown){
		notification.MaterialSnackbar.showSnackbar({message: xhr.status+"Error : "+xhr.statusText});
	});

	//サブミット
	$('.submit').click(function(){
		showSpinner(true);
		var form = $( $(this).data('form') );
		$.ajax({
			url: form.attr('action'),
			type: form.attr('method'),
			data: form.serialize(),
			
			success: function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);
				if (xml.find('success').length > 0){
					notification.MaterialSnackbar.showSnackbar({message: xml.find('success').text(), timeout: 1500});
					if (form.data('redirect')){
						setTimeout('location.href="'+form.data('redirect')+'";',1500);
					}else if (form.data('submit')){
						setTimeout('$("'+ form.data('submit') +'").submit();',1500);
					}else if (form.hasClass('reload')){
						notification.MaterialSnackbar.showSnackbar({message: 'リロードします', timeout: 1000});
						setTimeout('location.reload()',2500);
					}
				}else{
					notification.MaterialSnackbar.showSnackbar({message: xml.find('err').text()});
				}
				showSpinner(false);
			}
		});
	});

	$('.delPreset').click(function(){
		delPreset(this);
	});
	$('.addPreset').click(function(){
		var div = '<div>'
		var container = 'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing';
		var head = 'mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet';
		var content = 'mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop';
		var select = content + ' pulldown mdl-grid mdl-grid--no-spacing';
		var textfield = content + ' mdl-textfield mdl-js-textfield';
		var delbtn = 'delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button';
		var middle = ' mdl-cell--middle';
		var recNamePlugInoption;
		
		var partial = '';
		if ($(this).hasClass('partial')){
			partial = 'partial';
		}

		if ($('#preset').data('option')){
			recNamePlugIn = $(this).children('recNamePlugIndll').text();
			recNamePlugInoption = $(this).children('recNamePlugInoption').text();

			recNamePlugInoption = $(div, {class: container}).append(
				$(div, {class: head + middle, text: 'オプション'}) ).append(
				$(div, {class: textfield}).append(
					$('<input>', {class: 'mdl-textfield__input', type: 'text', name: partial+'recName', value: recNamePlugInoption, id: 'recName'}) ).append(
					$('<label>', {class: 'mdl-textfield__label', for: 'recName', text: 'ファイル名PlugIn'}) ) );
		}

		$(this).before(
			$(div, {class: 'preset '+container}).append(
				$(div, {class: delbtn, on: {click: function(){delPreset(this)}} }).append(
					$('<i>', {class: 'material-icons', text: 'delete'}) ) ).append(
				$(div, {class: container}).append(
					$(div, {class: head, text: 'フォルダ'}) ).append(
					$(div, {class: content, text: '!Default'}) ).append(
					$('<input>', {class: 'recFolderList', type: 'hidden', name: partial+'recFolder', value: ''}) ) ).append(
				$(div, {class: container}).append(
					$(div, {class: head + middle, text: '出力PlugIn'}) ).append(
					$(div, {class: select}).append(
						$('<select>', {name: partial+'writePlugIn'}).append(
							$('#Write').html() ).val('Write_Default.dll') ) ) ).append(
				$(div, {class: container}).append(
					$(div, {class: head + middle, text: 'ファイル名PlugIn'}) ).append(
					$(div, {class: select}).append(
						$('<select>', {name: partial+'recNamePlugIn'}).append(
							$('#RecName').html() ) ) ) ).append(
				recNamePlugInoption ) );

		componentHandler.upgradeDom();
	});
});
