class TvGuide{
	#oneMinPx;
	#baseTime;
	#marginMin;
	#container = document.getElementById('tv-guide-container');
	#header = document.getElementById('tv-guide-header');
	#main = document.getElementById('tv-guide-main');
	#now(add){
		let elapse;
		const date = new Date();
		const hour = createViewDate(date).getUTCHours();
		const min = createViewDate(date).getUTCMinutes();
		//現時刻の位置
		if (this.#baseTime>27){
			//baseTimeはUTCの時刻
			elapse = Math.floor((date-this.#baseTime*1000)/1000/60/60);
		}else{
			//baseTimeはUTC+9の「時」
			elapse = hour - this.#baseTime;
			if (hour<this.#baseTime) elapse += 24;
		}
		//ラインに分を表示
		if (add){
			const text = zero(min);
			if (text != $('#line span').text()) $('#line span').text(text);
		}
		return (elapse * 60 + min) * this.#oneMinPx;
	}
	#end($cell, mark){
		setTimeout(() => {
			const $next = $cell.next();
			$next.find('.notification').attr('disabled', true).children().text('notifications');
			this.#end($next, mark);

			//番組終了
			setTimeout(() => {
				$cell.find('.addreserve').remove();
				if (mark) $cell.children().addClass('end');
			}, $cell.data('endtime')*1000 - new Date().getTime());
		}, ($cell.data('endtime') - 30)*1000 - new Date().getTime());
	}
	#jump(){
		this.#clearMoment();
		$(this.#container).animate({scrollTop: this.#now() - this.#marginMin * this.#oneMinPx}, 550, 'swing');
	}

	#fps = 1000 / 60;
	#friction  = 0.95;
	#limit = 1;
	#deltaX = 0;
	#deltaY = 0;
	#momentID = 0;
	#lastTime = performance.now();
	#moment(time){
		if (time - this.#lastTime < this.#fps){
			this.#momentID = requestAnimationFrame(() => this.#moment());
			return;
		}
		this.#container.scrollBy(this.#deltaX, this.#deltaY);

		this.#deltaX *= this.#friction;
		this.#deltaY *= this.#friction;
		this.#lastTime = time;

		if (Math.abs(this.#deltaX)<this.#limit && Math.abs(this.#deltaY)<this.#limit) return;		
		this.#momentID = requestAnimationFrame(() => this.#moment());
	}
	#clearMoment(){
		if (!this.#momentID) return;
		cancelAnimationFrame(this.#momentID);
		this.#momentID = 0;
		this.#deltaX = 0;
		this.#deltaY = 0;
	}

	constructor(oneMinPx, baseTime, marginMin, lastTime, titleFlag, enableHover, hasNow, addEndMark, addMin, subheader){
		this.#oneMinPx = oneMinPx;
		this.#baseTime = baseTime;
		this.#marginMin = marginMin;

		if ($('.station').length && $('.station:last-child').offset().left+$('.station:last-child').width() < $(this.#container).width()) $('#tv-guide').addClass('grow');

		let touched;
		this.#main.addEventListener('pointerdown', e => {
			if (e.pointerType != 'mouse' || e.button != 0) return;
			this.#clearMoment();
			touched = true;
		});
		this.#main.addEventListener('wheel', () => this.#clearMoment());
		this.#main.addEventListener('pointermove', e => {
			if (!touched) return;

			if (e.movementX || e.movementY) {
				document.body.style.cursor = 'grabbing';
				e.currentTarget.setPointerCapture(e.pointerId);
			}

			this.#deltaX = -e.movementX;
			this.#deltaY = -e.movementY;

			this.#container.scrollBy(this.#deltaX, this.#deltaY);
		});
		this.#main.addEventListener('pointerup', e => {
			touched = false;
			document.body.style.cursor = null;

			this.#moment();
			e.currentTarget.releasePointerCapture(e.pointerId);
		});

