function now(){
	var elapse;
	var date = new Date();
	var hour = date.getHours();
	var min  = MIN = date.getMinutes();
	if (min < 10) min = '0' + min;
	//現時刻の位置
	if (baseTime>24) {
		elapse = Math.floor((date-baseTime*1000)/1000/60/60);
	}else{
		elapse = hour - baseTime;
		if (hour<baseTime) elapse += 24;
	}
	var line = (elapse * 60 + MIN) * oneminpx + $('#tv-guide-header').height();
	return {line: line, min: min};
}

function line(){
	var time = now();
	//現時刻のライン移動
	$('#line').css('top', time.line);

	//ラインに分を表示
	//if (time.min != $('#line').text()) $('#line').text(time.min);
}

function end(cell, mark){
	setTimeout(function(){
		var next = cell.next();
		next.find('.notification').attr('disabled', true).children().text('notifications');
		end(next, mark);

		//番組終了
		setTimeout(function(){
			cell.find('.addreserve').remove();
			if (mark) cell.children().addClass('end');
		}, cell.data('endtime')*1000 - new Date().getTime());
	}, (cell.data('endtime') - 30)*1000 - new Date().getTime());
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
		if (!lastTime || Date.now()<(baseTime+(interval*3600))*1000){
			jump();
		}else{
			location.reload();
		}
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
	var dialog = document.querySelector('dialog#suspend');
	if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
	$('.suspend').click(function(){
		var self = $(this);
		$('#suspend .mdl-dialog__content').html('<span>' + self.text() + 'に移行します');
	    $('#suspend .ok').unbind('click').click(function(){
			dialog.close();
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

		$.ajax({
			url: root + 'api/setReserve',
			data: data,

			success: function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);
				if (xml.find('success').length > 0){
					var add = data.oneclick==1;
					var message = addMark(xml, target, target.parents('.content')) + 'に';
					if (add) message = '追加';

					notification.MaterialSnackbar.showSnackbar({message: '予約を' + message + 'しました'});
				}else{
					errMessage(xml)
				}
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
		getEpgInfo($(this).parents('.cell'), $(this).data(), $(this).data('starttime'));
	});

	$('.close_info').click(function(){
		$('#sidePanel, .close_info.mdl-layout__obfuscator, .open').removeClass('is-visible open');
	});
});