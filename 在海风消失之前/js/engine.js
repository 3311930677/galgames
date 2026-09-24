/* ============================================================
 * 《在雨停之前》VN 引擎核心
 * 职责：流程状态机、好感/FLAG、存档、结局收集、已读池
 * UI 交互全部委托 ui.js，本文件不含 DOM 操作
 * ============================================================ */
(function () {

  const K = {
    save: n => `seaVN_save_${n}`,
    endings: 'seaVN_endings',
    seen: 'seaVN_seen',
    cfg: 'seaVN_cfg',
  };

  // localStorage 封装（file:// 下个别浏览器可能禁用，做降级）
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 忽略 */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ } },
  };

  const AFF_CHARS = ['misaki', 'reina', 'himari', 'noa'];

  const Engine = {

    state: null,   // { seg, idx, aff, flags, chapter, route, bg, cast }
    listeners: {},

    /* ---------------- 数据访问 ---------------- */

    data() { return window.GAME_DATA; },
    nodes() { return this.data()[this.state.seg]; },
    node(i) { return this.nodes()[i]; },
    current() { return this.node(this.state.idx); },
    chars() { return this.data().meta.chars; },
    res() { return window.RES; },

    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); },
    emit(ev, ...a) { (this.listeners[ev] || []).forEach(fn => fn(...a)); },

    /* ---------------- 全局存储 ---------------- */

    getSaves() {
      const out = [];
      for (let i = 0; i <= 3; i++) {
        const raw = LS.get(K.save(i));
        out.push(raw ? JSON.parse(raw) : null);
      }
      return out; // [自动, 槽1, 槽2, 槽3]
    },

    saveGame(slot) {
      const s = this.state;
      const cur = this.current();
      const data = {
        seg: s.seg, idx: s.idx, aff: s.aff, flags: s.flags,
        chapter: s.chapter, route: s.route, bg: s.bg, cast: s.cast,
        dataVersion: 2,
        preview: cur ? (cur.x || cur.title || '').slice(0, 30) : '',
        time: Date.now(),
      };
      LS.set(K.save(slot), JSON.stringify(data));
      this.emit('saved', slot, data);
    },

    loadGame(slot) {
      const raw = LS.get(K.save(slot));
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (d.seg?.startsWith('swim_') && !this.bonusUnlocked(d.seg)) return false;
      let idx = d.idx;
      if (!d.dataVersion && d.preview) {
        const nodes = this.data()[d.seg] || [];
        const matches = [];
        nodes.forEach((n, i) => {
          const preview = (n.x || n.title || '').slice(0, 30);
          if (preview === d.preview || (d.preview.startsWith('第六章：') && n.title?.startsWith('第六章：'))) matches.push(i);
        });
        if (matches.length) idx = matches.reduce((a, b) => Math.abs(a - d.idx) <= Math.abs(b - d.idx) ? a : b);
      } else if (!d.dataVersion && !d.preview) {
        // 旧版选项节点没有预览文字，按选项顺序迁移存档位置。
        const oldChoices = {
          main: [89, 101, 136, 173, 197, 211, 323, 355, 442, 512, 564, 616, 687, 707, 813, 846],
          true: [75],
        }[d.seg] || [];
        const order = oldChoices.indexOf(d.idx);
        if (order >= 0) idx = (this.data()[d.seg] || []).map((n, i) => n.t === 'c' ? i : -1).filter(i => i >= 0)[order] ?? idx;
      }
      let cast = Array.isArray(d.cast) ? d.cast : null;
      if (!Array.isArray(d.cast)) {
        const nodes = this.data()[d.seg] || [];
        for (let i = idx - 1; i >= 0; i--) {
          const n = nodes[i];
          if (n.t === 'cast') { cast = n.ids; break; }
          if (n.t === 'ch' || n.t === 'rt' || n.t === 'bg') break;
        }
      }
      this.state = {
        seg: d.seg, idx,
        aff: d.aff || {}, flags: d.flags || {},
        chapter: d.chapter || '', route: d.route || null, bg: d.bg || null,
        cast,
      };
      return true;
    },

    deleteSave(slot) { LS.del(K.save(slot)); },

    getEndings() {
      try { return JSON.parse(LS.get(K.endings) || '{}'); } catch (e) { return {}; }
    },

    recordEnding(e) {
      const all = this.getEndings();
      all[`${e.kind}${e.line}`] = e.title;
      LS.set(K.endings, JSON.stringify(all));
      this.emit('ending', e);
    },

    // TRUE 线解锁：四位女主 GOOD END 全达成
    trueUnlocked() {
      const e = this.getEndings();
      return ['A', 'B', 'C', 'D'].every(l => e['GOOD' + l]);
    },

    bonusUnlocked(seg) {
      const chapter = (window.SWIMSUIT_CHAPTERS || []).find(c => c.seg === seg);
      return !!(chapter && this.getEndings()[chapter.unlock]);
    },

    // 追加日常解锁：任一 TRUE END 达成
    extraUnlocked() {
      const e = this.getEndings();
      return false;
    },

    getSeen() {
      try { return JSON.parse(LS.get(K.seen) || '{}'); } catch (e) { return {}; }
    },

    markSeen(key) {
      const seen = this.getSeen();
      seen[key] = 1;
      LS.set(K.seen, JSON.stringify(seen));
    },

    isSeen(node) {
      if (node.t !== 'n' && node.t !== 'd') return false;
      const key = node.t + ':' + (node.w ? node.w + '|' : '') + node.x;
      return !!this.getSeen()[key];
    },

    getCfg() {
      const def = { speed: 30, auto: 1800, rain: false, vol: 0.35, motion: true };
      try { return Object.assign(def, JSON.parse(LS.get(K.cfg) || '{}')); } catch (e) { return def; }
    },

    setCfg(patch) {
      const cfg = Object.assign(this.getCfg(), patch);
      LS.set(K.cfg, JSON.stringify(cfg));
      this.emit('cfg', cfg);
      return cfg;
    },

    /* ---------------- 流程控制 ---------------- */

    start(seg, idx) {
      if (seg?.startsWith('swim_') && !this.bonusUnlocked(seg)) return null;
      this.state = {
        seg: seg || 'main', idx: idx || 0,
        aff: { misaki: 0, reina: 0, himari: 0, noa: 0 },
        flags: {}, chapter: '', route: null, bg: null, cast: null,
      };
      return this.seek();
    },

    // 消耗静默节点（跳转/好感/FLAG/背景），停在实际展示节点前
    seek() {
      const nodes = this.nodes();
      let guard = 100000;
      while (this.state.idx < nodes.length && guard-- > 0) {
        const n = nodes[this.state.idx];
        if (n.t === 'g') { this.state.idx = n.i; continue; }
        if (n.t === 'a') {
          this.state.aff[n.w] = (this.state.aff[n.w] || 0) + n.v;
          this.emit('aff', n);
          this.state.idx++; continue;
        }
        if (n.t === 'f') {
          this.state.flags[n.id] = 1;
          this.state.idx++; continue;
        }
        if (n.t === 'bg') {
          this.state.bg = n.id;
          this.state.cast = null;
          this.state.idx++;
          this.emit('cast', null);
          this.emit('bg', n.id);
          continue;
        }
        if (n.t === 'cast') {
          this.state.cast = n.ids;
          this.state.idx++;
          this.emit('cast', n.ids);
          continue;
        }
        if (n.t === 'ch' || n.t === 'rt') {
          this.state.cast = null;
          if (n.bg) this.state.bg = n.bg;
        }
        return n;
      }
      return null; // 段结束 → 回标题
    },

    // 当前展示节点已展示完毕
    advance() {
      const n = this.current();
      if (!n) return null;
      if (n.t === 'ch' || n.t === 'rt') {
        this.state.chapter = n.title;
        // 自动存档打点：章节/路线卡
        // 独立番外不覆盖主线的自动存档。
        if (!this.state.seg.startsWith('swim_')) this.saveGame(0);
      }
      if (n.t === 'n' || n.t === 'd') this.markSeen(n.t + ':' + (n.w ? n.w + '|' : '') + n.x);
      this.state.idx++;
      return this.seek();
    },

    // 处理选择
    choose(optIdx) {
      const n = this.current();
      if (!n || n.t !== 'c') return null;
      const o = n.o[optIdx];
      if (!o) return null;
      if (o.seg) {
        this.state.seg = o.seg;
        this.state.idx = o.i || 0;
        this.state.route = o.seg;
        this.state.cast = null;
        this.state.bg = null;
      } else if (o.na && o.ifail != null) {
        // 此前关系尚未建立时，坦白会停在普通结局。
        const aff = this.state.aff[o.na.w] || 0;
        this.state.idx = aff >= o.na.v ? o.i : o.ifail;
      } else {
        this.state.idx = o.i != null ? o.i : this.state.idx + 1;
      }
      return this.seek();
    },

    // 结局节点处理（返回结局对象，UI 负责展示）
    hitEnding() {
      const n = this.current();
      if (!n || n.t !== 'e') return null;
      this.recordEnding(n);
      return n;
    },

    // 追加日常的章节列表（extra 段内 ch 节点索引）
    extraChapters() {
      const out = [];
      (this.data().extra || []).forEach((n, i) => { if (n.t === 'ch') out.push({ idx: i, title: n.title }); });
      return out;
    },

    // 统计信息（鉴赏用）
    stats() {
      const e = this.getEndings();
      const total = 15;
      return { endings: Object.keys(e).length, total };
    },
  };

  window.VN = { Engine, K };
})();
