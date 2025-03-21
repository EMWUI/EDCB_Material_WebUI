const isMobile = navigator.userAgentData ? navigator.userAgentData.mobile : navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/);
const isTouch = 'ontouchstart' in window;

const isSmallScreen = () => window.matchMedia(window.MaterialLayout.prototype.Constant_.MAX_WIDTH).matches;
const showSpinner = (visible = false) => $('#spinner .mdl-spinner').toggleClass('is-active', visible);
const errMessage = xml => xml.find('err').each((i, e) => Snackbar(`${i==0 ? 'Error : ' : ''}${$(e).text()}`));
const zero = (e, n = 2) => (Array(n).join('0')+e).slice(-n);
let Snackbar = d => setTimeout(Snackbar, 1000, d);

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

const Info = {
	day: ['日', '月', '火', '水', '木', '金', '土'],
	EventInfo: {},
	recinfo: {},
}

//検索バー表示
const saerchbar = () => $('main>.mdl-layout__content').scroll(() => {
	$('.serch-bar').toggleClass('scroll', !$('main>.mdl-layout__content').scrollTop() > 0);
	$('main').toggleClass('serch-bar', $('main>.mdl-layout__content').scrollTop() > 0);
});

//検索等のリンクを生成
class SearchLinks {
	#d;
	#defaults = [
		//{href : d => `${d.title}`, class: '', external: true, icon: '', src: ''},
		{href: d => `search.html?andkey=${d._title}`, icon: 'search'},
		{href: d => `https://www.google.co.jp/search?q=${d._title}`, external: true, src:'img/google.png'},
		{href: d => `https://www.google.co.jp/search?q=${d._title}&btnI=Im+Feeling+Lucky`, external: true, icon: 'sentiment_satisfied'},
		{href: d => `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ConvertZtoH(d.title))}&location=${encodeURIComponent(ConvertZtoH(d.service))}&dates=${d.dates}&details=${d.details}${Links.calendar.op}`, class: "mdl-cell--hide-phone mdl-cell--hide-tablet", external: true, icon: 'event'},
	];
	constructor(d){
		this.#d = {...d};
		this.#d._title = encodeURIComponent(ConvertZtoH(d.title).replace(/(?!^【.*?】$)[＜【\[].*?[＞】\]]|（.*?版）/g, ''));
		this.#d.dates = encodeURIComponent(d.dates??`${ConvertTime(d.starttime, 'ISO')}/${ConvertTime(d.endtime, 'ISO')}`);
		this.#d.details = encodeURIComponent((d.details??Links.calendar.details.replace(/%text_char%/g, d.text)).replace(/%br%/g, '\n'));
	}

	#link = d => $('<a>', {class: `mdl-button mdl-button--icon ${d.class??''}`, href: d.href(this.#d), target: d.external&&'_blank', rel: d.external&&'noreferrer', append: $(`<${d.icon?'i':'img'}>`, {class: 'material-icons', src: d.src, alt: d.alt, text: d.icon})})
	get html(){return this.#defaults.map(d => this.#link(d));}		//番組表向け
	get htmlEX(){													//サイドパネル向け
		const a = this.#defaults.concat(Links.custom??[]).map(d => this.#link(d));
		if (Notification.permission == 'granted') a.unshift($('<button>', {class: `notify_${this.#d.eid} mdl-button mdl-js-button mdl-button--icon`, data: {notification: $(`#notify_${this.#d.eid}`).length > 0}, disabled: this.#d.starttime-30<=Date.now(), click: e => { const d = Info.EventInfo[`${this.#d.onid}-${this.#d.tsid}-${this.#d.sid}-${this.#d.eid}`]; $(e.currentTarget).data('notification') ? Notify.del(d) : Notify.create(d, true); }, append: $('<i>', {class: 'material-icons', text: $(`#notify_${this.#d.eid}`).length ? 'notifications_off' : this.#d.starttime-30<=Date.now() ? 'notifications' : 'add_alert'}),}) )
		return a;
	}
}
const createSearchLinks = e => {
	const $e = $(e).find('.search-links');
	if ($e.length != 1 || $e.is('.search-links-created')) return;

	$e.addClass('search-links-created').after(new SearchLinks($e.data()).html);
}


//表示用に時間シフトしたDateオブジェクトを生成
const createViewDate = (value = new Date()) => {
	if (typeof value !== 'object') value = new Date(value);
	return new Date(value.getTime() + 9 * 3600000);
}
const ConvertTime = (t, show_sec, show_ymd) => {
	if (!t) return '未定';
	t = createViewDate(t);
	if (show_sec == 'ISO') return `${t.getUTCFullYear()}${zero(t.getUTCMonth()+1)}${zero(t.getUTCDate())}T${zero(t.getUTCHours())}${zero(t.getUTCMinutes())}${zero(t.getUTCSeconds())}`;
	return `${show_ymd ? `${t.getUTCFullYear()}/${zero(t.getUTCMonth()+1)}/${zero(t.getUTCDate())}(${Info.day[t.getUTCDay()]}) ` : ''
		}${zero(t.getUTCHours())}:${zero(t.getUTCMinutes())}${show_sec && t.getUTCSeconds() != 0 ? `<small>:${zero(t.getUTCSeconds())}</small>` : ''}`;
}
const ConvertText = a => {
	if (!a) return '';
	const re = /https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>)/g;
	let s = '';
	let i = 0;
	for (let m; m = re.exec(a); i = re.lastIndex) {
		s += $('<p>').text(a.substring(i, re.lastIndex - m[0].length)).html();
		s += $('<p>').html($('<a>', {href: m[0], target: '_blank', text: m[0], rel:'noreferrer'})).html();
	}
	s += $('<p>').text(a.substring(i)).html();
	return s.replace(/\n/g,'<br>');
};
const ConvertTitle = a => !a ? '' : $('<p>').text(a).html().replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g, '<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>');
const ConvertService = d => `<img class="logo" src="${ROOT}api/logo?onid=${d.onid}&sid=${d.sid}">` + $('<p>').html($('<span>').text(d.service)).html();
const ConvertZtoH = s => s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');

const Notify = new class {
	#sound = new Audio(`${ROOT}video/notification.mp3`);
	constructor(){
		this.#sound.volume = 0.2;
	}
	#badge = () => {				//通知バッチ
		const count = $('[id^=notify_]').length;
		$('#notification i').toggleClass('mdl-badge', count != 0).text(`notifications${count==0 ? '_none' : ''}`);
		$('#noNotify').toggle(count == 0);
		$('#notification i').attr('data-badge', count);
	}
	save = (d, remove) => {		//通知保存
		const a = localStorage.getItem('notifications') ? JSON.parse(localStorage.getItem('notifications')) : new Array();
		!remove ? a.push(d) : a.some((v, i) => {if (v.eid == d.eid) a.splice(i,1);});
		localStorage.setItem('notifications', JSON.stringify(a));
	}
	del = (d, noSnack) => {		//通知リスト削除
		clearTimeout(d.timer);
		this.save(d, true);
		$(`.eid_${d.eid}.notify_icon,#notify_${d.eid}`).remove();
		$(`.notify_${d.eid}`).data('notification', false).children().text('add_alert');

		this.#badge();
		if (!noSnack) Snackbar('削除しました');
	}
	create = (d, save) => {		//通知登録
		if (save){
			this.save(d);
			Snackbar('追加しました');
		}

		d.timer = setTimeout(async () => {
			this.del(d, true);
			$(`.notify_${d.eid}`).children().text('notifications');

			const id = `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`;

			const _d = Info.EventInfo[id] ?? await $.get(`${ROOT}api/EnumEventInfo`, {id: id}).then(xml => toObj.EpgInfo($(xml).find('eventinfo').first()));
			const notification = new Notification(_d.title, {
				body: `${ConvertTime(_d.starttime)}～ ${_d.service}\n${_d.text}`,
				tag: id,
				icon: 'img/apple-touch-icon.png'
			});

			notification.onclick = e => {
				e.preventDefault();
				location.href=`epginfo.html?id=${id}`;
				notification.close();
			};

			this.#sound.play();

			setTimeout(() => notification.close(), 15*1000);	//通知を閉じる
		}, d.starttime - Date.now() - 30*1000);

		$(`.eid_${d.eid}.startTime`).after($('<div class="notify_icon"><i class="material-icons">notifications_active</i></div>'));
		$(`.notify_${d.eid}`).data('notification', true).children().text('notifications_off');

		const date = createViewDate(d.starttime);

		const $notifyList = $('<li>', {id: `notify_${d.eid}`, class: 'mdl-list__item mdl-list__item--two-line', data: {start: d.starttime}, append: [
			$('<span>', {class: 'mdl-list__item-primary-content', click: () => location.href = `epginfo.html?id=${d.onid}-${d.tsid}-${d.sid}-${d.eid}`, append: [
				$('<span>', {html: d.title}),
				$('<span>', {class: 'mdl-list__item-sub-title', text: `${zero(date.getUTCMonth()+1)}/${zero(date.getUTCDate())}(${Info.day[date.getUTCDay()]}) ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())} ${d.service}`}) ]}),
			$('<span>', {class: 'mdl-list__item-secondary-content', append: [
				$('<button>', {
					class: 'mdl-list__item-secondary-action mdl-button mdl-js-button mdl-button--icon',
					html: $('<i>', {class: 'material-icons', text: 'notifications_off'}),
					click: () => this.del(d) }) ]}) ]});

		let done;
		$('#notifylist li').each((i, e) => {
			if (d.starttime >= $(e).data('start')) return true;	//開始時間でソート

			done = true;
			$(e).before($notifyList);
			return false;
		});
		if (!done) $('#notifylist').append($notifyList);

		this.#badge();
	}
}

