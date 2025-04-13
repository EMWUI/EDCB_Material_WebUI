$(function(){
	const isGrid = () => (localStorage.getItem('ViewMode') ?? 'grid') == 'grid';

	const rollThumb = window.createMiscWasmModule && new tsThumb(`${ROOT}api/grabber`);
	
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

	const getMetadata = async ($e, hash) => {
		if ($e.data('path')) return;
		await $.get(`${ROOT}api/Library`, hash).done(xml => {
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

			if (xml.txt('programInfo')){
				const programInfo = xml.txt('programInfo').match(/^(.*?)\n(.*?)\n(.*?)\n+([\s\S]*?)\n+(?:詳細情報\n)?([\s\S]*?)\n+ジャンル : \n([\s\S]*)\n\n映像 : ([\s\S]*)\n音声 : ([\s\S]*?)\n\n([\s\S]*)\n$/);
				const id = programInfo[9].match(/OriginalNetworkID:(\d+)\(0x[0-9A-F]+\)\nTransportStreamID:(\d+)\(0x[0-9A-F]+\)\nServiceID:(\d+)\(0x[0-9A-F]+\)\nEventID:(\d+)\(0x[0-9A-F]+\)/);
				const date = programInfo[1].split(/ ～ | /);
				const starttime = new Date(`${date[0]} ${date[1]}`).getTime();
				const endtime = /未定/.test(date[2]) ? null : new Date(`${date[0]} ${date[2]}`).getTime();
				const data = {
					onid: Number(id[1]),
					tsid: Number(id[2]),
					sid:  Number(id[3]),
					eid:  Number(id[4]),
					service: programInfo[2],

					starttime: starttime,

					title: programInfo[3],
					text: programInfo[4],
					text_ext: programInfo[5],

					genre: programInfo[6],
					video: programInfo[7],
					audio: programInfo[8],
					other: programInfo[9].replace(/\n\n/g,'\n'),
				};
				if (endtime){
					data.endtime = endtime;
					data.duration = endtime - starttime;
				}
				$e.data('info', data);
			}
		});
	}

	let order = localStorage.getItem('sortOrder') ?? 'name';
	let asc = localStorage.getItem('ascending')??'true' == 'true';
	const sortLibrary = d => {
		const list = d.file ?? $('.item').clone(true);
		order = d.order ?? order
		asc = d.asc ? !asc : asc

		if (order == 'date') list.sort((a,b) => asc ? $(a).data().date - $(b).data().date : $(b).data().date - $(a).data().date);
		else if (order == 'name') list.sort((a,b) => asc ? $(a).data().name > $(b).data().name ? 1 : -1 : $(a).data().name > $(b).data().name ? -1 : 1);
		else if (order == 'size') list.sort((a,b) => asc ? $(a).data().size > $(b).data().size ? 1 : -1 : $(a).data().size > $(b).data().size ? -1 : 1);

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
				if (isGrid()) $e.addClass('mdl-button mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').append(
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
				const canvas = document.createElement('canvas');

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
					await getMetadata($e, hash);
					showSpinner();
					playMovie($e);
				});

				if (rollThumb){
					$e.hover(async () => {
						await getMetadata($e, hash);
						rollThumb.roll(canvas, $e.data('path'));
					}, () => rollThumb.hide());
				}

				const thumb = $(e).txt('thumb');
				if (isGrid()){
					if (!thumb){
						if (rollThumb){
							(async () => {
								const thumb = document.createElement('canvas');
								await getMetadata($e, hash);
								const done = await rollThumb.set(thumb, $e.data('path'));
								if (done) canvas.before(thumb);
							})();
						}
						$e.append($('<div>', {class: 'mdl-card__title mdl-card--expand icon'}), $('<i>', {class: 'material-icons', text: 'movie_creation'}) );
					}else $e.css('background-image', `url(\'${ROOT}video/thumbs/${thumb}.jpg\')`).append($('<div>', {class: 'mdl-card__title mdl-card--expand'}) );
					
					$e.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').append($('<div>', {class: 'mdl-card__actions', html: $('<span>', {class: 'filename', text: name}) }), canvas );
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

		if (isGrid()) $('#folder').show().append(folder);
		else $('#file').append($('<ul class="main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp">').append(folder));

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

	//表示切替
	const toggleView = load => {
		if (!load) localStorage.setItem('ViewMode', isGrid() ? 'list' : 'grid');
		$('#toggleViewIcon').text(isGrid() ? 'view_list' : 'view_module');
		$('#toggleView').children('span').text(isGrid() ? 'リスト' : 'グリッド');
		getLibrary();
	}

	$(window).on('popstate', () => getLibrary());
	toggleView(true);
	const play = new URLSearchParams(location.search).get('play');
	if (play){
		const $e = $('<div class="hidden is_cast">');
		$('#tvcast').append($e);
		readyToAutoPlay = async () => {
			await getMetadata($e, play);
			playMovie($e);
		}
	}

	$('#menu_autoplay').removeClass('hidden');
	$('#toggleView').click(() => toggleView());
	$(`#sort_${order}`).addClass('mdl-color-text--accent');
	$(asc ? '#des' : '#asc').hide();
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
		Snackbar('サムネの作成を開始します');
		$.get(`${ROOT}api/Library`, $(e.currentTarget).data()).done(xml => {
			showSpinner();
			Snackbar($(xml).find('info').text());
		});
	});
});
