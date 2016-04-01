function now(){
	var date = new Date();
	var hour = date.getHours();
	var min  = MIN = date.getMinutes();
	if (min < 10){min = '0' + min;}
	if (hour < basehour){hour = hour + 24;}
	//現時刻の位置
	var line = ((hour - basehour) * 60 + MIN) * oneminpx;
	return {line:line, min:min};
}

function line(){
	var time = now();
	//現時刻のライン移動
	$('#line').css('top', time.line);

	//ラインに分を表示
	if (time.min != $('#line').text()){$('#line').text(time.min);}
}

function end(){
	line();
	//終了番組を薄く
	$('.end_' + Math.floor( new Date().getTime()/10000 )).children().addClass('end').find('.addreserve').remove();
}

function jump(){
	$('main').animate({scrollTop:now().line - marginmin * oneminpx}, 550, 'swing');
}

$(function(){
	//チャンネル名連動
	$('#tv-guide').scroll(function(){
		$('#tv-guide-header').offset({left:-$('#tv-guide').scrollLeft()});
	});

	$('#tv-guide').on({
	    'touchstart mousedown': function(e){
	        if (!isTouch && e.which != 1){
	            return;
	        }
	    	var data = new Object();
        	data.touched = true;
	        data.X = (isTouch ? event.changedTouches[0].clientX : e.clientX);
	        data.Y = (isTouch ? event.changedTouches[0].clientY : e.clientY);
	        data.left = this.scrollLeft;
	        data.top = $('main').scrollTop();
	        $(this).data(data);
	        if (!isTouch){
        		return false;
        	}
	    }
	});
	var target = $('#tv-guide');
	$(document).on({
	    'touchmove mousemove': function(e){
	        if (!target.data('touched')){
	            return;
	        }
	        e.preventDefault();

	        $('body').addClass('drag');

	        target.scrollLeft( target.data('left') + (target.data('X') - (isTouch ? event.changedTouches[0].clientX : e.clientX) ) * (isTouch ? 1 : 1.6) );
	        $('#tv-guide-container').scrollTop( target.data('top') + (target.data('Y') - (isTouch ? event.changedTouches[0].clientY : e.clientY) ) * (isTouch ? 1 : 1.6) );
 	    },
	    'touchend mouseup': function(){
	        if (!target.data('touched')){
	            return;
	        }
	         
	        $('body').removeClass('drag');
	        target.data('touched', false);
	    }
	});

	/*禁断の果実
	$('main').on('scroll', function(){
		var header = $('header').height();
		$.each($('.cell'), function(){
			base=$(this).offset().top-header;
			height=$(this).innerHeight();
			content=$(this).children('.content');

			if (content.hasClass('reserve')){
				if(base < -3 && height+base > 3){
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
			base=$(this).offset().top-header;
			height=$(this).innerHeight();
			content=$(this).find('tt');

			if(base < 0 && height+base > 0){
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
		$('main').animate({scrollTop: $(this).data('scroll')}, 550, 'swing');
	});

	//番組詳細表示
	$('.cell').mousedown(function(e){
		if (e.which == 1){
			pageX = e.pageX;
			pageY = e.pageY;
		}
	}).mouseup(function(e){
		//ドラッグスクロール排除
		if (e.which == 1 && pageX == e.pageX && pageY == e.pageY){
			if (!$(e.target).is('a, label, .nothing')){
				if($(this).hasClass('clicked')){
					$(this).removeClass('clicked');
				}else{
					$('.cell').removeClass('clicked');
					$(this).addClass('clicked');
				}
			}
		}else if (hover == false && e.which == 1){
			$('.cell').removeClass('clicked');
		}
	});

	//マウスホバーで番組詳細表示
	if (hover == true){
		$('.cell').hover(
			function(){
				$(this).addClass('clicked');
			},function(){
				$(this).removeClass('clicked');
		});
	}

	//チャンネルトグル
	$('.stationToggle').change(function(){
		var obj = $('.id-' + $(this).val());
		if($(this).prop('checked')){
			obj.show();
		}else{
			obj.hide();
		}
	});
	
	//ジャンルトグル
	$('.genreToggle').change(function(){
		$('.cell').removeClass('nothing');
		if($(this).val() == 'all'){
			$('.content').show().removeClass('choice');
		}else{
			$('.content').show().removeClass('choice').not( $(this).val() ).hide().parent().addClass('nothing');
			$( $(this).val() ).addClass('choice');
		}
	});

	var notification = document.querySelector('.mdl-js-snackbar');
	//EPG取得
	$('.epg').click(function(){
		$.get('/api/Epg', {epg: $(this).data('epg')}, function(result, textStatus, xhr){
			var xml = $(xhr.responseXML);
			notification.MaterialSnackbar.showSnackbar({message: xml.find('info').text()});
		});
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

	//予約追加・有効・無効
	$('.addreserve').click(function(){
		$('#spinner').addClass('is-visible').children().addClass('is-active');
		var target = $(this);
		var message, url , data;

		if (target.data('reserve')){
			message = '予約を有効にしました';
			url = '/api/reservetoggle';
			data = {'id': target.data('reserve')};
		}else if (target.data('eid')){
			message = '予約を追加しました';
			url = '/api/oneclickadd';
			data = {
				'onid': target.data('onid'),
				'tsid': target.data('tsid'),
				'sid': target.data('sid'),
				'eid': target.data('eid')
			};
		}
		$.ajax({
			url: url,
			data: data,
			
			success: function(result, textStatus, xhr){
				var xml = $(xhr.responseXML);
				if (xml.find('success').length > 0){
					var start = xml.find('start').text();
					var recmode = xml.find('recmode').text();
					var overlapmode = xml.find('overlapmode').text();
					var id = xml.find('reserveid').text();
					var button, recmode, mark;

					if (recmode == 5){
						message = '予約を無効にしました'
						button = '有効';
						recmode = 'disabled';
						mark = '無'
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
					target.data('reserve', id).text(button).parents('.content').not('.reserve').find('.startTime').append('<span class="mark reserve"></span>');
					target.parents('.content').removeClass('disabled partially shortage view').addClass('reserve ' + recmode).find('.mark.reserve').text(mark);
				}else{
					message = xml.find('err').text();
				}
				notification.MaterialSnackbar.showSnackbar({message: message});
				target.parents('.cell').removeClass('clicked');
			}
		})
		$('#spinner').removeClass('is-visible').children().removeClass('is-active');
	});
});