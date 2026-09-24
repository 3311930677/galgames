/* ============================================================
 * 《在雨停之前》UI 层
 * 职责：DOM 渲染、打字机、选项、立绘/背景、面板、雨声
 * 依赖：engine.js（VN.Engine）、resources.js（RES）、data.js（GAME_DATA）
 * ============================================================ */
(function () {

  const E = VN.Engine;
  const $ = s => document.querySelector(s);

  const UI = {

    els: {},
    typing: { timer: null, full: '', done: true, pages: [], pageIndex: 0, isSys: false },
    auto: false,
    skip: false,
    skipTimer: null,
    history: [],
    onstage: [],            // [{id, ok}]
    allowedCast: null,
    bgSlot: 0,
    chapterTimer: null,
    autoTimer: null,
    pendingChoice: null,

    /* ================= 初始化 ================= */

    init() {
      const id = s => document.getElementById(s);
      this.els = {
        title: id('screen-title'), game: id('screen-game'),
        bgA: document.querySelector('.bg-a'), bgB: document.querySelector('.bg-b'),
        bgName: document.querySelector('.bg-name'),
        charLayer: id('char-layer'),
        charL: document.querySelector('.char-left'), charR: document.querySelector('.char-right'),
        textBox: id('text-box'), tbName: document.querySelector('.tb-name'),
        tbText: document.querySelector('.tb-text'), tbContent: document.querySelector('.tb-content'),
        tbCaret: document.querySelector('.tb-caret'), tbNext: document.querySelector('.tb-next'),
        tbPage: id('tb-page'),
        choice: id('choice-menu'),
        chapterCard: id('chapter-card'),
        endingCard: id('ending-card'),
        sysBar: id('sys-bar'),
        catcher: id('click-catcher'),
        overlay: id('overlay'), ovTitle: document.querySelector('.ov-title'), ovBody: document.querySelector('.ov-body'),
        rainCanvas: id('rain-canvas'),
        endingCount: id('ending-count'),
      };

      // 引擎事件
      E.on('bg', bg => this.setBg(bg));
      E.on('cast', ids => this.setCast(ids));
      E.on('ending', () => this.refreshTitle());

      // 标题画面
      this.els.title.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => this.onTitleAct(btn.dataset.act));
      });

      // 游戏画面交互
      this.els.catcher.addEventListener('click', () => this.onTap());
      this.els.textBox.addEventListener('click', () => this.onTap());
      this.els.chapterCard.addEventListener('click', () => this.dismissChapter());
      this.els.endingCard.addEventListener('click', () => this.showTitle());

      this.els.sysBar.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', ev => { ev.stopPropagation(); this.onSysAct(btn.dataset.sys, btn); });
      });
      this.els.overlay.querySelector('.ov-close').addEventListener('click', ev => {
        ev.stopPropagation();
        this.closeOverlay();
      });
      this.els.overlay.addEventListener('click', ev => {
        if (ev.target === this.els.overlay) this.closeOverlay();
      });

      // 键盘
      document.addEventListener('keydown', ev => {
        if (ev.key === 'Escape' && !this.els.overlay.classList.contains('hidden')) {
          ev.preventDefault(); this.closeOverlay(); return;
        }
        if (this.els.title.classList.contains('active')) return;
        if (ev.key === 'Escape') { if (this.dialogueHidden) this.setDialogueHidden(false); return; }
        if (ev.key === 'Control') { this.setSkip(true); return; }
        if (!this.els.overlay.classList.contains('hidden')) return;
        if (ev.key.toLowerCase() === 'h' && !ev.repeat) { ev.preventDefault(); this.toggleDialogue(); return; }
        if (ev.key === 'ArrowRight') { ev.preventDefault(); this.onTap(); return; }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); this.previousTextPage(); return; }
        if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); this.onTap(); }
      });
      document.addEventListener('keyup', ev => {
        if (ev.key === 'Control') this.setSkip(false);
      });

      // 标题主视觉
      this.loadTitleVisual();

      // 雨
      this.rainFx = new RainFx(this.els.rainCanvas);
      const cfg = E.getCfg();
      this.rainAudio = new RainAudio();
      if (cfg.rain) this.rainAudio.start(cfg.vol);

      this.refreshTitle();
      this.showTitle();
    },

    /* ================= 标题画面 ================= */

    showTitle() {
      clearInterval(this.chapterTimer);
      clearTimeout(this.autoTimer);
      this.auto = false; this.setSkip(false);
      this.setDialogueHidden(false);
      this.updateSysBar();
      this.els.game.classList.remove('active');
      this.els.title.classList.add('active');
      this.els.overlay.classList.add('hidden');
      this.els.endingCard.classList.remove('show');
      this.hideChars();
      this.rainFx.start();
      this.refreshTitle();
    },

    refreshTitle() {
      const cont = this.els.title.querySelector('[data-act="continue"]');
      const hasAuto = !!(E.getSaves()[0]);
      cont.classList.toggle('locked', !hasAuto);
      cont.disabled = !hasAuto;

      const t = this.els.title.querySelector('.true-entry');
      const x = this.els.title.querySelector('.extra-entry');
      t.classList.toggle('hidden', !E.trueUnlocked());
      if (x) x.classList.toggle('hidden', !E.extraUnlocked());

      const st = E.stats();
      this.els.endingCount.textContent = `已解锁结局 ${st.endings} / ${st.total}`;
    },

    loadTitleVisual() {
      const el = this.els.title.querySelector('.title-visual');
      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url("${RES.title.main}")`;
        el.classList.add('has-img');
      };
      img.src = RES.title.main;
    },

    onTitleAct(act) {
      switch (act) {
        case 'new': this.startGame('main', 0); break;
        case 'continue': if (E.loadGame(0)) this.enterGame(); break;
        case 'load': this.openSaveLoad('load'); break;
        case 'gallery': this.openGallery(); break;
        case 'settings': this.openSettings(); break;
        case 'true': this.startGame('true', 0); break;
        case 'extra': this.openExtraMenu(); break;
      }
    },

    /* ================= 游戏流程 ================= */

    startGame(seg, idx) {
      if (!E.start(seg, idx)) return;
      this.enterGame();
    },

    enterGame() {
      this.history = [];
      this.auto = false; this.setSkip(false);
      this.setDialogueHidden(false);
      this.updateSysBar();
      this.els.title.classList.remove('active');
      this.els.game.classList.add('active');
      this.rainFx.stop();
      this.hideChars();
      const current = E.current();
      // 文本或选项节点没有场景信息，读取存档时使用保存的背景。
      if (E.state.bg && !(current && (current.t === 'ch' || current.t === 'rt') && current.bg)) {
        this.setBg(E.state.bg);
      }
      this.setCast(E.state.cast);
      this.renderNode(current);
    },

    renderNode(n) {
      // 清理上一个节点状态
      clearTimeout(this.autoTimer);
      this.hideChoice();

      if (!n) { this.showTitle(); return; }  // 段结束 → 回标题

      // SKIP 快速路径：已读的文本节点直接跳
      if (this.skip && E.isSeen(n)) {
        if (n.t === 'n' || n.t === 'd') {
          this.pushHistory(n);
          const next = E.advance();
          this.skipTimer = setTimeout(() => this.renderNode(next), 40);
          return;
        }
        this.setSkip(false);
      }

      switch (n.t) {
        case 'ch': this.showChapter(n, false); break;
        case 'rt': this.showChapter(n, true); break;
        case 'n': case 'd': this.showText(n); break;
        case 's': this.showSystem(n); break;
        case 'c': this.showChoice(n); break;
        case 'e': this.showEnding(n); break;
        default:
          // 未知类型，跳过
          this.renderNode(E.advance());
      }
    },

    /* ---------------- 文本显示 ---------------- */

    showText(n) {
      if (n.w) {
        const c = E.chars()[n.w];
        this.els.tbName.textContent = n.w;
        this.els.tbName.style.color = c ? c.color : '#d8d4c8';
        this.els.textBox.classList.remove('no-speaker');
        // 立绘调度
        const cid = c && c.sprite && RES.char[c.id];
        if (cid) this.showChar(c.id, n.x);
      } else {
        this.els.tbName.textContent = '';
        this.els.textBox.classList.add('no-speaker');
      }
      this.els.textBox.classList.remove('hidden', 'sys');
      this.showContent(n.x, false);
      this.pushHistory(n);
    },

    showSystem(n) {
      this.els.tbName.textContent = '';
      this.els.textBox.classList.remove('hidden');
      this.els.textBox.classList.add('no-speaker', 'sys');
      this.showContent(n.x, true);
      this.pushHistory(n);
    },

    showContent(text, isSys) {
      this.typing.pages = this.paginateText(text);
      this.typing.pageIndex = 0;
      this.typing.isSys = isSys;
      this.showDialoguePage(0);
    },

    paginateText(text) {
      const content = this.els.tbContent;
      const area = this.els.tbText;
      const caret = this.els.tbCaret;
      const original = content.textContent;
      const originalCaretDisplay = caret.style.display;
      caret.style.display = 'inline';
      const chars = Array.from(text);
      const maxHeight = parseFloat(getComputedStyle(area).maxHeight);
      const pages = [];
      let rest = chars;

      while (rest.length) {
        content.textContent = rest.join('');
        if (area.scrollHeight <= maxHeight + 1) {
          pages.push(rest.join(''));
          break;
        }

        let low = 1, high = rest.length, best = 0;
        while (low <= high) {
          const mid = (low + high) >> 1;
          // Measure a prefix in the actual text box so wrapping matches the page.
          content.textContent = rest.slice(0, mid).join('');
          if (area.scrollHeight <= maxHeight + 1) { best = mid; low = mid + 1; }
          else high = mid - 1;
        }
        if (!best) best = 1;

        const minBreak = Math.max(1, Math.floor(best * 0.55));
        let paragraph = 0, sentence = 0, line = 0, clause = 0;
        for (let i = best; i >= minBreak; i--) {
          const end = rest[i - 1];
          const before = rest[i - 2];
          if (!paragraph && end === '\n' && before === '\n') paragraph = i;
          else if (!sentence && /[。！？!?；;]/.test(end)) sentence = i;
          else if (!line && end === '\n') line = i;
          else if (!clause && /[，,、]/.test(end)) clause = i;
        }
        const split = paragraph || sentence || line || clause || best;
        pages.push(rest.slice(0, split).join(''));
        rest = rest.slice(split);
      }

      content.textContent = original;
      caret.style.display = originalCaretDisplay;
      return pages.length ? pages : [''];
    },

    showDialoguePage(index, instant = false) {
      clearTimeout(this.autoTimer);
      clearTimeout(this.typing.timer);
      this.typing.pageIndex = index;
      this.typing.full = this.typing.pages[index] || '';
      const chars = Array.from(this.typing.full);
      const cfg = E.getCfg();
      const speed = cfg.speed;
      this.typing.done = instant || speed <= 0;
      this.els.tbNext.style.opacity = this.typing.done ? '1' : '0';
      this.els.tbCaret.style.display = this.typing.done ? 'none' : 'inline';
      this.els.tbPage.textContent = this.typing.pages.length > 1
        ? `${index + 1} / ${this.typing.pages.length}　← → 翻页`
        : '';

      if (this.typing.done) {
        this.els.tbContent.textContent = this.typing.full;
        if (this.auto) {
          this.autoTimer = setTimeout(() => this.onTap(), cfg.auto);
        }
        return;
      }

      let i = 0;
      const tick = () => {
        i++;
        this.els.tbContent.textContent = chars.slice(0, i).join('');
        if (i >= chars.length) { this.finishTyping(); return; }
        this.typing.timer = setTimeout(tick, speed);
      };
      this.els.tbContent.textContent = '';
      tick();
    },

    previousTextPage() {
      if (!this.els.game.classList.contains('active') || this.pendingChoice) return;
      if (this.typing.pageIndex > 0) this.showDialoguePage(this.typing.pageIndex - 1, true);
    },

    finishTyping() {
      clearTimeout(this.typing.timer);
      this.els.tbContent.textContent = this.typing.full;
      this.typing.done = true;
      this.els.tbCaret.style.display = 'none';
      this.els.tbNext.style.opacity = '1';
      // AUTO 模式
      if (this.auto) {
        const cfg = E.getCfg();
        this.autoTimer = setTimeout(() => this.onTap(), cfg.auto);
      }
    },

    onTap() {
      if (!this.els.game.classList.contains('active')) return;
      if (this.dialogueHidden) { this.setDialogueHidden(false); return; }
      if (this.pendingChoice) return;   // 选项显示中：禁止推进，必须点选项
      if (!this.typing.done && !this.els.textBox.classList.contains('hidden')) {
        this.finishTyping();
        return;
      }
      if (this.typing.pageIndex < this.typing.pages.length - 1) {
        this.showDialoguePage(this.typing.pageIndex + 1);
        return;
      }
      this.advance();
    },

    advance() {
      clearTimeout(this.autoTimer);
      const next = E.advance();
      this.renderNode(next);
    },

    /* ---------------- 章节/路线卡 ---------------- */

    showChapter(n, isRoute) {
      this.hideChars();
      this.els.textBox.classList.add('hidden');
      const card = this.els.chapterCard;
      card.querySelector('.cc-label').textContent = isRoute ? 'ROUTE' : 'CHAPTER';
      card.querySelector('.cc-title').textContent = n.title;
      card.classList.add('show');
      card.classList.toggle('route', !!isRoute);
      // 背景随章节切（ch 节点带 bg）
      if (n.bg) this.setBg(n.bg);
      clearInterval(this.chapterTimer);
      this.chapterTimer = setTimeout(() => this.dismissChapter(), isRoute ? 3200 : 2600);
    },

    dismissChapter() {
      const card = this.els.chapterCard;
      if (!card.classList.contains('show')) return;
      clearInterval(this.chapterTimer);
      card.classList.remove('show');
      this.renderNode(E.advance());
    },

    /* ---------------- 选项 ---------------- */

    showChoice(n) {
      this.pendingChoice = n;
      this.els.textBox.classList.add('hidden');
      const menu = this.els.choice;
      menu.innerHTML = '';
      n.o.forEach((o, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice-item';
        btn.textContent = o.x;
        btn.addEventListener('click', ev => {
          ev.stopPropagation();
          this.chooseOpt(i);
        });
        menu.appendChild(btn);
      });
      menu.classList.remove('hidden');
    },

    hideChoice() { this.els.choice.classList.add('hidden'); },

    chooseOpt(i) {
      const next = E.choose(i);
      this.pendingChoice = null;
      this.hideChoice();
      this.renderNode(next);
    },

    /* ---------------- 结局 ---------------- */

    showEnding(n) {
      const end = E.hitEnding();
      if (!end) return;
      this.hideChars();
      this.els.textBox.classList.add('hidden');
      const card = this.els.endingCard;
      const kindName = { GOOD: 'GOOD END', NORMAL: 'NORMAL END', BAD: 'BAD END', TRUE: 'TRUE END' }[end.kind] || 'END';
      card.querySelector('.ec-kind').textContent = kindName;
      card.querySelector('.ec-title').textContent = `《${end.title}》`;
      card.classList.add('show');
      this.rainFx.start();
    },

    /* ---------------- 背景 ---------------- */

    setBg(id) {
      const conf = RES.bg[id];
      if (!conf) return;
      this.els.bgName.textContent = conf.name;

      const next = this.bgSlot === 0 ? this.els.bgB : this.els.bgA;
      const cur = this.bgSlot === 0 ? this.els.bgA : this.els.bgB;
      this.bgSlot = 1 - this.bgSlot;

      const motion = !conf.portrait && conf.file?.startsWith('assets/cg/') && E.getCfg().motion;
      next.className = 'bg-slot ' + (this.bgSlot === 1 ? 'bg-b' : 'bg-a') + ' bg-fade-in' + (motion ? ' motion-cg' : '') + (conf.portrait ? ' portrait-cg' : '');
      cur.classList.remove('bg-fade-in', 'motion-cg');

      // 尝试图片，失败回退渐变
      if (conf.file) {
        const img = new Image();
        // 同一槽位可能在前一张图加载完之前再次被使用。
        const request = (next.dataset.bgRequest = String((Number(next.dataset.bgRequest) || 0) + 1));
        img.onload = () => {
          if (next.dataset.bgRequest !== request) return;
          next.style.backgroundImage = `url("${conf.file}")`;
          next.style.setProperty('--cg-image', `url("${new URL(conf.file, document.baseURI).href}")`);
          next.classList.remove('bg-placeholder');
        };
        img.onerror = () => { if (next.dataset.bgRequest === request) this.applyBgTint(next, conf); };
        this.applyBgTint(next, conf); // 先显示渐变，图到了再覆盖
        img.src = conf.file;
      } else {
        next.dataset.bgRequest = String((Number(next.dataset.bgRequest) || 0) + 1);
        this.applyBgTint(next, conf);
      }
    },

    applyBgTint(el, conf) {
      el.style.backgroundImage = 'none';
      el.style.removeProperty('--cg-image');
      el.style.setProperty('--t0', conf.tint[0]);
      el.style.setProperty('--t1', conf.tint[1]);
      el.style.setProperty('--t2', conf.tint[2]);
      el.classList.add('bg-placeholder');
    },

    /* ---------------- 立绘 ---------------- */

    setCast(ids) {
      this.hideChars();
      this.allowedCast = Array.isArray(ids) ? new Set(ids) : null;
    },

    showChar(charId, line) {
      if (this.allowedCast && !this.allowedCast.has(charId)) return;
      const conf = RES.char[charId];
      const variant = Object.values(conf.expr || {}).find(e => e.lines.includes(line));
      const file = variant ? variant.file : conf.img;
      const idx = this.onstage.findIndex(s => s.id === charId);
      if (idx >= 0) {
        // 已在台上 → 移到末尾（最新说话）
        const entry = this.onstage.splice(idx, 1)[0];
        entry.file = file;
        this.onstage.push(entry);
      } else {
        this.onstage.push({ id: charId, file });
        if (this.onstage.length > 2) this.onstage.shift();
      }
      this.layoutChars();
    },

    layoutChars() {
      const slots = [this.els.charL, this.els.charR];
      const activeId = this.onstage.length ? this.onstage[this.onstage.length - 1].id : null;

      // 单人固定在左侧；双人分别显示在左右两侧。
      this.els.charLayer.classList.toggle('solo', this.onstage.length === 1);
      this.els.charLayer.classList.toggle('duo', this.onstage.length === 2);
      const order = this.onstage;

      slots.forEach((slot, i) => {
        const entry = order[i];
        if (!entry) { slot.classList.remove('visible', 'active'); return; }
        const { id, file } = entry;
        const conf = RES.char[id];
        const img = slot.querySelector('img');
        if (slot.dataset.charId !== id || slot.dataset.spriteFile !== file) {
          const sameCharReady = slot.dataset.charId === id && slot.dataset.imgOk === '1';
          slot.dataset.charId = id;
          slot.dataset.imgOk = sameCharReady ? '1' : '';
          const loadSprite = src => {
            slot.dataset.spriteFile = src;
            img.onerror = () => {
              if (slot.dataset.spriteFile !== src) return;
              if (src !== conf.img) {
                entry.file = conf.img;
                loadSprite(conf.img);
              } else {
                slot.dataset.imgOk = '0';
                slot.classList.remove('visible', 'active');
              }
            };
            img.onload = () => {
              if (slot.dataset.spriteFile !== src) return;
              slot.dataset.imgOk = '1';
              this.layoutChars();
            };
            img.src = src;
          };
          loadSprite(file);
        }
        const ok = slot.dataset.imgOk === '1';
        slot.classList.toggle('visible', ok);
        slot.classList.toggle('active', ok && id === activeId);
        slot.style.setProperty('--char-color', conf.color);
      });
    },

    hideChars() {
      this.onstage = [];
      this.allowedCast = null;
      this.els.charLayer.classList.remove('solo', 'duo');
      [this.els.charL, this.els.charR].forEach(s => {
        s.classList.remove('visible', 'active');
        s.dataset.charId = '';
        s.dataset.spriteFile = '';
        s.dataset.imgOk = '';
        s.querySelector('img').removeAttribute('src');
      });
    },

    /* ---------------- 历史记录 ---------------- */

    pushHistory(n) {
      if (n.t !== 'n' && n.t !== 'd' && n.t !== 's') return;
      this.history.push({ w: n.w || null, x: n.x });
      if (this.history.length > 400) this.history.shift();
    },

    /* ================= 系统栏 ================= */

    onSysAct(act, btn) {
      switch (act) {
        case 'dialogue': this.toggleDialogue(); break;
        case 'menu': this.openGameMenu(); break;
        case 'auto':
          this.auto = !this.auto;
          this.updateSysBar();
          if (this.auto && this.typing.done) {
            const cfg = E.getCfg();
            this.autoTimer = setTimeout(() => this.onTap(), Math.min(cfg.auto, 800));
          }
          break;
        case 'skip': this.setSkip(!this.skip); break;
        case 'log': this.openHistoryPanel(); break;
        case 'save': this.openSaveLoad('save'); break;
        case 'load': this.openSaveLoad('load'); break;
      }
    },

    updateSysBar() {
      this.els.sysBar.querySelector('[data-sys="auto"]').classList.toggle('on', this.auto);
      this.els.sysBar.querySelector('[data-sys="skip"]').classList.toggle('on', this.skip);
    },

    toggleDialogue() {
      if (!this.dialogueHidden && this.els.textBox.classList.contains('hidden')) return;
      this.setDialogueHidden(!this.dialogueHidden);
    },

    setDialogueHidden(hidden) {
      this.dialogueHidden = !!hidden;
      if (hidden) {
        clearTimeout(this.autoTimer);
        this.auto = false;
        this.setSkip(false);
      }
      this.els.game.classList.toggle('dialogue-hidden', this.dialogueHidden);
      const button = this.els.sysBar.querySelector('[data-sys="dialogue"]');
      button.textContent = this.dialogueHidden ? '文字' : '看图';
      button.title = this.dialogueHidden ? '显示对话框（H）' : '隐藏对话框，欣赏画面（H）';
      button.setAttribute('aria-pressed', String(this.dialogueHidden));
      this.updateSysBar();
    },

    setSkip(v) {
      if (this.skip === v) return;
      this.skip = v;
      this.updateSysBar();
      if (v) {
        // 立即尝试快进当前节点
        const n = E.current();
        if (n && E.isSeen(n)) this.renderNode(n);
      }
    },

    /* ================= 覆盖面板 ================= */

    openPanel(title, bodyEl) {
      this.els.ovTitle.textContent = title;
      const body = this.els.ovBody;
      body.innerHTML = '';
      body.appendChild(bodyEl);
      this.els.overlay.classList.remove('hidden');
    },

    closeOverlay() { this.els.overlay.classList.add('hidden'); },

    openSaveLoad(mode) {
      const wrap = document.createElement('div');
      wrap.className = 'save-list';
      const saves = E.getSaves();
      saves.forEach((sv, i) => {
        const item = document.createElement('button');
        item.className = 'save-item';
        const slotName = i === 0 ? '自动存档' : `存档 ${i}`;
        if (sv) {
          const d = new Date(sv.time);
          item.innerHTML = `<span class="si-slot">${slotName}</span>
            <span class="si-chapter">${this.esc(sv.chapter) || '—'}</span>
            <span class="si-preview">${this.esc(sv.preview) || '…'}</span>
            <span class="si-time">${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</span>`;
        } else {
          item.innerHTML = `<span class="si-slot">${slotName}</span><span class="si-empty">── 空 ──</span>`;
        }
        item.addEventListener('click', () => {
          if (mode === 'save') {
            if (i === 0) return; // 自动槽不可手存
            if (sv && !confirm('覆盖这个存档？')) return;
            E.saveGame(i);
            this.closeOverlay();
          } else {
            if (!sv) return;
            if (E.loadGame(i)) { this.closeOverlay(); this.enterGame(); }
          }
        });
        wrap.appendChild(item);
      });
      const note = document.createElement('div');
      note.className = 'save-note';
      note.textContent = mode === 'save' ? '点击存档位保存（自动档由章节进度自动更新）' : '点击存档位读取';
      wrap.appendChild(note);
      this.openPanel(mode === 'save' ? '保存进度' : '读取进度', wrap);
    },

    openHistoryPanel() {
      const wrap = document.createElement('div');
      wrap.className = 'history-list';
      if (!this.history.length) {
        wrap.innerHTML = '<div class="his-empty">暂无记录</div>';
      }
      // 逆序显示（最新在上）
      [...this.history].reverse().forEach(h => {
        const row = document.createElement('div');
        row.className = 'his-row' + (h.w ? ' has-speaker' : '');
        if (h.w) {
          const c = E.chars()[h.w];
          row.innerHTML = `<span class="his-name" style="color:${c ? c.color : '#c8c4b8'}">${this.esc(h.w)}</span>`;
          const tx = document.createElement('span');
          tx.textContent = h.x;
          row.appendChild(tx);
        } else {
          const tx = document.createElement('span');
          tx.className = 'his-narr';
          tx.textContent = h.x;
          row.appendChild(tx);
        }
        wrap.appendChild(row);
      });
      this.openPanel('历史记录', wrap);
      wrap.scrollTop = wrap.scrollHeight;
    },

    openSettings() {
      const cfg = E.getCfg();
      const wrap = document.createElement('div');
      wrap.className = 'settings-panel';
      wrap.innerHTML = `
        <label class="st-row"><span>文字速度</span>
          <select data-k="speed">
            <option value="0">瞬间</option><option value="55">慢</option>
            <option value="30">普通</option><option value="15">快</option>
          </select>
        </label>
        <label class="st-row"><span>自动播放间隔</span>
          <select data-k="auto">
            <option value="3000">慢</option><option value="1800">普通</option>
            <option value="900">快</option>
          </select>
        </label>
        <label class="st-row"><span>动态 CG</span>
          <input type="checkbox" data-k="motion">
        </label>
        `;
      // 当前值
      wrap.querySelector('[data-k="speed"]').value = String(cfg.speed);
      wrap.querySelector('[data-k="auto"]').value = String(cfg.auto);
      wrap.querySelector('[data-k="motion"]').checked = !!cfg.motion;
      // 事件
      wrap.addEventListener('change', ev => {
        const k = ev.target.dataset.k;
        if (!k) return;
        let v;
        if (ev.target.type === 'checkbox') v = ev.target.checked;
        else if (ev.target.type === 'range') v = ev.target.value / 100;
        else v = Number(ev.target.value);
        E.setCfg({ [k]: v });
        if (k === 'motion') {
          const current = this.bgSlot === 1 ? this.els.bgA : this.els.bgB;
          current.classList.toggle('motion-cg', !!v && !!RES.bg[E.state?.bg]?.file?.startsWith('assets/cg/'));
        }
        if (k === 'rain') this.rainAudio.toggle(v ? E.getCfg().vol : 0);
        if (k === 'vol') this.rainAudio.setVol(v);
      });
      this.openPanel('设置', wrap);
    },

    openGallery() {
      const wrap = document.createElement('div');
      wrap.className = 'gallery-panel';
      // 结局鉴赏
      const endSec = document.createElement('div');
      endSec.className = 'gal-section';
      endSec.innerHTML = '<h3>结局 · 15</h3>';
      const endGrid = document.createElement('div');
      endGrid.className = 'end-grid';
      const got = E.getEndings();
      const endList = [
        { k: 'NORMAL00', n: '普通结局', cat: '共通' }, { k: 'NORMAL00-ALT', n: '另一种日常', cat: '共通' },
        { k: 'GOODA', n: '美咲 · GOOD', cat: 'A' }, { k: 'NORMALA', n: '美咲 · NORMAL', cat: 'A' }, { k: 'BADA', n: '美咲 · BAD', cat: 'A' },
        { k: 'GOODB', n: '玲奈 · GOOD', cat: 'B' }, { k: 'NORMALB', n: '玲奈 · NORMAL', cat: 'B' }, { k: 'BADB', n: '玲奈 · BAD', cat: 'B' },
        { k: 'GOODC', n: '阳葵 · GOOD', cat: 'C' }, { k: 'NORMALC', n: '阳葵 · NORMAL', cat: 'C' }, { k: 'BADC', n: '阳葵 · BAD', cat: 'C' },
        { k: 'GOODD', n: '乃爱 · GOOD', cat: 'D' }, { k: 'NORMALD', n: '乃爱 · NORMAL', cat: 'D' }, { k: 'BADD', n: '乃爱 · BAD', cat: 'D' },
        { k: 'TRUET', n: '隐藏篇章', cat: 'T' },
      ];
      endList.forEach(e => {
        const cell = document.createElement('div');
        const unlocked = got[e.k];
        cell.className = 'end-cell cat-' + e.cat + (unlocked ? ' got' : '');
        cell.innerHTML = unlocked
          ? `<span class="ec-name">${this.esc(unlocked)}</span><span class="ec-tag">${this.esc(e.n)}</span>`
          : `<span class="ec-name">？？？</span><span class="ec-tag">${this.esc(e.n)}</span>`;
        endGrid.appendChild(cell);
      });
      endSec.appendChild(endGrid);
      wrap.appendChild(endSec);

      // 角色鉴赏
      const charSec = document.createElement('div');
      charSec.className = 'gal-section';
      charSec.innerHTML = '<h3>登場人物</h3>';
      const charGrid = document.createElement('div');
      charGrid.className = 'char-grid';
      RES.title.gallery.forEach(g => {
        const conf = RES.char[g.char];
        const variant = Object.values(conf.expr || {})[0];
        const cell = document.createElement('div');
        cell.className = 'char-cell';
        const img = document.createElement('img');
        img.src = g.file; img.alt = conf.name; img.loading = 'lazy';
        img.onerror = () => { cell.classList.add('no-img'); };
        cell.appendChild(img);
        if (variant) {
          const toggle = document.createElement('button');
          toggle.className = 'char-expr-toggle';
          toggle.textContent = '表情差分';
          toggle.addEventListener('click', () => {
            const showingVariant = toggle.textContent === '表情差分';
            img.src = showingVariant ? variant.file : g.file;
            img.alt = showingVariant ? `${conf.name}·表情差分` : conf.name;
            toggle.textContent = showingVariant ? '原立绘' : '表情差分';
          });
          cell.appendChild(toggle);
        }
        cell.insertAdjacentHTML('beforeend', `<span class="cc-name" style="color:${conf.color}">${conf.name}</span>`);
        charGrid.appendChild(cell);
      });
      charSec.appendChild(charGrid);
      wrap.appendChild(charSec);

      const cgSec = document.createElement('div');
      cgSec.className = 'gal-section';
      cgSec.innerHTML = '<h3>剧情画面</h3>';
      const cgGrid = document.createElement('div');
      cgGrid.className = 'cg-grid';
      [
        ['GOODA', 'misaki_station', '站台的热可可'],
        ['GOODA', 'misaki_kitchen', '年末的橘子'],
        ['GOODA', 'misaki_park', '毕业前夜的约定'],
        ['GOODA', 'misaki_tokyo_date', '东京再会'],
        ['GOODA', 'misaki_bookshop', '旧书店的共同书架'],
        ['GOODA', 'misaki_festival', '灯笼下的约定'],
        ['GOODA', 'misaki_seaside_cafe', '海边的冰茶'],
        ['GOODA', 'misaki_balcony', '阳台上的明年'],
        ['GOODB', 'reina_library', '黄昏的资料室'],
        ['GOODB', 'reina_riverside', '河边的坦白'],
        ['GOODB', 'reina_diner', '两碗热汤面'],
        ['GOODB', 'reina_campus_date', '咖啡馆的散步约定'],
        ['GOODB', 'reina_archive', '档案室收工'],
        ['GOODB', 'reina_waterfront', '秋夜港边'],
        ['GOODB', 'reina_kitchen', '两人的晚饭'],
        ['GOODB', 'reina_gallery', '展览开幕'],
        ['GOODC', 'himari_riverside', '没有跑表的晚上'],
        ['GOODC', 'himari_track', '跑道的夕光'],
        ['GOODC', 'himari_aquarium', '水族馆的海龟'],
        ['GOODC', 'himari_relay_date', '接力赛后的牵手'],
        ['GOODC', 'himari_training', '训练后的最后一圈'],
        ['GOODC', 'himari_boardwalk', '海边留空的一天'],
        ['GOODC', 'himari_lab', '新的训练方向'],
        ['GOODC', 'himari_festival', '夜祭慢慢走'],
        ['GOODD', 'noa_museum', '冬夜的录音'],
        ['GOODD', 'noa_stars', '星图旁的约定'],
        ['GOODD', 'noa_rooftop', '寄出的信'],
        ['GOODD', 'noa_kyoto_date', '京都的夜路'],
        ['GOODD', 'noa_planetarium', '闭馆后的星象馆'],
        ['GOODD', 'noa_roof_night', '屋顶的星图'],
        ['GOODD', 'noa_river_festival', '河边灯会'],
        ['GOODD', 'noa_station_reunion', '站台再相见'],
      ].forEach(([key, id, title]) => {
        const cell = document.createElement('div');
        cell.className = 'cg-cell';
        if (got[key]) {
          const img = document.createElement('img');
          img.src = RES.bg[id].file;
          img.alt = title;
          img.loading = 'lazy';
          cell.appendChild(img);
          const label = document.createElement('span');
          label.textContent = title;
          cell.appendChild(label);
        } else cell.textContent = '？？？';
        cgGrid.appendChild(cell);
      });
      cgSec.appendChild(cgGrid);
      wrap.appendChild(cgSec);

      const bonusSec = document.createElement('div');
      bonusSec.className = 'gal-section';
      bonusSec.innerHTML = '<h3>夏日奖励章节</h3>';
      const bonusList = document.createElement('div');
      bonusList.className = 'swimsuit-panel';
      const note = document.createElement('p');
      note.className = 'swimsuit-note';
      note.textContent = '大学阶段番外 · 达成对应角色 GOOD END 后解锁';
      bonusList.appendChild(note);
      SWIMSUIT_CHAPTERS.forEach((chapter, i) => {
        const unlocked = E.bonusUnlocked(chapter.seg);
        const btn = document.createElement('button');
        btn.className = 'swimsuit-chapter' + (unlocked ? '' : ' locked');
        btn.type = 'button';
        btn.disabled = !unlocked;
        const cover = unlocked ? document.createElement('img') : document.createElement('span');
        if (unlocked) {
          cover.src = RES.bg[chapter.cover].file;
          cover.alt = '';
          cover.loading = 'lazy';
        } else {
          cover.className = 'swimsuit-cover-locked';
          cover.textContent = '◇';
        }
        const copy = document.createElement('span');
        copy.className = 'swimsuit-chapter-copy';
        const label = document.createElement('small');
        label.textContent = unlocked
          ? `夏日奖励 ${String(i + 1).padStart(2, '0')}　·　${chapter.count} 张画面`
          : `夏日奖励 ${String(i + 1).padStart(2, '0')}　·　未解锁`;
        const title = document.createElement('strong');
        title.textContent = chapter.name;
        const desc = document.createElement('span');
        desc.textContent = unlocked ? chapter.desc : `达成${chapter.name.split(' · ')[0]}的 GOOD END 后开放`;
        copy.append(label, title, desc);
        btn.append(cover, copy);
        if (unlocked) btn.addEventListener('click', () => {
          this.closeOverlay();
          this.startGame(chapter.seg, 0);
        });
        bonusList.appendChild(btn);
      });
      bonusSec.appendChild(bonusList);
      wrap.insertBefore(bonusSec, charSec);

      this.openPanel('鑑賞', wrap);
    },

    openExtraMenu() {
      const wrap = document.createElement('div');
      wrap.className = 'extra-panel';
      wrap.innerHTML = '<h3>追加日常 · 番外</h3>';
      const chapters = E.extraChapters();
      chapters.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'extra-item';
        btn.innerHTML = `<span class="ex-num">0${i + 1}</span><span class="ex-title">${this.esc(c.title.replace(/^追加共通日常\d+：?/, ''))}</span>`;
        btn.addEventListener('click', () => {
          this.closeOverlay();
          this.startGame('extra', c.idx);
        });
        wrap.appendChild(btn);
      });
      this.openPanel('追加日常', wrap);
    },

    openGameMenu() {
      const wrap = document.createElement('div');
      wrap.className = 'gmenu-panel';
      [
        { t: '返回标题', fn: () => { this.closeOverlay(); this.showTitle(); } },
        { t: '保存进度', fn: () => this.openSaveLoad('save') },
        { t: '读取进度', fn: () => this.openSaveLoad('load') },
        { t: '历史记录', fn: () => this.openHistoryPanel() },
        { t: '设置', fn: () => this.openSettings() },
      ].forEach(m => {
        const btn = document.createElement('button');
        btn.textContent = m.t;
        btn.addEventListener('click', m.fn);
        wrap.appendChild(btn);
      });
      this.openPanel('菜单', wrap);
    },

    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
  };

  /* ============================================================
   * 雨画面效果（标题画面 canvas 雨丝）
   * ============================================================ */
  class RainFx {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.drops = [];
      this.running = false;
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.resize();
      if (!this.drops.length) this.initDrops();
      this.loop();
    }
    stop() { this.running = false; }
    resize() {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
    }
    initDrops() {
      const n = Math.floor(this.canvas.width / 6);
      for (let i = 0; i < n; i++) {
        this.drops.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          l: 8 + Math.random() * 22,
          v: 5 + Math.random() * 9,
          o: 0.08 + Math.random() * 0.25,
        });
      }
    }
    loop() {
      if (!this.running) return;
      const c = this.ctx;
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      c.lineWidth = 1;
      for (const d of this.drops) {
        c.strokeStyle = `rgba(190, 210, 230, ${d.o})`;
        c.beginPath();
        c.moveTo(d.x, d.y);
        c.lineTo(d.x - d.l * 0.18, d.y + d.l);
        c.stroke();
        d.y += d.v;
        d.x -= d.v * 0.18;
        if (d.y > this.canvas.height) { d.y = -d.l; d.x = Math.random() * this.canvas.width; }
        if (d.x < -10) d.x = this.canvas.width + 10;
      }
      requestAnimationFrame(() => this.loop());
    }
  }

  /* ============================================================
   * 雨声（WebAudio 白噪合成，无需音频文件）
   * ============================================================ */
  class RainAudio {
    constructor() { this.ctx = null; this.gain = null; this.on = false; }
    start(vol) {
      try {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          const len = 2 * this.ctx.sampleRate;
          const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
          const ch = buf.getChannelData(0);
          // 粉噪近似（多次积分白噪，更像雨）
          let last = 0;
          for (let i = 0; i < len; i++) {
            const w = Math.random() * 2 - 1;
            last = last * 0.98 + w * 0.02;
            ch[i] = last * 8;
          }
          const src = this.ctx.createBufferSource();
          src.buffer = buf; src.loop = true;
          const lp = this.ctx.createBiquadFilter();
          lp.type = 'lowpass'; lp.frequency.value = 1200;
          this.gain = this.ctx.createGain();
          src.connect(lp); lp.connect(this.gain); this.gain.connect(this.ctx.destination);
          src.start();
        }
        this.ctx.resume();
        this.gain.gain.value = vol;
        this.on = true;
      } catch (e) { /* 无音频环境 */ }
    }
    setVol(v) { if (this.gain) this.gain.gain.value = v; }
    toggle(vol) {
      if (vol > 0) { this.start(vol); this.on = true; }
      else if (this.gain) { this.gain.gain.value = 0; this.on = false; }
    }
  }

  window.VN = window.VN || {};
  window.VN.UI = UI;
})();