		if (subheader && window.innerWidth < 700){
			//サブヘッダー連動
			let startTop, touched;
			let show = true;
			this.#main.addEventListener('pointerdown', e => {
				if (e.button != 0) return;
				$('#subheader').removeClass('serch-bar');
				touched = true;
				startTop = this.#container.scrollTop;
			});
			this.#container.addEventListener('scroll', e => {
				if (!touched) return;

				requestAnimationFrame(() => {
					const delta = Math.floor((startTop - this.#container.scrollTop) / 2);
					if (show){
						if (delta < 0){
							$('#subheader').css('margin-top', delta);
							if (delta<=-48) show = false;
						}else{
							$('#subheader').css('margin-top', 0);
							startTop = this.#container.scrollTop;
						}
					}else{
						if (delta > 0){
							$('#subheader').css('margin-top', Math.min(delta-48, 0));
							if (delta>=48) show = true;
						}else{
							$('#subheader').css('margin-top', -48);
							startTop = this.#container.scrollTop;
						}
					}
				});
			});
			$(document).on({
				'touchend mouseup': e => {
					if (!touched) return;

					touched = false;
					requestAnimationFrame(() => {
						const delta = Math.floor((startTop - this.#container.scrollTop) / 2);
						if ((show && delta<-48/2) || (!show && delta<48/2)){
							$('#subheader').addClass('serch-bar').css('margin-top', -48);
							show = false;
						}else{
							$('#subheader').addClass('serch-bar').css('margin-top', 0);
							show = true;
						}
					});
				}
			});
		}

		if (hasNow){
			$(".station>div>div:first-child").each((i, e) => this.#end($(e), addEndMark));
			setTimeout(() => this.#jump(), 500);
			//現時刻のライン移動
			setInterval(() => $('#line').css('top', this.#now(addMin)), 1000);
		}
		//番組名
		if (!isMobile && titleFlag&1 && titleFlag&4 || isMobile && titleFlag&2 && titleFlag&16){
			const observer = new IntersectionObserver(entries => {
				for(const e of entries) {
					const fixed = e.isIntersecting && ((e.intersectionRect.top <= e.rootBounds.top && e.intersectionRect.height < e.boundingClientRect.height) || e.rootBounds.height < e.boundingClientRect.height)
					$(e.target).toggleClass('fixed', fixed);
				}
			},{
				root: this.#container,
				rootMargin: `${-this.#header.offsetHeight}px 10px 0px 10px`,
				threshold: [0,1]
			});

			// 監視したい要素をobserveする。
			$('.cell,.hour').each((i, e) => observer.observe(e));

			this.#container.addEventListener('scroll', () => {
				const top = this.#container.getBoundingClientRect().top + this.#header.offsetHeight;
				requestAnimationFrame(() => {
					$('.cell.fixed').each((i, e) => {
						const base = top - e.getBoundingClientRect().top;
						$(e).find('.content').css('padding-top', base > 0 ? base - ($(e).children('.content-wrap').hasClass('reserve') ? 3 : 0) : '');
					});
					$('.hour.fixed').each((i, e) => {
						const base = top - e.getBoundingClientRect().top;
						$(e).find('tt').css('padding-top', base > 0 ? base : '');
					});
				});
			});
		}else if (!isMobile && titleFlag&1 && titleFlag&8 || isMobile && titleFlag&2 && titleFlag&32){
			$('main').addClass('titlescroll');
			$('head').append(`<style>.titlescroll .content,.titlescroll .hour tt{top:${this.#header.offsetHeight}px;}</style>`)
		}

		//現時間にスクロール
		$('#now').click(() => {
			if (!lastTime || Date.now()<lastTime*1000) this.#jump();
			else location.reload();
		});

		$('.ONE_MIN_PX').change(e => {
			this.#oneMinPx = $(e.currentTarget).val();
			$('#tv-guide').css('--ONE_MIN_PX', String(this.#oneMinPx));
			$('.ONE_MIN_PX').val(this.#oneMinPx);
			document.querySelector('#ONE_MIN_PX_S').MaterialSlider.change(this.#oneMinPx);
		});

		//指定時間にスクロール
		$('.scroller').click(e => $(this.#container).animate({scrollTop: $($(e.currentTarget).attr('href')).position().top-this.#marginMin*this.#oneMinPx}, 550, 'swing'));

		$('#prev').click(() => {
			$('[id^=id]').each((i, e) => {
				if ($(e).offset().top < -this.#container.offsetHeight) return true;

				if ($(e).offset().top > this.#marginMin*this.#oneMinPx){
					if ($(e).prevAll('[id^=id]').length) $(this.#container).animate({scrollTop: $(e).prevAll('[id^=id]').position().top-this.#marginMin*this.#oneMinPx}, 550, 'swing');
				}else{
					$(this.#container).animate({scrollTop: $(e).position().top-this.#marginMin*this.#oneMinPx}, 550, 'swing');
				}
				return false;
			});
		});
		$('#next').click(() => {
			$('[id^=id]').each((i, e) => {
				if ($(e).offset().top < this.#container.offsetHeight) return true;

				$(this.#container).animate({scrollTop: $(e).position().top-this.#marginMin*this.#oneMinPx}, 550, 'swing');
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
		$('.cell').click(e => {
			if (!popup){
				popup = setTimeout(() => {
					popup = 0;
					const $e = $(e.currentTarget);
					if ($(e.target).is('a, label, .nothing')) return;
					if ($e.hasClass('clicked')){
						$e.removeClass('clicked');
					}else{
						$('.cell').removeClass('clicked');
						createSearchLinks($e);
						$e.addClass('clicked');
					}
				}, 200);
			}else if (!enableHover) $('.cell').removeClass('clicked');
		}).dblclick(e => {
			clearTimeout(popup);
			popup = 0;
			createSearchLinks(e.currentTarget);
			$(e.currentTarget).find('.open_info').click();
		});

		//マウスホバーで番組詳細表示
		if (enableHover){
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
	}
}