loadingMovieList = false;
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
					showSpinner(false);
				}else{
					var xml = new XMLSerializer().serializeToString(xml);
					sessionStorage.setItem('movie', xml);
					sessionStorage.setItem('movie_expires', new Date().getTime() + 24*60*60*1000);
					loadingMovieList = false;
					refreshPath = true;
					folder();
					if (Snack){
						message = '取得しました';
					}
				}
			}else{
				message = '取得に失敗しました';
				showSpinner(false);
			}
			if (message){
				$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: message});
			}
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

//ライブラリ表示
function folder(){
	id = location.hash == '' ? 'home' : location.hash.slice(1);
	if (!$('#' + id).length > 0){
		refreshPath = true;
	}
	$('.mdl-layout__tab').removeClass('is-active');
	$('#' + id).addClass('is-active');
	var notification = $('.mdl-js-snackbar').get(0);
	if (!loadingMovieList){
		showSpinner(true);
		$('#library').empty();
		if (ViewMode == 'grid'){
			$('#library').addClass('list');
		}else{
			$('#library').removeClass('list');
		}
		var found;
		var xml = sessionStorage.getItem('movie');
		var movie = new DOMParser().parseFromString(xml, 'text/xml');
		$(movie).find('dir').each(function(){
			if ($(this).children('id').text() == id){
				found=true;
				$(this).children('dir,file').each(function(){
					var name = $(this).children('name').text();
					var obj = $((ViewMode == 'grid' ? '<div>' : '<li>'));
					if ($(this).context.tagName == 'dir'){
						obj.addClass('folder').data('id', $(this).children('id').text());
			 			$(obj).click(function(){
							refreshPath = true;
			 				location.hash = '#'+$(this).data('id');
						});

						if (ViewMode == 'grid'){
							obj.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').attr('title', name).append(
								$('<div>', {class: 'mdl-card__title mdl-card--expand'}).append(
									$('<i>', {class: 'material-icons', text: 'folder'}) ) ).append(
								$('<div>', {class: 'mdl-card__actions'}).append(
									$('<span>', {class: 'filename', text: name}) ) );
						}else{
							obj.addClass('mdl-list__item').append(
								$('<span>', {class: 'mdl-list__item-primary-content'}).append(
									$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'folder'}) ).append(
									$('<span>', {text: name}) ) );
						}
					}else{
						var data = {
							name: name,
							path: $(this).children('path').text(),
							public: $(this).children('public').length > 0 ? root + $(this).children('public').text() : false
						}
						obj.addClass('item').data(data);
						$(obj).click(function(){
							$('#popup').addClass('is-visible');
							$('.bar').addClass('is-visible');
							playMovie($(this));
						});

						if (ViewMode == 'grid'){
							obj.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp').attr('title', name);
							var thumbs = $(this).children('thumbs').text();
							if (thumbs != 0){
								obj.css('background-image', 'url(\'' + root + 'thumbs/' + thumbs + '\')').append($('<div>', {class: 'mdl-card__title mdl-card--expand'}) );
							}else{
								obj.append($('<div>', {class: 'mdl-card__title mdl-card--expand icon'}).append($('<i>', {class: 'material-icons', text: 'movie_creation'}) ) );
							}
							obj.append($('<div>', {class: 'mdl-card__actions'}).append($('<span>', {class: 'filename', text: name}) ) );
						}else{
							obj.addClass('mdl-list__item').append(
								$('<span>', {class: 'mdl-list__item-primary-content'}).append(
									$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'movie_creation'}) ).append(
									$('<span>', {text: name}) ) );
						}
					}
					$('#library').append(obj);
				});
				$('#library li').wrapAll('<ul class="main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp">');

				var name = $(this).children('name').text()
				$('.mdl-layout__header-row .mdl-layout-title').text(name);
				if (refreshPath){
					var obj = $(this);
					var i = $(this).children('id').text();

					var add = $('<span>', {id: i, class: 'mdl-layout__tab is-active', text: name, data: {id: i} });
			 		$(add).click(function(){
			 			location.hash = '#'+$(this).data('id');
					});
					$('.path').html(add);
					while (i.match(/\d+/g)){
						i = obj.siblings('id').text();
						var add = $('<span>', {id: i, class: 'mdl-layout__tab', text: obj.siblings('name').text(), data: {id: i} });
			 			$(add).click(function(){
			 				location.hash = '#'+$(this).data('id');
						});
						$('.path').prepend('<i class="mdl-layout__tab material-icons">chevron_right').prepend(add);
						obj = obj.parent();
					}
					if (i != 'home'){
						var add = $('<span>', {id: 'home', class: 'mdl-layout__tab', text: 'ホーム', data: {id: 'home'} });
			 			$(add).click(function(){
			 				location.hash = '#home';
						});
						$('.path').prepend('<i class="mdl-layout__tab material-icons">chevron_right').prepend(add);
					}
					refreshPath = false;
				}
			}
		});
		componentHandler.upgradeDom();
		showSpinner(false);
		if (!found){
			notification.MaterialSnackbar.showSnackbar({message: 'フォルダが見つかりませんでした。', timeout: 1000});
			var data = {
				message: 'リストを再取得しますか？',
				actionHandler: function(event) {
					getMovieList(true);
				},
				actionText: '再取得'
			};
			notification.MaterialSnackbar.showSnackbar(data);
		}
	}else{
		notification.MaterialSnackbar.showSnackbar({message: 'リスト取得中です。', timeout: 1000});
	}
}

