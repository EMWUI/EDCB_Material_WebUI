let PresetList, ReserveAutoaddList;
const isMobile = navigator.userAgentData ? navigator.userAgentData.mobile : navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/);
const isTouch = 'ontouchstart' in window;
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const isSmallScreen = () => window.matchMedia(window.MaterialLayout.prototype.Constant_.MAX_WIDTH).matches;
const showSpinner = (visible = false) => $('#spinner .mdl-spinner').toggleClass('is-active', visible);
const errMessage = xml => xml.find('err').each((i, e) => Snackbar({message: `${i==0 ? 'Error : ' : ''}${$(e).text()}`}));
const zero = (e, n) => (Array(n ? n : 2).join('0')+e).slice(-(n ? n : 2));
let Snackbar = d => setTimeout(() => Snackbar(d), 1000);

$.fn.extend({
	mdl_prop: function(prop, enable){
		this.prop(prop, enable).parent().toggleClass(`is-${prop}`, enable);
		return this;
	},
	txt: function(a){
		return this.children(a).text();
	},
	num: function(a){
		return Number(this.txt(a));
	},
});


//検索バー表示
const saerchbar = () => $('main>.mdl-layout__content').scroll(() => {
	$('.serch-bar').toggleClass('scroll', !$('main>.mdl-layout__content').scrollTop() > 0);
	$('main').toggleClass('serch-bar', $('main>.mdl-layout__content').scrollTop() > 0);
});

//検索等のリンクを生成
const createSearchLinks = e => {
	const $e = $(e).find('.search-links');
	if ($e.length != 1 || $e.is('.search-links-created')) return;

	const d = $e.data();
	const title = encodeURIComponent(d.title);
	const service = encodeURIComponent(d.service);
	const dates = encodeURIComponent(d.dates);
	const details = encodeURIComponent(d.details.replace(/%br%/g, '\n'));
	$e.addClass('search-links-created').after(`
		<a class="mdl-button mdl-button--icon" href="search.html?andkey=${title}"><i class="material-icons">search</i></a>
		<a class="mdl-button mdl-button--icon" href="https://www.google.co.jp/search?q=${title}" target="_blank"><img class="material-icons" src="img/google.png" alt="Google検索"></a>
		<a class="mdl-button mdl-button--icon" href="https://www.google.co.jp/search?q=${title}&amp;btnI=Im+Feeling+Lucky" target="_blank"><i class="material-icons">sentiment_satisfied</i></a>
		<a class="mdl-button mdl-button--icon mdl-cell--hide-phone mdl-cell--hide-tablet" href="https://www.google.com/calendar/render?action=TEMPLATE&amp;text=${title}&amp;location=${service}&amp;dates=${dates}&amp;details=${details}${calendar_op}" target="_blank"><i class="material-icons">event</i></a>
	`);
}


