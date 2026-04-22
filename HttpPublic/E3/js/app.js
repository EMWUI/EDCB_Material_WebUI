document.addEventListener('alpine:init', () => {
  const  dayText = ['日','月','火','水','木','金','土'];
  Alpine.data('edcbApp', () => ({
    debug: true,
    ROOT: ROOT || '',
    page: window.location.hash || '#dashboard',
    now: Date.now(),
    isOnline: false,
    isSmallScreen: false,
    loading: false,
    rawData: [],
    displayList: [],
    tunerDisplayData: {},
    totalCount: null,
    cursor: 0,
    perPage: 50,
    activeTunerId: 1,
    sidebarActive: false,
    dashboardData: {
      reserves: [], recs: [],
      reservesCount: 0, 
      activeTuners: 0, isRecording: false, isEpgCap: false,
      diskGB: 0, diskPercent: 0
    },

    allData: {
      epg: new Map(),
      reserve: new Map(),
      recinfo: new Map(),
      autoaddepg: new Map(),
      autoaddmanual: new Map(),
      tunerreserve: new Map(),
      service: new Map(),
      recpreset: new Map(),
    },
    totals: {
      reserve: 0,
      recinfo: 0,
      autoaddepg: 0,
      autoaddmanual: 0
    },

    lastUpdated: {
      epg: 0,
      reserve: 0,
      recinfo: 0,
      autoaddepg: 0,
      autoaddmanual: 0,
      tunerreserve: 0,
      service: 0,
      recpreset: 0,
    },

    set: {
      subGenre: false,
      genreMask: -1044262913,
    },

    // API名とデータキーを一元管理
    pageMap: {
      '#epg': { title: '番組表', itemKey: d => `${d.onid}-${d.tsid}-${d.sid}-${d.eid}` },
      '#epgweek': { title: '週間番組表' },
      '#onair': { title: '放送中' },
      '#tvcast': {title: 'リモート視聴' },
      '#reserve': { title: '予約一覧', api: 'EnumReserveInfo', sortKey: 'startTime', itemKey: d => d.eid !== 65535 ? `${d.onid}-${d.tsid}-${d.sid}-${d.eid}` : d.reserveID },
      '#tunerreserve': { title: 'チューナー別', api: 'EnumTunerReserveInfo', sortKey: 'startTime', itemKey: 'tunerID' },
      '#autoaddepg': { title: 'EPG自動予約', api: 'EnumAutoAdd', itemKey: 'dataID' },
      '#autoaddmanual': { title: 'プログラム自動予約', api: 'EnumManuAdd', itemKey: 'dataID' },
      '#library': { title: 'ライブラリ' },
      '#recinfo': { title: '録画結果', api: 'EnumRecInfo', sortKey: 'startTime', reverse: true, count: 200, itemKey: 'id' },
      '#search': { title: '検索' },
      '#setting': { title: '設定' },
      '#dashboard': { title: 'ダッシュボード' },
      'service': { api: 'EnumService', itemKey: d => `${d.onid}-${d.tsid}-${d.sid}` },
      'recpreset': { api: 'EnumRecPreset', itemKey: 'id' },
    },

    async init() {
      setInterval(() => this.now = Date.now(), 1000);
      this.isSmallScreen = window.matchMedia("(max-width: 600px)").matches;
      window.addEventListener('hashchange', () => {
        this.page = window.location.hash || '#dashboard';
        this.loadAll();
      });
      window.addEventListener('resize', () => {
        this.isSmallScreen = window.matchMedia("(max-width: 600px)").matches;
      });

      // 起動時にキャッシュから復元
      const saved = localStorage.getItem('edcb_full_cache');
      if (saved) {
        const cache = JSON.parse(saved);
        if (cache.lastUpdated) this.lastUpdated = { ...this.lastUpdated, ...cache.lastUpdated };
        if (cache.totals) this.totals = { ...this.totals, ...cache.totals };
        if (cache.allData) {
          Object.entries(cache.allData).forEach(([key, list]) => {
            if (this.allData[key] instanceof Map) {
              list.forEach(item => this.allData[key].set(this.getDataKey(item, key), item));
            }
          });
        }
        this.syncDashboardData();
        this.updateStorage();
      }

      // サービス一覧が空（初回またはクリア後）なら取得する
      if (this.allData.service.size === 0) {
        console.log("First run or no cache: fetching static data...");
        await this.refreshStaticData();
      }

      this.startSSE();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
          // 戻ってきたときに接続状態を確認
          if (this.eventSource.readyState === EventSource.CLOSED || this.eventSource.readyState === EventSource.CONNECTING) {
            // this.snackbar.add({ text: this.eventSource.readyState + ' visibilitychange'});
            this.isOnline = false;
          }
        }
      });

      // 初回表示の反映
      await this.loadAll();
    },

    // SSEの開始とメッセージ処理
    startSSE() {
      if (this.eventSource) {
        this.isOnline = false;
        this.eventSource.close();
      }

      this.eventSource = new EventSource(`${this.ROOT}api/SSE`);

      this.eventSource.onopen = async () => {
        // this.snackbar.add({ text: 'onopen' });
        this.isOnline = true;

        this.loading = true;
        try {
          await Promise.all([
            this.refreshData('#reserve'),
            this.refreshData('#tunerreserve'),
            this.refreshData('#recinfo'),
            this.refreshData('#autoaddepg'),
            this.refreshData('#autoaddmanual'),
            this.updateTunerStatus()
          ]);
        } catch (e) {
          console.error("Reconnection sync failed", e);
        } finally {
          this.loading = false;
        }
      }
      this.eventSource.onerror = () => {
        // this.snackbar.add({ text: 'onerror' });
        this.isOnline = false;
      }
      this.eventSource.onmessage = async e => {
        const data = JSON.parse(e.data);
        
        // 通知が来たら pageMap に基づいて再取得
        if (data.epg) {
          this.allData.epg.clear();
          this.saveCache();
        }
        if (data.reserve) {
          await Promise.all([
            this.refreshData('#reserve'),
            this.refreshData('#tunerreserve'),
          ]);
        }
        if (data.recinfo) this.refreshData('#recinfo');
        if (data.auto_add) this.refreshData('#autoaddepg');
        if (data.manual_add) this.refreshData('#autoaddmanual');
        if (data.tuner) this.updateTunerStatus();
      };
    },

    // 指定されたページのAPIを叩いてメモリ(allData)を更新する共通関数
    async refreshData(pageHash) {
      const config = this.pageMap[pageHash];
      if (!config || !config.api) return;

      try {
        const res = await fetch(`${this.ROOT}api/${config.api}?json=1${config.count ? `&count=${config.count}` : ''}`);
        const data = await res.json();
        
        // データキー（items等）の特定
        const key = config.key || 'items';
        const list = Array.isArray(data[key]) ? data[key] : (Array.isArray(data) ? data : Object.values(data));

        // ソート
        this.sortList(list, config);
        
        // 対応する内部キーに保存
        const internalKey = pageHash.replace('#', '');
        const map = this.allData[internalKey];
        map.clear();
        list.forEach(item => map.set(this.getDataKey(item, internalKey), item));
        this.lastUpdated[internalKey] = Date.now();
        if (internalKey === 'reserve') this.loadEpg();
        this.totals[internalKey] = data.total ?? list.length;

        // ダッシュボードや表示リストへの反映
        this.syncDashboardData();
        if (this.page === pageHash) this.updateDisplayList();
        
        // キャッシュ保存
        this.saveCache();
      } catch (e) {
        console.error(`Refresh failed for ${pageHash}`, e);
      }
    },
    async refreshStaticData() {
      this.loading = true;
      try {
        // サービス一覧とプリセットを同時に取得
        const [serviceRes, presetRes] = await Promise.all([
          fetch(`${this.ROOT}api/${this.pageMap['service'].api}?json=1`).then(r => r.json()),
          fetch(`${this.ROOT}api/${this.pageMap['recpreset'].api}?json=1`).then(r => r.json())
        ]);

        this.allData.service.clear();
        (serviceRes || []).forEach(s => this.allData.service.set(this.getDataKey(s, 'service'), s));
        this.allData.recpreset.clear();
        (presetRes || []).forEach(p => this.allData.recpreset.set(this.getDataKey(p, 'recpreset'), p));
        this.lastUpdated.service = Date.now();
        this.lastUpdated.recpreset = Date.now();

        // キャッシュを更新
        this.saveCache();
      } catch (e) {
        console.error("Failed to refresh static data", e);
      } finally {
        this.loading = false;
      }
    },

    // ページ切り替え時に呼ばれる
    async loadAll() {
      this.totalCount = null;
      window.scrollTo(0, 0);
      this.sidePanel.close();

      if (this.page === '#dashboard') {
        this.syncDashboardData();
        //if (this.isOnline) await this.updateStorage();
        return;
      }
      this.updateDisplayList();
    },

    updateDisplayList() {
      const internalKey = this.page.replace('#', '');

      // チューナー別予約ページの場合
      if (this.page === '#tunerreserve') {
        this.allData.tunerreserve.forEach(tuner => {
          const tid = tuner.tunerID;
          
          // まだこのチューナーの表示用データがない場合のみ作成
          if (!this.tunerDisplayData[tid]) {
            const idSet = new Set(tuner.reserveList);
            // 並び順はマスター(allData.reserve)に従う
            const allReserves = Array.from(this.allData.reserve.values());
            const fullList = allReserves.filter(res => idSet.has(res.reserveID));
            
            this.tunerDisplayData[tid] = {
              fullList: fullList,
              displayList: fullList.slice(0, this.perPage),
              cursor: Math.min(fullList.length, this.perPage),
              total: fullList.length
            };
          }
        });
        return;
      }

      const list = Array.from(this.allData[internalKey]?.values() || []);
      
      if (list) {
        this.rawData = list;
        this.totalCount = this.totals[internalKey];
        this.displayList = this.rawData.slice(0, this.perPage);
        this.cursor = this.displayList.length;
      }
    },

    syncDashboardData() {
      this.dashboardData.reserves = Array.from(this.allData.reserve.values()).slice(0, 5);
      this.dashboardData.reservesCount = this.totals.reserve;
      this.dashboardData.recs = Array.from(this.allData.recinfo.values()).slice(0, 5);
    },

    formatSize(bytes) {
      const gb = bytes / (1024 ** 3);
      if (gb < 1000) {
        return gb.toFixed(1) + ' GB';
      }
      return (gb / 1024).toFixed(2) + ' TB';
    },
    async updateStorage() {
      try {
        this.loadingStorage = true;
        const res = await fetch(`${this.ROOT}api/Common?json=1&storage=1`);
        const data = await res.json();
        this.dashboardData.storage = (Array.isArray(data) ? data : []).map(s => {
          const total = parseInt(s.total) || 0;
          const free = parseInt(s.free) || 0;
          return {
            name: s.name,
            freeText: this.formatSize(free),
            totalText: this.formatSize(total),
            usedPercent: total > 0 ? Math.floor(((total - free) / total) * 100) : 0
          };
        });
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingStorage = false;
      }
    },
    async updateTunerStatus() {
      try {
        const res = await fetch(`${this.ROOT}api/Common?json=1&tuner=1`).then(r => r.json());
        this.dashboardData.activeTuners = res.length;
        this.dashboardData.isRecording = res.some(t => t.recFlag === true);
        this.dashboardData.isEpgCap = res.some(t => t.epgCapFlag === true);
      } catch (e) { console.error("Tuner update error:", e); }
    },

    async loadMore() {
      if (this.loading) return;
      const config = this.pageMap[this.page];
      const internalKey = this.page.replace('#', '');

      // 1. メモリ内の未表示分を出す
      if (this.cursor < this.rawData.length) {
        const next = this.rawData.slice(this.cursor, this.cursor + this.perPage);
        this.displayList = [...this.displayList, ...next];
        this.cursor += next.length;
        return;
      }

      // 2. ネットワークからの追加取得
      if (this.totalCount > 0 && this.rawData.length < this.totalCount) {
        this.loading = true;
        try {
          const res = await fetch(`${this.ROOT}api/${config.api}?json=1&index=${this.rawData.length}&count=${config.count}`);
          const data = await res.json();
          
          const key = config.key || 'items';
          const newList = Array.isArray(data[key]) ? data[key] : (Array.isArray(data) ? data : Object.values(data));

          // 追加分をソート
          this.sortList(newList, config);
          
          // 【重要】allData(キャッシュ)自体を更新する
          // これにより、他のページから参照しているデータも拡張される
          newList.forEach(item => this.allData[internalKey].set(this.getDataKey(item, internalKey), item));
          
          // rawData も最新のキャッシュを参照させる
          this.rawData = Array.from(this.allData[internalKey].values());

          // 表示を更新
          const next = this.rawData.slice(this.cursor, this.cursor + this.perPage);
          this.displayList = [...this.displayList, ...next];
          this.cursor += next.length;
        } catch (e) {
          console.error("Fetch more error:", e);
        } finally {
          this.loading = false;
        }
      }
    },
    async loadMoreTuner(tid) {
      const d = this.tunerDisplayData[tid];
      if (!d || this.loading) return;

      // 1. メモリ(fullList)内の未表示分を出す
      if (d.cursor < d.fullList.length) {
        const next = d.fullList.slice(d.cursor, d.cursor + this.perPage);
        d.displayList = [...d.displayList, ...next];
        d.cursor += next.length;
        return;
      }

      // 2. 予約マスターデータを拡張取得
      const reserveConfig = this.pageMap['#reserve'];
      if (d.total > d.fullList.length && reserveConfig) {
        this.loading = true;
        try {
          const currentIndex = this.allData.reserve.length;
          const res = await fetch(`${this.ROOT}api/${reserveConfig.api}?json=1&index=${currentIndex}`);
          const data = await res.json();
          
          let newList = data.items || [];
          if (newList.length > 0) {
            // 【重要】追加分も予約一覧と同じルールでソートする
            this.sortList(newList, reserveConfig);

            // マスターデータを更新
            newList.forEach(item => this.allData.reserve.set(this.getDataKey(item, 'reserve'), item));
            const fullReserves = Array.from(this.allData.reserve.values());
            
            // 全チューナーの fullList を最新の allData.reserve から再抽出
            // これにより「時間順」などが全てのタブで維持される
            this.allData.tunerreserve.forEach(t => {
              const targetD = this.tunerDisplayData[t.tunerID];
              if (targetD) {
                const idSet = new Set(t.reserveList);
                targetD.fullList = fullReserves.filter(r => idSet.has(r.reserveID));
              }
            });

            // 自分のタブの表示を更新
            const next = d.fullList.slice(d.cursor, d.cursor + this.perPage);
            d.displayList = [...d.displayList, ...next];
            d.cursor += next.length;
          }
        } catch (e) {
          console.error("loadMoreTuner fetch error:", e);
        } finally {
          this.loading = false;
        }
      }
    },

    clone(obj){
      return JSON.parse(JSON.stringify(obj));
    },
    saveCache() {
      const cache = { totals: this.totals, lastUpdated: this.lastUpdated, allData: {} };
      Object.entries(this.allData).forEach(([key, map]) => {
        cache.allData[key] = Array.from(map.values());
      });
      localStorage.setItem('edcb_full_cache', JSON.stringify(cache));
    },

    // ソート処理を共通関数化
    sortList(list, config) {
      if (config.sortKey) {
        list.sort((a, b) => {
          const getValue = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
          const valA = getValue(a, config.sortKey) || '';
          const valB = getValue(b, config.sortKey) || '';
          return config.reverse ? valB.localeCompare(valA) : valA.localeCompare(valB);
        });
      }
    },

    getDataKey(d, mapName) {
      const config = this.pageMap[mapName] || this.pageMap['#' + mapName];
      if (config && config.itemKey) {
        if (typeof config.itemKey === 'function') return config.itemKey(d);
        return d[config.itemKey];
      }
      return d.id || d.reserveID || d.dataID;
    },
    async getEpgById(id) {
      let epg = this.allData.epg.get(id);
      if (!epg && this.isOnline) {
        try{
          this.loading = true;
          epg = await fetch(`${this.ROOT}api/EnumEventInfo?json=1&id=${id}`).then(r => r.json());
          if (epg) this.allData.epg.set(id, epg);
        } catch (e) {
          console.error(e);
        } finally {
          this.loading = false;
        }
      }
      return epg;
    },

    recModeText: ['全サービス','指定サービス','全サービス（デコード処理なし）','指定サービス（デコード処理なし）','視聴'],
    dayText: dayText,
    convert: {
      viewDate(value) {
        if (typeof value !== 'object') value = new Date(value);
        return new Date(value.getTime() + 9 * 3600000);
      },
      date(t, show_sec, show_ymd) {
        if (!t) return '未定';
        t = this.viewDate(t);
        if (show_sec == 'ISO') return `${t.getUTCFullYear()}${this.zero(t.getUTCMonth()+1)}${this.zero(t.getUTCDate())}T${this.zero(t.getUTCHours())}${this.zero(t.getUTCMinutes())}${this.zero(t.getUTCSeconds())}`;
        return `${show_ymd ? `${t.getUTCFullYear()}/${this.zero(t.getUTCMonth()+1)}/${this.zero(t.getUTCDate())}(${dayText[t.getUTCDay()]}) ` : ''
          }${this.zero(t.getUTCHours())}:${this.zero(t.getUTCMinutes())}${show_sec && t.getUTCSeconds() != 0 ? `<small>:${this.zero(t.getUTCSeconds())}</small>` : ''}`;
      },
      time(t) {
        return `${this.zero(Math.floor(t / 3600))}:${this.zero(Math.floor((t / 60) % 60))}:${this.zero(Math.floor(t % 60))}`
      },
      text(a) {
        if (!a) return '';
        const re = /https?:\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>)/g;
        let s = '';
        let i = 0;
        for (let m; m = re.exec(a); i = re.lastIndex){
          s += `${a.substring(i, re.lastIndex - m[0].length)}`
          s += `<a class="link underline" href="${m[0]}" target="_blank" rel="noreferrer">${m[0]}</a>`;
        }
        s += `${a.substring(i)}`;
        return s.replace(/\n/g,'<br>');
      },
      title(a) {
        return !a ? '' : `${a.replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g, '<span class="mark">$1</span>')}`
      },
      zero(t, n = 2) {
        return t.toString().padStart(n, '0');
      },
      ZtoH(s) {
        return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ')
      },
    },
    getLogoPath(d){
        return `${this.ROOT}api/logo?onid=${d.onid}&sid=${d.sid}`;
    },
    getPageTitle() {
      return this.pageMap[this.page]?.title || 'EMWUI 3';
    },
    getServiceName(d) {
      return this.allData.service.get(`${d.onid}-${d.tsid}-${d.sid}`)?.service_name || '不明';
    },
    getDefSearchService(){
      return [...document.getElementById('serviceList-template').content.querySelectorAll('.def')].map(e => e.value);
    },

    detail: {},
    sidePanel: {
      el: document.getElementById('sidePanel'),
      d: {},
      title() {
        return ['番組', 'プログラム予約', 'EPG自動予約', 'プログラム自動予約', '録画結果'][this.mode] + (this.isInfo||this.isRecinfo ? '詳細' : this.isNewEntry ? ' 新規追加' : ' 条件変更');
      },
      get mode() {
        if (this.d.eid == 65535) return 1
        else if (this.d.searchInfo) return 2
        else if (this.d.dataID != null) return 3
        else if (this.d.recStatus) return 4
        else return 0
      },
      get isNewEntry(){
        return !this.d.reserveID && !this.d.dataID && !this.d.id;
      },
      get isInfo() {
        return this.mode == 0;
      },
      get isReserve() {
        return this.mode == 1;
      },
      get isAutoaddepg() {
        return this.mode == 2;
      },
      get isAutoaddmanual() {
        return this.mode == 3;
      },
      get isRecinfo() {
        return this.mode == 4;
      },
      show() {
        this.el.querySelector('main').scrollTo(0, 0);
        this.el.show();
        this.el.previousElementSibling.classList.add('active');
      },
      close() {
        this.el.close();
        this.el.previousElementSibling.classList.remove('active');
      }
    },

    // 番組詳細を開くメイン関数
    openNewEntry(){
      this.detail = { recSetting: this.allData.recpreset.get(0).recSetting };
      if (this.page == '#autoaddepg') this.detail.searchInfo = {};
      else if (this.page == '#autoaddmanual') this.detail.dataID = 0;
      else this.detail.eid = 65535;

      if (this.detail.searchInfo) ui("#searchInfo");
      else ui("#recSetting");

      this.sidePanel.show();
    },
    async openProgramDetail(d) {
      this.detail = d;
      if (d.eid === 65535) ui("#recSetting");
      else ui("#info");
      this.sidePanel.show();

      if (d.archive || d.eid === 65535) return;

      if (d.reserveID){
        this.detail = { ...d, ...await this.getEpgById(`${d.onid}-${d.tsid}-${d.sid}-${d.eid}`)||{} };
      } else {
        const r = this.allData.reserve.get(`${d.onid}-${d.tsid}-${d.sid}-${d.eid}`);
        if (r) {
          this.detail.reserveID = r.reserveID;
          this.detail.recSetting = r.recSetting;
        } else {
          this.detail.recSetting = this.allData.recpreset.get(0).recSetting;
        }
      }
    },
    openAutoaddDetail(d) {
      this.detail = d;
      if (d.searchInfo) ui("#searchInfo");
      else ui("#recSetting");
      this.sidePanel.show();
    },
    async openRecinfoDetail(d) {
      this.detail = d;
      ui("#info")
      this.sidePanel.show();
      if (!d.programInfo) {
        // 1. 詳細情報を取得
        const json = await fetch(`${this.ROOT}api/${this.pageMap['#recinfo'].api}?json=1&id=${d.id}`).then(r => r.json()).catch(() => null);

        if (json) {
          const parsed = this.parseProgramInfo(json.programInfo);
          Object.assign(parsed, json);
          
          // 2. allData.recinfo の中から同じIDのものを探す
          const existing = this.allData.recinfo.get(d.id);
          
          if (existing) {
            // 3. 詳細データをマージ（上書き）
            // これにより allData 自体が更新され、リアクティブに画面が変わる
            Object.assign(existing, parsed);
            // 4. 表示用の detail には、その実体をセット
            this.detail = existing;
          } else {
            // 万が一一覧にない場合は直接入れる
            this.detail = parsed;
          }
        }
      }
    },

    parseProgramInfo(e) {
      if (!e) return {};
      // 改行コードを統一
      const normalized = e.replace(/\r\n/g, '\n');

      // ラベルで分割（肯定先読みを使用してキーワードを維持）
      const sections = normalized.split(/\n(?=ジャンル : |映像 : |音声 : |イベントリレーあり : |OriginalNetworkID:)/);

      // --- 冒頭セクションの解析 ---
      const head = sections[0] || '';
      const headLines = head.split('\n');
      
      // 1. 日時とdurationの算出
      // 生データ例: "2026/04/11(土) 00:12～00:52"
      const dateMatch = (headLines[0] || '').match(/(\d+)\/(\d+)\/(\d+)\D+([\d:]+)\s*～\s*(未定|[\d:]+)/);
      let starttime = headLines[0]; // デフォルトはそのまま
      let durationSecond = 0;

      if (dateMatch) {
        const pad = (n) => n.padStart(2, '0');
        const y = dateMatch[1], m = pad(dateMatch[2]), d = pad(dateMatch[3]);
        const startStr = `${y}-${m}-${d}T${dateMatch[4]}:00+09:00`;
        
        // starttime を ISO 8601 形式に上書き
        starttime = startStr;

        if (dateMatch[5] !== '未定') {
          const sTime = new Date(startStr).getTime();
          let eTime = new Date(`${y}-${m}-${d}T${dateMatch[5]}:00+09:00`).getTime();
          
          // 日またぎ補正
          if (eTime < sTime) eTime += 86400000;
          durationSecond = (eTime - sTime) / 1000;
        }
      }

      // 2. 番組内容と詳細情報の分離
      const extParts = head.split(/\n詳細情報\n/);
      const mainPart = extParts[0] || '';
      const text_ext = extParts[1] ? extParts[1].trim() : '';
      const mainLines = mainPart.split('\n');
      const text = mainLines.slice(3).join('\n').trim();

      // --- 各セクションの抽出ヘルパー ---
      const getSection = (key) => {
        const s = sections.find(sec => sec.startsWith(key));
        if (!s) return '';
        
        // キーワード（例：「音声 : 」）を取り除く
        let content = s.replace(key, '').trim();

        // 音声セクションの場合、最初の空行（\n\n）までを有効なデータとする
        if (key === '音声 : ') {
          // content全体（空行以降も含む）に「有料放送」が含まれているか確認
          res.freeCAFlag = content.includes('有料放送');

          // split の際に既に正規化（\r\n -> \n）済みであることを前提
          const firstEmptyLine = content.indexOf('\n\n');
          if (firstEmptyLine !== -1) {
            content = content.substring(0, firstEmptyLine).trim();
          }
        }
        return content;
      };

      // --- データの組み立て ---
      const res = {
        startTime: starttime,
        durationSecond: durationSecond,
        shortInfo: {
          text_char: text,
          event_name: headLines[2]
        },
        extInfo: {
          text_char: text_ext
        },
        freeCAFlag: false,
        
        /*/ 生データを保持しつつパース
        genre_raw: getSection('ジャンル :'),
        video_raw: getSection('映像 :'),
        audio_raw: getSection('音声 :'),
        relay_raw: getSection('イベントリレーあり :'),
        other_raw: getSection('OriginalNetworkID:'),
        //*/
        contentInfoList: getSection('ジャンル : ').split('\n').filter(v => v).map(e => {
          const nibble = e.split(' - ');
          return {
            nibble1: [/^ニュース／報道/,/^スポーツ/,/^情報／ワイドショー/,/^ドラマ/,/^音楽/,/^バラエティ/,/^映画/,/^アニメ／特撮/,/^ドキュメンタリー／教養/,/^劇場／公演/,/^趣味／教育/,/^福祉/].findIndex(s => s.test(e)) || 16,
            component_type_name: {
              nibble1: nibble[0],
              nibble2: nibble[1]
            }
          }
        }),
        componentInfo: { component_type_name: getSection('映像 : ') },
        audioInfoList: [],
        
        // ID類 (other_rawから抽出)
        onid: 0, tsid: 0, sid: 0, eid: 0
      };
      const relay = getSection('イベントリレーあり : ');
      if (relay) {
        res.eventRelayInfo = {
          eventDataList : relay.split('\n').filter(v => v).map(e => {
            e = e.match(/(\d+)\(0x[0-9A-F]+\)-(\d+)\(0x[0-9A-F]+\)-(\d+)\(0x[0-9A-F]+\)-(\d+)\(0x[0-9A-F]+\)(?:\s(.+))?/);
            return {onid: Number(e[1]), tsid: Number(e[2]), sid: Number(e[3]), eid: Number(e[4])}
          })
        }
      }

      const idMatch = getSection('OriginalNetworkID:').match(/(\d+).*?\nTransportStreamID:(\d+).*?\nServiceID:(\d+).*?\nEventID:(\d+)/);
      if (idMatch) {
        res.onid = Number(idMatch[1]);
        res.tsid = Number(idMatch[2]);
        res.sid  = Number(idMatch[3]);
        res.eid  = Number(idMatch[4]);
      }

      let i = 0;
      getSection('音声 : ').split('\n').filter(v => v).map(e => {
        if (!res.audioInfoList[i]) res.audioInfoList[i] = {};
        const key = e.match('サンプリングレート') ? 'sampling_rate_txt' : Object.keys(res.audioInfoList[i]).length ? 'text_char' : 'component_type_name'
        res.audioInfoList[i][key] = e.replace('サンプリングレート : ','');
        if (e.match('サンプリングレート')) i++;
      });

      return res;
    },

    snackbar: {
      list: [],
      active: null,
      add(d) {
        this.list.push(d);
        if (!this.active) this.show();
      },
      show() {
        this.active = this.list.shift();
        if (!this.active) return;

        const time = this.active.time || 2500;
        ui('#snackbar', time);
        // 表示時間 + アニメーション用のバッファ（500ms）を待ってから次を表示
        setTimeout(() => this.show(), time + 500);
      },
    },

    // 通信用共通メソッド
    apiFetch(url, params = new URLSearchParams(), method = 'POST') {
      url += (url.includes('?') ? '&' : '?') + 'json=1';
      // ctokをここで自動追加
      if (!params.has('ctok')) params.append('ctok', document.querySelector('input[name="ctok"]')?.value || '');

      const options = { method: method };

      if (method.toUpperCase() === 'GET') {
        // GETの場合はURLにパラメータを付与
        url += '&' + params.toString();
      } else {
        // POSTの場合はbodyにパラメータをセット
        options.body = params;
      }

      fetch(url, options).then(r => {
        if (!r.ok) throw new Error(`Server Error: ${r.status}`);
        return r.json();
      }).then(d => {
        if (d.err) this.snackbar.add({ text: d.err, error: true });
        else this.snackbar.add({ text: d.success });
      }).catch(err => {
        console.error('通信失敗:', err);
        // ctokエラーを想定してリロード
        const t = setTimeout(location.reload, 3000);
        this.snackbar.add({ text: 'トークン切れ？リロードします', action: () => clearTimeout(t), time: 2500, error: true});
      });
    },
    toggleReserve(d) {
      const fd = new URLSearchParams({ id: d.reserveID, toggle: Number(!d.recSetting.recEnabled) });
      this.apiFetch(`${this.ROOT}api/SetReserve`, fd, 'GET');
    },
    saveEntry() {
      const container = document.querySelector('#sidePanel');

      const action = document.getElementById('api_action')?.value || '';
      const url = `${this.ROOT}api/${action}`;
      const fd = new URLSearchParams();

      // name属性を持っている要素をすべて拾う
      container.querySelectorAll('[name]').forEach(el => {
        const name = el.name;
        let value;

        // 1. チェックボックス (0 or 1 変換)
        if (el.type === 'checkbox') {
          if (el.checked) fd.append(name, '1');
        }
        
        // 2. 複数選択セレクトボックス
        else if (el.tagName === 'SELECT' && el.multiple) {
          // 選択されているすべての option を個別に append する
          Array.from(el.selectedOptions).forEach(opt => {
            fd.append(name, opt.value);
          });
        }

        // 3. その他（通常の select, input, radio 等）
        else {
          fd.append(name, el.value);
        }
      });

      this.apiFetch(url, fd);
    },
    delEntry() {
      const action = document.getElementById('api_action')?.value || '';
      const url = `${this.ROOT}api/${action}`;
      this.apiFetch(url, new URLSearchParams({ del: 1 }));
    },
  }));
});