//表示切替
function toggleView(view){
	ViewMode=view;
	localStorage.setItem('ViewMode', view)
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
	if (obj.length > 0){
		location.hash = '#' + obj.data('id');
	}
}

function librarySearch(key){
		if (key.length > 0){ 
			$('#library').empty();
			var found;
			var xml = sessionStorage.getItem('movie');
			var movie = new DOMParser().parseFromString(xml, 'text/xml');
			var library = $('<div>', {id: 'library', class: 'mdl-grid'});
			if (ViewMode == 'grid'){
				library.addClass('list');
			}
			$(movie).find('file').each(function(){
				var name = $(this).children('name').text();
				if (name.match(key)){
					var data = {
						name: name,
						path: $(this).children('path').text(),
						public: $(this).children('public').length > 0 ? root + $(this).children('public').text() : false
					};
					var event = function(){
						$('#popup').addClass('is-visible');
						$('.bar').addClass('is-visible');
						playMovie($(this));
					};
					var obj = $((ViewMode == 'grid' ? '<div>' : '<li>'), {class: 'item', data: data, on: {click: event} });

					if (ViewMode == 'grid'){
						obj.addClass('mdl-card mdl-js-button mdl-js-ripple-effect mdl-cell mdl-cell--2-col mdl-shadow--2dp');
						var thumbs = $(this).children('thumbs').text();
						if (thumbs != 0){
							obj.css('background-image', 'url(\'' + root + 'thumbs/' + thumbs + '\')').append($('<div>', {class: 'mdl-card__title mdl-card--expand'}) );
						}else{
							obj.append($('<div>', {class: 'mdl-card__title mdl-card--expand icon'}).append($('<i>', {class: 'material-icons', text: 'movie_creation'}) ) );
						}
						obj.append($('<div>', {class: 'mdl-card__actions'}).append($('<span>', {class: 'filename', text: name}) ) );
					}else{
						obj.addClass('mdl-list__item').append(
							$('<span>', {class: 'mdl-list__item-primary-content'}).append(
								$('<i>', {class: 'material-icons mdl-list__item-avatar mdl-color--primary', text: 'movie_creation'}) ).append(
								$('<span>', {text: name}) ) );
					}
					library.append(obj);
				}
			});
			$('main').html(library);
			$('#library li').wrapAll('<ul class="main-content mdl-list mdl-cell mdl-cell--12-col mdl-shadow--4dp">');
			$('.mdl-layout__header-row .mdl-layout-title').text('検索 (' + key + ')');
			$('.path').html($('<span>', {id: 'home', class: 'mdl-layout__tab', text: 'ホーム', data: {id: 'home'}, on: {click: function(){location.hash = '#home';} } }) ).append(
				'<i class="mdl-layout__tab material-icons">chevron_right').append(
				$('<span>', {id: 'search_', class: 'mdl-layout__tab is-active', text: '検索', data: {id: 'search'}, on: {click: function(){location.hash = '#search@'+ key;} } }) );
			showSpinner(false);
		}
}

$(function(){
	$(window).on('hashchange', function(){
		if (location.hash.slice(0,8) != '#search@'){
			folder();
		}else{
			librarySearch(location.hash.slice(8));
		}
	});
	$(window).on('load', function(){
		if ($(window).width() < 479){
			$('#subheader').hide().addClass('scroll');
			setInterval("$('#subheader').show()",1000)
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
});
