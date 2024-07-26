$(function(){
	const isGrid = () => (localStorage.getItem('ViewMode') ?? 'grid') == 'grid';

	//ライブラリ取得
	const getLibrary = hash => {
		if (hash) history.pushState(null, null, `?${$.param(hash)}`);
		showSpinner(true);
		$.get(`${ROOT}api/Library${location.search}`).done(xml => {
			if ($(xml).find('error').length){
				Snackbar({message: $(xml).find('error').text()});
				showSpinner();
				history.back();
			}else{
				generateLibrary($(xml));
			}
		}).fail(() => {
			Snackbar({message: '取得に失敗しました'});
			showSpinner();
		});
	}

	let order = localStorage.getItem('sortOrder') ?? 'name';
	let asc = localStorage.getItem('ascending') == 'true';
	const sortLibrary = d => {
		const list = d.file ?? $('.item').clone(true);
		order = d.order ?? order
		asc = d.asc ? !asc : asc
		if (order == 'date'){
			list.sort((a,b) => asc ? $(a).data().date - $(b).data().date : $(b).data().date - $(a).data().date);
		}else if (order == 'name'){
			list.sort((a,b) => asc ? $(a).data().name > $(b).data().name ? 1 : -1 : $(a).data().name > $(b).data().name ? -1 : 1);
		}
		$('.item').remove();
		$(`#file${isGrid() ? '' : ' ul'}`).append(list);
		localStorage.setItem('sortOrder', order);
		localStorage.setItem('ascending', asc);
	}

	//ライブラリ表示
	const generateLibrary = xml => {
		xml = xml.find('entry');
		showSpinner(true);
		$('.library').empty();
		$('#folder').hide();
		$('.library').toggleClass('list', isGrid());

		const folder = [];
		const file = [];
		const baseHash = [];
		const index = xml.num('index');
		if (index) baseHash.push({name: 'i', value: index});
		const path = [...baseHash];
		if (xml.children('pathhash').length) xml.txt('pathhash').split(',').forEach(e => baseHash.push({name: 'p', value: e}) );

		xml.children('dir, file').each((i, e) => {
			const name = $(e).txt('name');
			const $e = $((isGrid() ? '<div>' : '<li>'));
			const hash = [...baseHash];
			if ($(e).children('index').length) hash.push({name: 'i', value: $(e).txt('index')});
			if ($(e).prop('tagName') == 'dir'){
				if (xml.children('dirhash').length) hash.push({name: 'p', value: xml.txt('dirhash')});
				if ($(e).children('hash').length) hash.push({name: 'd', value: $(e).txt('hash')});

				$e.addClass('folder').click(() => getLibrary(hash));
				isGrid()
					? $e.addClass('mdl-button mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').append(
						$('<div>', {class: 'icon', html: $('<i>', {class: 'material-icons fill', text: 'folder'}) }),
						$('<div>', {class: 'foldername', text: name }) )
					: $e.addClass('mdl-list__item').append(
						$('<span>', {class: 'mdl-list__item-primary-content', append: [
							$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'folder'}),
							$('<span>', {text: name}) ]}) );
				folder.push($e);
			}else{
				if (xml.children('dirhash').length) hash.push({name: 'd', value: xml.txt('dirhash')});
				hash.push({name: 'h', value: $(e).txt('hash')});

				$e.addClass('item').data({
					name: name,
					date: $(e).txt('date')*1000,
					public: $(e).children('public').length > 0,
				}).click(() => {
					showSpinner(true);
					$('#popup').addClass('is-visible');
					$('#playerUI').addClass('is-visible');
					$audios.prop('checked', false);
					$('#tvcast').animate({scrollTop:0}, 500, 'swing');
					$.get(`${ROOT}api/Library`, hash).done(xml => {
						showSpinner();
						xml = $(xml).find('file');
						$e.data({
							path: xml.txt('path'),
							public: xml.num('public') == 1,
							info: {
								duration: xml.children('meta').num('duration'),
								audio: xml.children('meta').num('audio')
							}
						});
						playMovie($e);
					});
				});

				const thumb = $(e).txt('thumb');
				if (isGrid()){
					$e.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp');
					(thumb != 0) 
						? $e.css('background-image', `url(\'${ROOT}video/thumbs/${thumb}.jpg\')`).append($('<div>', {class: 'mdl-card__title mdl-card--expand'}) )
						: $e.append($('<div>', {class: 'mdl-card__title mdl-card--expand icon'}), $('<i>', {class: 'material-icons', text: 'movie_creation'}) );
					$e.append($('<div>', {class: 'mdl-card__actions', html: $('<span>', {class: 'filename', text: name}) }) );
				}else{
					const date = createViewDate($e.data('date'));
					const avatar = (thumb != 0)
						? $('<i>', {class: 'mdl-list__item-avatar mdl-color--primary', style: `background-image:url(\'${ROOT}video/thumbs/${thumb}.jpg\');`})
						: $('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'movie_creation'});
					$e.addClass('mdl-list__item mdl-list__item--two-line').append(
						$('<span>', {class: 'mdl-list__item-primary-content', append: [
							avatar,
							$('<span>', {text: name}),
							$('<span>', {class: 'mdl-list__item-sub-title mdl-cell--hide-phone', text: `${$(e).txt('size')}MB ${date.getUTCFullYear()}/${zero(date.getUTCMonth()+1)}/${zero(date.getUTCDate())} ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())}:${zero(date.getUTCSeconds())}`}) ]}) );
				}
				file.push($e);
			}
		});

		isGrid()
			? $('#folder').show().append(folder)
			: $('#file').append($('<ul class="main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp">').append(folder));
		sortLibrary({file: file});

		let id = 'home';
		location.search.slice(1).split('&').forEach(e => {
			e = e.split('=');
			if (e[0] == 'i') id = `index${e[1]}`;
			if (e[0] == 'd') {
				id = e[1];
				return;
			}
		});

		const createTab = (id, text, hash, active) => $('<span>', {id: `l_${id}`, class: `mdl-layout__tab${active ? ' is-active' : ''}`, text: text, data: {hash: hash}, click: () => getLibrary(hash)});
		const chevron_right = '<i class="mdl-layout__tab material-icons">chevron_right'

		const dirname = xml.txt('dirname');
		$('.mdl-layout__header-row .mdl-layout-title').text(dirname);
		if (!$(`#l_${id}`).length){
			$('.path').html(createTab('home', 'ホーム', {}, dirname == 'ホーム'));

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

	//表示切替
	const toggleView = load => {
		if (!load) localStorage.setItem('ViewMode', isGrid() ? 'list' : 'grid');
		$('#toggleViewIcon').text(isGrid() ? 'view_list' : 'view_module');
		$('#toggleView').children('span').text(isGrid() ? 'リスト' : 'グリッド');
		getLibrary();
	}

	$(window).on('popstate', () => getLibrary());
	toggleView(true);

	$('#menu_autoplay').removeClass('hidden');
	$('#toggleView').click(() => toggleView());
	$(`#sort_${order}`).addClass('mdl-color-text--accent');
	$(asc ? '#asc' : '#des').hide();
	$('[id^=sort_]').click(e => {
		$('[id^=sort_]').removeClass('mdl-color-text--accent');
		$(e.currentTarget).addClass('mdl-color-text--accent');
		sortLibrary({order: $(e.currentTarget).data('val')});
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
		Snackbar({message: 'サムネの作成を開始します'});
		$.get(`${ROOT}api/Library`, $(e.currentTarget).data()).done(xml => {
			showSpinner();
			Snackbar({message: $(xml).find('info').text()});
		});
	});
});
