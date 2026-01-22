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
		$.get(`${ROOT}api/Library${location.search}`).done(xml => {
			if ($(xml).find('error').length){
				Snackbar($(xml).find('error').text());
				showSpinner();
				history.back();
			}else{
				generateLibrary($(xml));
			}
		}).fail(() => {
			Snackbar('取得に失敗しました');
			showSpinner();
		});
	}

	const getMetadata = async ($e, hash, basic = true) => {
		if ($e.data('path') && (!basic && $e.data('info'))) return;
		await $.get(`${ROOT}api/Library${basic?'':'?basic=0'}`, hash).done(xml => {
			xml = $(xml).find('file');
			$e.data({
				path: xml.txt('path'),
				name: xml.txt('name'),
				public: xml.num('public') == 1,
				meta: {
					duration: xml.children('meta').num('duration'),
					audio: xml.children('meta').num('audio')
				}
			});

			if (xml.txt('programInfo')) $e.data('info', Object.assign(toObj.ProgramInfo(xml.txt('programInfo')), {id: 65535}));
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
	const generateLibrary = xml => {
		xml = xml.find('entry');
		showSpinner(true);
		$('.library').empty();
		$('#folder').hide();
		$('#file').toggleClass('list', !isList());

		const folder = [];
		const file = [];
		const baseHash = [];
		const index = xml.num('index');
		if (index) baseHash.push({name: 'i', value: index});
		const path = [...baseHash];
		if (xml.children('pathhash').length) xml.txt('pathhash').split(',').forEach(e => baseHash.push({name: 'p', value: e}) );

		xml.children('dir, file').each((i, e) => {
			const name = $(e).txt('name');
			const $e = $((viewMode==CONP ? '<li>' : '<div>'));
			const hash = [...baseHash];
			if ($(e).children('index').length) hash.push({name: 'i', value: $(e).txt('index')});
			if ($(e).prop('tagName') == 'dir'){
				if (xml.children('dirhash').length) hash.push({name: 'p', value: xml.txt('dirhash')});
				if ($(e).children('hash').length) hash.push({name: 'd', value: $(e).txt('hash')});

				$e.addClass('folder').click(() => getLibrary(hash));
				if (isFolder()) $e.addClass('mdl-button mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').append(
					$('<div>', {class: 'icon', html: $('<i>', {class: 'material-icons fill', text: 'folder'}) }),
					$('<div>', {class: 'foldername', text: name }) );
				else $e.addClass('mdl-list__item').append(
					$('<span>', {class: 'mdl-list__item-primary-content', append: [
						$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'folder'}),
						$('<span>', {text: name}) ]}) );
				folder.push($e);
			}else{
				if (xml.children('dirhash').length) hash.push({name: 'd', value: xml.txt('dirhash')});
				hash.push({name: 'h', value: $(e).txt('hash')});
				const rollCanvas = document.createElement('canvas');

				$e.addClass('item').data({
					name: name,
					date: $(e).txt('date')*1000,
					size: $(e).num('size'),
					public: $(e).children('public').length > 0,
				}).click(async () => {
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
				});

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

				const thumbHash = $(e).txt('thumb');
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
							$('<span>', {class: 'title', html: name}),
							$('<span>', {class: 'mdl-typography--subhead', append:[
								$('<span>', {class: 'date', html: `${date.getUTCFullYear()}/${zero(date.getUTCMonth()+1)}/${zero(date.getUTCDate())} ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())}:${zero(date.getUTCSeconds())}`}),
								$('<span>', {class: 'size', html: `${$(e).txt('size')}`}),
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
							$('<span>', {class: 'title', text: name}),
							$('<span>', {class: 'mdl-list__item-sub-title mdl-cell--hide-phone', text: `${$(e).txt('size')}MB ${date.getUTCFullYear()}/${zero(date.getUTCMonth()+1)}/${zero(date.getUTCDate())} ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())}:${zero(date.getUTCSeconds())}`}) ]}) );
				}
				file.push($e);
			}
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

		const dirname = xml.txt('dirname');
		$('.mdl-layout__header-row .mdl-layout-title').text(dirname);
		if (!$(`#l_${id}`).length){
			$('.path').html(createTab('home', 'ホーム', [], dirname == 'ホーム'));

			if (xml.children('pathname').length){
				xml.txt('pathname').split('/').forEach((e, i) => {
					const dir = [...path];
					let pathhash = `index${index}`;
					if (xml.children('pathhash').length && i > 0){
						pathhash = xml.txt('pathhash').split(',')[i-1];
						path.push({name: 'p', value: pathhash});
						dir.push({name: 'd', value: pathhash});
					}
					$('.path').append(chevron_right).append(createTab(pathhash, e, dir));
				});
			}

			let dirhash = `index${index}`;
			if (xml.children('dirhash').length){
				dirhash = xml.txt('dirhash');
				path.push({name: 'd', value: dirhash});
			}
			if (dirname != 'ホーム') $('.path').append(chevron_right).append(createTab(dirhash, dirname, path, true));
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
		$.get(`${ROOT}api/Library`, $(e.currentTarget).data()).done(xml => {
			showSpinner();
			Snackbar($(xml).find('info').text());
		});
	});
});
