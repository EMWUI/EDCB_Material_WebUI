function now(text){
	var SHOW_MIN;
	var elapse;
	var date = new Date();
	var hour = date.getHours();
	var min = date.getMinutes();
	//現時刻の位置
	if (baseTime>27) {
		elapse = Math.floor((date-baseTime*1000)/1000/60/60);
	}else{
		elapse = hour - baseTime;
		if (hour<baseTime) elapse += 24;
	}
	//ラインに分を表示
	if (SHOW_MIN && text){
		text = ('0'+min).slice(-2);
		if (text != $('#line span').text()) $('#line span').text(text);
	}
	return (elapse * 60 + min) * oneminpx;
}

//現時刻のライン移動
function line(){
	$('#line').css('top', now(true));
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

var intervalID;
function jump(){
	if (intervalID) clearInterval(intervalID);
	$('#tv-guide-container').animate({scrollTop: now() - marginmin * oneminpx}, 550, 'swing');
}

$(window).on('load resize', function(){
	$('#line').width($('#tv-guide-container').width());
});

$(function(){
	var target = $('#tv-guide-container');
	if ($('.station:last-child').offset().left+$('.station:last-child').width() < target.width()){
		$('#tv-guide').addClass('grow');
	}

	var HIDE_SUBHEADER;
	var speedX, speedY;
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

	if (!isTouch){
		var X, XX, Y, YY;
		$('#tv-guide-main').on({
		    'touchstart mousedown': function(e){
				if (e.which != 1) return;
				
				X = XX = e.clientX;
		        Y = YY = e.clientY;

				target.data({
					touched: true,
		        	X: XX,
		        	Y: YY,
					left: target.scrollLeft(),
					top: target.scrollTop()
				});
			},
			'wheel': function(){
				if (intervalID) clearInterval(intervalID);
			}
		});
		$(document).on({
		    'touchmove mousemove': function(e){
				if (!target.data('touched')) return;
				e.preventDefault();

				$('body').addClass('drag');

				XX = X;
				YY = Y;

				X = e.clientX;
				Y = e.clientY;

				target.scrollLeft( target.data('left') + target.data('X') - X );
				target.scrollTop( target.data('top') + target.data('Y') - Y );
			},
		    'touchend mouseup': function(e){
				if (!target.data('touched')) return;

				$('body').removeClass('drag');
				target.data('touched', false);

				speedX = XX - X;
				speedY = YY - Y;

				//慣性スクロール？
				intervalID = setInterval(moment, 1000/60);
			}
		});
	}else if(HIDE_SUBHEADER && $(window).width() < 700){
		//サブヘッダー連動
		$('#tv-guide-main').data('show', true).on({
		    'touchstart mousedown': function(e){
		    	$('#subheader').removeClass('serch-bar');
				$(this).data({
					touched: true,
					top: $('#tv-guide-container').scrollTop()
				});
			},
		    'touchmove mousemove': function(e){
				if (!$(this).data('touched')) return;

				var data = $(this).data();
				var TOP = $('#tv-guide-container').scrollTop();
				var margin = data.top - TOP;
				if (data.show){
					if (margin < 0) {
						$('#subheader').css('margin-top', margin);	//表示が多いと重い時が
						//$('#subheader').addClass('serch-bar').css('margin-top', -48);	//不満な場合こっちを ※下のifも外すこと
						if (margin<=-48) $(this).data('show', false);
					}else{
						$('#subheader').css('margin-top', 0);
						$(this).data('top', TOP);
					}
				}else{
					if (margin > 0){
						$('#subheader').css('margin-top', Math.min(margin-48, 0));
						//$('#subheader').addClass('serch-bar').css('margin-top', 0);	//ここも同じように
						if (margin>=48) $(this).data('show', true);
					}else{
						$('#subheader').css('margin-top', -48);
						$(this).data('top', TOP);
					}
				}
			},
		    'touchend mouseup': function(e){
				$(this).data('touched', false);
				var data = $(this).data();
				var margin = data.top - $('#tv-guide-container').scrollTop();
				if ((data.show && margin<-24) || (!data.show && margin<24)){
					$('#subheader').addClass('serch-bar').css('margin-top', -48);
					$(this).data('show', false);
				}else {
					$('#subheader').addClass('serch-bar').css('margin-top', 0);
					$(this).data('show', true);
				}
			}
		});
	}

	//番組名
	if (!isTouch && titleControl&1 && titleControl&4 || isTouch && titleControl&2 && titleControl&16){
		$('#tv-guide-container').on('scroll', function(){
			var done;
			var top = $('#tv-guide-container').offset().top + $('#tv-guide-header').height();
			var left = $('.hour-container').width() - $('.station').width();
			var width = $('#tv-guide-container').width();
			var height = $('#tv-guide-container').height();
			$('#tv-guide-main .station ').each(function(){
			 	if (left <= $(this).position().left && $(this).position().left <= width){  //見えている範囲を絞る(各局で
					done = true;
					$(this).children().each(function(){
						var _done;
						$(this).children('.cell').each(function(){
							if (top-$(this).height() <= $(this).offset().top && $(this).offset().top <= height){  //(各番組で
								var base = top - $(this).offset().top;
								var content = $(this).find('.content');
								_done = true;

								if (base<=0){
									content.css('padding-top', '');
								}else if(base<height+$(this).height()){
									if ($(this).children('.content-wrap').hasClass('reserve')){
										content.css('padding-top', base-3);
									}else{
										content.css('padding-top', base);
									}
								}
							}else if (_done){
								return false;
							}
						});
					});
				}else if (done){
					return false;
				}
			});
			$('#tv-guide-main .hour').each(function(){
				var base = top - $(this).offset().top;
				if (base > 0 && base < $(this).innerHeight()){
					$(this).find('tt').css('padding-top', base);
				}else{
					$(this).find('tt').css('padding-top', '');
				}
			});
		});
	}else if (!isTouch && titleControl&1 && titleControl&8 || isTouch && titleControl&2 && titleControl&32){
	  $('main').addClass('titlescroll');
	  $('head').append('<style>.titlescroll .content,.titlescroll .hour tt{top:'+ $('#tv-guide-header').height()+'px;}</style>')
	}

	//現時間にスクロール
	$('#now').click(function(){
		if (!lastTime || Date.now()<lastTime*1000){
			if (intervalID) clearInterval(intervalID);
			jump();
		}else{
			location.reload();
		}
	});

	//指定時間にスクロール
	$('.scroller').click(function(){
		$('#tv-guide-container').animate({scrollTop: $($(this).attr('href')).position().top-marginmin*oneminpx}, 550, 'swing');
	});
	
	$('#prev').click(function(){
		$('[id^=id]').each(function(){
			if ($(this).offset().top > -$('#tv-guide-container').height()){
				if ($(this).offset().top > marginmin*oneminpx){
					if ($(this).prevAll('[id^=id]').length > 0) $('#tv-guide-container').animate({scrollTop: $(this).prevAll('[id^=id]').position().top-marginmin*oneminpx}, 550, 'swing');
				}else{
					$('#tv-guide-container').animate({scrollTop: $(this).position().top-marginmin*oneminpx}, 550, 'swing');
				}
				return false;
			}
		});
	});
	$('#next').click(function(){
		$('[id^=id]').each(function(){
			if ($(this).offset().top > $('#tv-guide-container').height()){
				$('#tv-guide-container').animate({scrollTop: $(this).position().top-marginmin*oneminpx}, 550, 'swing');
				return false;
			}
		});
	});

	//サービス絞り込み
	$('.select').click(function(){
		$('.select.mdl-color-text--accent').removeClass('mdl-color-text--accent');
		$(this).addClass('mdl-color-text--accent');
		$('#select').text($(this).text());
		$('[for=select_service] li').show().not($(this).data('val')).hide();
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
		$('.content-wrap.ex').removeClass('nothing choice');
		$('.content').show();
		if ($(this).val() != 'all'){
			$('.content-wrap:not(.nothing)').not( $(this).val() ).addClass('nothing ex').children().hide();
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
					var message = addMark(xml, target, target.parents('.content-wrap')) + 'に';
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