//XMLをオブジェクト化
const toObj = {
	EpgInfo: e => {
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

		if (e.num('ID')){
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
			d.drops = e.num('drops');
			d.scrambles = e.num('scrambles');
			d.errInfo = e.txt('errInfo');
			d.protect = e.num('protect') == 1;
		}

		return d;
	},
	RecSet: e => {
		r = e.children('recsetting');
		const d = {
			id: e.num('ID') || e.num('id'),
			recSetting: {
				recEnabled: r.num('recEnabled') == 1,
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
		}

		if (e.children('name').length){											//プリセット
			d.name = e.txt('name');
		}else if (e.txt('eventID') == 65535 || e.children('ONID').length){		//予約
			d.title = e.txt('title');
			d.starttime = new Date(`${e.txt('startDate').replace(/\//g,'-')}T${e.txt('startTime')}+09:00`).getTime(),
			d.duration = e.num('duration');
			if (d.duration) d.endtime = new Date(d.starttime + d.duration*1000).getTime();
			d.service = e.txt('service_name');
			d.onid = e.num('ONID');
			d.tsid = e.num('TSID');
			d.sid = e.num('SID');
			d.eid = e.num('eventID');
			d.comment = e.txt('comment');
			d.overlapMode = e.num('overlapMode');
		}

		return d
	},
	Search: e => {
		e = $(e).children('searchsetting');
		return {searchSetting: {
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
		} }
	}
}

//各リストを取得
const getList = new class {
	#notify = {};
	fetch = (key, url, n, fn = e=>e, toArray = e=>e) => {
		$.get(`${ROOT}api/Common`, {notify: n}).done(xml => {
			const notify = $(xml).num();
			if (notify == this.#notify[key]){
				fn(Info[key]);
			}else{
				this.#notify[key] = notify;
				$.get(url).done(xml => {
					Info[key] = new Map(toArray($(xml)));
					fn(Info[key]);
				});
			}
		});
	}
	reserve = fn => this.fetch('reserve', `${ROOT}api/EnumReserveInfo`, 2, fn, $xml => $.map($xml.find('reserveinfo'), e => toObj.RecSet($(e))).map(d => [d.id == 65535 ? d.id : `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`, d]));
	autoaddepg = fn => this.fetch('autoaddepg', `${ROOT}api/EnumAutoAdd`, 4, fn, $xml => $.map($xml.find('autoaddinfo'), e => Object.assign(toObj.RecSet($(e)), toObj.Search($(e)))).map(d=>[d.id, d]));
	recpreset = fn => {
		if (Info.preset){
			fn(Info.preset);
		}else{
			$.get(`${ROOT}api/EnumRecPreset`).done(xml => {
				Info.preset = new Map($.map($(xml).find('recpresetinfo'), e => toObj.RecSet($(e))).map(d=>[d.id, d]));
				fn(Info.preset);
			});
		}
	}
}

const resetSidePanel = tab => {
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0).removeClass('is-active');
	$('.mdl-tabs__tab,#sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$(`[href="#${tab}"], #${tab}`).addClass('is-active');
	$('.sidePanel-content').scrollTop(0);
}

//番組詳細を反映
const setEpgInfo = (d, $e) => {
	resetSidePanel('detail');
	if ($e) $e.addClass('open');

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
	$('#links').html(new SearchLinks(d).htmlEX);
	$('#summary p').html( ConvertText(d.text) );
	$('#ext').html( ConvertText(d.text_ext) );

	$('#genreInfo').html(() => !d.genre ? '' : typeof d.genre == 'string' ? `<li>${d.genre.replace(/\n/g,'<li>')}` : d.genre.map(e => `<li>${e.component_type_name}`));
	$('#videoInfo').html(() => !d.video ? '' : typeof d.video == 'string' ? `<li>${d.video.replace(/\n/g,'<li>')}` : d.video.map(e => `<li>${e.component_type_name} ${e.text}`));
	$('#audioInfo').html(() => !d.audio ? '' : typeof d.audio == 'string' ? `<li>${d.audio.replace(/\n/g,'<li>')}` : d.audio.map(e => `<li>${e.component_type_name} ${e.text} : ${{1:'16',2:'22.05',3:'24',5:'32',6:'44.1',7:'48'}[e.sampling_rate]}kHz`));

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

		$('#link_epginfo').attr('href', $e&&$e.is('tr') ? `reserveinfo.html?id=${$e.find('.flag').data('id')}` : `epginfo.html?id=${d.onid}-${d.tsid}-${d.sid}-${d.eid || d.starttime}`);
		$('#set').data('onid', d.onid).data('tsid', d.tsid).data('sid', d.sid).data('eid', d.eid);
	}
}

