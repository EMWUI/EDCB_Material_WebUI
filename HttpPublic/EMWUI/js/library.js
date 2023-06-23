﻿var loadingMovieList;
//ライブラリ一覧取得
function getMovieList(Snack){
	loadingMovieList = true;
	showSpinner(true);
	$.ajax({
		url: root + 'api/Library',
		success: function(result, textStatus, xhr){
			var message;
			if (xhr.responseXML){
				var xml = xhr.responseXML;
				if ($(xml).find('error').length > 0){
					message = $(xml).find('error').text();
					showSpinner();
				}else{
					xml = new XMLSerializer().serializeToString(xml);
					sessionStorage.setItem('movie', xml);
					sessionStorage.setItem('movie_expires', new Date().getTime() + 24*60*60*1000);
					loadingMovieList = false;
					refreshPath = true;
					folder();
					if (Snack) message = '更新しました';
				}
			}else{
				message = '更新に失敗しました';
				showSpinner();
			}
			if (message) Snackbar.MaterialSnackbar.showSnackbar({message: message});
		},
		complete: function(){
			loadingMovieList = false;
		}
	});
}

//ライブラリ一覧再取得
function refreshMovieList(){
	location.hash = '';
	getMovieList(true);
}

var order = localStorage.getItem('sortOrder') ? localStorage.getItem('sortOrder') : 'name';
var asc = localStorage.getItem('ascending') ? localStorage.getItem('ascending') == 'true' : true;
function sort(a){
	var list;
	if (typeof a == 'object'){
		list = a;
	}else{
		list = $('.item').clone(true);
		$('.item').remove();

		if (typeof a == 'string'){
			order = a;
			localStorage.setItem('sortOrder', order);
		}else if (a === true){
			asc = !asc;
			localStorage.setItem('ascending', asc);
		}
	}
	list.sort(function(a,b){
		if (order == 'date'){
			if (asc){
				return $(a).data().date - $(b).data().date;
			}else{
				return $(b).data().date - $(a).data().date;
			}
		}else if (order == 'name'){
			if (asc){
				return $(a).data().name > $(b).data().name ? 1 : -1;
			}else{
				return $(a).data().name > $(b).data().name ? -1 : 1;
			}
		}
	});
	if (ViewMode == 'grid') {
		$('#file').append(list);
	}else{
		$('#file ul').append(list);
	}
}

