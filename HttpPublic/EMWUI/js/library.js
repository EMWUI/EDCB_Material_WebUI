//ライブラリ取得
function getMovieList(){
	showSpinner(true);
	$.ajax({
		url: root + 'api/Library',
		data: location.hash.slice(1),
		success: function(result, textStatus, xhr){
			var message;
			if (xhr.responseXML){
				const xml = $(xhr.responseXML);
				if (xml.find('error').length > 0){
					message = xml.find('error').text();
					showSpinner();
				}else{
					generateLibrary(xml);
				}
			}else{
				message = '取得に失敗しました';
				showSpinner();
			}
			if (message) Snackbar.MaterialSnackbar.showSnackbar({message: message});
		}
	});
}

const isGrid = () => (localStorage.getItem('ViewMode') ?? 'grid') == 'grid';

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
	isGrid() ? $('#file').append(list) : $('#file ul').append(list);
	localStorage.setItem('sortOrder', order);
	localStorage.setItem('ascending', asc);
}

//ライブラリ表示
const generateLibrary = xml => {
	showSpinner(true);
	$('.library').empty();
	$('#folder').hide();
	isGrid() ? $('.library').addClass('list') : $('.library').removeClass('list');

	const folder = [];
	const file = [];
	const baseHash = [];
	let index;
	if (xml.find('entry').children('index').length > 0){
		index = xml.find('entry').children('index').text();
		baseHash.push({name: 'i', value: index});
	}
	const path = $.extend(true,[],baseHash);
	if (xml.find('entry').children('pathhash').length > 0)
		xml.find('pathhash').text().split(',').forEach((e) => baseHash.push({name: 'p', value: e}) );

	xml.find('dir, file').each((i, e) => {
		const name = $(e).children('name').text();
		const $elem = $((isGrid() ? '<div>' : '<li>'));
		const hash = $.extend(true,[],baseHash);
		if ($(e).find('index').length > 0) hash.push({name: 'i', value: $(e).find('index').text()});
		if ($(e).prop('tagName') == 'dir'){
			if (xml.find('entry').find('dirhash').length > 0) hash.push({name: 'p', value: xml.find('entry').find('dirhash').text()});
			if ($(e).find('hash').length > 0) hash.push({name: 'd', value: $(e).find('hash').text()});

			$elem.addClass('folder').click(() => location.hash = '#'+$.param(hash));
			isGrid()
				? $elem.addClass('mdl-button mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').append(
					$('<div>', {class: 'icon', html: $('<i>', {class: 'material-icons fill', text: 'folder'}) }),
					$('<div>', {class: 'foldername', text: name }) )
				: $elem.addClass('mdl-list__item').append(
					$('<span>', {class: 'mdl-list__item-primary-content', append: [
						$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'folder'}),
						$('<span>', {text: name}) ]}) );
			folder.push($elem);
		}else{
			if (xml.find('entry').find('dirhash').length > 0) hash.push({name: 'd', value: xml.find('entry').find('dirhash').text()});
			hash.push({name: 'h', value: $(e).find('hash').text()});

			$elem.addClass('item').data({
				name: name,
				date: $(e).children('date').text()*1000,
				public: $(e).children('public').length > 0,
			}).click(() => {
				showSpinner(true);
				$('#popup').addClass('is-visible');
				$('#playerUI').addClass('is-visible');
				$audios.prop('checked', false);
				$('#tvcast').animate({scrollTop:0}, 500, 'swing');
				$.get(root + 'api/Library', hash, (result, textStatus, xhr) => {
					showSpinner();
					var xml = $(xhr.responseXML);
					$elem.data('path', xml.find('path').text())
						.data('public', Number(xml.find('public').text()==1))
						.data('duration', Number(xml.find('duration').text()))
						.data('audio', Number(xml.find('audio').text()));
					playMovie($elem);
				});
			});

			var thumb = $(e).children('thumb').text();
			if (isGrid()){
				$elem.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp');
				(thumb != 0) 
					? $elem.css('background-image', 'url(\'' + root + 'video/thumbs/' + thumb +'.jpg'+ '\')').append($('<div>', {class: 'mdl-card__title mdl-card--expand'}) )
					: $elem.append($('<div>', {class: 'mdl-card__title mdl-card--expand icon'}), $('<i>', {class: 'material-icons', text: 'movie_creation'}) );
				$elem.append($('<div>', {class: 'mdl-card__actions', html: $('<span>', {class: 'filename', text: name}) }) );
			}else{
				var date = createViewDate($elem.data('date'));
				const avatar = (thumb != 0)
					? $('<i>', {class: 'mdl-list__item-avatar mdl-color--primary', style: 'background-image:url(\'' + root + 'video/thumbs/' + thumb +'.jpg'+ '\');'})
					: $('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'movie_creation'});
				$elem.addClass('mdl-list__item mdl-list__item--two-line').append(
					$('<span>', {class: 'mdl-list__item-primary-content', append: [
						avatar,
						$('<span>', {text: name}),
						$('<span>', {class: 'mdl-list__item-sub-title mdl-cell--hide-phone', text: $(e).find('size').text() +'MB '+ date.getUTCFullYear() +'/'+ ('0'+(date.getUTCMonth()+1)).slice(-2) +'/'+ ('0'+date.getUTCDate()).slice(-2) +' '+ ('0'+date.getUTCHours()).slice(-2) +':'+ ('0'+date.getUTCMinutes()).slice(-2) +':'+ ('0'+date.getUTCSeconds()).slice(-2)}) ]}) );
			}
			file.push($elem);
		}
	});

	isGrid()
		? $('#folder').show().append(folder)
		: $('#file').append($('<ul class="main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp">').append(folder));
	sortLibrary({file: file});

	let id;
	location.hash.split('&').forEach((e) => {
		if (e.match(/i=.*/)) id = 'index'+ index;
		if (e.match(/d=.*/)) {
			id = e.match(/d=(.*)/)[1];
			return;
		}
	});
	id = id ?? 'home';

	const dirname = xml.find('dirname').text();
	$('.mdl-layout__header-row .mdl-layout-title').text(dirname);
	if ($('#l_'+ id).length == 0){
		$('.path').html($('<span>', {id: 'l_home', class: 'mdl-layout__tab' +(dirname == 'ホーム' ? ' is-active' : ''), text: 'ホーム', data: {hash: ''}, click: () => location.hash = ''}) );

		if (xml.find('pathname').text().length > 0){
			xml.find('pathname').text().split('/').forEach((e, i) => {
				const dir = $.extend(true,[],path);
				let pathhash = 'index'+ index;
				if (xml.find('pathhash').text().length > 0){
					if (i >= 1){
						pathhash = xml.find('pathhash').text().split(',')[i-1];
						path.push({name: 'p', value: pathhash});
						dir.push({name: 'd', value: pathhash});
					}
				}
				$('.path').append('<i class="mdl-layout__tab material-icons">chevron_right').append($('<span>', {id: 'l_'+ pathhash, class: 'mdl-layout__tab', text: e, data: {hash: $.param(dir)}, click: () => location.hash = '#'+$.param(dir)}) );
			});
		}

		let dirhash = 'index'+ index;
		if (xml.find('dirhash').text().length > 0){
			dirhash = xml.find('dirhash').text();
			path.push({name: 'd', value: dirhash});
		}
		if (dirname != 'ホーム')
			$('.path').append('<i class="mdl-layout__tab material-icons">chevron_right').append($('<span>', {id: 'l_'+ dirhash, class: 'mdl-layout__tab is-active', text: dirname, data: {hash: $.param(path)}, click: () => location.hash = '#'+$.param(path)}) );
	}else{
		$('.mdl-layout__tab').removeClass('is-active');
		$('#l_' + id).addClass('is-active');
	}
	componentHandler.upgradeDom();
	showSpinner();
}

