function now(){
	var date = new Date();
	var hour = date.getHours();
	var min  = MIN = date.getMinutes();
	if (min < 10) min = '0' + min;
	if (hour < basehour) hour = hour + 24;
	//現時刻の位置
	var line = ((hour - basehour) * 60 + MIN) * oneminpx + $('#tv-guide-header').height();
	return {line: line, min: min};
}

function line(){
	var time = now();
	//現時刻のライン移動
	$('#line').css('top', time.line);

	//ラインに分を表示
	//if (time.min != $('#line').text()) $('#line').text(time.min);

	$('.start_' + Math.floor( new Date().getTime()/10000+3 )).find('.notification').attr('disabled', true).children().text('notifications');
}

function end(){
	line();
	//終了番組を薄く
	$('.end_' + Math.floor( new Date().getTime()/10000 )).children().addClass('end').find('.addreserve').remove();
}

function jump(){
	$('#tv-guide-container').animate({scrollTop: now().line - marginmin * oneminpx}, 550, 'swing');
}

$(function(){
	var target = $('#tv-guide-container');

	var FRICTION  = 0.95;
	var LIMIT_TO_STOP = 1;

	function moment(){
		if (target.data('touched') || (Math.abs(speedX)<LIMIT_TO_STOP && Math.abs(speedY)<LIMIT_TO_STOP)) {
			clearInterval(intervalID);
			return;
		}

		speedX *= FRICTION;
		speedY *= FRICTION;

		target.scrollLeft( target.scrollLeft() + speedX );
		target.scrollTop( target.scrollTop() + speedY );
	}

	if (!isTouch || !Light_Mode){
		//チャンネル名連動
		$('#tv-guide-container').scroll(function(){
			$('#tv-guide-header').css('top', target.scrollTop());
			$('#tv-guide-main .hour-container').first().css('left', target.scrollLeft());
			$('#line').css('left', target.scrollLeft());
		});

		$('#tv-guide-main').on({
		    'touchstart mousedown': function(e){
				if (!isTouch && e.which != 1){
					return;
				}

				var data = new Object();
				data.touched = true;
		        data.X = X = XX = (isTouch ? event.changedTouches[0].clientX : e.clientX);
		        data.Y = Y = YY = (isTouch ? event.changedTouches[0].clientY : e.clientY);
				data.left = target.scrollLeft();
				data.top = target.scrollTop();
				target.data(data);
	        	if (!isTouch){
					return false;
				}
			}
		});
		$(document).on({
		    'touchmove mousemove': function(e){
				if (!target.data('touched')){
					return;
				}
				e.preventDefault();

				$('body').addClass('drag');

		        XX = X;
		        YY = Y;

				X = (isTouch ? event.changedTouches[0].clientX : e.clientX);
				Y = (isTouch ? event.changedTouches[0].clientY : e.clientY);

		        target.scrollLeft( target.data('left') + target.data('X') - X );
		        target.scrollTop( target.data('top') + target.data('Y') - Y );
			},
		    'touchend mouseup': function(e){
				if (!target.data('touched')){
					return;
				}

				$('body').removeClass('drag');
				target.data('touched', false);

		        speedX = XX - X;
		        speedY = YY - Y;

				//慣性スクロール？
				intervalID = setInterval(moment, 16);
			}
		});
	}else{
		$('.hour-container').show();
		$('#line').width($('#tv-guide').width() - 13);
	}

	/*禁断の果実
	$('#tv-guide-container').on('scroll', function(){
		var header = $('header').height();
		$.each($('.cell'), function(){
			base = $(this).offset().top-header;
			height = $(this).innerHeight();
			content = $(this).children('.content');

			if (content.hasClass('reserve')){
				if (base < -3 && height+base > 3){
					content.css('top', -base).outerHeight(height+base-3).css('min-height', height+base).css('border-top', 'none');
					return;
				}
			}else{
				if (base < 0 && height+base > 0){
					content.css('top', -base).height(height+base).css('min-height', height+base);
					return;
				}
			}
			content.css('top', 0).css('min-height', height).css('border-top', '');
		})
		$.each($('#hour-container .hour'), function(){
			base = $(this).offset().top-header;
			height = $(this).innerHeight();
			content = $(this).find('tt');

			if (base < 0 && height+base > 0){
				content.css('padding-top', -base+5);
			}else{
				content.css('padding-top', '');
			}
		})
	});
	*/

	//現時間にスクロール
	$('#now').click(function(){
		jump();
	});

	//指定時間にスクロール
	$('.scroller').click(function(){
		$('#tv-guide-container').animate({scrollTop: $(this).data('scroll')}, 550, 'swing');
	});

	//サービス絞り込み
	$('.select').click(function(){
		$('.select.mdl-color-text--accent').removeClass('mdl-color-text--accent');
		$(this).addClass('mdl-color-text--accent');
		$('#select').text($(this).text());
		$('[for=service] li').show().not($(this).data('val')).hide();
	});

	//番組詳細表示
	var popup;
	$('.cell').mousedown(function(e){
		if (e.which == 1){
			pageX = e.pageX;
			pageY = e.pageY;
		}
	}).mouseup(function(e){
		//ドラッグスクロール排除
		var self = $(this);
		if (e.which == 1 && pageX == e.pageX && pageY == e.pageY && !popup){
			popup = setTimeout(function(){
				popup = false;
				if (!$(e.target).is('a, label, .nothing')){
					if (self.hasClass('clicked')){
						self.removeClass('clicked');
					}else{
						$('.cell').removeClass('clicked');
						self.addClass('clicked');
					}
				}
			}, 200);
		}else if (!hover && e.which == 1){
			$('.cell').removeClass('clicked');
		}
	}).dblclick(function(){
		clearTimeout(popup);
		popup = false;
		$(this).find('.open_info').click();
	});

	//マウスホバーで番組詳細表示
	if (hover){
		$('.cell').hover(
			function(){
				$(this).addClass('clicked');
			}, function(){
				$(this).removeClass('clicked');
		});
	}

	//チャンネルトグル
	$('.stationToggle').change(function(){
		var obj = $('.id-' + $(this).val());
		if ($(this).prop('checked')){
			obj.show();
		}else{
			obj.hide();
		}
	});

	//ジャンルトグル
	$('.genreToggle').change(function(){
		$('.cell').removeClass('nothing');
		if ($(this).val() == 'all'){
			$('.content').show().removeClass('choice');
		}else{
			$('.content').show().removeClass('choice').not( $(this).val() ).hide().parent().addClass('nothing');
			$( $(this).val() ).addClass('choice');
		}
	});

	var notification = document.querySelector('.mdl-js-snackbar');
	//EPG取得
	$('.api_tools').click(function(){
		$.get(root + 'api/Common', $(this).data(), function(result, textStatus, xhr){
			var xml = $(xhr.responseXML);
			notification.MaterialSnackbar.showSnackbar({message: xml.find('info').text()});
		});
	});
	var dialog = document.querySelector('dialog');
	if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
	$('.suspend').click(function(){
		var self = $(this);
		$('.mdl-dialog__content').text(self.text() + 'に移行します');
	    $('#dialog_button').unbind('click').click(function(){
			document.querySelector('dialog').close();
			$.get(root + 'api/Common', self.data(), function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);
				notification.MaterialSnackbar.showSnackbar({message: xml.find('info').text()});
			});
		});
	    dialog.showModal();
	});

	//EPG予約
	$('.autoepg').click(function(){
		$('#autoepg [name=andKey]').val( $(this).data('andkey') );
		var service = $(this).parents('.station').data('service');
		if (service){
			$('#autoepg [name=serviceList]').val(service);
		}
		$('#autoepg').submit();
	});

	//通知
	$('.cell .notify').click(function(){
		var notify = $(this);
		if (!notify.attr('disabled')){
			var data = notify.data();
			if (data.notification){
				//登録済み通知削除
				delNotify(notify, data);
			}else{
				data.title = notify.parents('.popup').prevAll('.mdl-typography--body-1-force-preferred-font').html();
				data.name = notify.parents('.station').data('name');

				creatNotify(notify, data, true);
			}
		}
	});

	//予約追加・有効・無効
	$('.addreserve').click(function(){
		showSpinner(true);
		var target = $(this);
		var data = target.data();
		var message, url;

		if (data.id){
			message = '予約を有効にしました';
			url = root + 'api/reservetoggle';
		}else if (data.eid){
			message = '予約を追加しました';
			url = root + 'api/oneclickadd';
		}

		$.ajax({
			url: url,
			data: data,

			success: function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);
				if (xml.find('success').length > 0){
					var disable = addMark(xml, target, target.parents('.content'));

					if (disable) message = disable;
				}else{
					message = 'Error : ' + xml.find('err').text();
				}
				notification.MaterialSnackbar.showSnackbar({message: message});
				target.parents('.cell').removeClass('clicked');
				showSpinner();
			}
		});
	});

	//更新通知のカウンタを取得
	var notifyCount;
	if (sessionStorage.getItem('notifyCount')){
		notifyCount = sessionStorage.getItem('notifyCount');
	}else{
		$.get(root + 'api/Common', {notify: 2}, function(result, textStatus, xhr){
			notifyCount = $(xhr.responseXML).find('info').text();
			sessionStorage.setItem('notifyCount', notifyCount);
		});
	}

	//番組詳細を表示
	$('.open_info').click(function(){
		showSpinner(true);
		$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
		$('[href="#recset"], #recset, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
		$('[href="#detail"], #detail').addClass('is-active');
		$(this).parents('.cell').addClass('open');
		$('.sidePanel-content').scrollTop(0);

		$.ajax({
			url: root + 'api/GetEventInfo',
			data: $(this).data(),
			success: function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);

				if (xml.find('eventinfo').length > 0){
					var onid = Number(xml.find('ONID').first().text());
					var tsid = Number(xml.find('TSID').first().text());
					var sid = Number(xml.find('SID').first().text());
					var eid = Number(xml.find('eventID').first().text());

					var startDate = xml.find('startDate').text();
					var startTime = xml.find('startTime').text();
					var endTime = new Date(startDate+' '+startTime).getTime() + Number(xml.find('duration').text())*1000;

					var genre = '';
					var audio = '';
					var other = '';
					xml.find('contentInfo').each(function(){
						genre = genre + '<li>' + $(this).find('component_type_name').text();
					});
					xml.find('audioInfo').each(function(){
						audio = audio + '<li>'+ $(this).find('component_type_name').text() + ' '+ $(this).find('text').text() + '<li>サンプリングレート : ' + {1:'16',2:'22.05',3:'24',5:'32',6:'44.1',7:'48'}[$(this).find('sampling_rate').text()] + 'kHz';
					});
					if (onid<0x7880 || 0x7FE8<onid){
						if (xml.find('freeCAFlag').first().text() == 0){
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

					$('#title').html(xml.find('event_name').text().replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g,'<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>'));
					$('#sidePanel_date').html(startDate+' '+startTime.match(/(\d+:\d+):\d+/)[1] + '～' + ('0'+endTime.getHours()).slice(-2) + ':' + ('0'+endTime.getMinutes()).slice(-2));
					$('#service').html(xml.find('service_name').text());
					$('#links').html($('.open .links a').clone(true));
					$('#summary p').html(xml.find('event_text').text().replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1">$1</a> ').replace(/\n/g,'<br>'));
					$('#ext').html(xml.find('event_ext_text').text().replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1">$1</a> ').replace(/\n/g,'<br>'));
					$('#genreInfo').html(genre);
					$('#videoInfo').html('<li>' + xml.find('videoInfo').find('component_type_name').text() + ' ' + $(this).find('videoInfo').find('text').text());
					$('#audioInfo').html(audio);
					$('#otherInfo').html(other +
						'<li>OriginalNetworkID:' + onid + '(0x' + ('000'+onid.toString(16).toUpperCase()).slice(-4) + ')' +
						'<li>TransportStreamID:' + tsid + '(0x' + ('000'+tsid.toString(16).toUpperCase()).slice(-4) + ')' +
						'<li>ServiceID:'         + sid  + '(0x' + ('000'+ sid.toString(16).toUpperCase()).slice(-4) + ')' +
						'<li>EventID:'           + eid  + '(0x' + ('000'+ eid.toString(16).toUpperCase()).slice(-4) + ')' );
					$('#epginfo').attr('href', 'epginfo.html?onid=' + onid + '&tsid=' + tsid + '&sid=' + sid + '&eid=' + eid);

					$('[name=onid]').val(onid);
					$('[name=tsid]').val(tsid);
					$('[name=sid]').val(sid);
					$('[name=eid]').val(eid);

					function searchReserve(){
						var reserve;
						ReserveAutoaddList.find('reserveinfo').each(function(){
							if (onid == $(this).find('ONID').text() &&
							    tsid == $(this).find('TSID').text() &&
							     sid == $(this).find('SID').text() &&
							     eid == $(this).find('eventID').text() ){
								var id = $(this).find('ID').text();

								$('#set').attr('action', root + 'api/ReserveChg?id='+id);
								$('#del').attr('action', root + 'api/ReserveDel?id='+id);
								$('#reserved, #delreseved').show();
								$('[name=presetID]').data('reseveid', id).val(65535);
								$('#reserve').text('変更');

								setRecSettting($(this));
								reserve = true;

								return false;
							}
						});

						if (!reserve) setDefault();

						$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
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
				}else{
					notification.MaterialSnackbar.showSnackbar({message: 'Error : ' + xml.find('err').text()});
					showSpinner();
				}
			}
		});
	});

	$('.close_info').click(function(){
		$('#sidePanel, .close_info.mdl-layout__obfuscator, .open').removeClass('is-visible open');
	});
});