$(function(){
	const GRID = 1;
	const LIST = 2;
	const CONP = 3;
	const isFolder = () => viewMode == GRID || viewMode == LIST;
	const isList = () => viewMode == LIST || viewMode == CONP;

	const thumb = 'createMiscWasmModule' in window && new TsThumb(`${ROOT}api/grabber`);
	
	//ライブラリ取得
	const getLibrary = hash => {
		if (hash){
			const params = new URLSearchParams(location.search);
			['i','p','d'].forEach(n => params.delete(n));
			hash.forEach(v => params.append(v.name, v.value));
			history.pushState(null, null, `?${params.toString()}`);
		}
		showSpinner(true);
		$.get(`${ROOT}api/Library${location.search}`, {json:1}).done(d => {
			if (!d.error) generateLibrary(d);
			else{
				Snackbar(d.error);
				showSpinner();
				history.back();
			}
		}).fail(() => {
			Snackbar('取得に失敗しました');
			showSpinner();
		});
	}

	const getMetadata = async ($e, hash, basic = true) => {
		if ($e.data('path') && basic || $e.data('info')) return;
		await $.get(`${ROOT}api/Library?json=1${basic?'':'&basic=0'}`, hash).done(d => {
			$e.data(d);
			if (d.programInfo) $e.data('info', Object.assign(toObj.ProgramInfo(d.programInfo), {id: 65535}));
		});
	}

	let order = localStorage.getItem('sortOrder') ?? 'name';
	let asc = (localStorage.getItem('ascending')??'true') == 'true';
	const sortLibrary = d => {
		const list = d.file ?? $('.item').clone(true);
		order = d.order ?? order
		asc = d.asc ? !asc : asc

		if (order == 'date') list.sort((a,b) => asc ? $(a).data().date - $(b).data().date : $(b).data().date - $(a).data().date);
		else if (order == 'name') list.sort((a,b) => asc ? $(a).data().name > $(b).data().name ? 1 : -1 : $(a).data().name > $(b).data().name ? -1 : 1);
		else if (order == 'size') list.sort((a,b) => asc ? $(a).data().size > $(b).data().size ? 1 : -1 : $(a).data().size > $(b).data().size ? -1 : 1);

		$('.item').remove();
		$(`#file${isList()?' .main-content':''}`).append(list);
		localStorage.setItem('sortOrder', order);
		localStorage.setItem('ascending', asc);
	}

	//ライブラリ表示
	const generateLibrary = d => {
		showSpinner(true);
		$('.library').empty();
		$('#folder').hide();
		$('#file').toggleClass('list', !isList());

		const baseHash = [];
		if (d.index) baseHash.push({name: 'i', value: d.index});
		const path = [...baseHash];
		if (d.path) d.path.forEach(e => baseHash.push({name: 'p', value: e.hash}) );

		const folder = d.dir.map(e => {
			const hash = [...baseHash];
			if (e.index) hash.push({name: 'i', value: e.index});
			if (d.dirhash) hash.push({name: 'p', value: d.dirhash});
			if (e.hash) hash.push({name: 'd', value: e.hash});

			const $e = $((viewMode==CONP ? '<li>' : '<div>'), {class: 'folder', click: () => getLibrary(hash)});
			if (isFolder()) $e.addClass('mdl-button mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').append(
				$('<div>', {class: 'icon', html: $('<i>', {class: 'material-icons fill', text: 'folder'}) }),
				$('<div>', {class: 'foldername', text: e.name }) );
			else $e.addClass('mdl-list__item').append(
				$('<span>', {class: 'mdl-list__item-primary-content', append: [
					$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'folder'}),
					$('<span>', {text: e.name}) ]}) );
			return $e;
		})
		const file = d.file.map(e => {
			const hash = [...baseHash];
			if (d.dirhash) hash.push({name: 'd', value: d.dirhash});
			hash.push({name: 'h', value: e.hash});
			const rollCanvas = document.createElement('canvas');

			const $e = $((viewMode==CONP ? '<li>' : '<div>'), {class: 'item', data: {
				name: e.name,
				date: new Date(e.mtime),
				size: e.size,
				public: e.public,
			}, click: async () => {
				showSpinner(true);
				const params = new URLSearchParams(location.search);
				params.set('play', $.param(hash));
				history.replaceState(null, null, `?${params.toString()}`);
				$('#popup').addClass('is-visible');
				$('#playerUI').addClass('is-visible');
				$audios.prop('checked', false);
				$('#tvcast').animate({scrollTop:0}, 500, 'swing');
				await getMetadata($e, hash, false);
				if ($e.data('info')){
					setEpgInfo($e.data('info'));
					$('#epginfo').removeClass('hidden');
				}else $('#epginfo').addClass('hidden');
				showSpinner();
				playMovie($e);
			}});

			const hover = {};
			if (thumb){
				let hovered = false;
				Object.assign(hover, {
					async pointerenter(e){
						e.currentTarget.setPointerCapture(e.pointerId);
						hovered = true;
						await getMetadata($e, hash);
						if (hovered) thumb.roll(rollCanvas, $e.data('path'));
					},
					pointerleave(e){
						hovered = false;
						thumb.hide();
						e.currentTarget.releasePointerCapture(e.pointerId);
					}
				});
			}

			const thumbHash = e.thumb;
			const date = createViewDate($e.data('date'));
			if (isFolder()){
				if (!thumbHash && thumb) (async () => {
					const thumbCanvas = document.createElement('canvas');
					await getMetadata($e, hash);
					const done = await thumb.setThumb(thumbCanvas, $e.data('path'), 0.1);
					if (done) rollCanvas.before(thumbCanvas);
				})();
				
				$e.addClass(`${['card','grid'][viewMode-1]}-container`).append([
					$('<div>', {class: 'thumb-container', on: hover, append: [
						thumbHash ? $('<img>', {src:  `${ROOT}video/thumbs/${thumbHash}.jpg`}) : $('<i>', {class: 'material-icons', text: 'movie_creation'}),
						rollCanvas
					]}),
					$('<div>', {class: 'summary mdl-typography--title-color-contrast', append: [
						$('<span>', {class: 'title', html: e.name}),
						$('<span>', {class: 'mdl-typography--subhead', append:[
							$('<span>', {class: 'date', html: `${date.getUTCFullYear()}/${zero(date.getUTCMonth()+1)}/${zero(date.getUTCDate())} ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())}:${zero(date.getUTCSeconds())}`}),
							$('<span>', {class: 'size', html: `${e.sizeText}`}),
						]})
					]})
				]);
			}else{
				const avatar = (thumbHash && thumbHash != 0)
					? $('<i>', {class: 'mdl-list__item-avatar mdl-color--primary', style: `background-image:url(\'${ROOT}video/thumbs/${thumbHash}.jpg\');`})
					: $('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'movie_creation'});
				$e.addClass('mdl-list__item mdl-list__item--two-line').append(
					$('<span>', {class: 'mdl-list__item-primary-content', append: [
						avatar,
						$('<span>', {class: 'title', text: e.name}),
						$('<span>', {class: 'mdl-list__item-sub-title mdl-cell--hide-phone', text: `${e.sizeText} ${date.getUTCFullYear()}/${zero(date.getUTCMonth()+1)}/${zero(date.getUTCDate())} ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())}:${zero(date.getUTCSeconds())}`}) ]}) );
			}
			return $e;
		});

		if (isList()) $('#file').append($(viewMode==LIST?'<div>':'<ul>', {class: 'main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp'}));
		if (isFolder()) $('#folder').show().append(folder);
		else $('#file ul').append(folder);

		sortLibrary({file: file});

		let id = 'home';
		location.search.slice(1).split('&').forEach(e => {
			e = e.split('=');
			if (e[0] == 'i') id = `index${e[1]}`;
			if (e[0] == 'd'){
				id = e[1];
				return;
			}
		});

		const createTab = (id, text, hash, active) => $('<span>', {id: `l_${id}`, class: `mdl-layout__tab${active ? ' is-active' : ''}`, text: text, data: {hash: hash}, click(){getLibrary(hash)}});
		const chevron_right = '<i class="mdl-layout__tab material-icons">chevron_right'

		$('.mdl-layout__header-row .mdl-layout-title').text(d.dirname);
		if (!$(`#l_${id}`).length){
			$('.path').html(createTab('home', 'ホーム', [], d.dirname == 'ホーム'));

			if (d.iname) $('.path').append(chevron_right).append(createTab(`index${d.index}`, d.iname, [...path]));
			if (d.path) d.path.forEach((e, i) =>{
				const dir = [...path];
				path.push({name: 'p', value: e.hash});
				dir.push({name: 'd', value: e.hash});
				$('.path').append(chevron_right).append(createTab(e.hash, e.name, dir));
			});

			if (d.dirhash) path.push({name: 'd', value: d.dirhash});
			if (d.dirname != 'ホーム') $('.path').append(chevron_right).append(createTab(d.dirhash||`index${d.index}`, d.dirname, path, true));
		}else{
			$('.mdl-layout__tab').removeClass('is-active');
			$(`#l_${id}`).addClass('is-active');
		}
		componentHandler.upgradeDom();
		showSpinner();
	}

	$(window).on('popstate', () => getLibrary());
	let viewMode = localStorage.getItem('ViewMode2') ?? GRID;
	$(`#view${viewMode}`).addClass('mdl-color-text--accent');
	getLibrary();
	const play = new URLSearchParams(location.search).get('play');
	if (play){
		const $e = $('<div class="hidden is_cast">');
		$('#tvcast').append($e);
		vid.readyToAutoPlay = async () => {
			await getMetadata($e, play, false);
			if ($e.data('info')){
				setEpgInfo($e.data('info'));
				$('#epginfo').removeClass('hidden');
			}
			playMovie($e);
		}
	}

	$('#menu_autoplay').removeClass('hidden');
	$(`#sort_${order}`).addClass('mdl-color-text--accent');
	$(asc ? '#des' : '#asc').hide();
	$('.viewmode').click(e => {
		$('.viewmode').removeClass('mdl-color-text--accent');
		$(e.currentTarget).addClass('mdl-color-text--accent');
		viewMode = $(e.currentTarget).data('val');
		localStorage.setItem('ViewMode2', viewMode);
		getLibrary();
	})
	$('[id^=sort_]').click(e => {
		$('[id^=sort_]').removeClass('mdl-color-text--accent');
		$(e.currentTarget).addClass('mdl-color-text--accent');
		sortLibrary({order: $(e.currentTarget).data('val')});
		getLibrary();
	});
	$('#sort').click(() => {
		sortLibrary({asc: true});
		$('#sort span').toggle();
	});
	//スワイプ
	if (isTouch){
		const librarySwipe = $e => {if ($e.length) getLibrary($e.data('hash'));};
		$('.lib-swipe,.lib-swipe *').hammer().on('swiperight', () => librarySwipe( $('.mdl-layout__tab.is-active').prevAll('span:first') ));
		$('.lib-swipe,.lib-swipe *').hammer().on('swipeleft' , () => librarySwipe( $('.mdl-layout__tab.is-active').nextAll('span:first') ));
	}

	$('#library-search').submit(() => location.hash = `#search@${$('#Key').val()}`);

	$('#playprev').click(() => $('.playing').prev().click());
	$('#playnext').click(() => $('.playing').next().click());

	$('.thumbs').click(e => {
		showSpinner(true);
		Snackbar('サムネの作成を開始します');
		$.get(`${ROOT}api/Library?json=1`, $(e.currentTarget).data()).done(d => {
			showSpinner();
			Snackbar(d.info);
		});
	});
});