//表示切替
function toggleView(view){
	localStorage.setItem('ViewMode', view);
	$(isGrid() ? '.view-list' : '.view-grid').show();
	$(isGrid() ? '.view-grid' : '.view-list').hide();
	getMovieList();
}

$(window).on('load', function(){
	if ($(window).width() < 479){
		$('#subheader').hide().addClass('scroll');
		setInterval("$('#subheader').show()", 1000);
	}
});

$(function(){
	$(window).on('hashchange', function(){
		getMovieList();
	});
	getMovieList();

	$('#menu_autoplay').removeClass('hidden');
	$('#sort_'+order).addClass('mdl-color-text--accent');
	$(isGrid() ? '.view-grid' : '.view-list').hide();
	$(asc ? '#asc' : '#des').hide();
	$('[id^=sort_]').click(function(){
		$('[id^=sort_]').removeClass('mdl-color-text--accent');
		$(this).addClass('mdl-color-text--accent');
		sortLibrary($(this).data('val'));
	});
	$('#sort').click(function(){
		sortLibrary({asc: true});
		$('#sort span').toggle();
	});
	//スワイプ
	if (isTouch){
		delete Hammer.defaults.cssProps.userSelect;

		function librarySwipe(obj){
			if (obj.length > 0) location.hash = '#' + obj.data('hash');
		}
		$('.lib-swipe').hammer().on('swiperight', function(){
			librarySwipe( $('.mdl-layout__tab.is-active').prevAll('span:first') );
		});
		$('.lib-swipe').hammer().on('swipeleft', function(){
			librarySwipe( $('.mdl-layout__tab.is-active').nextAll('span:first') );
		});
	}

	$('#library-search').submit(function(){
		location.hash = '#search@' + $('#Key').val();
		return false;
	});

	$('#playprev').click(function(){
		if (!$(this).hasClass('is-disabled')) $('.playing').prev().click();
	});
	$('#playnext').click(function(){
		if (!$(this).hasClass('is-disabled')) $('.playing').next().click();
	});

	$('.thumbs').click(function(){
		showSpinner(true);
		Snackbar.MaterialSnackbar.showSnackbar({message: 'サムネの作成を開始します'});
		$.get(root + 'api/Library', $(this).data(), function(result, textStatus, xhr){
			showSpinner();
			Snackbar.MaterialSnackbar.showSnackbar({message: $(xhr.responseXML).find('info').text()});
		});
	});
});