//表示用に時間シフトしたDateオブジェクトを生成
const createViewDate = value => {
	if (value === undefined) value =  new Date();
	if (typeof value !== 'elemect') value = new Date(value);
	return new Date(value.getTime() + 9 * 3600000);
}
const ConvertTime = (t, show_sec, show_ymd) => {
	if (!t)	return '未定';
	t = createViewDate(t);
	return `${show_ymd ? `${t.getUTCFullYear()}/${zero(t.getUTCMonth()+1)}/${zero(t.getUTCDate())}(${WEEK[t.getUTCDay()]}) ` : ''
		}${zero(t.getUTCHours())}:${zero(t.getUTCMinutes())}${show_sec && t.getUTCSeconds() != 0 ? `<small>:${zero(t.getUTCSeconds())}</small>` : ''}`;
}
const ConvertText = a => !a ? '' : a.replace(/(https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1" target="_blank">$1</a>').replace(/\n/g,'<br>');
const ConvertTitle = a => !a ? '' : a.replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g, '<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>');
const ConvertService = d => `<img class="logo" src="${ROOT}api/logo?onid=${d.onid}&sid=${d.sid}"><span>${d.service}</span>`;

const Notify = {
	sound: new Audio(`${ROOT}video/notification.mp3`),
	badge: () => {				//通知バッチ
		const count = $('[id^=notify_]').length;
		$('#notification i').toggleClass('mdl-badge', count != 0).text(`notifications${count==0 ? '_none' : ''}`);
		$('#noNotify').toggle(count == 0);
		$('#notification i').attr('data-badge', count);
	},
	save: (d, remove) => {		//通知保存
		const list = localStorage.getItem('notifications') ? JSON.parse(localStorage.getItem('notifications')) : new Array();
		!remove ? list.push(d) : list.some((v, i) => {if (v.eid == d.eid) list.splice(i,1);});
		localStorage.setItem('notifications', JSON.stringify(list));
	},
	del: (d, noSnack) => {		//通知リスト削除
		clearTimeout(d.timer);
		Notify.save(d, true);
		$(`.eid_${d.eid}.notify_icon,#notify_${d.eid}`).remove();
		$(`.notify_${d.eid}`).data('notification', false).children().text('add_alert');

		Notify.badge();
		if (!noSnack) Snackbar({message: '削除しました'});
	},
	create: (d, save) => {		//通知登録
		if (save){
			Notify.save(d);
			Snackbar({message: '追加しました'});
		}

		d.timer = setTimeout(() => {
			Notify.del(d, true);
			$(`.notify_${d.eid}`).children().text('notifications');

			$.get(`${ROOT}api/EnumEventInfo`, {id: `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`}).done(xml => {
				const d = toObj.EpgInfo($(xml).find('eventinfo').first());
				const notification = new Notification(d.title, {
					body: `${ConvertTime(d.starttime)}～ ${d.service}\n${d.text}`,
					tag: `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`,
					icon: 'img/apple-touch-icon.png'
				});

				notification.onclick = e => {
					e.preventDefault();
					location.href=`epginfo.html?onid=${d.onid}&tsid=${d.tsid}&sid=${d.sid}&eid=${d.eid}`;
					notification.close();
				};

				Notify.sound.play();

				setTimeout(() => notification.close(), 15*1000);	//通知を閉じる
			});
		}, d.starttime - Date.now() - 30*1000);

		$(`.eid_${d.eid}.startTime`).after($('<div class="notify_icon"><i class="material-icons">notifications_active</i></div>'));
		$(`.notify_${d.eid}`).data('notification', true).children().text('notifications_off');

		const date = createViewDate(d.starttime);

		const $notifyList = $('<li>', {id: `notify_${d.eid}`, class: 'mdl-list__item mdl-list__item--two-line', data: {start: d.starttime}, append: [
			$('<span>', {class: 'mdl-list__item-primary-content', click: () => location.href = `epginfo.html?id=${d.onid}-${d.tsid}-${d.sid}-${d.eid}`, append: [
				$('<span>', {html: d.title}),
				$('<span>', {class: 'mdl-list__item-sub-title', text: `${zero(date.getUTCMonth()+1)}/${zero(date.getUTCDate())}(${WEEK[date.getUTCDay()]}) ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())} ${d.service}`}) ]}),
			$('<span>', {class: 'mdl-list__item-secondary-content', append: [
				$('<button>', {
					class: 'mdl-list__item-secondary-action mdl-button mdl-js-button mdl-button--icon',
					html: $('<i>', {class: 'material-icons', text: 'notifications_off'}),
					click: () => Notify.del(d) }) ]}) ]});

		let done;
		$('#notifylist li').each((i, e) => {
			if (d.starttime >= $(e).data('start')) return true;	//開始時間でソート

			done = true;
			$(e).before($notifyList);
			return false;
		});
		if (!done) $('#notifylist').append($notifyList);

		Notify.badge();
	}
}
Notify.sound.volume = 0.2;

//XMLをオブジェクト化
const toObj = {
	EpgInfo: (e, recinfo) => {
		const d = {
			onid: e.num('ONID'),
			tsid: e.num('TSID'),
			sid:  e.num('SID'),
			eid:  e.num('eventID'),
			service: e.txt('service_name'),

			starttime: new Date(`${e.txt('startDate').replace(/\//g,'-')}T${e.txt('startTime')}+09:00`).getTime(),
			duration: e.num('duration'),

			title: e.children('event_name').length ? e.txt('event_name') : e.txt('title'),
			text: e.txt('event_text'),
			text_ext: e.txt('event_ext_text'),

			freeCAFlag: e.num('freeCAFlag') == 1,

			genre: e.children('contentInfo').get().map(e => {
				return {
					nibble1: $(e).num('nibble1'),
					nibble2: $(e).num('nibble2'),
					component_type_name: $(e).txt('component_type_name')
				}
			}),
			video: e.children('videoInfo').get().map(e => {
				return {
					stream_content: $(e).num('stream_content'),
					component_type: $(e).num('component_type'),
					component_tag: $(e).num('component_tag'),
					text: $(e).txt('text'),
					component_type_name: $(e).txt('component_type_name')
				}
			}),
			audio: e.children('audioInfo').get().map(e => {
				return {
					stream_content: $(e).num('stream_content'),
					component_type: $(e).num('component_type'),
					component_tag: $(e).num('component_tag'),
					stream_type: $(e).num('stream_type'),
					simulcast_group_tag: $(e).num('simulcast_group_tag'),
					ES_multi_lingual: $(e).num('ES_multi_lingual_flag') == 1,
					main_component: $(e).num('main_component_flag') == 1,
					quality_indicator: $(e).txt('quality_indicator'),
					sampling_rate: $(e).txt('sampling_rate'),
					text: $(e).txt('text'),
					component_type_name: $(e).txt('component_type_name')
				}
			})
		}
		if (d.duration) d.endtime = new Date(d.starttime + d.duration*1000).getTime();

		if (recinfo){
			d.recinfoid = e.num('ID');
			const programInfo = e.txt('programInfo').match(/^[\s\S]*?\n\n([\s\S]*?)\n+(?:詳細情報\n)?([\s\S]*?)\n+ジャンル : \n([\s\S]*)\n\n映像 : ([\s\S]*)\n音声 : ([\s\S]*?)\n\n([\s\S]*)\n$/);
			if (programInfo){
				d.text = programInfo[1];
				d.text_ext = programInfo[2];
				d.genre = programInfo[3];
				d.video = programInfo[4];
				d.audio = programInfo[5];
				d.other = programInfo[6].replace(/\n\n/g,'\n');
			}
			d.recFilePath = e.txt('recFilePath');
			d.comment = e.txt('comment');
			d.drops = e.txt('drops');
			d.scrambles = e.txt('scrambles');
			d.errInfo = e.txt('errInfo');
			d.protect = e.num('protect') == 1;
		}

		return d;
	},
	RecSet: e => {
		r = e.children('recsetting');
		const d = {
			id: e.num('ID') || e.num('id'),
			recMode: r.num('recMode'),
			priority: r.num('priority'),
			tuijyuuFlag: r.num('tuijyuuFlag') == 1,
			serviceMode: r.num('serviceMode'),
			pittariFlag: r.num('pittariFlag') == 1,
			batFilePath: r.txt('batFilePath'),
			suspendMode: r.num('suspendMode'),
			rebootFlag: r.num('rebootFlag') == 1,
			useMargineFlag: r.num('useMargineFlag') == 1,
			startMargine: r.num('startMargine'),
			endMargine: r.num('endMargine'),
			continueRecFlag: r.num('continueRecFlag') == 1,
			partialRecFlag: r.num('partialRecFlag') == 1,
			tunerID: r.num('tunerID'),
			recFolderList: r.children('recFolderList').children('recFolderInfo').get().map(e => {
				return {
					recFolder: $(e).txt('recFolder'),
					writePlugIn: $(e).txt('writePlugIn'),
					recNamePlugIn: $(e).txt('recNamePlugIn')
				}
			}),
			partialRecFolder: r.children('partialRecFolder').children('recFolderInfo').get().map(e => {
				return {
					recFolder: $(e).txt('recFolder'),
					writePlugIn: $(e).txt('writePlugIn'),
					recNamePlugIn: $(e).txt('recNamePlugIn')
				}
			}),
		}

		if (e.children('name').length){ 										//プリセット
			d.name = e.txt('name');
			PresetList[d.id] = d;
		}else if (e.txt('eventID') == 65535 || e.children('ONID').length){ 		//予約
			d.title = e.txt('title');
			d.starttime = new Date(`${e.txt('startDate').replace(/\//g,'-')}T${e.txt('startTime')}+09:00`).getTime(),
			d.duration = e.num('duration');
			if (d.duration) d.endtime = new Date(d.starttime + d.duration*1000).getTime();
			d.service = e.txt('service_name');
			d.onid = e.num('ONID');
			d.tsid = e.num('TSID');
			d.sid = e.num('SID');
			d.eid = e.num('eventID');
			d.commen = e.txt('commen');
			d.overlapMode = e.num('overlapMode');
			const id = e.num('eventID') == 65535 ? d.id : `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`;
			if (ReserveAutoaddList) ReserveAutoaddList[id] = d;
		}else{
			ReserveAutoaddList[d.id].recSetting = d;
		}

		return d
	},
	Search: e => {
		const id = $(e).num('ID');
		e = $(e).children('searchsetting');
		const d = {
			disableFlag: e.num('disableFlag') == 1,
			andKey: e.txt('andKey'),
			notKey: e.txt('notKey'),
			note: e.txt('note'),
			regExpFlag: e.num('regExpFlag') == 1,
			aimaiFlag: e.num('aimaiFlag') == 1,
			titleOnlyFlag: e.num('titleOnlyFlag') == 1,
			caseFlag: e.num('caseFlag') == 1,

			contentList: e.children('contentList').get().map(e => {
				return {
					content_nibble: $(e).num('content_nibble'),
					user_nibble: $(e).num('user_nibble')
				}
			}),
			notContetFlag: e.txt('notContetFlag') == 1,
			serviceList: e.children('serviceList').get().map(e => {
				return {
					onid: $(e).num('onid'),
					tsid: $(e).num('tsid'),
					sid: $(e).num('sid')
				}
			}),
			dateList: e.children('dateList').get().map(e => {
				return {
					startDayOfWeek: $(e).num('startDayOfWeek'),
					startMin: $(e).num('startMin'),
					startHour: $(e).num('startHour'),
					endDayOfWeek: $(e).num('endDayOfWeek'),
					endHour: $(e).num('endHour'),
					endMin: $(e).num('endMin')
				}
			}),

			notDateFlag: e.num('notDateFlag') == 1,
			freeCAFlag: e.num('freeCAFlag'),
			chkDurationMin: e.num('chkDurationMin'),
			chkDurationMax: e.num('chkDurationMax'),
			chkRecEnd: e.num('chkRecEnd') == 1,
			chkRecNoService: e.num('chkRecNoService') == 1,
			chkRecDay: e.num('chkRecDay')
		}

		ReserveAutoaddList[id].SearchSettting = d;

		return d;
	}
}

//各リストを取得
const getList = {
	fetch: (url, n, fn, addList) => {
		$.get(`${ROOT}api/Common`, {notify: n}).done(xml => {
			const Count = $(xml).find('info').text();
			if (ReserveAutoaddList && Count == Notify.count){
				fn();
			}else{
				Notify.count = Count;
				$.get(url).done(xml => addList($(xml)));
			}
		});
	},
	Reserve: fn => {
		getList.fetch(`${ROOT}api/EnumReserveInfo`, 2, fn, xml => {
			ReserveAutoaddList = {};
			xml.find('reserveinfo').each((i, e) => {
				const id = $(e).num('eventID') == 65535 ? $(e).num('ID') : `${$(e).num('ONID')}-${$(e).num('TSID')}-${$(e).num('SID')}-${$(e).num('eventID')}`;
				ReserveAutoaddList[id] = $(e);
			});
			fn();
		});
	},
	AutoAdd: fn => {
		getList.fetch(`${ROOT}api/EnumAutoAdd`, 4, fn, xml => {
			ReserveAutoaddList = {};
			xml.find('autoaddinfo').each((i, e) => ReserveAutoaddList[$(e).num('ID')] = $(e));
			fn();
		});
	},
	Preset: fn => {
		if (PresetList){
			fn();
		}else{
			$.get(`${ROOT}api/EnumRecPreset`).done(xml => {
				PresetList = {};
				$(xml).find('recpresetinfo').each((i, e) => PresetList[$(e).num('id')] = $(e));
				fn();
			});
		}
	}
}

//番組詳細を反映
const setEpgInfo = d => {
	if (!d.onid) d = toObj.EpgInfo(d);

	$('#title').html( ConvertTitle(d.title) );

	if (d.starttime){
		$('#info_date').html(`${ConvertTime(d.starttime, true, true)}～${ConvertTime(d.endtime, true)}`);
		progReserve(d);
	}else{
		$('#info_date').html('未定');
	}
	$('#sidePanel .mdl-tabs__tab-bar,#sidePanel .mdl-card__actions').toggle(d.recinfoid && true || d.starttime && !d.endtime || Date.now() < d.endtime);

	$('#service').html(ConvertService(d));
	$('#links').html($('.open .links a').clone(true));
	$('#summary p').html( ConvertText(d.text) );
	$('#ext').html( ConvertText(d.text_ext) );

	$('#genreInfo').html(() => !d.genre ? '' : typeof d.genre == 'string' ? `<li>${d.genre.replace(/\n/g,'<li>')}` : d.genre.map(e => `<li>${e.component_type_name}`).join(''));
	$('#videoInfo').html(() => !d.video ? '' : typeof d.video == 'string' ? `<li>${d.video.replace(/\n/g,'<li>')}` : d.video.map(e => `<li>${e.component_type_name} ${e.text}`).join(''));
	$('#audioInfo').html(() => !d.audio ? '' : typeof d.audio == 'string' ? `<li>${d.audio.replace(/\n/g,'<li>')}` : d.audio.map(e => `<li>${e.component_type_name} ${e.text} : ${{1:'16',2:'22.05',3:'24',5:'32',6:'44.1',7:'48'}[e.sampling_rate]}kHz`).join(''));

	if (d.recinfoid){
		$('#otherInfo').html(d.other ? `<li>${d.other.replace(/\n/g,'<li>')}` : '');
	}else{
		$('#otherInfo').html(`
			${d.onid<0x7880 || 0x7FE8<d.onid ? (d.freeCAFlag ? '<li>有料放送' : '<li>無料放送') : ''}
			<li>OriginalNetworkID:${d.onid}(0x${zero(d.onid.toString(16).toUpperCase(), 4)})
			<li>TransportStreamID:${d.tsid}(0x${zero(d.tsid.toString(16).toUpperCase(), 4)})
			<li>ServiceID:${         d.sid}(0x${zero( d.sid.toString(16).toUpperCase(), 4)})
			<li>EventID:${           d.eid}(0x${zero( d.eid.toString(16).toUpperCase(), 4)})
		`);

		$('[name=onid]').val(d.onid);
		$('[name=tsid]').val(d.tsid);
		$('[name=sid]').val(d.sid);
		$('[name=eid]').val(d.eid);

		$('#link_epginfo').attr('href', `epginfo.html?id=${d.onid}-${d.tsid}-${d.sid}-${d.eid || d.starttime}`);
		$('#set').data('onid', d.onid).data('tsid', d.tsid).data('sid', d.sid).data('eid', d.eid);
	}
	return d;
}

//マクロ一覧表示
const openMacro = $e => {
	$e.prevAll('input').addClass('is-active');
	$('#macro').addClass('is-visible');
}

//録画フォルダパス
const recFolder = {
	create: (d, i, partial) => {
		const div = '<div>';
		const container = 'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing';
		const select = 'mdl-cell pulldown mdl-grid mdl-grid--no-spacing';
		const textfield = 'mdl-cell mdl-textfield mdl-js-textfield';
		const delbtn = 'delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button';
		const middle = 'mdl-cell mdl-cell--middle';
		const recNamePlugIn = d.recNamePlugIn.match(/^(.*\.(?:dll|so))?(?:\?(.*))?/);
		partial = partial ? 'partial' : '';
		return $(div, {class: `preset ${container}`, append: [
					$(div, {class: delbtn, click: e => recFolder.del($(e.currentTarget)), html:
						$('<i>', {class: 'material-icons', text: 'delete'}) }),
					$(div, {class: container, append: [
						$(div, {class: middle, text: 'フォルダ'}),
						$(div, {class: textfield, append: [
							$('<input>', {class: 'has-icon mdl-textfield__input', type: 'text', name: `${partial}recFolder`, id: `${partial}recFolder${i}`, val: d.recFolder}),
							$('<label>', {class: 'mdl-textfield__label', for: `${partial}recFolder${i}`, text: '!Default'}) ]}) ]}),
					$(div, {class: container, append: [
						$(div, {class: middle, text: '出力PlugIn'}),
						$(div, {class: select, html:
							$('<select>', {name: `${partial}writePlugIn`, html:
								$('#Write').html(), val: d.writePlugIn }) }) ]}),
					$(div, {class: container, append: [
						$(div, {class: middle, text: 'ファイル名PlugIn'}),
						$(div, {class: select, html:
							$('<select>', {name: `${partial}recNamePlugIn`, html:
								$('#RecName').html(), val: recNamePlugIn[1]}) }) ]}),
					$(div, {class: container, append: [
						$(div, {class: middle, text: 'オプション'}),
						$(div, {class: textfield, append: [
							$('<input>', {class: 'has-icon mdl-textfield__input', type: 'text', name: `${partial}recName`, id: `${partial}recName${i}`, val: recNamePlugIn[2]}),
							$('<label>', {class: 'mdl-textfield__label', for: `${partial}recName${i}`, text: 'ファイル名PlugIn'}),
							$('<i>', {class: 'addmacro material-icons', text: 'add', click: e => openMacro($(e.currentTarget)) }) ]}) ]}) ]});
	},
	del: $e => {
		$e = $e.parent();
		const $elem = $e.next();
		const $clone = $e.clone(true);
		$e.remove();
		const d = {
			message: '削除しました',
			timeout: 2000,
			actionHandler: () => {
				$clone.insertBefore($elem);
				Snackbar({message: '元に戻しました'});
			},
			actionText: '元に戻す'
		};
		Snackbar(d);
	}
}

//録画設定を反映
const setRecSettting = r => {
	if (r.recSetting) r = r.recSetting;
	if (!r.recMode) r = toObj.RecSet(r);
	
	$('[name=recMode]').val(r.recMode);										//録画モード
	$('[name=tuijyuuFlag]').mdl_prop('checked', r.tuijyuuFlag);				//追従
	$('[name=priority]').val(r.priority);									//優先度
	$('[name=pittariFlag]').mdl_prop('checked', r.pittariFlag);				//ぴったり(？)録画
	$('[name=suspendMode]').val(r.suspendMode);								//録画後動作
	$('#reboot').mdl_prop('disabled', r.suspendMode == 0);
	$('[name=rebootFlag]').mdl_prop('checked', r.rebootFlag);				//復帰後再起動
	$('[name=useDefMarginFlag]').mdl_prop('checked', !r.useMargineFlag);	//録画マージン
	$('.recmargin').mdl_prop('disabled', !r.useMargineFlag);
	$('[name=startMargin]').val(r.startMargine);							//開始
	$('[name=endMargin]').val(r.endMargine);								//終了
	$('[name=serviceMode]').mdl_prop('checked', r.serviceMode%2 == 0);		//指定サービス対象データ
	$('.smode').mdl_prop('disabled', r.serviceMode%2 == 0);
	const serviceMode = (r.serviceMode%2 == 0) ? r.defserviceMode : r.serviceMode;
	$('[name=serviceMode_1]').mdl_prop('checked', Math.floor(serviceMode/16)%2 != 0);
	$('[name=serviceMode_2]').mdl_prop('checked', Math.floor(serviceMode/32)%2 != 0);
	$('[name=continueRecFlag]').mdl_prop('checked', r.continueRecFlag);		//連続録画動作
	$('[name=tunerID]').val(r.tunerID);										//使用チューナー強制指定

	//プリセット
	$('.preset').remove();

	//録画後実行bat
	const batFilePath = r.batFilePath.match(/^([^*]*)\*?([\s\S]*)$/);
	if (!$(`[name="batFilePath"] option[value="${batFilePath[1].replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&')}"]`).length)
		$('[name="batFilePath"]').append($('<option>', {value: batFilePath[1], text: batFilePath[1]}));
	$('[name="batFilePath"]').val(batFilePath[1]);
	$('[name="batFileTag"]').val(batFilePath[2]);
	r.recFolderList.forEach((e, i) => $('#preset .addPreset').before(recFolder.create(e, i)));
	r.partialRecFolder.forEach((e, i) => $('#partialpreset .addPreset').before(recFolder.create(e, i, true)));				//部分受信プリセット
	componentHandler.upgradeDom();
	$('[name=partialRecFlag]').mdl_prop('checked', r.partialRecFlag);		//部分受信サービス
	$('#partialpreset').toggle(r.partialRecFlag);

	return r;
}

//時間絞り込み
const dateList = {
	click: e => {
		$(e.currentTarget).toggleClass('mdl-color--accent mdl-color-text--accent-contrast');
		const $e = $('#dateList_select option').eq( $(e.currentTarget).data('count') );
		$e.prop('selected', !$e.prop('selected'));
	},
	create: () => {
		$("#dateList_touch").empty();
		$('[name=dateList]').val(
			$('#dateList_select option').get().map((e, i) => {
				dateList.add.touch(i, $(e).text());
				return $(e).val();
			})
		);
	},
	//追加
	add: {
		select: (t, text) => $('#dateList_select').append(`<option value="${text ? `${t}">${text}` : `${t.startDayOfWeek}-${t.startTime}-${t.endDayOfWeek}-${t.endTime}">${t.startDayOfWeek} ${t.startTime} ～ ${t.endDayOfWeek} ${t.endTime}`}`),
		touch: (i, text) => $("#dateList_touch").append($('<li>', {class: 'mdl-list__item', data: {count: i}, click: e => dateList.click(e), html: `<span class="mdl-list__item-primary-content">${text}</span>`}))
	}
}

//検索条件を反映
const setSerchSetting = s => {
	if (s.SearchSettting) s = s.SearchSettting;
	if (!s.andKey) s = toObj.Search(s);
	$('#disable').mdl_prop('checked', s.disableFlag);
	$('#andKey').val(s.andKey);
	$('#notKey').val(s.notKey);
	$('#note').val(s.note);
	$('#reg').mdl_prop('checked', s.regExpFlag);
	$('#aimai').mdl_prop('checked', s.aimaiFlag);
	$('#titleOnly').mdl_prop('checked', s.titleOnlyFlag);
	$('#caseFlag').mdl_prop('checked', s.caseFlag);
	$('#contentList').val(s.contentList.map(e => e.content_nibble));
	$('#notcontet').mdl_prop('checked', s.notContetFlag);
	$('#serviceList').val(s.serviceList.map(e => `${e.onid}-${e.tsid}-${e.sid}`));
	$('#dateList_select,#dateList_touch').empty();
	$('[name=dateList]').val(
		s.dateList.map((e, i) => {
			const val = `${WEEK[e.startDayOfWeek]}-${e.startHour}:${e.startMin}-${WEEK[e.endDayOfWeek]}-${e.endHour}:${e.endMin}`;
			const txt = `${WEEK[e.startDayOfWeek]} ${zero(e.startHour)}:${zero(e.startMin)} ～ ${WEEK[e.endDayOfWeek]} ${zero(e.endHour)}:${zero(e.endMin)}`
			dateList.add.select(val, txt);
			dateList.add.touch(i, txt);
			return val;
		}
	));
	$('#notdate').mdl_prop('checked', s.notDateFlag);
	$('[name=freeCAFlag]').val(s.freeCAFlag);
	$('#DurationMin').val(s.chkDurationMin);
	$('#DurationMax').val(s.chkDurationMax);
	$('#chkRecEnd').mdl_prop('checked', s.chkRecEnd);
	$('#chkRecNoService').mdl_prop('checked', s.chkRecNoService);
	$('#chkRecDay').val(s.chkRecDay);
}

//EGP予約を反映
const setAutoAdd = $e => {
	showSpinner(true);
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
	$('[href="#recset"], #recset, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$('[href="#search_"], #search_').addClass('is-active');
	$e.addClass('open');
	$('.sidePanel-content').scrollTop(0);

	getList.AutoAdd(() => {
		const id = $e.data('id');
		const d = ReserveAutoaddList[id];
		if (d){
			$('#set,#del').attr('action', `${ROOT}api/SetAutoAdd?id=${id}`);
			$('#link_epginfo').attr('href', `autoaddepginfo.html?id=${id}`);

			setSerchSetting(d);
			setRecSettting(d);

			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
		}else{
			Snackbar({message: 'Error : 自動予約が見つかりませんでした'});
		}
		showSpinner();
	});
}

//録画結果を反映
const setRecInfo = $e => {
	if ($e.data('info')){
		$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
		$('[href="#error"], #error, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
		$('[href="#detail"], #detail').addClass('is-active');
		$e.addClass('open');
		$('.sidePanel-content').scrollTop(0);

		const d = $e.data('info');
		setEpgInfo(d);

		$('#path').text(d.recFilePath);
		$('#comment').text(d.comment);
		$('#drops').text(d.drops);
		$('#scrambles').text(d.scrambles);

		$('pre').text(d.errInfo);

		$('#del').attr('action', `${ROOT}api/SetRecInfo?id=${d.recinfoid}`).next('button').prop('disabled', d.protect);
		$('#link_epginfo').attr('href', `recinfodesc.html?id=${d.recinfoid}`);

		$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
	}else{
		showSpinner(true);
		$.get(`${ROOT}api/EnumRecInfo?id=${$e.data('recinfoid')}`).done(xml => {
			if ($(xml).find('recinfo').length){
				$e.data('info', toObj.EpgInfo($(xml).find('recinfo').first(), true));
				setRecInfo($e);
			}else{
				errMessage($(xml));
			}
			showSpinner();
		});
	}
}

//予約を反映
const setReserve = (r, fn) => {
	const id = setRecSettting(r).id;

	$('#set').attr('action', `${ROOT}api/SetReserve?id=${id}`);
	$('#del').attr('action', `${ROOT}api/SetReserve?id=${id}`);
	$('#progres').attr('action', `${ROOT}api/SetReserve?id=${id}`);
	$('#action').attr('name', 'change');
	$('#reserved, #delreseved, #toprogres').show();
	$('[name=presetID]').data('reseveid', id).val(65535);
	$('#reserve').text('変更');

	if (fn){
		fn();
	}else{
		$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
		showSpinner();
	}
}

//デフォルト読込
const setDefault = mark => {
	setRecSettting(PresetList['0']);

	$('#set').attr('action', `${ROOT}api/SetReserve`);
	$('#action').attr('name', 'add');
	$('#reserved, #delreseved, #toprogres').hide();
	$('[name=presetID]').val(0);
	$('#reserve').text('予約追加');

	if (!mark) return;

	$('.open .mark.reserve').remove();
	$('.open .addreserve').data('id', false).data('oneclick', 1).text('予約追加');
	$('.open .reserve').removeClass('reserve disabled partially shortage view');
	$('.open .flag').data('id', false).data('oneclick', 1).html($('<span>', {class:'search add mdl-button mdl-js-button mdl-button--fab mdl-button--colored', click: e => addReserve($(e.currentTarget)), html:'<i class="material-icons">add</i>'}));
}

//録画マーク追加
const addRecMark = (r, $target, $content) => {
	if ($('.open').hasClass('epginfo')) return;

	if (!r.recMode) r = toObj.RecSet(r);
	const messege = r.recMode == 5 ? '無効' : '有効';
	const button = r.recMode == 5 ? '有効' : '無効';
	const mode = r.recMode == 5 ? 'disabled' :
		r.overlapMode == 1 ? 'partially' :
		r.overlapMode == 2 ? 'shortage' :
		r.recMode == 4 ? 'view' : '';
	const mark = r.recMode == 5 ? '無' :
		r.overlapMode == 1 ? '部' :
		r.overlapMode == 2 ? '不' :
		r.recMode == 4 ? '視' : '録';
	$target.data('id', r.id).data('toggle', r.recMode == 5 ? 1 : 0).data('oneclick', 0).text(button);
	$content.not('.reserve').find('.startTime').after('<span class="mark reserve"></span>');
	$content.removeClass('disabled partially shortage view').addClass(`reserve ${mode}`).find('.mark.reserve').text(mark);

	return messege;
}

//一覧の録画トグル
const fixRecToggleSW = (d, $e = $('.open')) => {
	if ($e.hasClass('cell')) return;

	if (!d.recMode) d = toObj.RecSet(d);

	const $input = $e.find('input');
	if ($e.hasClass('search')){						//検索ページ向け
		$e = $e.find('.flag').data('id', d.id);
		//スイッチ追加
		if (d.starttime < Date.now()){
			$input.removeClass().addClass('search recmark').empty();
			if (d.recMode != 5) $input.unbind('click');
		}else if (!$e.hasClass('addreserve')){
			const id = `reserve${d.id}`;
			const $switch = $('<label>', {
				class: 'mdl-switch mdl-js-switch',
				for: id,
				html: $('<input>', {
					id: id,
					class: 'search addreserve mdl-switch__input',
					type: 'checkbox',
					checked: d.recMode != 5,
					change: e => {
						$e.data('toggle', d.recMode == 5 ? 1 : 0);
						addReserve($(e.currentTarget))} }) });
			componentHandler.upgradeElement($switch.get(0));

			const $mark = $('<span>').html($switch);
			$e.removeData('oneclick').html($mark);
			setTimeout(() => {
				$e.parent('tr').addClass('start');
				$mark.addClass('recmark').empty();
			}, d.starttime-Date.now());
		}
	}

	const mode = d.recMode == 5 ? 'disabled' :	//無効
		d.overlapmode == 1 ? 'partially' :		//チューナー不足
		d.overlapmode == 2 ? 'shortage' : '';	//一部録画

	$e.removeClass('disabled partially shortage').addClass(mode);
	$input.mdl_prop('checked', d.recMode != 5);
}

//プログラム予約
const progReserve = d => {
	start = createViewDate(d.starttime);
	end = d.endtime ? createViewDate(d.endtime) : start;
	$('#startdate').val(`${start.getUTCFullYear()}-${zero(start.getUTCMonth()+1)}-${zero(start.getUTCDate())}`);
	$('#starttime').val(`${zero(start.getUTCHours())}:${zero(start.getUTCMinutes())}:${zero(start.getUTCSeconds())}`);
	$('#endtime').val(`${zero(end.getUTCHours())}:${zero(end.getUTCMinutes())}:${zero(end.getUTCSeconds())}`);

	$('#toprogres').text(`プログラム予約${d.id != 65535 ? '化' : ''}`);
	$('#progres p').toggle(d.eid != 65535);
}

//番組詳細予約確認
const checkReserve = ($e, d) => {
	let id = d.next ? d.nextid : d.id || $e.find('.addreserve').data('id') || $e.children('.flag').data('id');
	let r = ReserveAutoaddList[`${d.onid}-${d.tsid}-${d.sid}-${d.eid}`];
	if (r){
		if (!id){															//追加されてた
			if (!r.recMode) r = toObj.RecSet(r);
			if ($e.hasClass('onair')) $e.data(`${d.next ? 'next' : ''}id`, r.id);
		}
		if (!$e.hasClass('onair')){
			addRecMark(r, $('.open .addreserve'), $('.open .content-wrap'));
			fixRecToggleSW(r);
		}
		setReserve(r);
	}else if (id){															//削除されてた
		if ($e.hasClass('reserve')){
			$e.remove();
		}else{
			if ($e.hasClass('onair')) $e.removeData(`${d.next ? 'next' : ''}id`);

			getList.Preset(() => setDefault(true));
			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
		}
		if (!$e.hasClass('onair')) Snackbar({message: '予約が見つかりませんでした'});
	}else{
		getList.Preset(() => setDefault());
		$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
	}
}

//番組詳細を取得
const getEpgInfo = ($e, d = $e.data()) => {
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0);
	$('[href="#recset"], #recset, #sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$('[href="#detail"], #detail').addClass('is-active');
	$e.addClass('open');
	$('.sidePanel-content').scrollTop(0);

	const info = d.next ? d.nextinfo : d.info;
	if (info){
		setEpgInfo(info);
		getList.Reserve(() => checkReserve($e, d));
		return;
	}

	showSpinner(true);
	$.get(`${ROOT}api/EnumEventInfo`, {basic: 0, id: `${d.onid}-${d.tsid}-${d.sid}-${d.eid || d.starttime}`}).done(xml => {
		if ($(xml).find('eventinfo').length){
			d.info = setEpgInfo($(xml).find('eventinfo').first());
			getList.Reserve(() => checkReserve($e, d));
		}else{
			const id = d.next ? d.nextid : d.id || $e.find('.addreserve').data('id') || $e.children('.flag').data('id');
			if (id){													//プログラム予約または番組変更でなくなった
				getList.Reserve(() => {
					const key = d.eid == 65535 ? id : `${d.onid}-${d.tsid}-${d.sid}-${d.eid || d.starttime}`
					const r = ReserveAutoaddList[key];
					if (r){
						setEpgInfo(r);
						setReserve(r);

						$('#link_epginfo').attr('href', `reserveinfo.html?id=${id}`);
						$('[href="#detail"], #detail').removeClass('is-active');
						$('[href="#recset"], #recset').addClass('is-active');
					}else{
						$e.remove();
						Snackbar({message: '予約が見つかりませんでした'});
					}
				});
			}else{
				errMessage($(xml));
			}
		}
		showSpinner();
	});
}

//予約送信
const sendReserve = (d, fn) => {
	d.ctok = ctok;
	showSpinner(true);
	$.get(`${ROOT}api/SetReserve`, d).done(xml => {
		if ($(xml).find('success').length){
			fn.success($(xml).find('reserveinfo'));
		}else{
			fn.err();
			errMessage($(xml));
		}
		if (fn.end) fn.end();
		showSpinner();
	});
}

//予約処理
const addReserve = $e => {
	sendReserve($e.parents('td').data(), {
		success: xml => fixRecToggleSW(xml, $e.parents('tr')),
		err: () => {if ($e.hasClass('mdl-switch__input')) $e.mdl_prop('checked', !$e.prop('checked'));}
	});
}

$(window).on('load resize', () => {
	const OVER700 = !window.matchMedia('(max-width: 700px)').matches;
	//マクロ補助
	$('.shrink-phone').toggle(OVER700);
	$('.check-shrink-phone').prop('checked', OVER700);
	$('.drawer-separator.mdl-cell--hide-desktop').toggle(!OVER700);
});

//サービスワーカーの登録
if ("serviceWorker" in navigator) navigator.serviceWorker.register("serviceworker.js");

$(function(){
	$('.mdl-js-snackbar').on('mdl-componentupgraded', () => Snackbar = d => document.querySelector('.mdl-js-snackbar').MaterialSnackbar.showSnackbar(d));

	//スワイプ
	if (isTouch){
		delete Hammer.defaults.cssProps.userSelect;
		//drawer表示
		$('.drawer-swipe').hammer().on('swiperight', () => $('.mdl-layout__drawer-button').click());

		//タブ移動
		const moveTab = $e => {
			if (!$e.length || document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement | document.msFullscreenElement) return
			const panel = $e.attr('href');
			if ($e.hasClass('mdl-layout__tab')){
				$('.mdl-layout__tab, .mdl-layout__tab-panel').removeClass('is-active');
				$('main').scrollTop(0);
			}else{
				$('.mdl-tabs__tab, .mdl-tabs__panel').removeClass('is-active');
			}
			$e.addClass('is-active');
			$(panel).addClass('is-active');

			if (panel != '#movie' || $('#video').data('load')) return;

			if (!$('#video').data('public')) loadMovie($('#video'));
			$('#video').trigger('load').data('load', true);
		}
		$('.tab-swipe'  ).hammer().on('swiperight', () => moveTab($('.mdl-layout__tab.is-active').prev()));
		$('.tab-swipe'  ).hammer().on('swipeleft' , () => moveTab($('.mdl-layout__tab.is-active').next()));
		$('.panel-swipe').hammer().on('swiperight', () => moveTab($('.mdl-tabs__tab.is-active').prev()));
		$('.panel-swipe').hammer().on('swipeleft' , () => moveTab($('.mdl-tabs__tab.is-active').next()));
	}

	//一覧の行をリンクに
	$('tr.epginfo').click(e => {
		const $e = $(e.currentTarget);
		if ($(e.target).is('.flag, .flag *, .count a')) return;

		if ($e.data('onid') || $e.data('recinfoid')) createSearchLinks(e.currentTarget);

		$e.data('onid') ? getEpgInfo($e) :
		$e.data('id') ? setAutoAdd($e) :
		$e.data('recinfoid') ? setRecInfo($e) : 
		location.href = $e.data('href');
	});
	$('.close_info').click(() => $('#sidePanel, .close_info.mdl-layout__obfuscator, .open').removeClass('is-visible open'));

	//drawer ドロップダウン
	$('.drop-down').click(e => $(e.currentTarget).next().slideToggle());

	//ダイアログ
	const dialog = e => document.querySelector(`dialog${$(e.currentTarget).data('dialog')}`);
	$('.show_dialog').click(e => dialog(e).showModal());
	$('dialog .close').click(e => dialog(e).close());	//閉じ

	$('.mdl-layout__tab').click(() => $('main').scrollTop(0));
	//再生タブ
	$('#movie_tab').click(() => {
		if ($('#video').data('load')) return;

		if (!$('#video').data('public')) loadMovie($('#video'));
		$('#video').trigger('load').data('load', true);
	});

	//通知
	if (!isMobile && !isTouch && window.Notification){
		if (Notification.permission == 'granted'){
			$('.notification').removeClass('hidden');
			//通知リスト読み込み
			if (localStorage.getItem('notifications')){
				const list = JSON.parse(localStorage.getItem('notifications'));
				list.forEach(e => e.starttime < Date.now() ? Notify.save(e, true) : Notify.create(e));	//時間が過ぎてたらリストから削除
			}
		}else if (Notification.permission == 'default'){
			//通知許可要求
			Notification.requestPermission(result => {if (result == 'granted') $('.notification').removeClass('hidden');});
		}
	}
	if ($('h4 .notify').length && !$('h4 .notify').attr('disabled')){
		const interval = $('.notify').data('starttime') - Date.now();
		setTimeout(() => $('.notify').attr('disabled', true).children().text('notifications'), interval);
	}
	$('.notify').click(e => {
		const $e = $(e.currentTarget);
		if ($e.attr('disabled')) return;

		const d = $e.data();
		//登録済み通知削除
		if (d.notification){
			Notify.del(d);
		}else{
			if (d.service){
				d.title = $e.prevAll('.title').html();
			}else{
				d.title = $e.parents('.popup').prevAll('.mdl-typography--body-1-force-preferred-font').html();
				d.service = $e.parents('.station').data('service');
			}

			Notify.create(d, true);
		}
	});

	//録画後動作の抑制
	$('#nosuspend').click(e => {
		$.post(`${ROOT}api/Common`, $(e.currentTarget).data()).done(xml => {
			const message = $(xml).find('info').text();
			Snackbar({message: message});
			if (message.match('起動')){
				$('#nosuspend').data('nosuspend', 'n').addClass('n').removeClass('y');
			}else if (message.match('停止')){
				$('#nosuspend').data('nosuspend', 'y').addClass('y').removeClass('n');
			}
		});
	});
	//スタンバイ
	const suspend = document.querySelector('dialog#dialog');
	if (suspend){
		$('#suspend').click(e => {
			$('#dialog .mdl-dialog__content').html(`<span>${$(e.currentTarget).text()}に移行します`);
			$('#dialog .ok').unbind('click').click(() => {
				suspend.close();
				$.post(`${ROOT}api/Common`, $(e.currentTarget).data()).done(xml => Snackbar({message: $(xml).find('info').text()}));
			});
		    suspend.showModal();
		});
	}

	//検索条件
	//詳細検索
	$('.advanced').toggle($('#advanced').prop('checked'));
	$('#advanced').change(e => {
		const enabled =  $(e.currentTarget).prop('checked');
		$('.advanced').toggle(enabled);
		$('.g_celar').not('.advanced').toggle(!enabled).prev().toggleClass('has-button', !enabled);
	});
	//ジャンル
	$('#content').change(e => {
		const val = $('#content').val();
		$('#contentList option').show();
		$('#subGenre').mdl_prop('disabled', val != 'all');
		if (val != 'all'){
			$('#contentList option').not(val).prop('selected', false).hide();
		}else if (!$('#subGenre').prop('checked')){
			$('.subGenre').hide();
		}
	});
	//全ジャンル選択解除
	$('.g_celar').click(() => $('#contentList option').prop('selected', false));
	//サブジャンル
	$(".subGenre").toggle($('#subGenre').prop('checked'));
	$('#subGenre').change(e => $('.subGenre').toggle($(e.currentTarget).prop('checked')));
	//サービス
	//全選択
	$('.all_select').click(() => $('#serviceList option').not('.hide').prop('selected', true));
	//映像のみ表示
	$('#image').change(e => $(e.currentTarget).prop('checked')
		? $('#serviceList option.data').addClass('hide')
		: $('.extraction:checked').each((i, e) => $(`#serviceList ${$(e).val()}`).removeClass('hide'))
	);
	//ネットワーク表示
	$('.extraction').change(e => {
		const $e = $(e.currentTarget);
		$e.prop('checked')
			? $('#image').prop('checked') ? $( $e.val() ).not('.data').removeClass('hide') : $( $e.val() ).removeClass('hide')
			: $($e.val()).addClass('hide').prop('selected', false);
	});
	//時間絞り込み
	//切替
	$('[name=dayList]').change(() => {
		$('[name=dayList]').each((i, e) => {
			$(e).next().find('select').prop('disabled', !$(e).prop('checked'));
			$(e).next().find('input').mdl_prop('disabled', !$(e).prop('checked'));
		});
	});
	//追加
	$('#add_dateList').click(() => {
		const date = {
			startTime: $('#startTime').val(),
			endTime: $('#endTime').val()
		};

		if ($('#dayList').prop('checked')){
			date.startDayOfWeek = $('#startDayOfWeek').val();
			date.endDayOfWeek = $('#endDayOfWeek').val();
			dateList.add.select(date);
		}else if(date.startTime > date.endTime){
			Snackbar({message: '開始 > 終了です'});
			return;
		}else{
			$('.DayOfWeek:checked').each((i, e) => {
				date.startDayOfWeek = $(e).val();
				date.endDayOfWeek = $(e).val();
				dateList.add.select(date);
			});
		}
		dateList.create();
	});
	//削除
	$('#del_dateList').click(() => {
		$('#dateList_select option:selected').remove();
		dateList.create();
	});
	//選択
	$('#dateList_touch .mdl-list__item').click(e => dateList.click(e));
	//編集表示
	$('#add_dateList').prop('disabled', $('#dateList_edit').is(':hidden'));
	$('#edit_dateList').click(() => {
		const visible = $('#dateList_edit').hasClass('is-visible');
		$('#edit_dateList .material-icons').text(`expand_${visible ? 'more' : 'less'}`);
		$('#add_dateList').prop('disabled', visible);
		$('#dateList_edit').toggleClass('is-visible', !visible);
	});

	//マクロ
	$('.addmacro').click(e => openMacro($(e.currentTarget)));
	$('.close.macro').click(() => {
		$('input.is-active').removeClass('is-active');
		$('#macro').removeClass('is-visible');
	});
	$('.macro-item').click(e => {
		const elem = document.querySelector('input.is-active');
		const start = elem.selectionStart;
		const end = elem.selectionEnd;
		const def = $('input.is-active').val();
		const val = `${def.substr(0, start)}${$(e.currentTarget).data('macro')}${def.substr(end, def.length)}`;
		$('input.is-active').val(val).removeClass('is-active').parent().addClass('is-dirty');
		$('#macro').removeClass('is-visible');
	});



	//検索バーのアイコンクリックで検索
	$('[for=header-andKey]').click(e => {if ($(e.currentTarget).parent().hasClass('is-dirty')) $('#search-bar').submit();});
	//検索バー連動
	$('#search-bar').val($('#andKey').val());
	$('.andKey').change(e => $('.andKey').val($(e.currentTarget).val()));
	//検索プリセット
	$('#save_preset').click(() => {
		if ($('#lock').prop('checked')) $('#search').append('<input type="hidden" name="lock" value="1">');
		$('#search').append('<input type="hidden" name="save" value="1">').attr('action', `search.html?preset=${encodeURIComponent($('#preset_name').val())}`).submit();
	});



	//録画設定
	//プリセット読み込み
	const setPreset = (list, id) => {
		let messege = 'プリセットの読み込に失敗しました';
		const preset = list[id];
		if (preset){
			const name = setRecSettting(preset).name ?? $('[name=presetID] option:selected').text();
			messege = `"${name}" を読み込みました`;
		}
		Snackbar({message: messege});
	}
	$('[name=presetID]').change(e => {
		const $e = $(e.currentTarget);
		if ($e.val() != 65535){
			getList.Preset(() => setPreset(PresetList, $e.val()));
		}else if ($e.data('reseveid')){
			const d = $('#set').data();
			const id = d.eid == 65535 ? $e.data('reseveid') : `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`;
			getList.Reserve(() => setPreset(ReserveAutoaddList, id));
		}else{
			const id = $e.data('autoaddid');
			getList.AutoAdd(() => setPreset(ReserveAutoaddList, id));
		}
	});
	//録画マージン
	$('#usedef').change(e => $('.recmargin').mdl_prop('disabled', $(e.currentTarget).prop('checked')));
	//指定サービス対象データ
	$('#smode').change(e => $('.smode').mdl_prop('disabled', $(e.currentTarget).prop('checked')));
	$('[name=suspendMode]').change(e => $('#reboot').mdl_prop('disabled', $(e.currentTarget).val() == 0));
	//部分受信サービス
	$('#partial').change(e => $('#partialpreset').toggle($(e.currentTarget).prop('checked')));

	//予約トグルスイッチ
	$('.flag input').change(e => {
		$(e.currentTarget).parents('td').data('toggle', $(e.currentTarget).prop('checked') ? 1 : 0);
		addReserve($(e.currentTarget));
	});
	//録画無効マーク
	$('.disabled span').click(e => {if ($(e.currentTarget).hasClass('recmark')) addReserve($(e.currentTarget));});
	//検索ページ追加ボタン
	$('.add').click(e => addReserve($(e.currentTarget)));

	//通信エラー
	$(document).ajaxError((e, xhr, textStatus) => {
		showSpinner();
		Snackbar({message: xhr.status!=0 ? `${xhr.status}Error : ${xhr.statusText}` : `Error : ${textStatus.url.match('api/set') ? 'トークン認証失敗' : '通信エラー'}`});
	});

	//予約一覧マーク等処理
	$('tr.reserve').each((i, e) => setTimeout(() => {
			$(e).addClass('start').children('.flag').children('span').empty().addClass('recmark');
			setTimeout(() => $(e).remove(), $(e).data('endtime')-Date.now());
		}, $(e).data('starttime')-Date.now())
	);
	//検索ページ向け
	$('tr.search').each((i, e) => {
		if ($(e).data('starttime')) setTimeout(() => $(e).addClass('start').children('.flag').children('span').addClass('recmark').empty(), $(e).data('starttime')-Date.now())
		setTimeout(() => $(e).children('.flag').data('id', false).children('span').remove(), $(e).data('endtime')-Date.now());
	});
	$('.submitEX').click(e => {
		const d = $(e.currentTarget).data();
		$(`#${d.form} .ctok`).val(d.ctok);
		$(`#${d.form}`).attr('action', d.action).submit();
	});

	//サブミット
	$('.submit').click(e => {
		if ($('dialog').attr('open')) dialog(e).close();

		showSpinner(true);
		const $form = $( $(e.currentTarget).data('form') );
		const d = $form.data();

		$.ajax({
			url: $form.attr('action'),
			type: $form.attr('method'),
			data: $form.serialize(),

			success: (result, textStatus, xhr) => {
				const xml = $(xhr.responseXML);
				if (xml.find('success').length){
					Snackbar({message: xml.find('success').text(), timeout: 1500});
					if (d.redirect){
						setTimeout(() => location.href=d.redirect, 1500);
					}else if (d.submit){
						setTimeout(() => $(d.submit).submit(), 1500);
					}else if (d.reload || $form.hasClass('reload')){
						Snackbar({message: 'リロードします', timeout: 1000});
						setTimeout(() => location.reload(), 2500);
					}else if (d.action) {
						if (d.action == 'add' || d.action == 'reserve'){
							const r = toObj.RecSet(xml.find('reserveinfo'));

							setReserve(r, () => {
								addRecMark(r, $('.open .addreserve'), $('.open .content-wrap'));
								progReserve(r);

								if (d.action == 'reserve') fixRecToggleSW(r);
							});
						}else if (d.action == 'autoadd'){
							$('.open .keyword').text($('#andKey').val());
							$('.open .notkeyword').text($('#notKey').val());
							let count = $('#serviceList option:selected').length-1;
							$('.open .servicelist').html(`${$('#serviceList option:selected:first').text().replace(/^\(.*\)\s/g, '')}${count>0 ? `<small>.他${count}ch` : ''}`);
							count = $('#contentList option:selected').length;
							$('.open .category').html( count==0 ? '全ジャンル' : `${$('#contentList option:selected:first').text()}${count>1 ? `<small>.他${(count-1)}ch` : ''}` );
							$('.open .mode').text($('[name=recMode] option:selected').text());
						}else if (d.action == 'del'){
							getList.Preset(() => setDefault(true));
							if ($('.open').hasClass('reserve')) {
								$('#sidePanel, .close_info.mdl-layout__obfuscator').removeClass('is-visible');
								$('.open').remove();
							}
						}
					}
				}else{
					errMessage(xml);
				}
				showSpinner();
			}
		});
	});

	$('.delPreset').click(e => recFolder.del($(e.currentTarget)));
	$('.addPreset').click(e => {
		$(e.currentTarget).before(recFolder.create({recFolder: '', writePlugIn: $('#Write option').first().val(), recNamePlugIn: ''}, $(e.currentTarget).prevAll().length+1, $(e.currentTarget).hasClass('partial')));
		componentHandler.upgradeDom();
	});

	//入力チェック
	$('form').on('input', e => $(`[data-form="#${$(e.currentTarget).attr('id')}"]`).attr('disabled', !$(e.currentTarget).get(0).checkValidity()));
});
