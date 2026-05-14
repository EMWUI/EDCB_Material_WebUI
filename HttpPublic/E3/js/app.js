document.addEventListener('alpine:init', () => {
  // ARIB ジャンル・コンポーネント定義データ EpgTimerUtil.cppより
  const ARIB_GENRE = {
    l1: { 0x0:'ニュース／報道', 0x1:'スポーツ', 0x2:'情報／ワイドショー', 0x3:'ドラマ', 0x4:'音楽', 0x5:'バラエティ', 0x6:'映画', 0x7:'アニメ／特撮', 0x8:'ドキュメンタリー／教養', 0x9:'劇場／公演', 0xA:'趣味／教育', 0xB:'福祉', 0xE:'拡張', 0xF:'その他' },
    l2: {
      0x0: {0:'定時・総合', 1:'天気', 2:'特集・ドキュメント', 3:'政治・国会', 4:'経済・市況', 5:'海外・国際', 6:'解説', 7:'討論・会談', 8:'報道特番', 9:'ローカル・地域', 10:'交通', 15:'その他'},
      0x1: {0:'スポーツニュース', 1:'野球', 2:'サッカー', 3:'ゴルフ', 4:'その他の球技', 5:'相撲・格闘技', 6:'オリンピック・国際大会', 7:'マラソン・陸上・水泳', 8:'モータースポーツ', 9:'マリン・ウィンタースポーツ', 10:'競馬・公営競技', 15:'その他'},
      0x2: {0:'芸能・ワイドショー', 1:'ファッション', 2:'暮らし・住まい', 3:'健康・医療', 4:'ショッピング・通販', 5:'グルメ・料理', 6:'イベント', 7:'番組紹介・お知らせ', 15:'その他'},
      0x3: {0:'国内ドラマ', 1:'海外ドラマ', 2:'時代劇', 15:'その他'},
      0x4: {0:'国内ロック・ポップス', 1:'海外ロック・ポップス', 2:'クラシック・オペラ', 3:'ジャズ・フュージョン', 4:'歌謡曲・演歌', 5:'ライブ・コンサート', 6:'ランキング・リクエスト', 7:'カラオケ・のど自慢', 8:'民謡・邦楽', 9:'童謡・キッズ', 10:'民族音楽・ワールドミュージック', 15:'その他'},
      0x5: {0:'クイズ', 1:'ゲーム', 2:'トークバラエティ', 3:'お笑い・コメディ', 4:'音楽バラエティ', 5:'旅バラエティ', 6:'料理バラエティ', 15:'その他'},
      0x6: {0:'洋画', 1:'邦画', 2:'アニメ', 15:'その他'},
      0x7: {0:'国内アニメ', 1:'海外アニメ', 2:'特撮', 15:'その他'},
      0x8: {0:'社会・時事', 1:'歴史・紀行', 2:'自然・動物・環境', 3:'宇宙・科学・医学', 4:'カルチャー・伝統文化', 5:'文学・文芸', 6:'スポーツ', 7:'ドキュメンタリー全般', 8:'インタビュー・討論', 15:'その他'},
      0x9: {0:'現代劇・新劇', 1:'ミュージカル', 2:'ダンス・バレエ', 3:'落語・演芸', 4:'歌舞伎・古典', 15:'その他'},
      0xA: {0:'旅・釣り・アウトドア', 1:'園芸・ペット・手芸', 2:'音楽・美術・工芸', 3:'囲碁・将棋', 4:'麻雀・パチンコ', 5:'車・オートバイ', 6:'コンピュータ・ＴＶゲーム', 7:'会話・語学', 8:'幼児・小学生', 9:'中学生・高校生', 10:'大学生・受験', 11:'生涯教育・資格', 12:'教育問題', 15:'その他'},
      0xB: {0:'高齢者', 1:'障害者', 2:'社会福祉', 3:'ボランティア', 4:'手話', 5:'文字（字幕）', 6:'音声解説', 15:'その他'},
      0x60: {0:'中止の可能性あり', 1:'延長の可能性あり', 2:'中断の可能性あり', 3:'別話数放送の可能性あり', 4:'編成未定枠', 5:'繰り上げの可能性あり', 0xFF:'編成情報'},
      0x61: {0:'中断ニュースあり', 1:'臨時サービスあり', 0xFF:'特性情報'},
      0x62: {0:'3D映像あり', 0xFF:'3D映像'},
      0x70: {0:'テニス', 1:'バスケットボール', 2:'ラグビー', 3:'アメリカンフットボール', 4:'ボクシング', 5:'プロレス', 15:'その他', 0xFF:'スポーツ(CS)'},
      0x71: {0:'アクション', 1:'SF／ファンタジー', 2:'コメディー', 3:'サスペンス／ミステリー', 4:'恋愛／ロマンス', 5:'ホラー／スリラー', 6:'ウエスタン', 7:'ドラマ／社会派ドラマ', 8:'アニメーション', 9:'ドキュメンタリー', 10:'アドベンチャー／冒険', 11:'ミュージカル／音楽映画', 12:'ホームドラマ', 15:'その他', 0xFF:'洋画(CS)'},
      0x72: {0:'アクション', 1:'SF／ファンタジー', 2:'お笑い／コメディー', 3:'サスペンス／ミステリー', 4:'恋愛／ロマンス', 5:'ホラー／スリラー', 6:'青春／学園／アイドル', 7:'任侠／時代劇', 8:'アニメーション', 9:'ドキュメンタリー', 10:'アドベンチャー／冒険', 11:'ミュージカル／音楽映画', 12:'ホームドラマ', 15:'その他', 0xFF:'邦画(CS)'},
    }
  };

  const ARIB_COMPONENT = {
    // Video (MPEG-2)
    0x0101:['480i', '4:3', false], 0x0102:['480i', '16:9', true], 0x0103:['480i', '16:9', false], 0x0104:['480i', '>16:9', false],
    0x0191:['2160p', '4:3', false], 0x0192:['2160p', '16:9', true], 0x0193:['2160p', '16:9', false], 0x0194:['2160p', '>16:9', false],
    0x01A1:['480p', '4:3', false], 0x01A2:['480p', '16:9', true], 0x01A3:['480p', '16:9', false], 0x01A4:['480p', '>16:9', false],
    0x01B1:['1080i', '4:3', false], 0x01B2:['1080i', '16:9', true], 0x01B3:['1080i', '16:9', false], 0x01B4:['1080i', '>16:9', false],
    0x01C1:['720p', '4:3', false], 0x01C2:['720p', '16:9', true], 0x01C3:['720p', '16:9', false], 0x01C4:['720p', '>16:9', false],
    0x01D1:['240p', '4:3', false], 0x01D2:['240p', '16:9', true], 0x01D3:['240p', '16:9', false], 0x01D4:['240p', '>16:9', false],
    0x01E1:['1080p', '4:3', false], 0x01E2:['1080p', '16:9', true], 0x01E3:['1080p', '16:9', false], 0x01E4:['1080p', '>16:9', false],
    // Video (H.264/AVC)
    0x0501:['H.264 480i', '4:3', false], 0x0502:['H.264 480i', '16:9', true], 0x0503:['H.264 480i', '16:9', false], 0x0504:['H.264 480i', '>16:9', false],
    0x0591:['H.264 2160p', '4:3', false], 0x0592:['H.264 2160p', '16:9', true], 0x0593:['H.264 2160p', '16:9', false], 0x0594:['H.264 2160p', '>16:9', false],
    0x05A1:['H.264 480p', '4:3', false], 0x05A2:['H.264 480p', '16:9', true], 0x05A3:['H.264 480p', '16:9', false], 0x05A4:['H.264 480p', '>16:9', false],
    0x05B1:['H.264 1080i', '4:3', false], 0x05B2:['H.264 1080i', '16:9', true], 0x05B3:['H.264 1080i', '16:9', false], 0x05B4:['H.264 1080i', '>16:9', false],
    0x05C1:['H.264 720p', '4:3', false], 0x05C2:['H.264 720p', '16:9', true], 0x05C3:['H.264 720p', '16:9', false], 0x05C4:['H.264 720p', '>16:9', false],
    0x05D1:['H.264 240p', '4:3', false], 0x05D2:['H.264 240p', '16:9', true], 0x05D3:['H.264 240p', '16:9', false], 0x05D4:['H.264 240p', '>16:9', false],
    0x05E1:['H.264 1080p', '4:3', false], 0x05E2:['H.264 1080p', '16:9', true], 0x05E3:['H.264 1080p', '16:9', false], 0x05E4:['H.264 1080p', '>16:9', false],
    // Video (H.265/HEVC)
    0x0982:['H.265 1080i', '16:9', false], 0x09B2:['H.265 1080p', '16:9', false], 0x0993:['H.265 2160p', '16:9', false], 0x0983:['H.265 4320p', '16:9', false],
    // Audio
    0x0201:['1/0', 'シングルモノ'], 0x0202:['1/0+1/0', 'デュアルモノ'], 0x0203:['2/0', 'ステレオ'], 0x0204:['2/1', ''], 0x0205:['3/0', ''],
    0x0206:['2/2', ''], 0x0207:['3/1', ''], 0x0208:['3/2', ''], 0x0209:['3/2+LFE', '3/2.1モード'], 0x020A:['3/3.1', ''],
    0x020B:['2/0/0-2/0/2-0.1', ''], 0x020C:['5/2.1', ''], 0x020D:['3/2/2.1', ''], 0x020E:['2/0/0-3/0/2-0.1', ''],
    0x020F:['0/2/0-3/0/2-0.1', ''], 0x0210:['2/0/0-3/2/3-0.2', ''], 0x0211:['3/3/3-5/2/3-3/0/0.2', ''],
    0x0240:['', '視覚障害者用音声解説'], 0x0241:['', '聴覚障害者用音声']
  };

  const  dayText = ['日','月','火','水','木','金','土'];
  Alpine.data('edcbApp', () => ({
    debug: true,
    isMobile: navigator.userAgentData ? navigator.userAgentData.mobile : navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/),
    ROOT: ROOT || '',
    useDedicatedSsePort: false, // SSE専用ポートを使用するかどうか
    ssePortOffset: 10, // SSE専用ポートを使用する場合のオフセット (デフォルトは+10)
    page: window.location.hash || '#dashboard',
    params: {},
    now: Date.now(),
    isOnline: false,
    isSmallScreen: false,
    isPortrait: false,

    loading: false,
    rawData: [],
    displayList: [],
    tunerDisplayData: {},
    totalCount: null,
    cursor: 0,
    perPage: 50,
    activeTunerId: 1,
    dashboardData: {
      reserves: [], recs: [], nowOnAir: {},
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
      sidebar: false,
      oneseg: false,
      subCh: false,
      subGenre: true,
      genreMask: -1044262913,
      epg: {
        minHeight: 4,
        hover: false,
      },
      player: {
        volume: 1,
        quality: 1,
        isMuted: false,
        nwtv: 0,
        cap: false,
        datacast: false,
        jikkyo: false,
        jikkyoConfig: {
          load: false,
          opacity: 1,
          height: 32,
        }
      },
    },

    // API名とデータキーを一元管理
    pageMap: {
      '#epg': { title: '番組表', itemKey: d => `${d.onid}-${d.tsid}-${d.sid}-${d.eid}` },
      '#epgweek': { title: '週間番組表' },
      '#onair': { title: '放送中' },
      '#watch': {title: 'リモート視聴' },
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

    // クエリパラメータを解析して params オブジェクトを更新
    updateParams() {
      const newParams = Object.fromEntries(new URLSearchParams(window.location.search));
      // 既存のオブジェクトの内容を更新してリアクティブな参照を維持する
      for (const k in this.params) if (!(k in newParams)) delete this.params[k];
      Object.assign(this.params, newParams);
    },

    // リロードなしでページとパラメータを切り替える
    openPage(page, params = {}, replace = false) {
      const url = new URL(window.location.href);
      url.hash = page;
      // パラメータをリセットして設定
      url.search = '';
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      }
      if (replace) history.replaceState(null, '', url.toString());
      else history.pushState(null, '', url.toString());
      this.page = page;
      this.updateParams();
      this.loadAll();
    },

    async init() {
      this.updateParams();
      this.player.app = this;
      this.epg.set = this.set.epg;
      this.player.set = this.set.player;
      setInterval(() => {
        this.now = Date.now();
        // 放送中の番組が終了したかチェック
        let needSync = false;
        for (const id in this.dashboardData.nowOnAir) {
          const entry = this.dashboardData.nowOnAir[id];
          const p = entry.current;
          if (p && this.now >= p.startTimeInt + p.durationSecond * 1000) {
            needSync = true;
            break;
          }
        }
        if (needSync) this.syncNowOnAir();
      }, 1000);

      const mqlSmall = window.matchMedia("(max-width: 600px)");
      const mqlPortrait = window.matchMedia("(orientation: portrait)");
      const updateMedia = () => {
        this.isSmallScreen = mqlSmall.matches;
        this.isPortrait = mqlPortrait.matches;
      };
      mqlSmall.addEventListener('change', updateMedia);
      mqlPortrait.addEventListener('change', updateMedia);
      updateMedia();

      this.$watch('set.oneseg', () => {
        this.updateNetworkMask();
        if (!this.set.oneseg && this.epg.activeNetwork === 2) this.setNetwork(0);
        this.saveCache();
        this.loadEpg();
        this.syncNowOnAir();
      });

      this.$watch('set.subCh', () => {
        this.saveCache();
        this.loadEpg();
        this.syncNowOnAir();
      });

      const d = new Date(this.now);
      d.setMinutes(0, 0, 0);
      this.epg.epgStartTime = d.getTime();

      this.epg.minTime = EPG_MIN_TIME;
      this.epg.maxTime = EPG_MAX_TIME;

      window.addEventListener('hashchange', () => {
        // ページ移動時はクエリをリセット
        if (window.location.search) history.replaceState(null, '', window.location.pathname + window.location.hash);
        this.page = window.location.hash || '#dashboard';
        this.updateParams();
        this.loadAll();
      });
      window.addEventListener('popstate', () => {
        this.page = window.location.hash || '#dashboard';
        this.updateParams();
        this.loadAll();
      });
      window.addEventListener('resize', () => {
        this.player.setbmlBrowserSize();
      });

      // 起動時に設定を復元
      const savedSettings = localStorage.getItem('E3');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const deepMerge = (target, source) => {
          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              if (!target[key]) target[key] = {};
              deepMerge(target[key], source[key]);
            } else {
              target[key] = source[key];
            }
          }
        };
        deepMerge(this.set, settings);
      }

      // 起動時にキャッシュから復元
      const saved = localStorage.getItem('edcb_full_cache');
      if (saved) {
        const cache = JSON.parse(saved);
        if (cache.lastUpdated) this.lastUpdated = { ...this.lastUpdated, ...cache.lastUpdated };
        if (cache.networkMask) this.epg.networkMask = cache.networkMask | 1;
        if (cache.totals) this.totals = { ...this.totals, ...cache.totals };
        if (cache.allData) {
          Object.entries(cache.allData).forEach(([key, list]) => {
            if (this.allData[key] instanceof Map) {
              list.forEach(val => {
                if (key === 'epg' && Array.isArray(val) && val.length > 0) {
                  // 局ごとのMapとして復元
                  const serviceId = `${val[0].onid}-${val[0].tsid}-${val[0].sid}`;
                  this.allData.epg.set(serviceId, new Map(val.map(v => [v.eid, v])));
                } else {
                  this.allData[key].set(this.getDataKey(val, key), val);
                }
              });
            }
          });
          // キャッシュから復元したデータの時間範囲を特定（コア範囲）
          let min = Infinity, max = 0;
          this.allData.epg.forEach(m => m.forEach(v => {
            min = Math.min(min, v.startTimeInt);
            max = Math.max(max, v.startTimeInt + v.durationSecond * 1000);
          }));
          this.epg.coreRange = { start: min === Infinity ? 0 : min, end: max };
        }
        // 「すべて」(bit 0)を保証
        if ((this.epg.networkMask & 1) === 0) this.epg.networkMask |= 1;
        // キャッシュに他ネットワークの情報がない場合、データから再計算
        if (this.epg.networkMask === 1 && this.allData.epg.size > 0) {
          this.updateNetworkMask();
        }

        this.syncNowOnAir();
        this.syncDashboardData();
        this.updateStorage();
      }

      // 設定の変更を監視して自動保存
      this.$watch('set', () => {
        //localStorage.setItem('E3', JSON.stringify(this.set));
      }, { deep: true });

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

      // 現在のROOTをベースにSSE接続URLを生成する
      const sseUrl = new URL(`${this.ROOT}api/SSE`, window.location.href);
      if (this.useDedicatedSsePort) {
        const currentPort = parseInt(sseUrl.port || (sseUrl.protocol === 'https:' ? '443' : '80'));
        sseUrl.port = (currentPort + this.ssePortOffset).toString();
      }

      this.eventSource = new EventSource(sseUrl.toString(), { withCredentials: true });

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
            this.updateTunerStatus(),
            this.refreshEpg()
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
        if (data.reserve) {
          await Promise.all([
            this.refreshData('#reserve'),
            this.refreshData('#tunerreserve'),
          ]);
          if (!data.epg) {
            this.loadEpg();
            this.loadWeeklyEpg();
          }
        }
        if (data.recinfo) this.refreshData('#recinfo');
        if (data.auto_add) this.refreshData('#autoaddepg');
        if (data.manual_add) this.refreshData('#autoaddmanual');
        if (data.tuner) this.updateTunerStatus();
        if (data.epg) await this.refreshEpg();
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
    async refreshEpg() {
      try {
        // 現在時刻の2時間前から取得を開始
        const d = new Date(this.now - 2 * 3600 * 1000);
        let hour = d.getHours();
        // 4時を日またぎの基準とするAPIの仕様（0-3時を前日の24-27時として扱う）に合わせる
        if (hour < 4) {
          d.setDate(d.getDate() - 1);
          hour += 24;
        }
        const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

        const rangeQuery = `&date=${dateStr}&hour=${hour}&interval=36`;

        // id65535-65535-65535でリクエストを1回だけ送り、全サービスの番組情報を取得する
        const res = await fetch(`${this.ROOT}api/EnumEventInfo?json=1&id=65535-65535-65535${rangeQuery}`);

        const list = await res.json();

        if (list.err) throw new Error(list.err);

        const grouped = new Map();
        const now = this.now;
        (Array.isArray(list) ? list : []).forEach(v => {
          // 描画負荷軽減のため、あらかじめ数値タイムスタンプを持たせておく
          v.startTimeInt = new Date(v.startTime).getTime();
          const serviceId = `${v.onid}-${v.tsid}-${v.sid}`;
          if (!grouped.has(serviceId)) grouped.set(serviceId, new Map());
          grouped.get(serviceId).set(v.eid, v);
        });

        this.allData.epg = grouped;

        // コアキャッシュの範囲を更新
        let min = Infinity, max = 0;
        grouped.forEach(m => m.forEach(v => {
          min = Math.min(min, v.startTimeInt);
          max = Math.max(max, v.startTimeInt + v.durationSecond * 1000);
        }));
        this.epg.coreRange = { start: min === Infinity ? 0 : min, end: max };

        this.lastUpdated.epg = Date.now();
        this.updateNetworkMask();
        this.saveCache();

        // this.snackbar.add({ text: 'EPG updated' });

        this.loadEpg();
        this.loadWeeklyEpg();
        this.syncNowOnAir();
      } catch (e) {
        console.error("Failed to refresh epg", e);
      }
    },
    // 指定範囲のEPGを単発取得し、再利用可能な形でメモリに保持する
    async fetchEpgForRange(startTime) {
      this.loading = true;
      try {
        const d = new Date(startTime);
        let hour = d.getHours();
        // 4時を日またぎの基準とするAPIの仕様（0-3時を前日の24-27時として扱う）に合わせる
        if (hour < 4) {
          d.setDate(d.getDate() - 1);
          hour += 24;
        }
        const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        // 27時間分を取得
        const res = await fetch(`${this.ROOT}api/EnumEventInfo?json=1&id=65535-65535-65535&date=${dateStr}&hour=${hour}&interval=24`);
        const list = await res.json();
        
        if (list.err) throw new Error(list.err);

        const grouped = new Map();
        (Array.isArray(list) ? list : []).forEach(v => {
          v.startTimeInt = new Date(v.startTime).getTime();
          const serviceId = `${v.onid}-${v.tsid}-${v.sid}`;
          if (!grouped.has(serviceId)) grouped.set(serviceId, new Map());
          grouped.get(serviceId).set(v.eid, v);
        });

        // 再利用可能な形式で保存（例: '2026-1-1-4'）
        const key = this.getEpgKey(startTime);
        this.epg.extraData.set(key, grouped);
        this.loadEpg();
      } catch (e) {
        console.error("Failed to fetch epg for range", e);
      } finally {
        this.loading = false;
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
        const services = serviceRes || [];
        services.forEach((s, i) => {
          const ni = this.getNetworkIndex(s.onid, s.partialReceptionFlag);
          const prev = services[i - 1];
          s.subCh = (ni === 1 || ni === 3) && prev && s.onid === prev.onid && s.tsid === prev.tsid;
          this.allData.service.set(this.getDataKey(s, 'service'), s);
        });

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
      // 視聴ページ以外に移動した場合は再生を停止してインスタンスを破棄
      if (this.player.ts && this.page !== '#watch') {
        this.player.destroy();
      }

      this.totalCount = null;
      if (!['#epg', '#epgweek'].includes(this.page)) document.querySelector('main').scrollTo(0,0);
      this.sidePanel.close();

      if (this.page === '#dashboard') {
        this.syncDashboardData();
        //if (this.isOnline) await this.updateStorage();
        return;
      }
      if (this.page === '#epg') {
        // タブ選択の同期
        const tab = parseInt(this.params.tab);
        if (!isNaN(tab)) this.epg.activeNetwork = tab;

        // 放送日付の基準（4時を境界とする）
        let base = new Date(this.now);
        if (base.getHours() < 4) base.setDate(base.getDate() - 1);
        base.setHours(4, 0, 0, 0);

        const dateParam = this.params.date;
        const hourParam = this.params.hour;

        let d;
        if (dateParam === undefined) {
          // 指定なし：現在の時間（1時間境界）
          d = new Date(this.now);
          d.setMinutes(0, 0, 0, 0);
        } else if (/^-?\d+$/.test(dateParam)) {
          // 相対指定（0:今日, 1:明日...）
          const offset = parseInt(dateParam);
          // 今日(0)かつhour指定なしなら現在時刻、それ以外なら04:00開始
          if (offset === 0 && hourParam === undefined) {
            d = new Date(this.now);
            d.setMinutes(0, 0, 0, 0);
          } else {
            d = new Date(base);
            d.setDate(d.getDate() + offset);
            d.setHours(4, 0, 0, 0);
          }
        } else {
          // 絶対指定（YYYY-MM-DD）
          d = new Date(dateParam);
          if (isNaN(d.getTime())) d = new Date(this.now);
          d.setHours(4, 0, 0, 0);
        }

        if (hourParam !== undefined) {
          const h = parseInt(hourParam);
          if (!isNaN(h)) d.setHours(h, 0, 0, 0);
        }
        this.epg.epgStartTime = d.getTime();

        this.loadEpg();
        return;
      }
      if (this.page === '#epgweek') {
        if (!this.params.id) {
          const first = this.serviceList[0];
          if (first) this.openPage('#epgweek', { id: this.getDataKey(first, 'service') }, true);
          return;
        }
        this.loadWeeklyEpg();
        return;
      }
      if (this.page === '#onair') {
        return;
      }
      if (this.page === '#watch') {
        if (this.player.ts) {
          if (this.params.id) this.player.loadLive(this.params.id);
          else if (this.params.recid) this.player.loadVideo(this.params);
        }
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
      this.dashboardData.reserves = Array.from(this.allData.reserve.values()).slice(0, 10);
      this.dashboardData.reservesCount = this.totals.reserve;
      this.dashboardData.recs = Array.from(this.allData.recinfo.values()).slice(0, 10);
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
      const cache = { totals: this.totals, lastUpdated: this.lastUpdated, networkMask: this.epg.networkMask, allData: {} };
      Object.entries(this.allData).forEach(([key, map]) => {
        if (key === 'epg') {
          // serviceId毎のMapを配列に戻して保存
          cache.allData[key] = Array.from(map.values()).map(m => Array.from(m.values()));
        } else {
          cache.allData[key] = Array.from(map.values());
        }
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
      // id: "onid-tsid-sid-eid"
      const parts = id.split('-');
      if (parts.length < 4) return null;

      const serviceId = parts.slice(0, 3).join('-');
      const eid = parseInt(parts[3]);

      // ネストした Map から取得
      const serviceMap = this.allData.epg.get(serviceId);
      let epg = serviceMap ? serviceMap.get(eid) : null;

      if (!epg && this.isOnline) {
        try{
          this.loading = true;
          epg = await fetch(`${this.ROOT}api/EnumEventInfo?json=1&id=${id}`).then(r => r.json());
          // 単発取得時は既存の配列を汚さないよう個別に扱うか検討が必要ですが、
          // 基本的に refreshEpg で一括取得されている前提とします
        } catch (e) {
          console.error(e);
        } finally {
          this.loading = false;
        }
      }
      return epg;
    },
    getGenre(w) {
      if (!w || w.content_nibble === undefined) return { nibble1: 15, nibble2: 15, name1: '', name2: '' };
      let ln = w.content_nibble;
      if (ln === 0x0E00) ln = (w.user_nibble || 0) + 0x6000;
      else if (ln === 0x0E01) ln = (w.user_nibble || 0) + 0x7000;
      const ln1 = (ln >> 8) & 0xFF;
      const ln2 = ln & 0xFF;
      return {
        nibble1: (w.content_nibble >> 8) & 0xFF,
        nibble2: w.content_nibble & 0xFF,
        name1: ARIB_GENRE.l1[ln1] || ARIB_GENRE.l2[ln1]?.[0xFF] || '',
        name2: ARIB_GENRE.l2[ln1]?.[ln2] || ''
      };
    },
    getComponent(info) {
      const empty = { text: '', toString() { return ''; } };
      if (!info) return empty;
      if (info.quality || info.aspect || info.mode) return info;
      if (typeof info.component_type_name === 'string') return { text: info.component_type_name, text_char: info.text_char, toString() { return this.text; } };
      if (info.stream_content === undefined) return empty;
      const id = (info.stream_content << 8) | info.component_type;
      const data = ARIB_COMPONENT[id];
      if (Array.isArray(data)) {
        if (info.stream_content !== 2) {
          // Video: [resolution, aspect, pan]
          return {
            quality: data[0],
            aspect: data[1],
            pan: data[2],
            text: `${data[0]}、アスペクト比${data[1]} パンベクトル${data[2] ? 'あり' : 'なし'}`,
            text_char: info.text_char,
            toString() { return this.text; }
          };
        } else {
          // Audio: [mode, info]
          return {
            mode: data[0],
            info: data[1],
            text: data[0] + (data[0] && data[1] ? ` (${data[1]})` : data[1]),
            text_char: info.text_char,
            toString() { return this.text; }
          };
        }
      }
      return { text: data || `タイプ 0x${id.toString(16)}`, toString() { return this.text; } };
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
    getElapsedTime(p) {
      if (!p || !p.durationSecond) return 0;
      return (this.now - p.startTimeInt) / 1000;
    },
    get nowOnAirList() {
      // サービス一覧の並び順に従って、放送中・次の番組ペアの配列を返す
      return this.serviceList.map(s => this.dashboardData.nowOnAir[`${s.onid}-${s.tsid}-${s.sid}`]).filter(v => v);
    },
    syncNowOnAir() {
      const now = this.now;
      const res = {};

      const createDummy = (s, start, duration) => ({
        onid: s.onid, tsid: s.tsid, sid: s.sid, eid: 65535,
        startTimeInt: start,
        durationSecond: Math.max(0, Math.floor(duration)),
        shortInfo: { event_name: '番組情報なし' },
        stationName: s.service_name,
        isDummy: true
      });

      this.allData.epg.forEach((eventsMap, serviceId) => {
        const s = this.allData.service.get(serviceId);
        if (!s || (!this.set.oneseg && s.partialReceptionFlag) || (!this.set.subCh && s.subCh)) return;

        const events = Array.from(eventsMap.values()).sort((a, b) => a.startTimeInt - b.startTimeInt);
        let current = null;
        let next = null;

        const currentIndex = events.findIndex(v => v.startTimeInt <= now && v.startTimeInt + v.durationSecond * 1000 > now);

        if (currentIndex !== -1) {
          // 現在放送中の番組が見つかった場合
          current = { ...events[currentIndex], stationName: s.service_name };
          const nextStart = current.startTimeInt + current.durationSecond * 1000;
          const nextActual = events[currentIndex + 1];

          if (nextActual && nextActual.startTimeInt === nextStart) {
            // 次の番組が連続している場合
            next = { ...nextActual, stationName: s.service_name };
          } else {
            // 次の番組との間に隙間がある、または次の番組がない
            const duration = nextActual ? (nextActual.startTimeInt - nextStart) / 1000 : 3600;
            next = createDummy(s, nextStart, duration);
          }
        } else {
          // 現在放送中の番組がない場合（隙間期間）
          const nextIdx = events.findIndex(v => v.startTimeInt > now);
          if (nextIdx !== -1) {
            // 次の番組は存在するので、前の番組の終了（または現在時刻）からその開始までをダミーに
            const nextActual = events[nextIdx];
            const prevActual = events[nextIdx - 1];
            const gapStart = prevActual ? (prevActual.startTimeInt + prevActual.durationSecond * 1000) : now;
            current = createDummy(s, gapStart, (nextActual.startTimeInt - gapStart) / 1000);
            next = { ...nextActual, stationName: s.service_name };
          } else {
            // 現在も将来も番組情報がない場合
            current = createDummy(s, now, 3600);
            next = createDummy(s, now + 3600000, 3600);
          }
        }

        res[serviceId] = { current, next };
      });
      this.dashboardData.nowOnAir = res;
    },
    get serviceList() {
      const list = Array.from(this.allData.service.values());
      return list
        .filter(s => this.set.oneseg || !s.partialReceptionFlag)
        .filter(s => this.set.subCh || !s.subCh)
        .filter(s => this.allData.epg.has(`${s.onid}-${s.tsid}-${s.sid}`));
    },
    getNetworkIndex(onid, partial) {
      if (0x7880 <= onid && onid <= 0x7FE8) return partial ? 2 : 1;
      if (onid === 4) return 3;
      if (onid === 11) return 4;
      if (!this.divCS && (onid === 6 || onid === 7)) return 5;
      if (onid === 6) return 6;
      if (onid === 7) return 7;
      if (onid === 10) return 8;
      return 9;
    },
    updateNetworkMask() {
      let mask = 1;
      this.allData.epg.forEach((_, serviceId) => {
        const s = this.allData.service.get(serviceId);
        if (s) {
          const ni = this.getNetworkIndex(s.onid, s.partialReceptionFlag);
          if (this.set.oneseg || ni !== 2) mask |= (1 << ni);
        }
      });
      this.epg.networkMask = mask;
    },
    getDefSearchService(){
      return [...document.getElementById('serviceList-template').content.querySelectorAll('.def')].map(e => e.value);
    },

    epg: {
      epgStartTime: 0,
      minTime: 0,
      maxTime: 0,
      servicesToDisplay: [],
      weeklyToDisplay: [],
      activeNetwork: 1,
      networkNames: ['すべて', '地デジ', 'ワンセグ', 'BS', 'BS4K', 'CS', 'CS1', 'CS2', 'CS3', 'その他'],
      networkMask: 1,
      lastLoadedNetwork: -1,
      coreRange: { start: 0, end: 0 },
      extraData: new Map(), // 追加取得したデータの保管庫
      lastLoadedData: 0,
      lastLoadedReserve: 0,
      loadId: 0,
      lastLoadedKey: '',
      weeklyCache: new Map(),
      fetchingWeekly: null,
      lastLoadedWeeklyService: '',
      lastLoadedWeeklyStart: 0,
      lastLoadedWeeklyData: 0,
      lastLoadedWeeklyReserve: 0,
      weeklyLoadId: 0,

      isDragging: false,
      hasMoved: false,
      velocityX: 0,
      velocityY: 0,
      momentID: 0,
      onPointerDown(e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        // 新しいドラッグが始まったら現在の慣性アニメーションを止める
        if (this.momentID) {
          cancelAnimationFrame(this.momentID);
          this.momentID = 0;
        }
        this.isDragging = true;
        this.hasMoved = false;
        this.velocityX = 0;
        this.velocityY = 0;
      },
      onPointerMove(e) {
        if (!this.isDragging) return;
        if (this.hasMoved || Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) {
          if (!this.hasMoved) e.currentTarget.setPointerCapture(e.pointerId);
          this.hasMoved = true;
          document.body.style.cursor = 'grabbing';
          document.querySelector('main').scrollBy(-e.movementX, -e.movementY);
          // 直近の移動量を速度として記録
          this.velocityX = -e.movementX;
          this.velocityY = -e.movementY;
        }
      },
      onPointerUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        document.body.style.cursor = null;
        if (this.hasMoved) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          // 慣性アニメーションの開始
          const friction = 0.85; // 摩擦係数（1に近いほど止まりにくい）
          const moment = () => {
            if (Math.abs(this.velocityX) < 0.1 && Math.abs(this.velocityY) < 0.1) return;
            document.querySelector('main').scrollBy(this.velocityX, this.velocityY);
            this.velocityX *= friction;
            this.velocityY *= friction;
            this.momentID = requestAnimationFrame(moment);
          };
          this.momentID = requestAnimationFrame(moment);
        }
      },
      // ホイール操作時も慣性を止める
      onWheel() {
        if (this.momentID) {
          cancelAnimationFrame(this.momentID);
          this.momentID = 0;
        }
      },

      active: null,
      onPointerEnter(event) {
        if (this.set.hover && !event.isGap) {
          this.active = event.eid;
        }
      },
      onPointerLeave() {
        if (this.set.hover) {
          this.active = null;
        }
      },
      clickTimeout: null,
      // クリックハンドラ
      onEventClick(event) {
        if (this.hasMoved) return;
        clearTimeout(this.clickTimeout);
        this.clickTimeout = setTimeout(() => {
            // Gap（番組の隙間）であるか、既にアクティブなら解除、そうでなければeidをセット
            this.active = event.isGap || this.active === event.eid ? null : event.eid;
        }, 200);
      },
      // ダブルクリックハンドラ
      onEventDblClick(event) {
        if (this.hasMoved) return;
        clearTimeout(this.clickTimeout);
        if (!event.isGap) {
            this.openProgramDetail(event);
        }
      },
      // EPGイベントに適用するCSSクラスを判定する
      getEventClass(event) {
        const genreId = (event.contentInfoList && event.contentInfoList.length > 0) 
            ? this.getGenre(event.contentInfoList[0]).nibble1 + 1 
            : 16;
        const genreClass = event.isGap ? 'cont-0' : 'cont-' + genreId;

        return {
            'reserve': !!event.reserve,
            'disabled': event.reserve && !event.reserve.recSetting.recEnabled,
            'partially': event.reserve?.overlapMode === 1,
            'shortage': event.reserve?.overlapMode === 2,
            'view': event.reserve?.recSetting.recMode === 5,
            'large-elevate': !event.isGap && this.active === event.eid,
            [genreClass]: true
        };
      },
    },
    getEpgKey(time) {
      const d = new Date(time);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
    },
    loadEpg(){
      const gridStart = this.epg.epgStartTime;
      const gridEnd = gridStart + 24 * 3600 * 1000;
      const slotKey = this.getEpgKey(gridStart);

      // データソースの決定
      let dataMap = null;
      if (gridStart >= this.epg.coreRange.start && gridEnd <= this.epg.coreRange.end) {
        dataMap = this.allData.epg;
      } else {
        dataMap = this.epg.extraData.get(slotKey);
        // キャッシュになければ取得
        if (!dataMap && this.isOnline) {
          this.fetchEpgForRange(gridStart);
          return;
        }
      }

      // 基準時間、ネットワークフィルタ、EPGデータ更新のいずれも変化がなければ処理をスキップ
      if (this.epg.lastLoadedStart === gridStart &&
          this.epg.lastLoadedNetwork === this.epg.activeNetwork &&
          this.epg.lastLoadedData === this.lastUpdated.epg &&
          this.epg.lastLoadedMask === this.epg.networkMask &&
          this.epg.lastLoadedReserve === this.lastUpdated.reserve &&
          this.epg.lastLoadedKey === slotKey &&
          this.epg.servicesToDisplay.length > 0) {
        return;
      }
      const timeChanged = this.epg.lastLoadedStart !== gridStart;
      const networkChanged = this.epg.lastLoadedNetwork !== this.epg.activeNetwork;
      const maskChanged = this.epg.lastLoadedMask !== this.epg.networkMask;

      // 中断と新規 ID 発行
      const currentLoadId = ++this.epg.loadId;
      this.epg.lastLoadedStart = gridStart;
      this.epg.lastLoadedNetwork = this.epg.activeNetwork;
      this.epg.lastLoadedMask = this.epg.networkMask;
      this.epg.lastLoadedData = this.lastUpdated.epg;
      this.epg.lastLoadedReserve = this.lastUpdated.reserve;
      this.epg.lastLoadedKey = slotKey;

      // 1. サービスリストの準備
      if (networkChanged || maskChanged || this.epg.servicesToDisplay.length === 0) {
        let services = this.serviceList;
        if (this.epg.activeNetwork > 0) {
          services = services.filter(s => this.getNetworkIndex(s.onid, s.partialReceptionFlag) === this.epg.activeNetwork);
        }
        this.epg.servicesToDisplay = services.map(s => ({ ...s, displayEvents: [] }));
      } else if (timeChanged) {
        // 時間枠（1時間ごとの境界）が変わった場合のみクリアする。
        this.epg.servicesToDisplay.forEach(s => s.displayEvents = []);
      }

      // 代入後にプロキシ化された参照を取得する（比較用）
      const currentServices = this.epg.servicesToDisplay;

      if (timeChanged || networkChanged) document.querySelector('main').scrollTo(0,0);

      // 2. 各局の番組計算を非同期（逐次）で行い、メインスレッドのブロックを防ぐ
      let index = 0;

      const processNext = () => {
        // 別の loadEpg (フィルタ切り替え等) が開始されていたらこのループを中止
        if (this.epg.loadId !== currentLoadId) return;

        const s = currentServices[index];
        const serviceId = this.getDataKey(s, 'service');
        const eventMap = dataMap ? dataMap.get(serviceId) : null;
        const displayEvents = [];
        let lastPos = gridStart;

        if (eventMap) {
          for (const v of eventMap.values()) {
            const start = v.startTimeInt;
            const end = start + (v.durationSecond * 1000);
            if (end <= gridStart || start >= gridEnd) continue;

            // サーバー側で時間順にソート済みのため、表示枠を超えたらこの局の計算は終了できる
            if (start >= gridEnd) break;
            if (end <= gridStart) continue;

            const vStart = Math.max(start, gridStart);
            const vEnd = Math.min(end, gridEnd);
            const startMin = Math.floor((vStart - gridStart) / 60000);
            const endMin = Math.floor((vEnd - gridStart) / 60000);
            const lastMin = Math.floor((lastPos - gridStart) / 60000);

            if (startMin < lastMin) continue;
            if (startMin > lastMin) {
              displayEvents.push({ isGap: true, minutes: startMin - lastMin });
            }
            const minutes = endMin - startMin;
            if (minutes > 0) {
              const reserve = this.allData.reserve.get(`${v.onid}-${v.tsid}-${v.sid}-${v.eid}`);
              displayEvents.push({ ...v, isGap: false, minutes, reserve });
              lastPos = Math.max(lastPos, vEnd);
            }
          }
        }

        const finalMin = Math.floor((gridEnd - gridStart) / 60000);
        const lastMin = Math.floor((lastPos - gridStart) / 60000);
        if (finalMin > lastMin) {
          displayEvents.push({ isGap: true, minutes: finalMin - lastMin });
        }

        // リアクティブに個別の番組リストを更新
        currentServices[index].displayEvents = displayEvents;

        index++;
        if (index < currentServices.length) setTimeout(processNext, 0);
      };
      setTimeout(processNext, 0);
    },
    async loadWeeklyEpg() {
      const serviceId = this.params.id;
      if (!serviceId) return;
      const service = this.allData.service.get(serviceId);
      if (!service) return;

      // 4時基準の開始時間を決定
      let d = new Date(this.now);
      let dateSpecified = false;
      if (this.params.date) {
        const parsed = new Date(this.params.date);
        if (!isNaN(parsed.getTime())) {
          d = parsed;
          dateSpecified = true;
        }
      }
      // 日付指定がない場合のみ、現在時刻が4時前なら前日扱いとする
      if (!dateSpecified && d.getHours() < 4) d.setDate(d.getDate() - 1);
      d.setHours(4, 0, 0, 0);

      const startTime = d.getTime();
      const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const cacheKey = `${serviceId}-${dateStr}`;

      // 同一キーの取得リクエストが進行中なら重複して走らせない
      if (this.epg.fetchingWeekly === cacheKey) return;
      this.epg.fetchingWeekly = cacheKey;

      // 再描画が必要かチェック（サービス、開始時間、データ更新、予約更新のいずれも変化がなければスキップ）
      if (this.epg.lastLoadedWeeklyService === serviceId &&
          this.epg.lastLoadedWeeklyStart === startTime &&
          this.epg.lastLoadedWeeklyData === this.lastUpdated.epg &&
          this.epg.lastLoadedWeeklyReserve === this.lastUpdated.reserve &&
          this.epg.weeklyToDisplay.length === 7) {
        this.epg.fetchingWeekly = null;
        return;
      }

      this.epg.epgStartTime = startTime;
      const serviceChanged = this.epg.lastLoadedWeeklyService !== serviceId;
      const timeChanged = this.epg.lastLoadedWeeklyStart !== startTime;

      const currentWeeklyLoadId = ++this.epg.weeklyLoadId;
      this.epg.lastLoadedWeeklyService = serviceId;
      this.epg.lastLoadedWeeklyStart = startTime;
      this.epg.lastLoadedWeeklyData = this.lastUpdated.epg;
      this.epg.lastLoadedWeeklyReserve = this.lastUpdated.reserve;

      // 先にガワだけ作る（リアクティブな反映のため）
      if (this.epg.weeklyToDisplay.length !== 7 || serviceChanged || timeChanged) {
        this.epg.weeklyToDisplay = Array.from({ length: 7 }, (_, i) => {
          const dayStart = startTime + i * 24 * 3600 * 1000;
          const dayDate = new Date(dayStart);
          return {
            ...service,
            date: dayStart,
            label: `${dayDate.getMonth() + 1}/${dayDate.getDate()}(${this.dayText[dayDate.getDay()]})`,
            displayEvents: []
          };
        });
        // 構造が変わった場合のみ、一旦処理を戻し、空のグリッドを表示させる
        await new Promise(resolve => setTimeout(resolve, 0));
        document.querySelector('main').scrollTo(0,0);
      }


      const processEvents = events => {
        let index = 0;
        const processNext = () => {
          if (this.epg.weeklyLoadId !== currentWeeklyLoadId) return;

          const dayStart = startTime + index * 24 * 3600 * 1000;
          const dayEnd = dayStart + 24 * 3600 * 1000;
          const displayEvents = [];
          let lastPos = dayStart;

          // その日の範囲に含まれる番組をフィルタリング
          const dayEvents = events.filter(v => (v.startTimeInt + v.durationSecond * 1000) > dayStart && v.startTimeInt < dayEnd);

          for (const v of dayEvents) {
            const vStart = Math.max(v.startTimeInt, dayStart);
            const vEnd = Math.min(v.startTimeInt + (v.durationSecond * 1000), dayEnd);

            const startMin = Math.floor((vStart - dayStart) / 60000);
            const endMin = Math.floor((vEnd - dayStart) / 60000);
            const lastMin = Math.floor((lastPos - dayStart) / 60000);

            if (startMin > lastMin) {
              displayEvents.push({ isGap: true, minutes: startMin - lastMin });
            }
            const minutes = endMin - startMin;
            if (minutes > 0) {
              const reserve = this.allData.reserve.get(`${v.onid}-${v.tsid}-${v.sid}-${v.eid}`);
              displayEvents.push({ ...v, isGap: false, minutes, reserve });
              lastPos = Math.max(lastPos, vEnd);
            }
          }

          const finalMin = 1440;
          const lastMin = Math.floor((lastPos - dayStart) / 60000);
          if (finalMin > lastMin) {
            displayEvents.push({ isGap: true, minutes: finalMin - lastMin });
          }

          // 変更がある場合のみ個別の番組リストを更新（リアクティブ連鎖の抑制）
          const old = this.epg.weeklyToDisplay[index].displayEvents || [];
          const isChanged = old.length !== displayEvents.length || 
                            displayEvents.some((v, i) => v.eid !== old[i]?.eid || v.minutes !== old[i]?.minutes || 
                            (v.reserve?.reserveID !== old[i]?.reserve?.reserveID) || 
                            (v.reserve?.recSetting.recEnabled !== old[i]?.reserve?.recSetting.recEnabled) ||
                            (v.reserve?.overlapMode !== old[i]?.reserve?.overlapMode));
          
          if (isChanged) {
            this.epg.weeklyToDisplay[index].displayEvents = displayEvents;
          }

          index++;
          if (index < 7) setTimeout(processNext, 0);
        };

        processNext();
      };

      // メモリキャッシュのチェック（EPGデータ自体の更新がなければ使い回す）
      if (this.epg.weeklyCache.has(cacheKey)) {
        processEvents(this.epg.weeklyCache.get(cacheKey));
        this.epg.fetchingWeekly = null;
        return;
      }

      this.loading = true;
      try {
        // 指定されたサービスの1週間分(168時間)を取得
        const res = await fetch(`${this.ROOT}api/EnumEventInfo?json=1&id=${serviceId}&date=${dateStr}&hour=4&interval=168`);
        const list = await res.json();
        this.loading = false;
        
        if (this.epg.weeklyLoadId !== currentWeeklyLoadId) {
          this.epg.fetchingWeekly = null;
          return;
        }
        if (list.err) throw new Error(list.err);

        const events = (Array.isArray(list) ? list : []).map(v => {
          v.startTimeInt = new Date(v.startTime).getTime();
          return v;
        });

        this.epg.weeklyCache.set(cacheKey, events);
        processEvents(events);
      } catch (e) {
        console.error("Failed to load weekly EPG", e);
        this.loading = false;
      } finally {
        this.epg.fetchingWeekly = null;
      }
    },
    // ネットワーク（タブ）を切り替え、履歴に追加する
    setNetwork(index) {
      if (this.epg.activeNetwork === index) return;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', index);
      history.pushState(null, '', url.toString());
      this.epg.activeNetwork = index;
      this.updateParams();
      this.loadEpg();
    },
    // 日付を前後にずらす (24時間単位)
    shiftDate(days) {
      const target = this.epg.epgStartTime + days * 24 * 3600 * 1000;
      if (target < this.epg.minTime || target > this.epg.maxTime) return;
      
      const d = new Date(target);
      this.setDate(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, d.getHours());
    },
    // 移動可能か判定
    canShift(days) {
      const target = this.epg.epgStartTime + days * 24 * 3600 * 1000;
      return target >= this.epg.minTime && target <= this.epg.maxTime;
    },
    // 表示中の日を基準にした日付リストを取得（前後10日間、かつ有効範囲内）
    getEpgDateList() {
      const current = new Date(this.epg.epgStartTime);
      if (current.getHours() < 4) current.setDate(current.getDate() - 1);
      current.setHours(4, 0, 0, 0);

      const list = [];
      for (let i = -2; i <= 7; i++) {
        const d = new Date(current.getTime());
        d.setDate(d.getDate() + i);
        if (d.getTime() >= this.epg.minTime && d.getTime() <= this.epg.maxTime) {
          list.push(d);
        }
      }
      return list;
    },
    // 指定の日付・時間に移動する
    setDate(date, hour) {
      const url = new URL(window.location.href);
      if (date instanceof Date) {
        const d = date;
        date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        hour = d.getHours();
      }
      url.searchParams.set('date', date);
      if (hour !== undefined && hour !== null) url.searchParams.set('hour', hour);
      else url.searchParams.delete('hour');
      history.pushState(null, '', url.toString());
      this.updateParams();
      this.loadAll();
    },
    // ヘッダー表示用の日付テキスト
    getEpgDateText() {
      if (!this.epg.epgStartTime) return '';
      const d = new Date(this.epg.epgStartTime);
      const h = d.getHours();
      // 4時までは前日扱いとして表示
      const logical = new Date(d.getTime());
      if (h < 4) logical.setDate(logical.getDate() - 1);
      return `${logical.getMonth() + 1}/${logical.getDate()}(${this.dayText[logical.getDay()]})`;
    },
    // メニュー用の相対日付ラベル
    getDateLabel(targetDate) {
      const target = new Date(targetDate.getTime());
      if (target.getHours() < 4) target.setDate(target.getDate() - 1);
      target.setHours(4, 0, 0, 0);

      const d = new Date(this.now);
      if (d.getHours() < 4) d.setDate(d.getDate() - 1);
      d.setHours(4, 0, 0, 0);

      const diff = Math.round((target.getTime() - d.getTime()) / (24 * 3600 * 1000));
      const m = target.getMonth() + 1;
      const date = target.getDate();
      const w = this.dayText[target.getDay()];
      return `${m}/${date}(${w})`;
    },
    // 表示している日付（offset）が現在選択されているものか判定
    isDateActive(targetDate) {
      if (!this.epg.epgStartTime) return false;

      const target = new Date(targetDate.getTime());
      if (target.getHours() < 4) target.setDate(target.getDate() - 1);
      target.setHours(4, 0, 0, 0);

      // 現在表示中の論理日
      const currentShowDay = new Date(this.epg.epgStartTime);
      if (currentShowDay.getHours() < 4) currentShowDay.setDate(currentShowDay.getDate() - 1);
      currentShowDay.setHours(4, 0, 0, 0);

      return target.getTime() === currentShowDay.getTime();
    },
    // 現在時刻の線の位置（px）を取得。範囲外なら -1
    getNowLinePos() {
      const start = this.epg.epgStartTime;
      const end = start + 24 * 3600 * 1000;
      if (this.now < start || this.now > end) return -1;
      return Math.floor((this.now - start) / 60000) * this.epg.set.minHeight;
    },
    // 現在時刻の位置までスクロールする
    scrollToNow() {
      const pos = this.getNowLinePos();
      if (pos < 0) {
        // 表示範囲外なら「今日」へ移動（loadAllが走り、現在時刻開始のグリッドになる）
        this.setDate(0);
      } else {
        // 表示範囲内ならスクロール。ヘッダー（90px）を考慮して少し余裕を持たせる
        document.querySelector('main').scrollTo({ top: pos - this.epg.set.minHeight * 15, behavior: 'smooth' });
      }
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
    openNewEntry(e){
      this.detail = { recSetting: this.allData.recpreset.get(0).recSetting };
      if (e)  this.detail.searchInfo = { andKey: e.shortInfo.event_name, serviceList: [{onid: e.onid, tsid: e.tsid, sid: e.sid }] };
      else if (this.page == '#autoaddepg') this.detail.searchInfo = {};
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

      if (d.past ||  d.startTimeInt + d.durationSecond * 1000 < this.now || d.eid === 65535) return;

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
          const names = e.split(' - ');
          const n1 = Object.keys(ARIB_GENRE.l1).find(k => ARIB_GENRE.l1[k] === names[0]);
          const n2 = n1 !== undefined ? Object.keys(ARIB_GENRE.l2[n1] || {}).find(k => ARIB_GENRE.l2[n1][k] === names[1]) : undefined;
          return {
            content_nibble: (parseInt(n1 || 0x0F) << 8) | parseInt(n2 || 0x0F)
          };
        }),
        componentInfo: (() => {
          const text = getSection('映像 : ');
          const lines = text.split('\n');
          const firstLine = lines[0] || '';
          const m = firstLine.match(/^(.+?)、アスペクト比([\d:>]+)\s*(.*)/);
          return m ? {
            quality: m[1],
            aspect: m[2],
            pan: m[3].includes('あり'),
            text_char: lines.slice(1).join('\n').trim(),
            text: firstLine,
            toString() { return this.text; }
          } : { component_type_name: text, text: text, toString() { return this.text; } };
        })(),
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
      getSection('音声 : ').split('\n').filter(v => v.trim()).forEach(e => {
        if (!res.audioInfoList[i]) res.audioInfoList[i] = {};
        const isSampling = e.includes('サンプリングレート');
        const key = isSampling ? 'sampling_rate_txt' : res.audioInfoList[i].component_type_name ? 'text_char' : 'component_type_name';
        const val = e.replace('サンプリングレート : ', '').trim();
        if (key === 'text_char' && res.audioInfoList[i][key]) {
          res.audioInfoList[i][key] += '\n' + val;
        } else {
          res.audioInfoList[i][key] = val;
        }
        if (isSampling) i++;
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
    addReserve(e) {
      const fd = new URLSearchParams({ id: `${e.onid}-${e.tsid}-${e.sid}-${e.eid}`, oneClick: 1 });
      this.apiFetch(`${this.ROOT}api/SetReserve`, fd, 'GET');
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

    player: {
      get params() { return this.app.params },
      get nowOnAir() { return this.app.dashboardData.nowOnAir },
      get epg() { return this.live ? this.nowOnAir[this.params?.id]?.current : this.app.allData.recinfo.get(Number(this.app.params.recid)) },
      vid: null,
      ts: null,
      tslive: false,
      live: true,
      isPlaying: false,
      currentTime: 0,
      get duration() { return this.epg?.durationSecond || 0},
      isFullscreen: false,
      playbackRate: 1,
      track: 0,
      cinema: false,
      isLoading: false, // バッファリング/読み込み中にtrueに設定
      controlsVisible: true, // コントロールの表示状態
      showSettingsMenu: false, // 設定ドロップダウンの状態
      showSidePanel: false,
      controlTimeout: null, // コントロール自動非表示用タイマー
      isSeeking: false, // シーク中フラグ
      sideTab: 'service-list',

      // ビデオ要素と対話するためのメソッド
      loadLive(id) {
        if (!this.ts) return;
        const video = this.app.$refs.video;
        video.setAttribute('ctok', video.dataset.ctokView);
        this.live = true;
        Alpine.raw(this.ts).reset();
        Alpine.raw(this.ts).loadSource(`${ROOT}api/view?n=${this.set.nwtv}&id=${id}`);
        this.isLoading = true;
      },
      loadVideo(d) {
        if (!this.ts) return;
        const video = this.app.$refs.video;
        video.setAttribute('ctok', video.dataset.ctokXcode);
        this.live = false;
        Alpine.raw(this.ts).reset();
        Alpine.raw(this.ts).loadSource(`${ROOT}api/xcode?${d.path ? `fname=${encodeURIComponent(d.path)}` : d.recid ? `recid=${d.recid}` : d.rid ? `rid=${d.rid}` : ''}&shiftable=1`);
        this.isLoading = true;
      },
      reset() {
        Alpine.raw(this.ts).reset();
        if (window.location.search) history.replaceState(null, '', window.location.pathname + window.location.hash);
        if (this.app) this.app.updateParams();
        this.isPlaying = false;
        this.currentTime = 0;
        this.isLoading = false;
        this.isSeeking = false;
      },
      destroy() {
        this.reset();
        this.vid = null;
        this.ts = null;
      },
      togglePlay() {
        if (Alpine.raw(this.vid).paused) Alpine.raw(this.vid).play();
        else Alpine.raw(this.vid).pause();
      },
      seek(value) {
        Alpine.raw(this.ts).setSeek(value, () => this.isLoading = true);
      },
      setVolume(value) {
        this.set.volume = parseFloat(value);
        this.set.isMuted = this.set.volume === 0;
        Alpine.raw(this.vid).volume = this.set.volume;
      },
      toggleMute() {
        this.set.isMuted = !this.set.isMuted;
        Alpine.raw(this.vid).muted = this.set.isMuted;
      },
      toggleDatacast() {
        this.set.datacast = !this.set.datacast;
        Alpine.raw(this.ts).toggleDatacast(this.set.datacast);
      },
      toggleCap() {
        this.set.cap = !this.set.cap;
        this.set.cap ? Alpine.raw(this.ts).cap.show() : Alpine.raw(this.ts).cap.hide();
      },
      toggleJikkyo() {
        this.set.jikkyo = Alpine.raw(this.ts).toggleJikkyo();
      },
      toggleFullscreen() {
        const player = document.getElementById('player');
        if (!document.fullscreenElement) {
          player.requestFullscreen().catch(err => console.error(err));
          screen.orientation.lock('landscape');
          this.isFullscreen = true;
        } else {
          screen.orientation.unlock();
          document.exitFullscreen();
          this.isFullscreen = false;
        }
        this.moveRemocon(this.isPortrait);
      },
      setAudioTrack(track){
        this.track = track;
        Alpine.raw(this.ts).setAudioTrack(track, () => this.isLoading = true);
      },
      get audioTrackLabels() {
        const audioList = this.epg?.audioInfoList;
        if (!audioList || audioList.length === 0) return ['主音声'];

        // 多重音声（2つ以上の音声コンポーネントがある場合）
        if (audioList.length >= 2) {
          return [
            audioList[0].text_char?.trim() || '主音声',
            audioList[1].text_char?.trim() || '副音声'
          ];
        }

        const info = audioList[0];
        // デュアルモノ (component_type: 2) の判定
        if (info.component_type === 2) {
          // onair.jsを参考に、text_charが「日本語 英語」のように空白や改行で区切られている場合を考慮
          const text = (info.text_char || '').trim().split(/[\s\n\r]+/);
          return [
            `[二] ${text[0] || '日本語'}`,
            `[二] ${text[1] || '英語'}`
          ];
        }
        return [info.text_char?.trim() || '主音声'];
      },
      setPlaybackRate(rate, i) {
        this.playbackRate = rate;
        Alpine.raw(this.ts).setFast(rate, i, () => this.isLoading = true);
      },
      setQuality(quality, tslive) {
        this.set.quality = quality;
        this.tslive = tslive;
        Alpine.raw(this.ts).setOption(quality, tslive, ()=>{}, () => this.isLoading = true);
      },
      setDetelecine(){
        this.cinema = !this.cinema;
        Alpine.raw(this.ts).setDetelecine(this.cinema, () => this.isLoading = true);
      },
      setbmlBrowserSize(){
        if (typeof bmlBrowserSetVisibleSize === 'undefined') return;
        const width = this.$refs.player.clientWidth;
        const height = this.$refs.player.clientHeight;
        if (width * 9 < height * 16) bmlBrowserSetVisibleSize(width, Math.floor(width * 9 / 16));
        else bmlBrowserSetVisibleSize(Math.floor(height * 16 / 9), height);
      },

      // 時間フォーマットユーティリティ
      formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const parts = [m, s].map(v => v.toString().padStart(2, '0'));
        if (h > 0) parts.unshift(h.toString().padStart(2, '0'));
        return parts.join(':');
      },

      // コントロールの表示管理
      showControls() {
        this.controlsVisible = true;
      },
      hideControls() {
        if (!this.showSettingsMenu) { // メニューが開いていない場合のみ非表示
          this.controlsVisible = false;
        }
      },
      resetControlTimeout() {
        clearTimeout(this.controlTimeout);
        this.showControls(); // 操作時にコントロールが確実に表示されるようにする
        this.controlTimeout = setTimeout(() => {
          this.hideControls();
        }, 3000); // 3秒間操作がない場合に非表示
      },

      moveRemocon(isPortrait) {
        const content = this.$refs.remocon;
        const target = isPortrait && !this.isFullscreen ? this.$refs.remoteMobile : this.$refs.remoteDesktop;
        if (content && target && content.parentElement !== target) {
          target.appendChild(content);
        }
      },

      remoconInit() {
        this.$watch('isPortrait', value => this.moveRemocon(value));
        this.$nextTick(() => {
          const s = document.createElement('script');
          s.src = 'js/web_bml_play_ts.js';
          s.id = 'webBml';
          this.$refs.remocon.appendChild(s);
          this.moveRemocon(this.isPortrait);
        });
      },

      // 初期化 (例: ビデオ要素へのイベントリスナーのアタッチ)
      videoInit() {
        this.$nextTick(() => {
          const video = this.$refs.video;
          const vid = this.tslive ? new TsLiveDatacast(video) : video;
          const ts = this.tslive ? vid : new HlsDatacast(video);
          this.vid = vid;
          this.ts = ts;

          video.volume = this.set.volume;
          video.muted = this.set.isMuted;
          video.addEventListener('play', () => this.isPlaying = true);
          video.addEventListener('pause', () => this.isPlaying = false);
          video.addEventListener('timeupdate', () => {
            if (this.isSeeking) return;
            if (this.live){
              this.currentTime = this.app.getElapsedTime(this.epg);
            } else {
              this.currentTime = ts.fixedCurrentTime || vid.currentTime;
            }
          });
          video.addEventListener('volumechange', () => { this.set.volume = video.volume; this.set.isMuted = video.muted; });
          video.addEventListener('waiting', () => this.isLoading = true);
          video.addEventListener('playing', () => this.isLoading = false);
          video.addEventListener('canplay', () => {
            const promise = video.play();
            //自動再生ポリシー対策 https://developer.chrome.com/blog/autoplay?hl=ja
            if (promise !== undefined){
              promise.catch(error => {
                video.muted = true;
                video.play();
                document.addEventListener('click', () => {
                  video.muted = false;
                }, { once: true });
              });
            }
          });
          video.addEventListener('enabledDetelecine',  () => this.cinema = true);
          video.addEventListener('disabledDetelecine', () => this.cinema = false);

          this.sideTab = this.live ? 'service-list' : 'info';
          ts.setOption(this.set.quality);
          if (ts.cap && !this.set.cap) ts.cap.hide();
          ts.toggleJikkyo(this.set.jikkyo, this.set.jikkyoConfig.load);
          if (ts.jikkyo.danmaku) {
            ts.jikkyo.danmaku.opacity(this.set.jikkyoConfig.opacity);
            ts.jikkyo.danmaku.options.height = this.set.jikkyoConfig.height;
          }
          if (ts.datacast) {
            ts.toggleDatacast(this.set.datacast);
            this.setbmlBrowserSize();
          }

          if (this.params.id) this.loadLive(this.params.id);
          else if (this.params.recid) this.loadVideo(this.params);
          
          this.resetControlTimeout();
        });
      }
    },
  }));
});