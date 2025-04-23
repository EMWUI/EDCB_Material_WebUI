const isMobile = navigator.userAgentData ? navigator.userAgentData.mobile : navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/);
const isTouch = 'ontouchstart' in window;

const isSmallScreen = () => window.matchMedia(window.MaterialLayout.prototype.Constant_.MAX_WIDTH).matches;
const showSpinner = (visible = false) => $('#spinner .mdl-spinner').toggleClass('is-active', visible);
const errMessage = xml => xml.find('err').each((i, e) => Snackbar(`${i==0 ? 'Error : ' : ''}${$(e).text()}`));
const zero = (e, n = 2) => (Array(n).join('0')+e).slice(-n);
let Snackbar = d => setTimeout(Snackbar, 1000, d);

$.fn.extend({
	mdl_prop(prop, enable){
		this.prop(prop, enable).parent().toggleClass(`is-${prop}`, enable);
		return this;
	},
	txt(a){
		return this.children(a).text();
	},
	num(a){
		return Number(this.txt(a));
	},
});

const Info = {
	day: ['日', '月', '火', '水', '木', '金', '土'],
	EventInfo: {},
	recinfoEX: {},
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
		//{href : d => `${d._title}`, class: '', local: true, icon: '', src: ''},
		{href: d => `search.html?andkey=${d._title}`, local: true, icon: 'search'},
		{href: d => `https://www.google.co.jp/search?q=${d._title}`, src:'img/google.png'},
		{href: d => `https://www.google.co.jp/search?q=${d._title}&btnI=Im+Feeling+Lucky`, icon: 'sentiment_satisfied'},
		{href: d => `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ConvertZtoH(d.title))}&location=${encodeURIComponent(ConvertZtoH(d.service))}&dates=${d.dates}&details=${d.details}${Links.calendar.op}`, class: "mdl-cell--hide-phone mdl-cell--hide-tablet", icon: 'event'},
	];
	constructor(d){
		this.#d = {...d};
		this.#d._title = encodeURIComponent(ConvertZtoH(d.title).replace(/(?!^【.*?】$)[＜【\[].*?[＞】\]]|（.*?版）/g, ''));
		this.#d.dates = encodeURIComponent(d.dates??`${ConvertTime(d.starttime, 'ISO')}/${ConvertTime(d.endtime, 'ISO')}`);
		this.#d.details = encodeURIComponent((d.details??Links.calendar.details.replace(/%text_char%/g, d.text)).replace(/%br%/g, '\n'));
	}

	#link = d => $('<a>', {class: `mdl-button mdl-button--icon ${d.class??''}`, href: d.href(this.#d), target: !d.local?'_blank':undefined, rel: !d.local?'noreferrer':undefined, append: $(`<${d.icon?'i':'img'}>`, {class: 'material-icons', src: d.src, alt: d.alt, text: d.icon})})
	get html(){return this.#defaults.map(d => this.#link(d));}		//番組表向け
	get htmlEX(){													//サイドパネル向け
		const a = this.#defaults.concat(Links.links??[]).map(d => this.#link(d));
		if (Notification.permission == 'granted') a.unshift($('<button>', {class: `notify_${this.#d.eid} mdl-button mdl-js-button mdl-button--icon`, data: {notification: $(`#notify_${this.#d.eid}`).length > 0}, disabled: this.#d.starttime-30<=Date.now(), click: e => { const d = Info.EventInfo[`${this.#d.onid}-${this.#d.tsid}-${this.#d.sid}-${this.#d.eid}`]||Info.reserve[0].get(this.#d.id); $(e.currentTarget).data('notification') ? Notify.del(d) : Notify.create(d, true); }, append: $('<i>', {class: 'material-icons', text: $(`#notify_${this.#d.eid}`).length ? 'notifications_off' : this.#d.starttime-30<=Date.now() ? 'notifications' : 'add_alert'}),}) )
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
	for (let m; m = re.exec(a); i = re.lastIndex){
		s += $('<p>').text(a.substring(i, re.lastIndex - m[0].length)).html();
		s += $('<p>').html($('<a>', {href: m[0], target: '_blank', text: m[0], rel:'noreferrer'})).html();
	}
	s += $('<p>').text(a.substring(i)).html();
	return s.replace(/\n/g,'<br>');
};
const ConvertTitle = a => !a ? '' : $('<p>').text(a).html().replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g, '<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>');
const ConvertService = d => `<img class="logo" src="${ROOT}api/logo?onid=${d.onid}&sid=${d.sid}">` + $('<p>').html($('<span>').text(d.service||Info.service.get(`${d.onid}-${d.tsid}-${d.sid}`).service_name)).html();
const ConvertServiceList = d => ConvertService({onid: d.serviceList[0].onid, tsid: d.serviceList[0].tsid, sid: d.serviceList[0].sid})+`${d.serviceList.length > 1 ? `<small>.他${d.serviceList.length - 1}ch` : ''}`;
const ConvertZtoH = s => s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');

const Notify = new class {
	#sound = new Audio(`${ROOT}video/notification.mp3`);
	constructor(){
		this.#sound.volume = 0.2;
	}
	#badge(){				//通知バッチ
		const count = $('[id^=notify_]').length;
		$('#notification i').toggleClass('mdl-badge', count != 0).text(`notifications${count==0 ? '_none' : ''}`);
		$('#noNotify').toggle(count == 0);
		$('#notification i').attr('data-badge', count);
	}
	save(d, remove){		//通知保存
		const a = localStorage.getItem('notifications') ? JSON.parse(localStorage.getItem('notifications')) : new Array();
		!remove ? a.push(d) : a.some((v, i) => {if (v.eid == d.eid) a.splice(i,1);});
		localStorage.setItem('notifications', JSON.stringify(a));
	}
	del(d, noSnack){		//通知リスト削除
		clearTimeout(d.timer);
		this.save(d, true);
		$(`.eid_${d.eid}.notify_icon,#notify_${d.eid}`).remove();
		$(`.notify_${d.eid}`).data('notification', false).children().text('add_alert');

		this.#badge();
		if (!noSnack) Snackbar('削除しました');
	}
	create(d, save){		//通知登録
		if (save){
			this.save(d);
			Snackbar('追加しました');
		}

		d.timer = setTimeout(async () => {
			this.del(d, true);
			$(`.notify_${d.eid}`).children().text('notifications');

			const id = d.eid==65535 ? d.id : `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`;

			const _d = d.eid==65535 ? await getList.reserve(r => r[0].get(id)) : Info.EventInfo[id] ?? await $.get(`${ROOT}api/EnumEventInfo`, {id: id}).then(xml => toObj.EpgInfo($(xml).find('eventinfo').first()));
			const notification = new Notification(_d.title, {
				body: `${ConvertTime(_d.starttime)}～ ${_d.service}\n${_d.text}`,
				tag: id,
				icon: 'img/apple-touch-icon.png'
			});

			notification.onclick = e => {
				e.preventDefault();
				location.href = d.eid==65535 ? `reserveinfo.html?id=${id}` : `epginfo.html?id=${id}`;
				notification.close();
			};

			this.#sound.play();

			setTimeout(() => notification.close(), 15*1000);	//通知を閉じる
		}, d.starttime - Date.now() - 30*1000);

		$(`.eid_${d.eid}.startTime`).after($('<div class="notify_icon"><i class="material-icons">notifications_active</i></div>'));
		$(`.notify_${d.eid}`).data('notification', true).children().text('notifications_off');

		const date = createViewDate(d.starttime);

		const $notifyList = $('<li>', {id: `notify_${d.eid}`, class: 'mdl-list__item mdl-list__item--two-line', data: {start: d.starttime}, append: [
			$('<span>', {class: 'mdl-list__item-primary-content', click: () => location.href = d.eid==65535 ? `reserveinfo.html?id=${d.id}` : `epginfo.html?id=${d.onid}-${d.tsid}-${d.sid}-${d.eid}`, append: [
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
	EpgInfo(e){
		e = $(e);
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

			genre: e.children('contentInfo').get().map(e => ({
				nibble1: $(e).num('nibble1'),
				nibble2: $(e).num('nibble2'),
				component_type_name: $(e).txt('component_type_name')
			})),			
			video: e.children('videoInfo').get().map(e => ({
				stream_content: $(e).num('stream_content'),
				component_type: $(e).num('component_type'),
				component_tag: $(e).num('component_tag'),
				text: $(e).txt('text'),
				component_type_name: $(e).txt('component_type_name')
			})),
			audio: e.children('audioInfo').get().map(e => ({
				stream_content: $(e).num('stream_content'),
				component_type: $(e).num('component_type'),
				component_tag: $(e).num('component_tag'),
				stream_type: $(e).num('stream_type'),
				simulcast_group_tag: $(e).num('simulcast_group_tag'),
				ES_multi_lingual: $(e).num('ES_multi_lingual_flag') == 1,
				main_component: $(e).num('main_component_flag') == 1,
				quality_indicator: $(e).num('quality_indicator'),
				sampling_rate: $(e).num('sampling_rate'),
				text: $(e).txt('text'),
				component_type_name: $(e).txt('component_type_name')
			}))
		}
		if (d.duration) d.endtime = new Date(d.starttime + d.duration*1000).getTime();

		if (e.num('ID')){
			d.id = e.num('ID');
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
	RecSet(e){
		e = $(e);
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
				recFolderList: r.children('recFolderList').children('recFolderInfo').get().map(e => ({
					recFolder: $(e).txt('recFolder'),
					writePlugIn: $(e).txt('writePlugIn'),
					recNamePlugIn: $(e).txt('recNamePlugIn')
				})),
				partialRecFolder: r.children('partialRecFolder').children('recFolderInfo').get().map(e => ({
					recFolder: $(e).txt('recFolder'),
					writePlugIn: $(e).txt('writePlugIn'),
					recNamePlugIn: $(e).txt('recNamePlugIn')
				})),
			}
		}

		if (e.txt('eventID') == 65535 || e.children('ONID').length){		//予約
			d.title = e.txt('title');
			d.starttime = e.children('startDate').length ? new Date(`${e.txt('startDate').replace(/\//g,'-')}T${e.txt('startTime')}+09:00`).getTime() : e.num('startTime'),
			d.duration = e.num('duration');
			d.service = e.txt('service_name');
			d.onid = e.num('ONID');
			d.tsid = e.num('TSID');
			d.sid = e.num('SID');
			if (e.children('dayOfWeekFlag').length){
				d.dayOfWeekFlag = e.num('dayOfWeekFlag');
				d.endtime = d.starttime + d.duration;
			}else{
				if (d.duration) d.endtime = new Date(d.starttime + d.duration*1000).getTime();
				d.eid = e.num('eventID');
				d.comment = e.txt('comment');
				d.overlapMode = e.num('overlapMode');
				d.size = e.txt('size');
			}
		}else if (e.children('name').length) d.name = e.txt('name');		//プリセット
		else d.addCount = e.num('addCount');								//EPG予約

		return d
	},
	Search(e){
		s = $(e).children('searchsetting');
		return {
			searchSetting: {
				disableFlag: s.num('disableFlag') == 1,
				andKey: s.txt('andKey'),
				notKey: s.txt('notKey'),
				note: s.txt('note'),
				regExpFlag: s.num('regExpFlag') == 1,
				aimaiFlag: s.num('aimaiFlag') == 1,
				titleOnlyFlag: s.num('titleOnlyFlag') == 1,
				caseFlag: s.num('caseFlag') == 1,

				contentList: s.children('contentList').get().map(e => {
					return {
						content_nibble: $(e).num('content_nibble'),
						user_nibble: $(e).num('user_nibble')
					}
				}),
				notContetFlag: s.txt('notContetFlag') == 1,
				serviceList: s.children('serviceList').get().map(e => {
					return {
						onid: $(e).num('onid'),
						tsid: $(e).num('tsid'),
						sid: $(e).num('sid')
					}
				}),
				dateList: s.children('dateList').get().map(e => {
					return {
						startDayOfWeek: $(e).num('startDayOfWeek'),
						startMin: $(e).num('startMin'),
						startHour: $(e).num('startHour'),
						endDayOfWeek: $(e).num('endDayOfWeek'),
						endHour: $(e).num('endHour'),
						endMin: $(e).num('endMin')
					}
				}),

				notDateFlag: s.num('notDateFlag') == 1,
				freeCAFlag: s.num('freeCAFlag'),
				chkDurationMin: s.num('chkDurationMin'),
				chkDurationMax: s.num('chkDurationMax'),
				chkRecEnd: s.num('chkRecEnd') == 1,
				chkRecNoService: s.num('chkRecNoService') == 1,
				chkRecDay: s.num('chkRecDay')
			}
		}
	},
	service(e){
		e = $(e);
		return {
			onid: e.num('ONID'),
			tsid: e.num('TSID'),
			sid: e.num('SID'),
			service_type: e.num('service_type'),
			partialReceptionFlag: e.num('partialReceptionFlag') == 1,
			service_provider_name: e.txt('service_provider_name'),
			service_name: e.txt('service_name'),
			network_name: e.txt('network_name'),
			ts_name: e.txt('ts_name'),
			remote_control_key_id: e.num('remote_control_key_id')
		}
	}
}

//各リストを取得
const getList = new class {
	#presets = {
		reserve: {
			notify: 2,
			url: `${ROOT}api/EnumReserveInfo`,
			sort: 'starttime',
			toArray: $xml => $.map($xml.find('reserveinfo'), e => toObj.RecSet(e)).map(d => [d.eid == 65535 ? d.id : `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`, d]),
		},
		tunerreserve: {
			notify: 2,
			url: `${ROOT}api/EnumTunerReserveInfo`,
			sort: 'starttime',
			toArray: $xml => $.map($xml.find('reserveinfo'), e => toObj.RecSet(e)).map(d => [d.eid == 65535 ? d.id : `${d.onid}-${d.tsid}-${d.sid}-${d.eid}`, d]),
			tabArray: $xml => $.map($xml.find('tuner'), e => [[{total: $(e).num('total'),tunerName: $(e).txt('tunerName'),tunerID: $(e).num('tunerID')}, e]]),
		},
		recinfo: {
			notify: 3,
			url: `${ROOT}api/EnumRecInfo`,
			toArray: $xml => $.map($xml.find('recinfo'), e => toObj.EpgInfo(e)).map(d => [d.id, d]),
		},
		autoaddepg: {
			notify: 4,
			url: `${ROOT}api/EnumAutoAdd`,
			toArray: $xml => $.map($xml.find('autoaddinfo'), e => Object.assign(toObj.RecSet(e) , toObj.Search(e))).map(d => [d.id, d]),
		},
		autoaddmanual: {
			notify: 5,
			url: `${ROOT}api/EnumManuAdd`,
			toArray: $xml => $.map($xml.find('autoaddinfo'), e => toObj.RecSet(e)).map(d => [d.id, d]),
		},
		search: {
			url: `${ROOT}api/SearchEvent`,
			toArray: ($xml, archive) => $.map($xml.find('eventinfo'), e => toObj.EpgInfo(e)).map(d => [`${d.onid}-${d.tsid}-${d.sid}-${archive?d.starttime:d.eid}`, d]),
		},
		recpreset: {
			url: `${ROOT}api/EnumRecPreset`,
			toArray: $xml => ({0: new Map($.map($xml.find('recpresetinfo'), e => toObj.RecSet(e)).map(d => [d.id, d]))})
		},
		service: {
			url: `${ROOT}api/EnumService`,
			toArray: $xml => new Map($.map($xml.find('serviceinfo'), e => toObj.service(e)).map(d => [`${d.onid}-${d.tsid}-${d.sid}`, d]))
		},
	}

	#notify = {};
	#div;
	#count;
	#index(page){return Math.floor(page / this.#div * PAGE_COUNT) * this.#div};
	constructor(){
		this.#div = Math.round(200/PAGE_COUNT)*PAGE_COUNT;
		if (this.#div != 200) this.#count = this.#div;
	}

	async checkUpdate(key){
		const notify = await $.get(`${ROOT}api/Common`, {notify: this.#presets[key].notify}).then(r => $(r).num(), r=>this.#notify[key]) + 1;
		if (notify != this.#notify[key]) return notify;
	}
	async fetch(key, fn = e=>e){
		const preset = this.#presets[key];
		if (!preset) return;
		if (Info[key]) return fn(Info[key]);

		return await $.get(preset.url).then(xml => {
			Info[key] = preset.toArray($(xml));
			return fn(Info[key]);
		});
	}
	async fetchEX(key, index = 0, any, fn){
		const preset = this.#presets[key];
		if (!preset) return;

		const notify = typeof any === 'number' ? any : await this.checkUpdate(key);
		const sort = typeof any === 'string' ? any : null;
		fn ??= typeof any === 'function' ? any : e=>e;

		if (!notify && Info[key][index]){
			if (sort) Info[key][index] = new Map(this.sort(key, Info[key][index], sort));
			return fn(Info[key]);
		};

		return await $.get(preset.url, {index: index, count: this.#count}).then(xml => {
			const $xml = $(xml);
			if (notify){
				this.#notify[key] = notify;
				Info[key] = preset.tabArray ? {} : {total: $xml.children().num('total')};
			}

			if (preset.tabArray){
				(preset.tabArray($(xml))).forEach((e, i) => {
					e[0][index] = new Map(this.sort(key, preset.toArray($(e[1])), sort));
					Info[key][i+1] = e[0];
				});
			}else Info[key][index] = new Map(this.sort(key, preset.toArray($xml), sort));

			return fn(Info[key]);
		}, () => fn(Info[key]));
	}
	sort(key, d, sort, reverse){
		if (typeof sort === 'boolean'){
			reverse = sort;
			sort = null;
		}
		const x = this.#presets[key];
		if (sort) x.sort = sort;
		if (!x.sort) return d;
		return [...d].sort((a, b) => reverse ? b[1][x.sort] > a[1][x.sort] ? 1 : -1 : a[1][x.sort] > b[1][x.sort] ? 1 : -1);
	}

	reserve = fn => this.fetchEX('reserve', 0, fn);
	tunerreserve = fn => this.fetchEX('tunerreserve', 0, fn);
	recinfo = (fn, page) => this.fetchEX('recinfo', this.#index(page), fn);
	autoaddepg = fn => this.fetchEX('autoaddepg', 0, fn);
	autoaddmanual = fn => this.fetchEX('autoaddmanual', 0, fn);
	recpreset = fn => this.fetch('recpreset', fn);
	service = fn => this.fetch('service', fn);
	async search(form, index = 0, fn = e=>e){
		await this.reserve();
		const preset = this.#presets.search;
		$(`#${form}`).find('.ctok').prop('disabled', true).filter('#api').prop('disabled', false);
		Info.search ??= {};
		const key = $(`#${form}`).serialize();
		if (Info.search[key] && Info.search[key][index]) return fn(Info.search[key]);
		const params = new URLSearchParams();
		if (index) params.set('index', index);
		if (this.#count) params.set('count', this.#count);
		return await $.post(`${preset.url}?${params.toString()}`, $(`#${form}`).serializeArray()).then(xml => {
			const $xml = $(xml);
			const d = new Map(this.sort('search', preset.toArray($xml, $('#archive').prop('checked'))));
			Info.search[key] ??= {total:  $xml.children().num('total'), archive: $('#archive').prop('checked')};
			Info.search[key][index] = d;
			return fn(Info.search[key]);
		});
	};
}

const createHtml = new class {
	#days = Info.day;
	#recMode = ['全サービス', '指定サービス', '全サービス（デコード処理なし）', '指定サービス（デコード処理なし）', '視聴', '無効'];
	#presets = {
		reserve: {
			title: '予約一覧',
			subtitle: '番組情報',
			load: () => {
				if (!$('tbody tr').length) return;
				const sortedStartTime = $.map($('tbody tr'), e=>e).sort((a,b) => $(a).data('starttime') - $(b).data('starttime'));
				const onStart = () => {
					if (!sortedStartTime.length) return;
					const $e = $(sortedStartTime[0]);
					this.#timerID[1] = setTimeout(() => {
						$e.find('.flag>span').empty().addClass('recmark');
						if ($e.has('disabled')) $e.find('.flag>span').one({click(){$e.children('.flag').data('toggle', 1);addReserve($(this));}});
						sortedStartTime.shift();
						onStart();
					}, $e.data('starttime') - Date.now());
				}
				onStart();
				this.#timerID[2] = setTimeout(() => this.popstate(), Math.min(...$.map($('tbody tr'), e => $(e).data('endtime'))) - Date.now());
			},
			sidePanel: '#detail,#recset',
			class: d => `reserve${d.recSetting.recEnabled ? '' : ' disabled'} `,
			data: d => ({id: d.id, onid: d.onid, tsid: d.tsid, sid: d.sid, eid: d.eid??65535, starttime: d.starttime - d.recSetting.startMargine * 1000, endtime: d.endtime + (d.recSetting.endMargine + 20) * 1000}),
			click: e => {
				if ($(e.target).is('.flag, .flag *')) return;
				$('#sidePanel').length ? getEpgInfo($(e.currentTarget)) : location.href = `reserveinfo.html?id=${$(e.currentTarget).data('id')}`;
			},
			cell: [
				{title: '録画', class: 'flag', text: d => createSwitch(d), data: d => ({id: d.id})},
				{title: '日付', class: 'date', text: d => `${ConvertTime(d.starttime, false, true)}～${ConvertTime(d.endtime)}`},
				{title: '番組名', class: 'title', col: 4, text: d => ConvertTitle(d.title)},
				{title: 'サービス', class: 'service', text: d => '<span>'+ConvertService(d)},
				{title: 'コメント', class: 'comment', text: d => d.comment},
				{title: '予想サイズ', class: 'size', text: d => d.size, n: true},
				{title: '優先度', class: 'priority', text: d => `<span class="inline-icons mdl-cell--hide-desktop mdl-cell--hide-tablet"><i class="material-icons">grade</i></span>${d.recSetting.priority}`, n: true},
			],
		},
		tunerreserve: {
			tab: (d,i) => $('<a>', {href: '?tab='+i, class: 'mdl-layout__tab'+(i==1?' is-active':''), text: `${i}:${d.tunerName}(${d.total})`, click: e=>{e.preventDefault();this.setTab(i);}}),
			title: 'チューナー別',
			subtitle: '番組情報',
			load: () => {
				if (!$('tbody tr').length) return;
				const sortedStartTime = $.map($('tbody tr'), e=>e).sort((a,b) => $(a).data('starttime') - $(b).data('starttime'));
				const onStart = () => {
					if (!sortedStartTime.length) return;
					const $e = $(sortedStartTime[0]);
					this.#timerID[1] = setTimeout(() => {
						$e.find('.flag>span').empty().addClass('recmark');
						sortedStartTime.shift();
						onStart();
					}, $e.data('starttime') - Date.now());
				}

				onStart();
				this.#timerID[2] = setTimeout(() => this.popstate(), Math.min(...$.map($('tbody tr'), e => $(e).data('endtime'))) - Date.now());
			},
			sidePanel: '#detail,#recset',
			class: d => `reserve${d.recSetting.recEnabled ? '' : ' disabled'} `,
			data: d => ({onid: d.onid, tsid: d.tsid, sid: d.sid, eid: d.eid??65535, starttime: d.starttime - d.recSetting.startMargine * 1000, endtime: d.endtime + (d.recSetting.endMargine + 20) * 1000}),
			click: e => {
				if ($(e.target).is('.flag, .flag *')) return;
				$('#sidePanel').length ? getEpgInfo($(e.currentTarget)) : location.href = `reserveinfo.html?id=${$(e.currentTarget).data('id')}`;
			},
			cell: [
				{title: '録画', class: 'flag', text: d => createSwitch(d), data: d => ({id: d.id})},
				{title: '日付', class: 'date', text: d => `${ConvertTime(d.starttime, false, true)}～${ConvertTime(d.endtime)}`},
				{title: '番組名', class: 'title', col: 4, text: d => ConvertTitle(d.title)},
				{title: 'サービス', class: 'service', text: d => '<span>'+ConvertService(d)},
				{title: 'コメント', class: 'comment', text: d => d.comment},
				{title: '予想サイズ', class: 'size', text: d => d.size, n: true},
				{title: '優先度', class: 'priority', text: d => `<span class="inline-icons mdl-cell--hide-desktop mdl-cell--hide-tablet"><i class="material-icons">grade</i></span>${d.recSetting.priority}`, n: true},
			],
		},
		recinfo: {
			div: true,
			title: '録画結果',
			sidePanel: '#detail,#error',
			class: d => d.drops>0 ? 'drops' : d.scrambles>0 ? 'scrambles' : '',
			data: d => ({recinfo: d.id}),
			click: e => $('#sidePanel').length ? setRecInfo($(e.currentTarget)) : location.href = `recinfodesc.html?id=${$(e.currentTarget).data('recinfo')}`,
			cell: [
				{title: '日付', class: 'date', text: d => `${ConvertTime(d.starttime, false, true)}～${ConvertTime(d.endtime)}`},
				{title: 'タイトル', class: 'title', col: 4, text: d => ConvertTitle(d.title)},
				{title: 'サービス', class: 'service', text: d => '<span>'+ConvertService(d)},
				{title: '結果', class: 'comment', col: 4, text: d => d.comment},
				{title: 'D', class: 'drop', col: 2, text: d => `<span class="mdl-cell--hide-desktop mdl-cell--hide-tablet">Drops:</span>${d.drops}`, n: true},
				{title: 'S', class: 'scramble', col: 2, text: d => `<span class="mdl-cell--hide-desktop mdl-cell--hide-tablet">Scrambles:</span>${d.scrambles}`, n: true},
			],
		},
		autoaddepg: {
			title: 'EPG予約',
			add: 'autoaddepginfo.html',
			sidePanel: '#search_,#recset',
			data: d => ({autoadd: d.id}),
			click: e => {
				if ($(e.target).is('.count a')) return;
				$('#sidePanel').length ? setAutoAdd($(e.currentTarget)) : location.href = `autoaddepginfo.html?id=${$(e.currentTarget).data('id')}`;
			},
			cell: [
				{title: 'キーワード', class: 'keyword', col: 4, text: d => d.searchSetting.andKey},
				{title: 'NOTキーワード', class: 'notkeyword', col: 3, text: d => [$('<span>', {class: 'inline-icons mdl-cell--hide-desktop mdl-cell--hide-tablet', html: $('<i>', {class: 'material-icons', text: 'block'})}), d.searchSetting.notKey]},
				{title: 'メモ', class: 'note', col: 1, text: d => [$('<span>', {class: 'inline-icons mdl-cell--hide-desktop mdl-cell--hide-tablet', html: $('<i>', {class: 'material-icons', text: 'note'})}), d.searchSetting.note]},
				{title: '登録数', class: 'count', col: 2, order: 1, text: d => [$('<span>', {class: 'inline-icons mdl-cell--hide-desktop mdl-cell--hide-tablet', html: $('<i>', {class: 'material-icons', text: 'search'})}), $('<a>', {text: d.addCount, href: `search.html?id=${d.id}`})], n: true},
				{title: 'サービス', class: 'servicelist', col: 2, text: d => '<span>'+ConvertServiceList(d.searchSetting)},
				{title: 'ジャンル', class: 'category', col: 2, text: d => d.searchSetting.contentList.length ? $(`#contentList [value="${d.searchSetting.contentList[0].content_nibble}"]`).text() : '全ジャンル'},
				{title: '録画モード', class: 'mode', col: 2, text: d => this.#recMode[d.recSetting.recMode]}
			],
		},
		autoaddmanual: {
			title: 'プログラム予約',
			add: 'autoaddmanualinfo.html',
			sidePanel: '#manuadd,#recset',
			data: d => ({manuadd: d.id}),
			click: e => $('#sidePanel').length ? setManuAdd($(e.currentTarget)) : location.href = `autoaddmanualinfo.html?id=${$(e.currentTarget).data('id')}`,
			cell: [
				{title: '番組名', class: 'title', col:4, text: d => d.title},
				{title: '曜日', class: '', text: d => this.#days.filter((e, i) => (d.dayOfWeekFlag & 2 ** i))},
				{title: '時間', class: '', text: d => `${zero(Math.floor(d.starttime / 3600))}:${zero(Math.floor((d.starttime / 60) % 60))}:${zero(Math.floor(d.starttime % 60))} ～ ${zero(Math.floor(d.endtime / 3600))}:${zero(Math.floor((d.endtime / 60) % 60))}:${zero(Math.floor(d.endtime % 60))}`},
				{title: '録画モード', class: 'mode', text: d => this.#recMode[d.recSetting.recMode]},
				{title: '優先度', class: 'priority', text: d => `<span class="inline-icons mdl-cell--hide-desktop mdl-cell--hide-tablet"><i class="material-icons">grade</i></span>${d.recSetting.priority}`, n: true},
			],
		},
		search: {
			ori: true,
			div: true,
			load: () => {
				if (!$('tbody tr').length) return;
				const sortedStartTime = $.map($('tbody tr').filter((i,a) => $(a).find('.flag').data('id')), e=>e).sort((a,b) => $(a).data('starttime') - $(b).data('starttime'));
				const onStart = () => {
					if (!sortedStartTime.length) return;
					const $e = $(sortedStartTime[0]);
					this.#timerID[1] = setTimeout(() => {
						$e.find('.flag>span').empty().addClass('recmark');
						if ($e.children('.flag').has('disabled')) $e.find('.flag>span').one({click(){$e.children('.flag').data('toggle', 1);addReserve($(this));}});
						sortedStartTime.shift();
						onStart();
					}, $e.data('starttime') - Date.now());
				}
				onStart();

				const sortedEndTime = $.map($('tbody tr').filter((i,a) => $(a).data('endtime')), e=>e).sort((a,b) => $(a).data('endtime') - $(b).data('endtime'));
				const onEnd = () => {
					if (!sortedEndTime.length) return;
					const $e = $(sortedEndTime[0]);
					this.#timerID[2] = setTimeout(() => {
						$e.children('.flag').data('id', false).children('span').remove();
						sortedEndTime.shift();
						onEnd();
					}, $e.data('endtime') - Date.now());
				}
				onEnd();
			},
			class: () => 'search',
			data: d => ({onid: d.onid, tsid: d.tsid, sid: d.sid, eid: d.eid, endtime: d.endtime, starttime: d.id?d.starttime:undefined}),
			click: e => {
				if ($(e.target).is('.flag, .flag *')) return;
				$('#sidePanel').length ? getEpgInfo($(e.currentTarget)) : location.href = `reserveinfo.html?id=${$(e.currentTarget).data('id')}`;
			},
			cell: [
				{title: '録画', class: 'flag', text: d => createSwitch(d), data: d => ({id: d.id, onid: d.onid, tsid: d.tsid, sid: d.sid, eid: d.eid, oneclick: !d.id?1:undefined})},
				{title: '日付', class: 'date', text: d => `${ConvertTime(d.starttime, false, true)}`},
				{title: '番組名', class: 'title', col: 4, text: d => ConvertTitle(d.title)},
				{title: 'サービス', class: 'service', text: d => '<span>'+ConvertService(d)},
				{title: '番組内容', class: 'info', text: d => d.text},
			],
		},
	}

	#timerID = [];
	#clearTimeout = () => this.#timerID.forEach(e => clearTimeout(e));

	#key;
	#form;
	#container = 'div.mdl-layout__content';
	#div = Math.round(200 / PAGE_COUNT);
	constructor(){
		this.#setFromURL();
		if (!this.#preset) return;
		$(window).on('popstate', () => this.popstate());
		$(() => {
			getList.service();
			if (this.#preset.load) this.#preset.load();

			$('.pagination a').click(e => {
				e.preventDefault();
				this.setPage(new URL($(e.currentTarget).attr('href'), location.href).searchParams.get('page') ?? 0);
			});
			/*
			$('.pagination button:not(:disabled)').click(e => {
				e.preventDefault();
				const page = Number(new URL($(e.currentTarget).attr('formaction'), location.href).searchParams.get('page') ?? 0);
				this.#form = $(e.currentTarget).attr('form');
				this.setPage(page);
			});
			//*/
			if (!this.enabled) return;

			this.#checkUpdate();
			this.#resetSidePanel();

			$('.mdl-navigation a').click(e => {
				const key = $(e.currentTarget).attr('href').split('.')[0];
				if (!this[key]) return;
				e.preventDefault();
				this[key]();
			});
			$('.mdl-layout__tab').click(e => {
				const params = new URLSearchParams($(e.currentTarget).attr('href'));
				if (!params.has('tab')) return;
				e.preventDefault();
				this.setTab(params.get('tab'));
			});
		});
	}

	set setContainer(e){this.#container = e};
	get #preset(){return this.#presets[this.#key] && this.#presets[this.#key]};
	get enabled(){return this.#key=='index' || this.#preset && !this.#preset.ori || false};
	get #index(){return this.#preset.div ? (Math.floor(this.#page / this.#div) * this.#div * PAGE_COUNT) : 0};

	load(){
		this.#clearTimeout();
		this.#presets[this.#key].load();
	}

	#main(d){
		const i = (this.#preset.div ? this.#page % this.#div : this.#page) * PAGE_COUNT;
		return [
			$('<caption>', {text: `${d.total} 件中 ${Math.min(d.total, this.#page * PAGE_COUNT + 1)} － ${Math.min(d.total, (this.#page + 1) * PAGE_COUNT)} 件`}),
			$('<thead>', {class: 'mdl-cell--hide-phone', append:
				$('<tr>', {append: this.#preset.cell.map(cell =>
					$('<th>', {class: `${cell.class}${cell.n ? '' : ' mdl-data-table__cell--non-numeric'}`, text: cell.title}) )}) }),
			$('<tbody>', {append: [...d[this.#index]].slice(i, i + PAGE_COUNT).map(e =>
				$('<tr>', { class: `${this.#preset.class ? this.#preset.class(e[1]) : ''} mdl-grid--no-spacing`, data: this.#preset.data(e[1]), click: e => this.#preset.click(e), append: this.#preset.cell.map(cell =>
					$('<td>', {class: `${cell.class}${cell.n?'':' mdl-data-table__cell--non-numeric'}${cell.col?` mdl-cell--${cell.col}-col-phone`:''}${cell.order?` mdl-cell--order-${cell.order}-phone`:''}`, data: cell.data && cell.data(e[1]), append: cell.text(e[1])}) )}) )})
		];
	}
	#pagination(d){
		const i = 5;	//表示数
		const max = Math.ceil(d.total / PAGE_COUNT - 1);
		const n = Math.max(Math.min(this.#page-Math.round(i/2)+1, max-i+1), 0);
		return $('<div>', {class: 'mdl-grid mdl-grid--no-spacing', append: [
					{text: 'first_page', page: 0, disabled: this.#page==0},
					{text: 'chevron_left', page: this.#page-1, disabled: this.#page == 0, class: 'prev'},
					...[...Array(i)].map((e, i)=>i+n).filter(i=>i==this.#page||i<=max).map(i => ({text: i+1, page: i, class: i==this.#page?'mdl-color--accent mdl-color-text--accent-contrast':'', disabled: i==this.#page})),
					{text: 'chevron_right', page: this.#page+1, disabled: this.#page>=max, class: 'next'},
					{text: 'last_page', page: max, disabled: this.#page>=max}
				].map(d => $(`<${!d.disabled&&!this.#form ? 'a' : 'button'}>`, {class: `mdl-button mdl-js-button mdl-button--icon ${d.class ?? ''}`, href: !d.disabled ? `${this.#key}.html${d.page>0 ? `?page=${d.page}` : ''}` : null, disabled: d.disabled, click: e => {e.preventDefault();this.setPage(d.page);}, html: typeof d.text == 'number' ? d.text : $('<i>', {class: 'material-icons', text: d.text}) })) });
	}
	async create(notify){
		showSpinner(true);
		this.#clearTimeout();

		const d = this.#key=='search' ? await getList.search(this.#form, this.#index)
			: await getList.fetchEX(this.#key, this.#index, notify, d => this.#preset.tab?d[this.#tab]:d);

		$('.mdl-layout__content').scrollTop(0);
		$(`${this.#container} .pagination`).html(this.#pagination(d));
		$(`${this.#container} table`).html(this.#main(d))
		componentHandler.upgradeDom();

		if (this.#preset.load) this.#preset.load();
		this.#checkUpdate();

		showSpinner();
	}
	async sort(sort){
		const d = await getList.fetchEX(this.#key, this.#index, sort);
		$(`${this.#container} table`).html(this.#main(d));
		componentHandler.upgradeDom();
	}

	#checkUpdate(){
		this.#timerID[0] = setTimeout(async ()=> {
			const notify = await getList.checkUpdate(this.#key);
			if (notify) this.create(notify);
			else this.#checkUpdate();
		}, 10*60*1000);
	}

	#resetSidePanel(){
		$('#sidePanel, .close_info.mdl-layout__obfuscator, .open').removeClass('is-visible open');
		$('.mdl-layout__drawer').attr('aria-hidden', true);
		$('.mdl-layout__drawer,.mdl-layout__obfuscator').removeClass('is-visible');

		$('header .mdl-layout-title').text(this.#preset.title);
		$('.sidePanel_title').text(this.#preset.subtitle ?? this.#preset.title);
		$('form.tab-container').find('input,select').mdl_prop('disabled', true);
		$(this.#preset.sidePanel).find('input,select').mdl_prop('disabled', false);
		$('#del [name="ctok"]').prop('disabled', true);
		$(`#del-${this.#key}`).prop('disabled', false);
		$('.mdl-tabs__tab,[class*="show-"]').addClass('hidden');
		$(`${this.#preset.sidePanel.split(',').map(e=>`.mdl-tabs__tab[href='${e}']`).join(',')},[class*="hide-"],.show-${this.#key}`).removeClass('hidden');
		$(`.hide-${this.#key}`).addClass('hidden');
		$('#reserve').text('変更');
		$('#add').toggleClass('hidden', !this.#preset.add).attr('href', this.#preset.add??'')
	}

	get #page(){return Number(this.#params.get('page'))||0};
	set #page(page){page ? this.#params.set('page', page) : this.#params.delete('page')};
	setPage(page){
		this.#setParams(page);
	}
	get #tab(){return Number(this.#params.get('tab'))||1};
	set #tab(tab){tab>1 ? this.#params.set('tab', tab) : this.#params.delete('tab')};
	setTab(tab){
		$('.mdl-layout__tab').removeClass('is-active');
		$(`[href='?tab=${tab}']`).addClass('is-active');
		this.#tab = tab;
		this.#setParams(0);
	}

	#params;
	#setFromURL(){
		const old = this.#key;
		const key = location.pathname.split('/');
		this.#key = key[key.length - 1].split('.')[0];
		if (this.#key=='') this.#key = 'index';
		this.#params = new URLSearchParams(location.search);
		return this.#key != old && this.#key!='index';
	}
	async #setToURL(key, page, tab = 1){
		if (this.#key != key){
			this.#key = key;
			$('.mdl-layout__tab-bar-container').remove();
			if (this.#preset.tab){
				$('header').append($('<div>', {class:'mdl-layout__tab-bar', append: Object.values(await getList[this.#key]()).map((d,i)=>this.#preset.tab(d,i+1))}));
				const btn = document.querySelector('.mdl-layout__drawer-button');
				const clonedBtn = btn.cloneNode(true);
				btn.replaceWith(clonedBtn);
				$('.mdl-layout').unwrap();
				delete $('.mdl-layout.mdl-js-layout.mdl-layout--fixed-header').get(0).dataset.upgraded;
				$('.has-drawer>.mdl-layout__obfuscator:not(#macro)').remove();
			}
		}
		this.#page = page;
		this.#tab = tab;
		this.#resetSidePanel();
		history.pushState(null, null, `${this.#key}.html?${this.#params.toString()}`);
		this.create();
	}
	async #setParams(page){
		this.#page = page;
		history.pushState(null, null, `?${this.#params.toString()}`);
		await this.create();
	}
	async popstate(){
		this.#setFromURL() && this.#resetSidePanel();
		if (this.#key=='index'){
			$(this.#container).find('.pagination,table').empty();
			$('header .mdl-layout-title').text('');
		}else this.create();
	}

	reserve(page = 0){this.#setToURL('reserve', page)}
	recinfo(page = 0){this.#setToURL('recinfo', page)}
	autoaddepg(page = 0){this.#setToURL('autoaddepg', page)}
	autoaddmanual(page = 0){this.#setToURL('autoaddmanual', page)}
	tunerreserve(page = 0, tab = 1){this.#setToURL('tunerreserve', page, tab)}
}

const resetSidePanel = tab => {
	$('.mdl-tabs__panel').addClass('is-active').scrollTop(0).removeClass('is-active');
	$('.mdl-tabs__tab,#sidePanel, .clicked, .open').removeClass('is-visible is-active clicked open');
	$(`[href="#${tab}"], #${tab}`).addClass('is-active');
	$('.sidePanel-content').scrollTop(0);
}

//番組詳細を反映
const setEpgInfo = (d, $e, id) => {
	resetSidePanel('detail');
	if ($e) $e.addClass('open');

	if (!d.onid) d = toObj.EpgInfo(d);

	$('#title').html( ConvertTitle(d.title) );

	if (d.starttime){
		$('#info_date').html(`${ConvertTime(d.starttime, true, true)}～${ConvertTime(d.endtime, true)}`);
		progReserve(d);
	}else $('#info_date').html('未定');
	$('#sidePanel .mdl-tabs__tab-bar,#sidePanel .mdl-card__actions:not(.hidden)').toggle(d.errInfo && true || d.starttime && !d.endtime || Date.now() < d.endtime);

	$('#service').html(ConvertService(d));
	$('#links').html(new SearchLinks(d).htmlEX);
	$('#summary p').html( ConvertText(d.text) );
	$('#ext').html( ConvertText(d.text_ext) );

	$('#genreInfo').html(() => !d.genre ? '' : typeof d.genre == 'string' ? `<li>${d.genre.replace(/\n/g,'<li>')}` : d.genre.map(e => `<li>${e.component_type_name}`));
	$('#videoInfo').html(() => !d.video ? '' : typeof d.video == 'string' ? `<li>${d.video.replace(/\n/g,'<li>')}` : d.video.map(e => `<li>${e.component_type_name} ${e.text}`));
	$('#audioInfo').html(() => !d.audio ? '' : typeof d.audio == 'string' ? `<li>${d.audio.replace(/\n/g,'<li>')}` : d.audio.map(e => `<li>${e.component_type_name} ${e.text}<li>サンプリングレート: ${{1:'16',2:'22.05',3:'24',5:'32',6:'44.1',7:'48'}[e.sampling_rate]}kHz`));

	if (d.errInfo){
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

		$('#link_epginfo').attr('href', createHtml.enabled ? `reserveinfo.html?id=${$e.find('.flag').data('id')}` : `epginfo.html?id=${id||`${d.onid}-${d.tsid}-${d.sid}-${d.eid || d.starttime}`}`);
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
	create(d, i, partial){
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
	del($e){
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
	click(e){
		$(e.currentTarget).toggleClass('mdl-color--accent mdl-color-text--accent-contrast');
		const $e = $('#dateList_select option').eq( $(e.currentTarget).data('count') );
		$e.prop('selected', !$e.prop('selected'));
	}
	create(){
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
		const id = $e.data('autoadd');
		d = d[0].get(id);
		if (d){
			$('#set,#del').attr('action', `${ROOT}api/SetAutoAdd?id=${id}`);
			$('#link_epginfo').attr('href', `autoaddepginfo.html?id=${id}`);
			$('[name=presetID]').data('id', id).data('key', 'autoaddepg').val(65535);

			setSerchSetting(d);
			setRecSettting(d);

			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
		}else Snackbar('Error : 自動予約が見つかりませんでした');

		showSpinner();
	});
}

//プログラム予約を反映
const setManuAdd = $e =>{
	showSpinner(true);
	resetSidePanel('manuadd');
	$e.addClass('open');

	getList.autoaddmanual(d => {
		const id = $e.data('manuadd');
		d = d[0].get(id);
		if (d){
			$('#set,#del').attr('action', `${ROOT}api/SetManuAdd?id=${id}`);
			$('#link_epginfo').attr('href', `autoaddmanualinfo.html?id=${id}`);
			$('[name=presetID]').data('id', id).data('key', 'autoaddmanual').val(65535);

			[...Array(7)].map((e, i)=>$(`#checkDayOfWeek${i+1}`).mdl_prop('checked', (d.dayOfWeekFlag & 2 ** i)>0));
			$('#startTime-from').val(`${zero(Math.floor(d.starttime / 3600))}:${zero(Math.floor((d.starttime / 60) % 60))}:${zero(Math.floor(d.starttime % 60))}`);
			$('#endTime-from').val(`${zero(Math.floor((d.endtime) / 3600))}:${zero(Math.floor(((d.endtime) / 60) % 60))}:${zero(Math.floor((d.endtime) % 60))}`);
			$('#title-from').val(d.title);
			$('#serviceID').val(`${d.onid}-${d.tsid}-${d.sid}`);
			setRecSettting(d);

			$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
		}else Snackbar('Error : プログラム予約が見つかりませんでした');

		showSpinner();
	});
}

//録画結果を反映
const setRecInfo = async $e => {
	showSpinner(true);
	const id = $e.data('recinfo');
	const d = Info.recinfoEX[id] ?? await $.get(`${ROOT}api/EnumRecInfo?id=${id}`).then(xml => {
		if ($(xml).find('recinfo').length) return Info.recinfoEX[id] = toObj.EpgInfo($(xml).find('recinfo').first());
		else errMessage($(xml));
	});
	showSpinner();

	if (!d) return;

	setEpgInfo(d, $e);

	$('#path').text(d.recFilePath);
	$('#comment').text(d.comment);
	$('#drops').text(d.drops);
	$('#scrambles').text(d.scrambles);

	$('pre').text(d.errInfo);

	$('#del').attr('action', `${ROOT}api/SetRecInfo?id=${d.id}`).next('button').prop('disabled', d.protect);
	$('#link_epginfo').attr('href', `recinfodesc.html?id=${d.id}`);

	$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
}

//予約を反映
const setReserve = (r, fn) => {
	const id = setRecSettting(r).id;

	$('#set,#del,#progres').attr('action', `${ROOT}api/SetReserve?id=${id}`);
	$('#action').attr('name', 'change');
	$('#reserved, #delreseved, #toprogres').show();
	$('[name=presetID]').data('id', r.eid == 65535 ? r.id : `${r.onid}-${r.tsid}-${r.sid}-${r.eid}`).data('key', 'reserve').val(65535);
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
		setRecSettting(d[0].get(0));

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

const createSwitch = d => {
	if (!d.id) return $('<span>', {
		class: 'search add mdl-button mdl-js-button mdl-button--fab mdl-button--colored',
		click(){addReserve($(this))},
		html: '<i class="material-icons">add'
	});

	const id = `reserve${d.id}`;
	return $('<span>', {
		append: $('<label>', {
			class: 'mdl-switch mdl-js-switch',
			for: id,
			html: $('<input>', {
				id: id,
				class: 'mdl-switch__input',
				type: 'checkbox',
				checked: d.recSetting.recEnabled,
				change(){
					$(this).parents('td').data('toggle', $(this).prop('checked') ? 1 : 0);
					addReserve($(this));
				}
			})
		})
	});
}

//一覧の録画トグル
const fixRecToggleSW = (d, $e = $('.open')) => {
	if ($e.hasClass('cell')) return;

	if (!d.recSetting) d = toObj.RecSet(d);

	const $input = $e.find('input');
	//検索ページ向け
	if ($e.hasClass('search')){
		//スイッチ追加
		if (!$e.data('starttime')){		
			$e.data('starttime', d.starttime - d.recSetting.startMargine * 1000);
			const $switch = createSwitch(d);
			componentHandler.upgradeElement($switch.children().get(0));

			$e.find('.flag').data('id', d.id).removeData('oneclick').html($switch);
			createHtml.load();
		}
		$e = $e.find('.flag');
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

//番組詳細を取得
const getEpgInfo = async ($e, d = $e.data()) => {
	showSpinner(true);
	const rid = d.next ? d.nextid : d.id || $e.find('.addreserve').data('id') || $e.children('.flag').data('id');
	if ((d.next ? d._eid : d.eid) == 65535){
		getList.reserve(r => {
			r = r[0].get(rid);
			if (r){
				setEpgInfo(r, $e);
				setReserve(r);

				$('#link_epginfo').attr('href', `reserveinfo.html?id=${rid}`);
				$('[href="#detail"], #detail').removeClass('is-active');
				$('[href="#recset"], #recset').addClass('is-active');
			}else{
				createHtml.create();
				Snackbar('予約が見つかりませんでした');
			}
			showSpinner();
		});
	}else{
		const id = `${d.onid}-${d.tsid}-${d.sid}-${d.next ? d._eid : d.eid || d.starttime}`
		const info = Info.EventInfo[id] ?? await $.get(`${ROOT}api/EnumEventInfo`, {basic: 0, id: id}).then(xml => {
			if ($(xml).find('eventinfo').length) return Info.EventInfo[id] = toObj.EpgInfo($(xml).find('eventinfo').first());
			else {
				errMessage($(xml));
				showSpinner();
			}
		});
		if (info){
			setEpgInfo(info, $e, id);
			if (!d.eid){
				$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
				showSpinner();
				return;
			};
			getList.reserve(r => {
				r = r[0].get(id);
				if (r){
					if (!rid){															//追加されてた				
						if ($e.hasClass('onair')) $e.data(`${d.next ? 'next' : ''}id`, r.id);
						else if ($e.hasClass('reserve')) fixRecToggleSW(r);
						else addRecMark(r, $('.open .addreserve'), $('.open .content-wrap'));
					}
					setReserve(r);
				}else if (rid){															//削除されてた
					if ($e.hasClass('reserve')){
						createHtml.create();
					}else{
						if ($e.hasClass('onair')) $e.removeData(`${d.next ? 'next' : ''}id`);
		
						setDefault(true);
						$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
					}
					if (!$e.hasClass('onair')) Snackbar('予約が見つかりませんでした');
				}else{
					$('#sidePanel, .close_info.mdl-layout__obfuscator').addClass('is-visible');
					setDefault();
				}
				showSpinner();
			});
		}
	}
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
			$e.get(0).click();
		}
		$('.tab-swipe'  ).hammer().on('swiperight', () => moveTab($('.mdl-layout__tab.is-active').prev()));
		$('.tab-swipe'  ).hammer().on('swipeleft' , () => moveTab($('.mdl-layout__tab.is-active').next()));
		$('.panel-swipe').hammer().on('swiperight', () => moveTab($('.mdl-tabs__tab.is-active').prevAll(':visible:first')));
		$('.panel-swipe').hammer().on('swipeleft' , () => moveTab($('.mdl-tabs__tab.is-active').nextAll(':visible:first')));
	}

	//一覧の行をリンクに
	$('tr.epginfo').click(e => {
		const $e = $(e.currentTarget);
		if ($(e.target).is('.flag, .flag *, .count a')) return;

		if ($e.data('onid')) getEpgInfo($e);
		else if ($e.data('autoadd')) setAutoAdd($e);
		else if ($e.data('manuadd')) setManuAdd($e);
		else if ($e.data('recinfo')) setRecInfo($e);
		else location.href = $e.data('href');
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
		if ($('#video').data('loaded')) return;

		if (!$('.is_cast').data('public')) loadMovie($('.is_cast'));
		else $('#video').trigger('load');
		$('#video').data('loaded', true);
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
			if (message.match('起動')) $('#nosuspend').data('nosuspend', 'n').addClass('n').removeClass('y');
			else if (message.match('停止')) $('#nosuspend').data('nosuspend', 'y').addClass('y').removeClass('n');
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
		if (val != 'all') $('#contentList option').not(val).prop('selected', false).hide();
		else if (!$('#subGenre').prop('checked'))$('.subGenre').hide();
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
	$('#image').change(e => { 
		if ($(e.currentTarget).prop('checked')) $('#serviceList option.data').addClass('hidden');
		else $('.extraction:checked').each((i, e) => $(`#serviceList ${$(e).val()}`).removeClass('hidden'))
	});
	//ネットワーク表示
	$('.extraction').change(e => {
		const $e = $(e.currentTarget);
		if ($e.prop('checked')) $('#image').prop('checked') ? $( $e.val() ).not('.data').removeClass('hidden') : $( $e.val() ).removeClass('hidden');
		else $($e.val()).addClass('hidden').prop('selected', false);
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
		d = d[0].get(id);
		if (d){
			const name = setRecSettting(d).name ?? $('[name=presetID] option:selected').text();
			messege = `"${name}" を読み込みました`;
		}
		Snackbar(messege);
	}
	$('[name=presetID]').change(e => {
		const $e = $(e.currentTarget);
		if ($e.val() != 65535) getList.recpreset(d => setPreset(d, parseInt($e.val())));
		else if ($e.data('key')) setPreset(Info[$e.data('key')], $e.data('id'));
		else if ($e.data('reserve')) getList.reserve(d => setPreset(d, $e.data('reserve')));
		else if ($e.data('autoadd')) getList.autoaddepg(d => setPreset(d, $e.data('autoadd')));
		else if ($e.data('manuadd')) getList.autoaddmanual(d => setPreset(d, $e.data('manuadd')));
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
	
	//検索ページ向け
	//予約追加ボタン
	$('.add').click(e => addReserve($(e.currentTarget)));
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

	//通信エラー
	$(document).ajaxError((e, xhr, textStatus) => {
		showSpinner();
		Snackbar(xhr.status!=0 ? `${xhr.status}Error : ${xhr.statusText}` : `Error : ${textStatus.url.match('api/set') ? 'トークン認証失敗' : '通信エラー'}`);
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
					if (d.redirect) setTimeout(() => location.href=d.redirect, 1500);
					else if (d.submit) setTimeout(() => $(d.submit).submit(), 1500);
					else if (d.reload || $form.hasClass('reload')){
						Snackbar({message: 'リロードします', timeout: 1000});
						setTimeout(() => location.reload(), 2500);
					}else if (d.action){
						if (d.action == 'epg'){
							const r = toObj.RecSet(xml.find('reserveinfo'));

							setReserve(r, () => {
								addRecMark(r, $('.open .addreserve'), $('.open .content-wrap'));
								progReserve(r);

								if ($('.open').hasClass('epginfo')) fixRecToggleSW(r);
							});
						}else if (d.action == 'list'){
							createHtml.create();
						}else if (d.action == 'del'){
							if (createHtml.enabled){
								$('#sidePanel, .close_info.mdl-layout__obfuscator').removeClass('is-visible');
								createHtml.create();
							}else{
								setDefault(true);
								if ($('.open').hasClass('reserve')){
									$('#sidePanel, .close_info.mdl-layout__obfuscator').removeClass('is-visible');
									$('.open').remove();
								}
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