//マクロ一覧表示
const openMacro = $e => {
	$e.prevAll('input').addClass('is-active');
	$('#macro').addClass('is-visible');
}

//録画フォルダパス
const recFolder = new class {
	create = (d, i, partial) => {
		const div = '<div>';
		const container = 'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing';
		const select = 'mdl-cell pulldown mdl-grid mdl-grid--no-spacing';
		const textfield = 'mdl-cell mdl-textfield mdl-js-textfield';
		const delbtn = 'delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button';
		const middle = 'mdl-cell mdl-cell--middle';
		const recNamePlugIn = d.recNamePlugIn.match(/^(.*\.(?:dll|so))?(?:\?(.*))?/);
		partial = partial ? 'partial' : '';
		return $(div, {class: `preset ${container}`, append: [
					$(div, {class: delbtn, click: e => this.del($(e.currentTarget)), html:
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
	}
	del = $e => {
		$e = $e.parent();
		const $elem = $e.next();
		const $clone = $e.clone(true);
		$e.remove();
		const d = {
			message: '削除しました',
			timeout: 2000,
			actionHandler: () => {
				$clone.insertBefore($elem);
				Snackbar('元に戻しました');
			},
			actionText: '元に戻す'
		};
		Snackbar(d);
	}
}

//録画設定を反映
const setRecSettting = d => {
	const r = d.recSetting;

	$('[name=recEnabled]').mdl_prop('checked', r.recEnabled);				//有効
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

	return d;
}

//時間絞り込み
const dateList = new class {
	click = e => {
		$(e.currentTarget).toggleClass('mdl-color--accent mdl-color-text--accent-contrast');
		const $e = $('#dateList_select option').eq( $(e.currentTarget).data('count') );
		$e.prop('selected', !$e.prop('selected'));
	}
	create = () => {
		$("#dateList_touch").empty();
		$('[name=dateList]').val(
			$('#dateList_select option').get().map((e, i) => {
				this.add.touch(i, $(e).text());
				return $(e).val();
			})
		);
	}
	//追加
	add = {
		select: (t, text) => $('#dateList_select').append(`<option value="${text ? `${t}">${text}` : `${t.startDayOfWeek}-${t.startTime}-${t.endDayOfWeek}-${t.endTime}">${t.startDayOfWeek} ${t.startTime} ～ ${t.endDayOfWeek} ${t.endTime}`}`),
		touch: (i, text) => $("#dateList_touch").append($('<li>', {class: 'mdl-list__item', data: {count: i}, click: e => this.click(e), html: `<span class="mdl-list__item-primary-content">${text}</span>`}))
	}
}

//検索条件を反映
const setSerchSetting = s => {
	if (s.searchSetting) s = s.searchSetting;
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
			const val = `${Info.day[e.startDayOfWeek]}-${e.startHour}:${e.startMin}-${Info.day[e.endDayOfWeek]}-${e.endHour}:${e.endMin}`;
			const txt = `${Info.day[e.startDayOfWeek]} ${zero(e.startHour)}:${zero(e.startMin)} ～ ${Info.day[e.endDayOfWeek]} ${zero(e.endHour)}:${zero(e.endMin)}`
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
	resetSidePanel('search_');
	$e.addClass('open');

	getList.autoaddepg(d => {
		const id = $e.data('id');
		d = d.get(id);
		if (d){
			$('#set,#del').attr('action', `${ROOT}api/SetAutoAdd?id=${id}`);
			$('#link_epginfo').attr('href', `autoaddepginfo.html?id=${id}`);

			setSerchSetting(d);
			setRecSettting(d);

			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
		}else{
			Snackbar('Error : 自動予約が見つかりませんでした');
		}
		showSpinner();
	});
}

//録画結果を反映
const setRecInfo = $e => {
	if (Info.recinfo[$e.data('recinfoid')]){
		const d = Info.recinfo[$e.data('recinfoid')];
		setEpgInfo(d, $e);

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
				Info.recinfo[$e.data('recinfoid')] = toObj.EpgInfo($(xml).find('recinfo').first());
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

	$('#set,#del,#progres').attr('action', `${ROOT}api/SetReserve?id=${id}`);
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
	getList.recpreset(d => {
		setRecSettting(d.get(0));

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
	});
}

//録画マーク追加
const addRecMark = (r, $target, $content) => {
	if ($('.open').hasClass('epginfo')) return;

	if (!r.recSetting) r = toObj.RecSet(r);
	const rs = r.recSetting;
	const mode = !rs.recEnabled ? 'disabled' :
		rs.overlapMode == 1 ? 'partially' :
		rs.overlapMode == 2 ? 'shortage' :
		rs.recMode == 4 ? 'view' : '';
	const mark = !rs.recEnabled ? '無' :
		rs.overlapMode == 1 ? '部' :
		rs.overlapMode == 2 ? '不' :
		rs.recMode == 4 ? '視' : '録';
	$target.data('id', r.id).data('toggle', rs.recEnabled ? 1 : 0).data('oneclick', 0).text(rs.recEnabled ? '有効' : '無効');
	$content.not('.reserve').find('.startTime').after('<span class="mark reserve"></span>');
	$content.removeClass('disabled partially shortage view').addClass(`reserve ${mode}`).find('.mark.reserve').text(mark);

	return rs.recEnabled ? '無効' : '有効';
}

//一覧の録画トグル
const fixRecToggleSW = (d, $e = $('.open')) => {
	if ($e.hasClass('cell')) return;

	if (!d.recSetting) d = toObj.RecSet(d);

	const $input = $e.find('input');
	if ($e.hasClass('search')){						//検索ページ向け
		$e = $e.find('.flag').data('id', d.id);
		//スイッチ追加
		if (d.starttime < Date.now()){
			$input.removeClass().addClass('search recmark').empty();
			if (d.recSetting.recMode != 5) $input.unbind('click');
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
						$e.data('toggle', d.recSetting.recMode == 5 ? 1 : 0);
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

	const mode = !d.recSetting.recEnabled ? 'disabled' :	//無効
		d.recSetting.overlapmode == 1 ? 'partially' :		//チューナー不足
		d.recSetting.overlapmode == 2 ? 'shortage' : '';	//一部録画

	$e.removeClass('disabled partially shortage').addClass(mode);
	$input.mdl_prop('checked', d.recSetting.recEnabled);
}

//プログラム予約
const progReserve = d => {
	start = createViewDate(d.starttime);
	end = d.endtime ? createViewDate(d.endtime) : start;
	$('#startdate').val(`${start.getUTCFullYear()}-${zero(start.getUTCMonth()+1)}-${zero(start.getUTCDate())}`);
	$('#starttime').val(`${zero(start.getUTCHours())}:${zero(start.getUTCMinutes())}:${zero(start.getUTCSeconds())}`);
	$('#endtime').val(`${zero(end.getUTCHours())}:${zero(end.getUTCMinutes())}:${zero(end.getUTCSeconds())}`);

	$('#toprogres').text(`プログラム予約${d.eid != 65535 ? '化' : ''}`);
	$('#progres p').toggle(d.eid != 65535);
}

//番組詳細予約確認
const checkReserve = ($e, d) => {
	getList.reserve(r => {
		let id = d.next ? d.nextid : d.id || $e.find('.addreserve').data('id') || $e.children('.flag').data('id');
		r = r.get(`${d.onid}-${d.tsid}-${d.sid}-${d.next ? d._eid : d.eid}`);
		if (r){
			if (!id){															//追加されてた
				if (!r.recSetting.recMode) r = toObj.RecSet(r);
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

				setDefault(true);
				$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
			}
			if (!$e.hasClass('onair')) Snackbar('予約が見つかりませんでした');
		}else{
			setDefault();
			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
		}
	});
}

//番組詳細を取得
const getEpgInfo = async ($e, d = $e.data()) => {
	showSpinner(true);
	const id = `${d.onid}-${d.tsid}-${d.sid}-${d.next ? d._eid : d.eid || d.starttime}`
	const info = Info.EventInfo[id] ?? await $.get(`${ROOT}api/EnumEventInfo`, {basic: 0, id: id}).then(xml => {
		if ($(xml).find('eventinfo').length){
			return Info.EventInfo[id] = toObj.EpgInfo($(xml).find('eventinfo').first());
		}else{
			const id = d.next ? d.nextid : d.id || $e.find('.addreserve').data('id') || $e.children('.flag').data('id');
			if (id){													//プログラム予約または番組変更でなくなった
				getList.reserve(r => {
					const key = d.eid == 65535 ? id : `${d.onid}-${d.tsid}-${d.sid}-${d.eid || d.starttime}`
					r = r.get(key);
					if (r){
						setEpgInfo(r, $e);
						setReserve(r);

						$('#link_epginfo').attr('href', `reserveinfo.html?id=${id}`);
						$('[href="#detail"], #detail').removeClass('is-active');
						$('[href="#recset"], #recset').addClass('is-active');
					}else{
						$e.remove();
						Snackbar('予約が見つかりませんでした');
					}
				});
			}else{
				errMessage($(xml));
			}
		}
	});

	showSpinner();
	if (!info) return;

	setEpgInfo(info, $e);
	checkReserve($e, d);
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
	$('.mdl-js-snackbar').on('mdl-componentupgraded', () => Snackbar = d => document.querySelector('.mdl-js-snackbar').MaterialSnackbar.showSnackbar(typeof d === 'string' ? {message: d} : d));

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
			Snackbar(message);
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
				$.post(`${ROOT}api/Common`, $(e.currentTarget).data()).done(xml => Snackbar($(xml).find('info').text()));
			});
			suspend.showModal();
		});
	}

	//検索条件
	//詳細検索
	$('.advanced').toggle($('#advanced').prop('checked'));
	$('#advanced').change(e => {
		const enabled = $(e.currentTarget).prop('checked');
		$('.advanced').toggle(enabled);
		$('.g_celar').not('.advanced').toggle(!enabled).prev().toggleClass('has-button', !enabled);
		$('#add_dateList').prop('disabled', $('#dateList_edit').is(':hidden'));
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
	$('.all_select').click(() => $('#serviceList option').not('.hidden').prop('selected', true));
	//映像のみ表示
	$('#image').change(e => $(e.currentTarget).prop('checked')
		? $('#serviceList option.data').addClass('hidden')
		: $('.extraction:checked').each((i, e) => $(`#serviceList ${$(e).val()}`).removeClass('hidden'))
	);
	//ネットワーク表示
	$('.extraction').change(e => {
		const $e = $(e.currentTarget);
		$e.prop('checked')
			? $('#image').prop('checked') ? $( $e.val() ).not('.data').removeClass('hidden') : $( $e.val() ).removeClass('hidden')
			: $($e.val()).addClass('hidden').prop('selected', false);
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
			Snackbar('開始 > 終了です');
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
	const setPreset = (d, id) => {
		let messege = 'プリセットの読み込に失敗しました';
		d = d.get(id);
		if (d){
			const name = setRecSettting(d).name ?? $('[name=presetID] option:selected').text();
			messege = `"${name}" を読み込みました`;
		}
		Snackbar(messege);
	}
	$('[name=presetID]').change(e => {
		const $e = $(e.currentTarget);
		if ($e.val() != 65535){
			getList.recpreset(d => setPreset(d, parseInt($e.val())));
		}else if ($e.data('reseveid')){
			const d = $('#set').data();
			const id = d.eid == 65535 ? $e.data('reseveid') : `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`;
			getList.reserve(d => setPreset(d, id));
		}else{
			const id = $e.data('autoaddid');
			getList.autoaddepg(d => setPreset(d, id));
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
		Snackbar(xhr.status!=0 ? `${xhr.status}Error : ${xhr.statusText}` : `Error : ${textStatus.url.match('api/set') ? 'トークン認証失敗' : '通信エラー'}`);
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
	$('#archive').change(e => {
		const checked = $(e.currentTarget).prop('checked');
		$('#startDate,#endDate').attr('required', checked);
		$('#startDate').parent().toggleClass('is-invalid', checked && $('#startDate').val()=='');
		$('#endDate').parent().toggleClass('is-invalid', checked && $('#endDate').val()=='');
	});
	$('.submitEX').click(e => {
		e.preventDefault();
		e = e.currentTarget;
		$(e.form).find('.ctok').prop('disabled', true).filter($(e).data('ctok')).prop('disabled', false);
		$(e.form).attr('action', e.formAction).submit();
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
							setDefault(true);
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