//ライブラリ表示
function folder(){
	id = location.hash == '' ? 'home' : location.hash.slice(1);
	if ($('#' + id).length == 0) refreshPath = true;

	$('.mdl-layout__tab').removeClass('is-active');
	$('#' + id).addClass('is-active');
	if (!loadingMovieList){
		showSpinner(true);
		$('.library').empty();
		$('#folder').hide();
		if (ViewMode == 'grid'){
			$('.library').addClass('list');
		}else{
			$('.library').removeClass('list');
		}
		var found;
		var folder = [];
		var file = [];
		var xml = sessionStorage.getItem('movie');
		var movie = new DOMParser().parseFromString(xml, 'text/xml');
		$(movie).find('dir').each(function(){
			if ($(this).children('id').text() == id){
				found = true;
				$(this).children('dir, file').each(function(){
					var name = $(this).children('name').text();
					var obj = $((ViewMode == 'grid' ? '<div>' : '<li>'));
					if ($(this).prop('tagName') == 'dir'){
						obj.addClass('folder').data('id', $(this).children('id').text());
			 			$(obj).click(function(){
							refreshPath = true;
			 				location.hash = '#'+$(this).data('id');
						});

						if (ViewMode == 'grid'){
							obj.addClass('mdl-button mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').append(
								$('<div>', {class: 'icon', html: $('<i>', {class: 'material-icons', text: 'folder'}) }),
								$('<div>', {class: 'foldername', text: name }) );
						}else{
							obj.addClass('mdl-list__item mdl-list__item--two-line').append(
								$('<span>', {class: 'mdl-list__item-primary-content', append: [
									$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'folder'}),
									$('<span>', {text: name}),
									$('<span>', {class: 'mdl-list__item-sub-title', text: $(this).children('dir').length +'フォルダ, '+$(this).children('file').length +'ファイル'}) ]}) );
						}
						folder.push(obj);
					}else{
						var data = {
							name: name,
							path: $(this).children('path').text(),
							date: $(this).children('date').text()*1000,
							public: $(this).children('public').length > 0
						};
						obj.addClass('item').data(data);
						$(obj).click(function(){
							$('#popup').addClass('is-visible');
							$('#playerUI').addClass('is-visible');
							$('.audio').prop('checked', false);
							$('#tvcast').animate({scrollTop:0}, 500, 'swing');
							playMovie($(this));
						});

						var thumbs = $(this).children('thumbs').text();
						if (ViewMode == 'grid'){
							obj.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp');
							if (thumbs != 0){
								obj.css('background-image', 'url(\'' + root + 'video/thumbs/' + thumbs + '\')').append($('<div>', {class: 'mdl-card__title mdl-card--expand'}) );
							}else{
								obj.append($('<div>', {class: 'mdl-card__title mdl-card--expand icon'}), $('<i>', {class: 'material-icons', text: 'movie_creation'}) );
							}
							obj.append($('<div>', {class: 'mdl-card__actions', html: $('<span>', {class: 'filename', text: name}) }) );
						}else{
							var avatar;
							var date = createViewDate(data.date);
							if (thumbs != 0){
								avatar = $('<i>', {class: 'mdl-list__item-avatar mdl-color--primary', style: 'background-image:url(\'' + root + 'video/thumbs/' + thumbs + '\');'});
							}else{
								avatar = $('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'movie_creation'});
							}
							obj.addClass('mdl-list__item mdl-list__item--two-line').append(
								$('<span>', {class: 'mdl-list__item-primary-content', append: [
									avatar,
									$('<span>', {text: name}),
									$('<span>', {class: 'mdl-list__item-sub-title mdl-cell--hide-phone', text: date.getUTCFullYear() +'/'+ ('0'+(date.getUTCMonth()+1)).slice(-2) +'/'+ ('0'+date.getUTCDate()).slice(-2) +' '+ ('0'+date.getUTCHours()).slice(-2) +':'+ ('0'+date.getUTCMinutes()).slice(-2) +':'+ ('0'+date.getUTCSeconds()).slice(-2)}) ]}) );
						}
						file.push(obj);
					}
				});

				if (ViewMode == 'grid') {
					$('#folder').show().append(folder);
				}else{
					$('#file').append($('<ul class="main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp">').append(folder));
				}
				sort(file);

				var name = $(this).children('name').text();
				$('.mdl-layout__header-row .mdl-layout-title').text(name);
				if (refreshPath){
					var obj = $(this);
					var i = $(this).children('id').text();

					$('.path').html($('<span>', {id: i, class: 'mdl-layout__tab is-active', text: name, data: {id: i}, click: function(){location.hash = '#'+$(this).data('id');} }) );
					while (i.match(/\d+/g)){
						i = obj.siblings('id').text();
						$('.path').prepend('<i class="mdl-layout__tab material-icons">chevron_right').prepend($('<span>', {id: i, class: 'mdl-layout__tab', text: obj.siblings('name').text(), data: {id: i}, click: function(){location.hash = '#'+$(this).data('id');} }) );
						obj = obj.parent();
					}
					if (i != 'home') $('.path').prepend('<i class="mdl-layout__tab material-icons">chevron_right').prepend($('<span>', {id: 'home', class: 'mdl-layout__tab', text: 'ホーム', data: {id: 'home'}, click: function(){location.hash = '#home';} }) );
					refreshPath = false;
				}
			}
		});
		componentHandler.upgradeDom();
		showSpinner();
		if (!found){
			Snackbar.MaterialSnackbar.showSnackbar({message: 'フォルダが見つかりませんでした。', timeout: 1000});
			var data = {
				message: 'ライブラリを更新しますか？',
				actionHandler: function(event) {
					getMovieList(true);
				},
				actionText: '更新'
			};
			Snackbar.MaterialSnackbar.showSnackbar(data);
		}
	}else{
		Snackbar.MaterialSnackbar.showSnackbar({message: 'ライブラリを更新中です。', timeout: 1000});
	}
}

//表示切替
function toggleView(view){
	ViewMode = view;
	localStorage.setItem('ViewMode', view);
	if (ViewMode == 'grid'){
		$('.view-list').show();
		$('.view-grid').hide();
	}else{
		$('.view-grid').show();
		$('.view-list').hide();
	}
	if (location.hash.slice(0,8) != '#search@'){
		folder();
	}else{
		librarySearch(location.hash.slice(8));
	}
}

//スワイプ処理
function librarySwipe(obj){
	if (obj.length > 0) location.hash = '#' + obj.data('id');
}

