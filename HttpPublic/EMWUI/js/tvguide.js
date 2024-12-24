
$(function(){
	const tvGide = {
		top: $('#tv-guide-container').offset().top + $('#tv-guide-header').height(),
		height: $('#tv-guide-container').height(),
		now: text => {
			let elapse;
			const date = new Date();
			const hour = createViewDate(date).getUTCHours();
			const min = createViewDate(date).getUTCMinutes();
			//現時刻の位置
			if (baseTime>27){
				//baseTimeはUTCの時刻
				elapse = Math.floor((date-baseTime*1000)/1000/60/60);
			}else{
				//baseTimeはUTC+9の「時」
				elapse = hour - baseTime;
				if (hour<baseTime) elapse += 24;
			}
			//ラインに分を表示
			if (SHOW_MIN && text){
				text = zero(min);
				if (text != $('#line span').text()) $('#line span').text(text);
			}
			return (elapse * 60 + min) * oneminpx;
		},
		end: ($cell, mark) => {
			setTimeout(() => {
				const $next = $cell.next();
				$next.find('.notification').attr('disabled', true).children().text('notifications');
				tvGide.end($next, mark);

				//番組終了
				setTimeout(() => {
					$cell.find('.addreserve').remove();
					if (mark) $cell.children().addClass('end');
				}, $cell.data('endtime')*1000 - new Date().getTime());
			}, ($cell.data('endtime') - 30)*1000 - new Date().getTime());
		},
		//現時刻のライン移動
		line: () => $('#line').css('top', tvGide.now(true)),
		jump: () => {
			if (tvGide.moment) clearInterval(tvGide.moment);
			$('#tv-guide-container').animate({scrollTop: tvGide.now() - marginmin * oneminpx}, 550, 'swing');
		}
	}

	$(window).on('resize', () => {
		$('#line').width($('#tv-guide-container').width());
		tvGide.top = $('#tv-guide-container').offset().top + $('#tv-guide-header').height();
		tvGide.height = $('#tv-guide-container').height();
	});

	const $tvGuideContainer = $('#tv-guide-container');
	if ($('.station').length && $('.station:last-child').offset().left+$('.station:last-child').width() < $tvGuideContainer.width()) $('#tv-guide').addClass('grow');

	let HIDE_SUBHEADER;
	let speedX, speedY;
	const FRICTION  = 0.95;
	const LIMIT_TO_STOP = 1;

	function moment(){
		if ($tvGuideContainer.data('touched') || (Math.abs(speedX)<LIMIT_TO_STOP && Math.abs(speedY)<LIMIT_TO_STOP)) {
			clearInterval(tvGide.moment);
			return;
		}

		speedX *= FRICTION;
		speedY *= FRICTION;

		$tvGuideContainer.scrollLeft( $tvGuideContainer.scrollLeft() + speedX );
		$tvGuideContainer.scrollTop( $tvGuideContainer.scrollTop() + speedY );
	}

	if (!isTouch){
		let X, XX, Y, YY;
		$('#tv-guide-main').on({
			'touchstart mousedown': e => {
				if (e.which != 1) return;
				
				X = XX = e.clientX;
				Y = YY = e.clientY;

				$tvGuideContainer.data({
					touched: true,
					X: XX,
					Y: YY,
					left: $tvGuideContainer.scrollLeft(),
					top: $tvGuideContainer.scrollTop()
				});
			},
			'wheel': () => {if (tvGide.moment) clearInterval(tvGide.moment);}
		});
		$(document).on({
			'touchmove mousemove': e => {
				if (!$tvGuideContainer.data('touched')) return;

				e.preventDefault();

				$('body').addClass('drag');

				XX = X;
				YY = Y;

				X = e.clientX;
				Y = e.clientY;

				$tvGuideContainer.scrollLeft( $tvGuideContainer.data('left') + $tvGuideContainer.data('X') - X );
				$tvGuideContainer.scrollTop( $tvGuideContainer.data('top') + $tvGuideContainer.data('Y') - Y );
			},
			'touchend mouseup': e => {
				if (!$tvGuideContainer.data('touched')) return;

				$('body').removeClass('drag');
				$tvGuideContainer.data('touched', false);

				speedX = XX - X;
				speedY = YY - Y;

				//慣性スクロール？
				tvGide.moment = setInterval(moment, 1000/60);
			}
		});
	}else if(HIDE_SUBHEADER && $(window).width() < 700){
		//サブヘッダー連動
		$('#tv-guide-main').data('show', true).on({
			'touchstart mousedown': e => {
				$('#subheader').removeClass('serch-bar');
				$(e.currentTarget).data({
					touched: true,
					top: $('#tv-guide-container').scrollTop()
				});
			},
			'touchmove mousemove': e => {
				const $e = $(e.currentTarget);
				if (!$e.data('touched')) return;

				const d = $e.data();
				const TOP = $('#tv-guide-container').scrollTop();
				const margin = d.top - TOP;
				if (d.show){
					if (margin < 0) {
						$('#subheader').css('margin-top', margin);	//表示が多いと重い時が
						//$('#subheader').addClass('serch-bar').css('margin-top', -48);	//不満な場合こっちを ※下のifも外すこと
						if (margin<=-48) $(this).data('show', false);
					}else{
						$('#subheader').css('margin-top', 0);
						$e.data('top', TOP);
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
			'touchend mouseup': e => {
				const $e = $(e.currentTarget);
				$e.data('touched', false);
				const d = $e.data();
				const margin = d.top - $('#tv-guide-container').scrollTop();
				if ((d.show && margin<-24) || (!d.show && margin<24)){
					$('#subheader').addClass('serch-bar').css('margin-top', -48);
					$e.data('show', false);
				}else {
					$('#subheader').addClass('serch-bar').css('margin-top', 0);
					$e.data('show', true);
				}
			}
		});
	}

	if (now){
		$(".station>div>div:first-child").each((i, e) => tvGide.end($(e), endMark));
		tvGide.jump();
		setInterval(() => tvGide.line(), 1000);
	}
	//番組名
	if (!isMobile && titleControl&1 && titleControl&4 || isMobile && titleControl&2 && titleControl&16){
		const observer = new IntersectionObserver((entries) => {
			for(const e of entries) {
				const fixed = e.isIntersecting && ((e.intersectionRect.top <= e.rootBounds.top && e.intersectionRect.height < e.boundingClientRect.height) || e.rootBounds.height < e.boundingClientRect.height)
				$(e.target).toggleClass('fixed', fixed);
			}
		},{
			root: document.querySelector('#tv-guide-container'),
			rootMargin: -$('#tv-guide-header').height() +'px 10px 0px 10px',
			threshold: [0,1]
		});

		// 監視したい要素をobserveする。
		$('.cell,.hour').each((i, e) => observer.observe(e));

		$('#tv-guide-container').on('scroll', () => {
			$('.cell.fixed').each((i, e) => {
				const base = tvGide.top - $(e).offset().top;
				const $e = $(e).find('.content');

				if (base <= 0){
					$e.css('padding-top', '');
				}else if(base < tvGide.height + $(e).height()){
					$(e).children('.content-wrap').hasClass('reserve') ? $e.css('padding-top', base-3) : $e.css('padding-top', base);
				}
			});
			$('.hour.fixed').each((i, e) => {
				const base = tvGide.top - $(e).offset().top;
				base > 0 && base < $(e).innerHeight() ? $(e).find('tt').css('padding-top', base) : $(e).find('tt').css('padding-top', '');
			});
		});
	}else if (!isMobile && titleControl&1 && titleControl&8 || isMobile && titleControl&2 && titleControl&32){
		$('main').addClass('titlescroll');
		$('head').append('<style>.titlescroll .content,.titlescroll .hour tt{top:'+ $('#tv-guide-header').height()+'px;}</style>')
	}

	//現時間にスクロール
	$('#now').click(() => {
		if (!lastTime || Date.now()<lastTime*1000){
			if (tvGide.moment) clearInterval(tvGide.moment);
			tvGide.jump();
		}else{
			location.reload();
		}
	});

	$('.ONE_MIN_PX').change(e => {
		oneminpx = $(e.currentTarget).val();
		$('#tv-guide').css('--ONE_MIN_PX', String(oneminpx));
		$('.ONE_MIN_PX').val(oneminpx);
		document.querySelector('#ONE_MIN_PX_S').MaterialSlider.change(oneminpx);
	});

	//指定時間にスクロール
	$('.scroller').click(e => $('#tv-guide-container').animate({scrollTop: $($(e.currentTarget).attr('href')).position().top-marginmin*oneminpx}, 550, 'swing'));
	
	$('#prev').click(() => {
		$('[id^=id]').each((i, e) => {
			if ($(e).offset().top < -$('#tv-guide-container').height()) return true;

			if ($(e).offset().top > marginmin*oneminpx){
				if ($(e).prevAll('[id^=id]').length) $('#tv-guide-container').animate({scrollTop: $(e).prevAll('[id^=id]').position().top-marginmin*oneminpx}, 550, 'swing');
			}else{
				$('#tv-guide-container').animate({scrollTop: $(e).position().top-marginmin*oneminpx}, 550, 'swing');
			}
			return false;
		});
	});
	$('#next').click(() => {
		$('[id^=id]').each((i, e) => {
			if ($(e).offset().top < $('#tv-guide-container').height()) return true;

			$('#tv-guide-container').animate({scrollTop: $(e).position().top-marginmin*oneminpx}, 550, 'swing');
			return false;
		});
	});

	//指定日に移動
	$('#date_input').change(e => $(e.currentTarget).submit());
	$('#forSP').click(() => $('#dateFormat').click());  //無理やりだがスマホで動くように応急処置
	

	//サービス絞り込み
	$('.select').click(e => {
		const $e = $(e.currentTarget);
		$('.select.mdl-color-text--accent').removeClass('mdl-color-text--accent');
		$e.addClass('mdl-color-text--accent');
		$('#select').text($e.text());
		$('[for=select_service] li').show().not($e.data('val')).hide();
	});

	//番組詳細表示
	let popup;
	$('.cell').mousedown(e => {
		if (e.which != 1) return;

		pageX = e.pageX;
		pageY = e.pageY;
	}).mouseup(e => {
		const $e = $(e.currentTarget);
		//ドラッグスクロール排除
		if (e.which == 1 && pageX == e.pageX && pageY == e.pageY && !popup){
			popup = setTimeout(() => {
				popup = null;
				if (!$(e.target).is('a, label, .nothing')){
					if ($e.hasClass('clicked')){
						$e.removeClass('clicked');
					}else{
						$('.cell').removeClass('clicked');
						createSearchLinks($e);
						$e.addClass('clicked');
					}
				}
			}, 200);
		}else if (!hover && e.which == 1){
			$('.cell').removeClass('clicked');
		}
	}).dblclick(e => {
		clearTimeout(popup);
		popup = null;
		createSearchLinks(e.currentTarget);
		$(e.currentTarget).find('.open_info').click();
	});

	//マウスホバーで番組詳細表示
	if (hover){
		$('.cell').hover(e => {
			createSearchLinks(e.currentTarget);
			$(e.currentTarget).addClass('clicked');
		}, e => $(e.currentTarget).removeClass('clicked'));
	}

	//チャンネルトグル
	$('.stationToggle').change(e => {
		const $e = $(`.id-${$(e.currentTarget).val()}`);
		$(e.currentTarget).prop('checked') ? $e.show() : $e.hide();
	});

	//ジャンルトグル
	$('.genreToggle').change(e => {
		const $e = $(e.currentTarget);
		$('.content-wrap.ex').removeClass('nothing choice');
		$('.content').show();
		if ($e.val() == 'all') return;

		$('.content-wrap:not(.nothing)').not( $e.val() ).addClass('nothing ex').children().hide();
		$( $e.val() ).addClass('choice');
	});

	//EPG取得
	$('.api_tools').click(e => $.post(`${ROOT}api/Common`, $(e.currentTarget).data()).done(xml => Snackbar($(xml).find('info').text())));

	//EPG予約
	$('.autoepg').click(e => {
		$('#autoepg [name=andKey]').val( $(e.currentTarget).data('andkey') );
		const id = $(e.currentTarget).parents('.station').data('service_id');
		if (id) $('#autoepg [name=serviceList]').val(id);
		$('#autoepg').submit();
	});

	//予約追加・有効・無効
	$('.addreserve').click(e => {
		const $e = $(e.currentTarget);
		const d = $e.data();
		sendReserve(d, {
			success: xml => {
					const add = d.oneclick == 1;
					const messege = addRecMark(xml, $e, $e.parents('.content-wrap'));
					Snackbar(`予約を${add ? '追加' : `${messege}に`}しました`);
			},
			end: () => $e.parents('.cell').removeClass('clicked')
		});
	});
	
	//番組詳細を表示
	$('.open_info').click(e => getEpgInfo($(e.currentTarget).parents('.cell'), $(e.currentTarget).data()));
	$('.close_info').click(() => $('#sidePanel, .close_info.mdl-layout__obfuscator, .open').removeClass('is-visible open'));
});