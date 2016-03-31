isTouch = ('ontouchstart' in window);
if (isTouch){
	document.write('<link href="/css/touch.css" rel="stylesheet" type="text/css">');
}else{
	document.write('<link href="/css/pc.css" rel="stylesheet" type="text/css">');
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
		url: '/api/EnumRecPreset',
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
		$('main').hammer().on('swiperight', function(){
			tab( $('.mdl-layout__tab.is-active').prev() );
		});
		$('main').hammer().on('swipeleft', function(){
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
			$('video').load().data('load', true);
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



	//検索バー連動
	$('#search-bar').val($('#andKey').val());
	$('.andKey').change(function(){
		$('.andKey').val($(this).val());
	});



	//ポップアップ閉じ
	$('.close.mdl-badge').click(function(){
		$('#popupmovie').removeClass('is-visible');
		$('#video').get(0).pause();
	});



	//録画設定
	//プリセット読み込み
	$('[name=presetID]').change(function(){
		var preset, messege;
 		var tag='recpresetinfo';
 		var tagid='id';

		if ($(this).val() != 65535){
			preset = $($('html').data('preset'));
		        id=$(this).val();
		}else{
			preset = $($('html').data('xml'));
			if($(this).data('reseveid')){
				id=$(this).data('reseveid');
				tag='reserveinfo'
				tagid='ID'
			}else{
				id=$(this).data('autoaddid');
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
					batFilePath = batFilePath != '' ? batFilePath : '－';
					$('.preset').empty();
					var recFolderList = recset.children('recFolderList');
					var wrap = $('<div>').addClass('mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing');
					var before = $('<div>').addClass('mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle');
					var after = $('<div>').addClass('mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop');
					var annotation = '<div>※プリセットによる変更のみ</div>';

					$('#preset').append(annotation).append( wrap.clone().append( before.clone().text('録画後実行bat') ).append( after.clone().text(batFilePath) ) );
					if (recFolderList.text().length > 0){
						$(recFolderList).children('recFolderInfo').each(function(i){
							var recFolder = $(this).children('recFolder').text();
							var writePlugIn = $(this).children('writePlugIn').text();
							var recNamePlugIn = $(this).children('recNamePlugIn').text();
							var recNamePlugIndll, recNamePlugInoption;

							if($(this).children('recNamePlugIndll').text() != ''){
								recNamePlugIndll = $(this).children('recNamePlugIndll').text();
								recNamePlugInoption = $(this).children('recNamePlugInoption').text();

								var div = document.createElement('div');
								div.className = 'recFolderList mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield';
								
								var input = document.createElement('input');
								input.id = 'recName' + i;
								input.setAttribute('type', 'text');
								input.name = 'recName';
								input.value = recNamePlugInoption;
								input.className = 'mdl-textfield__input';
								div.appendChild(input);

								var label = document.createElement('label');
								var textNode = document.createTextNode('ファイル名オプション')
								label.setAttribute('for', 'recName' + i);
								label.className = 'mdl-textfield__label';
								label.appendChild(textNode);
								div.appendChild(label);

								componentHandler.upgradeElement(div);
								
								recNamePlugInoption = wrap.clone();
								before.clone().text('オプション').appendTo(recNamePlugInoption).after(div);
							}else{
								recNamePlugIndll = recNamePlugIn != '' ? recNamePlugIn : '－';
								recNamePlugInoption = '';
							}
							$('#preset').append('<input type=hidden name="recFolder" value="' + recFolder + '"><input type=hidden name="writePlugIn" value="' + writePlugIn + '"><input type=hidden name="recNamePlugIn" value="' + recNamePlugIndll + '">')
							  .append( wrap.clone().append( before.clone().text('フォルダ') ).append( after.clone().text(recFolder) ) )
							  .append( wrap.clone().append( before.clone().text('出力PlugIn') ).append( after.clone().text(writePlugIn) ) )
							  .append( wrap.clone().append( before.clone().text('ファイル名PlugIn') ).append( after.clone().text(recNamePlugIndll) ) )
							  .append( recNamePlugInoption ); 
						});
					}else{
						$('#preset').append( wrap.clone().append( before.clone().text('フォルダ') ).append( after.clone().text('－') ) )
							  .append( wrap.clone().append( before.clone().text('出力PlugIn') ).append( after.clone().text('－') ) )
							  .append( wrap.clone().append( before.clone().text('ファイル名PlugIn') ).append( after.clone().text('－') ) );
					}
					//部分受信サービス
					if (recset.children('partialRecFlag').text() == 1){
						$('[name=partialRecFlag]').prop('checked', true).parent().addClass('is-checked');
						$('#partialpreset').show();
					}else{
						$('[name=partialRecFlag]').prop('checked', false).parent().removeClass('is-checked');
						$('#partialpreset').hide();
					}
					//部分受信プリセット
					$('#partialpreset').append(annotation);
					var partialRecFolder = recset.children('partialRecFolder');
					if (partialRecFolder.text().length > 0){
						$(partialRecFolder).children('recFolderInfo').each(function(i){
							var recFolder = $(this).children('recFolder').text();
							var writePlugIn = $(this).children('writePlugIn').text();
							var recNamePlugIn = $(this).children('recNamePlugIn').text();
							var recNamePlugIndll, recNamePlugInoption;

							if($(this).children('recNamePlugIndll').length > 0){
								recNamePlugIndll = $(this).children('recNamePlugIndll').text();
								recNamePlugInoption = $(this).children('recNamePlugInoption').text();

								var div = document.createElement('div');
								div.className = 'recFolderList mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield';
								
								var input = document.createElement('input');
								input.id = 'partialrecName' + i;
								input.setAttribute('type', 'text');
								input.name = 'partialrecName';
								input.value = recNamePlugInoption;
								input.className = 'mdl-textfield__input';
								div.appendChild(input);

								var label = document.createElement('label');
								var textNode = document.createTextNode('ファイル名オプション')
								label.setAttribute('for', 'partialrecName' + i);
								label.className = 'mdl-textfield__label';
								label.appendChild(textNode);
								div.appendChild(label);

								componentHandler.upgradeElement(div);
								
								recNamePlugInoption = wrap.clone();
								before.clone().text('オプション').appendTo(recNamePlugInoption).after(div);
							}else{
								recNamePlugIndll = recNamePlugIn;
								recNamePlugInoption = '';
							}
							$('#partialpreset').append('<input type=hidden name="partialrecFolder" value="' + recFolder + '"><input type=hidden name="partialwritePlugIn" value="' + writePlugIn + '"><input type=hidden name="partialrecNamePlugIn" value="' + recNamePlugIndll + '">')
							  .append( wrap.clone().append( before.clone().text('フォルダ') ).append( after.clone().text(recFolder) ) )
							  .append( wrap.clone().append( before.clone().text('出力PlugIn') ).append( after.clone().text(writePlugIn) ) )
							  .append( wrap.clone().append( before.clone().text('ファイル名PlugIn') ).append( after.clone().text(recNamePlugIndll) ) )
							  .append( recNamePlugInoption ); 
						});
					}else{
						$('#partialpreset').append( wrap.clone().append( before.clone().text('フォルダ') ).append( after.clone().text('－') ) )
							  .append( wrap.clone().append( before.clone().text('出力PlugIn') ).append( after.clone().text('－') ) )
							  .append( wrap.clone().append( before.clone().text('ファイル名PlugIn') ).append( after.clone().text('－') ) );
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
		$('#spinner').addClass('is-visible').children().addClass('is-active');
		var url;
		var data = obj.parents('td').data();

		if (data.id){
			url = '/api/reservetoggle';
		}else{
			url = '/api/oneclickadd';
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
				$('#spinner').removeClass('is-visible').children().removeClass('is-active');
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
		notification.MaterialSnackbar.showSnackbar({message: xhr.status+" Error : "+xhr.statusText});
	});

	//サブミット
	$('.submit').click(function(){
		$('#spinner').addClass('is-visible').children().addClass('is-active');
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
				$('#spinner').removeClass('is-visible').children().removeClass('is-active');
			}
		});
	});
	
});