function librarySearch(key){
		if (key.length > 0){
			key = decodeURI(key);
			var found;
			var file = [];
			var xml = sessionStorage.getItem('movie');
			var movie = new DOMParser().parseFromString(xml, 'text/xml');
			$('.library').empty();
			if (ViewMode == 'grid'){
				$('.library').addClass('list') ;
			}else{
				$('.library').removeClass('list');
			}

			$(movie).find('file').each(function(){
				var name = $(this).children('name').text();
				if (name.match(key)){
					var data = {
						name: name,
						path: $(this).children('path').text(),
						date: $(this).children('date').text()*1000,
						public: $(this).children('public').length > 0
					};
					var event = function(){
						$('#popup').addClass('is-visible');
						$('#playerUI').addClass('is-visible');
						$('.audio').prop('checked', false);
						playMovie($(this));
					};
					var obj = $((ViewMode == 'grid' ? '<div>' : '<li>'), {class: 'item', data: data, click: event });

					var thumbs = $(this).children('thumbs').text();
					if (ViewMode == 'grid'){
						obj.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp');
						if (thumbs != 0){
							obj.css('background-image', 'url(\'' + root + 'video/thumbs/' + thumbs + '\')').append($('<div>', {class: 'mdl-card__title mdl-card--expand'}) );
						}else{
							obj.append($('<div>', {class: 'mdl-card__title mdl-card--expand icon'}), $('<i>', {class: 'material-icons', text: 'movie_creation'}) );
						}
						obj.append($('<div>', {class: 'mdl-card__actions', html: $('<span>', {class: 'filename', text: name}) }) );
					}else{
						var avatar;
						var date = createViewDate(data.date);
						if (thumbs != 0){
							avatar = $('<i>', {class: 'mdl-list__item-avatar mdl-color--primary', style: 'background-image:url(\'' + root + 'video/thumbs/' + thumbs + '\');'});
						}else{
							avatar = $('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'movie_creation'});
						}
						obj.addClass('mdl-list__item mdl-list__item--two-line').append(
							$('<span>', {class: 'mdl-list__item-primary-content', append: [
								avatar,
								$('<span>', {text: name}),
								$('<span>', {class: 'mdl-list__item-sub-title mdl-cell--hide-phone', text: date.getUTCFullYear() +'/'+ ('0'+(date.getUTCMonth()+1)).slice(-2) +'/'+ ('0'+date.getUTCDate()).slice(-2) +' '+ ('0'+date.getUTCHours()).slice(-2) +':'+ ('0'+date.getUTCMinutes()).slice(-2) +':'+ ('0'+date.getUTCSeconds()).slice(-2)}) ]}) );
					}
					file.push(obj);
				}
			});

			if (ViewMode != 'grid') $('#file').append('<ul class="main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp">');
			sort(file);

			$('.mdl-layout__header-row .mdl-layout-title').text('検索 (' + key + ')');
			$('.path').html($('<span>', {id: 'home', class: 'mdl-layout__tab', text: 'ホーム', data: {id: 'home'}, click: function(){location.hash = '#home';} }) ).append(
				$('<i>', {class: 'mdl-layout__tab material-icons', text: 'chevron_right'}),
				$('<span>', {id: 'search_', class: 'mdl-layout__tab is-active', text: '検索', data: {id: 'search'}, click: function(){location.hash = '#search@'+ key;} }) );
			showSpinner();
		}
}

$(window).on('load', function(){
	if ($(window).width() < 479){
		$('#subheader').hide().addClass('scroll');
		setInterval("$('#subheader').show()", 1000);
	}
});

$(function(){
	$(window).on('hashchange', function(){
		if (location.hash.slice(0,8) != '#search@'){
			folder();
		}else{
			librarySearch(location.hash.slice(8));
		}
	});

	//ライブラリ一覧有無確認
	ViewMode = localStorage.getItem('ViewMode') ? localStorage.getItem('ViewMode') : 'grid';
	if (!sessionStorage.getItem('movie') || sessionStorage.getItem('movie_expires') - new Date().getTime() < 0){
		getMovieList();
	}else{
		refreshPath = true;
		if (location.hash.slice(0,8) != '#search@'){
			folder();
		}else{
			librarySearch(location.hash.slice(8));
		}
	}
	if (ViewMode == 'grid'){
		$('.view-grid').hide();
	}else{
		$('.view-list').hide();
	}

	$('#menu_autoplay').removeClass('hidden');
	$('#sort_'+order).addClass('mdl-color-text--accent');
	$('#'+ (asc ? 'asc' : 'des')).hide();
	$('[id^=sort_]').click(function(){
		$('[id^=sort_]').removeClass('mdl-color-text--accent');
		$(this).addClass('mdl-color-text--accent');
		sort($(this).data('val'));
	});
	$('#sort').click(function(){
		sort(true);
		$('#sort span').toggle();
	});
	//スワイプ
	if (isTouch){
		delete Hammer.defaults.cssProps.userSelect;

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
		if (!$(this).hasClass('is-disabled')) playMovie($('.playing').prev());
	});
	$('#playnext').click(function(){
		if (!$(this).hasClass('is-disabled')) playMovie($('.playing').next());
	});

	$('.thumbs').click(function(){
		showSpinner(true);
		Snackbar.MaterialSnackbar.showSnackbar({message: 'サムネの作成を開始します'});
		$.get(root + 'api/Library', $(this).data(), function(result, textStatus, xhr){
			var xml = $(xhr.responseXML);
			showSpinner();
			Snackbar.MaterialSnackbar.showSnackbar({message: xml.find('info').text()});
			Snackbar.MaterialSnackbar.showSnackbar({message: 'ライブラリを更新します'});
			getMovieList(true);
		});
	});
});
