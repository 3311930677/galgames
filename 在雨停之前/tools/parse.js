#!/usr/bin/env node
/**
 * 《在雨停之前》剧本解析器
 * story/*.txt → js/data.js
 *
 * 剧本语法（由人工分析确定）：
 *   ====== 包围    ：章节标题（序章/第N章/A-x/TRUE-x/普通结局/追加共通日常xx）
 *   #### 包围      ：ROUTE 大标题（A/B/C/D ROUTE、TRUE ROUTE）
 *   【旁白】       ：旁白块开始，后续文本行归属旁白
 *   「角色」：文本  ：对话
 *   【场景】xxx    ：背景切换
 *   【登场】角色、角色：限定当前场景中可显示立绘的角色；【登场】无 清空立绘
 *   【选项XX】     ：选项组，后跟 A./B./… 或 1./2./… 选项行
 *   【路线分歧】   ：第六章 5 分歧（A-D 路线 + E 普通结局）
 *   【最终选择】   ：TRUE-6 的 5 分歧（TRUE-A~E）
 *   【分支X：名】  ：路线分歧响应块（X=A-D）
 *   【分支N】      ：数字选项响应块
 *   【分支A】      ：字母选项响应块
 *   【X1-1】       ：选项组 X1 的数字响应块
 *   【02-A】       ：选项组 02 的字母响应块
 *   【GOOD/NORMAL/BAD/TRUE END L：标题】：结局块/终点标记
 *   【好感】角色±N ：好感度变化
 *   【FLAG】xxx    ：旗标
 *   【系统】       ：系统消息块
 *   【开启条件】   ：解锁说明（解析时丢弃，逻辑硬编码于引擎）
 *
 * 用法：node tools/parse.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'story', '在雨停之前_Galgame完整多路线剧情脚本_一万字以上.txt');
const OUT = path.join(__dirname, '..', 'js', 'data.js');

/* ---------------- 配置 ---------------- */

// 角色表：id / 主题色 / 是否有立绘
const CHARS = {
  '林澈':   { id: 'rinche',  color: '#9fb8cf', sprite: false },
  '美咲':   { id: 'misaki',  color: '#e6a8c0', sprite: true  },
  '玲奈':   { id: 'reina',   color: '#8fa8d8', sprite: true  },
  '阳葵':   { id: 'himari',  color: '#e8b45c', sprite: true  },
  '乃爱':   { id: 'noa',     color: '#a8a0d8', sprite: true  },
  '遥':     { id: 'haruka',  color: '#8cc8c0', sprite: true  },
  '班长':   { id: 'ichiban', color: '#a8a8a8', sprite: false },
  '校长':   { id: 'kocho',   color: '#a8a8a8', sprite: false },
  '录音中的少女': { id: 'voice', color: '#98b8b0', sprite: false },
  '？？？': { id: 'unknown', color: '#a8a8a8', sprite: false },
  '玲奈母亲': { id: 'reina_m', color: '#a8a8a8', sprite: false },
  '干部':   { id: 'kanbu',  color: '#a8a8a8', sprite: false },
  '班主任': { id: 'tener',  color: '#a8a8a8', sprite: false },
  '医生':   { id: 'isha',   color: '#a8a8a8', sprite: false },
  '广播':   { id: 'hoso',   color: '#a8a8a8', sprite: false },
  '同学A':  { id: 'dosei',  color: '#a8a8a8', sprite: false },
};

// 好感角色中文名 → 内部 id
const AFF_WHO = { '美咲': 'misaki', '玲奈': 'reina', '阳葵': 'himari', '乃爱': 'noa' };
const CAST_WHO = { ...AFF_WHO, '遥': 'haruka' };

// 最终坦白需要此前建立足够的信任；不足时以普通结局收束。
const AFF_NEED = { A: 4, B: 4, C: 4, D: 3 };

// 章节默认背景（【场景】指令优先于此表）
const CHAPTER_BG = [
  [/^序章/,        'station'],
  [/^第一章/,      'classroom'],
  [/^第二章/,      'classroom'],
  [/^第三章/,      'rain_street'],
  [/^第四章/,      'corridor_night'],
  [/^第五章/,      'corridor_night'],
  [/^第六章/,      'room_night'],
  [/^普通结局/,    'room_night'],
  [/^A-1/,         'park_evening'],
  [/^A-2/,         'classroom'],
  [/^A-3/,         'classroom'],
  [/^A-4/,         'classroom'],
  [/^A-5/,         'festival'],
  [/^B-1/,         'student_council'],
  [/^B-2/,         'hospital_roof'],
  [/^B-3/,         'playground'],
  [/^B-4/,         'storage'],
  [/^B-5/,         'festival'],
  [/^C-1/,         'riverside'],
  [/^C-2/,         'hospital'],
  [/^C-3/,         'room'],
  [/^C-4/,         'playground'],
  [/^C-5/,         'playground'],
  [/^D-1/,         'observatory'],
  [/^D-2/,         'observatory'],
  [/^D-3/,         'room'],
  [/^D-4/,         'observatory'],
  [/^D-5/,         'room_night'],
  [/^D-6/,         'observatory'],
  [/^TRUE-1/,      'room_night'],
  [/^TRUE-2/,      'student_council'],
  [/^TRUE-3/,      'student_council'],
  [/^TRUE-4/,      'principal'],
  [/^TRUE-5/,      'festival'],
  [/^TRUE-6/,      'festival'],
  [/^TRUE-A/,      'station_year'],
  [/^TRUE-B/,      'street'],
  [/^TRUE-C/,      'playground'],
  [/^TRUE-D/,      'observatory'],
  [/^TRUE-E/,      'observatory'],
  [/^追加共通日常01/, 'student_council'],
  [/^追加共通日常02/, 'street'],
  [/^追加共通日常03/, 'sea'],
  [/^追加共通日常04/, 'playground'],
];

// 结局正文里的引导语前缀（"若选择B，"等），渲染前清除
const END_PREFIX_RE = /^(?:若选择[“"']?[^”"']?[”"']?，?|如果选择[“"']?[^”"']?[”"']?，?|若选择[“"']?.+?[”"']，)\s*/;

/* ---------------- Token 化 ---------------- */

const RE = {
  sep:   /^=+$/,
  hsep:  /^#{2,}$/,
  narr:  /^【旁白】$/,
  sys:   /^【系统】$/,
  scene: /^【场景】(.+)$/,
  cast:  /^【登场】(.*)$/,
  aff:   /^【好感】(.+?)([＋+]|[-－])(\d+)$/,
  flag:  /^【FLAG】(.+)$/,
  choiceOpt: /^【选项(.+?)】$/,
  routeDiv:  /^【路线分歧】$/,
  finalSel:  /^【最终选择】$/,
  routeBranch: /^【分支([A-E])：(.+?)】$/,
  letterBranch: /^【分支([A-E])】$/,
  numBranch:  /^【分支(\d+)】$/,
  subBlock:   /^【([A-Z][A-Z\d]*(?:-\d+)*?)-(\d+)】$/,
  letterBlock: /^【(\d+)-([A-E])】$/,
  endBlock:   /^【((?:GOOD|NORMAL|BAD|TRUE)\s*END)\s*([A-Z0-9]*)：(.+?)】$/,
  condMark:   /^【开启条件】$/,
  dlg:   /^「(.+?)」：(.*)$/,
  optL:  /^([A-E])[\.、]\s*(.+)$/,
  optN:  /^(\d)[\.、]\s*(.+)$/,
};

function tokenize(raw) {
  const lines = raw.split(/\r?\n/);
  const tokens = [];
  const unknown = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const t = line.trim();

    if (t === '') { tokens.push({ type: 'blank', ln }); continue; }

    // ====== 章节标题（三行结构：sep / title / sep）
    if (RE.sep.test(t)) {
      if (i + 2 < lines.length && lines[i + 1].trim() !== '' && RE.sep.test(lines[i + 2].trim())) {
        tokens.push({ type: 'chapter', title: lines[i + 1].trim(), ln });
        i += 2;
      }
      continue;
    }
    // #### ROUTE 标题
    if (RE.hsep.test(t)) {
      if (i + 2 < lines.length && lines[i + 1].trim() !== '' && RE.hsep.test(lines[i + 2].trim())) {
        tokens.push({ type: 'routeTitle', title: lines[i + 1].trim(), ln });
        i += 2;
      }
      continue;
    }

    if (RE.narr.test(t))   { tokens.push({ type: 'narr', ln }); continue; }
    if (RE.sys.test(t))    { tokens.push({ type: 'sysMark', ln }); continue; }
    if (RE.condMark.test(t)) { tokens.push({ type: 'condMark', ln }); continue; }

    let m = t.match(RE.dlg);
    if (m) { tokens.push({ type: 'dlg', who: m[1], x: m[2], ln }); continue; }

    m = t.match(RE.scene);
    if (m) { tokens.push({ type: 'scene', x: m[1], ln }); continue; }

    m = t.match(RE.cast);
    if (m) {
      const names = m[1].split(/[、，,\s]+/).filter(Boolean);
      tokens.push({ type: 'cast', ids: names.map(name => CAST_WHO[name]).filter(Boolean), ln });
      continue;
    }

    m = t.match(RE.aff);
    if (m) { tokens.push({ type: 'aff', who: m[1], v: ('＋'.includes(m[2]) || m[2] === '+' ? 1 : -1) * parseInt(m[3], 10), ln }); continue; }

    m = t.match(RE.flag);
    if (m) { tokens.push({ type: 'flag', id: m[1], ln }); continue; }

    m = t.match(RE.routeDiv);
    if (m) { tokens.push({ type: 'choice', id: 'ROUTE_DIV', kind: 'letter', ln }); continue; }

    m = t.match(RE.finalSel);
    if (m) { tokens.push({ type: 'choice', id: 'TRUE_FINAL', kind: 'trueLetter', ln }); continue; }

    m = t.match(RE.choiceOpt);
    if (m) {
      const id = m[1];
      const isFinal = /FINAL/.test(id);
      tokens.push({ type: 'choice', id, kind: isFinal ? 'final' : 'num', ln });
      continue;
    }

    m = t.match(RE.routeBranch);
    if (m) { tokens.push({ type: 'routeBranch', letter: m[1], name: m[2], ln }); continue; }

    m = t.match(RE.letterBranch);
    if (m) { tokens.push({ type: 'letterBranch', letter: m[1], ln }); continue; }

    m = t.match(RE.numBranch);
    if (m) { tokens.push({ type: 'numBranch', n: parseInt(m[1], 10), ln }); continue; }

    m = t.match(RE.subBlock);
    if (m) { tokens.push({ type: 'subBlock', group: m[1], n: parseInt(m[2], 10), ln }); continue; }

    m = t.match(RE.letterBlock);
    if (m) { tokens.push({ type: 'letterBlock', group: m[1], letter: m[2], ln }); continue; }

    m = t.match(RE.endBlock);
    if (m) { tokens.push({ type: 'endBlock', kind: m[1].replace(/\s+/g, ' ').split(' ')[0], line: m[2], title: m[3], ln }); continue; }

    m = t.match(RE.optL);
    if (m) { tokens.push({ type: 'optL', k: m[1], x: m[2], ln }); continue; }

    m = t.match(RE.optN);
    if (m) { tokens.push({ type: 'optN', k: parseInt(m[1], 10), x: m[2], ln }); continue; }

    // 普通文本行（归属最近的旁白/系统/结局正文块）
    tokens.push({ type: 'text', x: line, ln });
  }
  return { tokens, unknown };
}

/* ---------------- 结构组装 ---------------- */

// 判断 token 是否为"块起点"（选项组的响应块标签或边界）
function isBlockStart(tk) {
  return tk.type === 'routeBranch' || tk.type === 'letterBranch' || tk.type === 'numBranch' || tk.type === 'subBlock'
    || tk.type === 'letterBlock'
    || tk.type === 'endBlock' || tk.type === 'chapter' || tk.type === 'routeTitle';
}

// 块 token → 选项序号（-1 = 不属于该组）
// 匹配依据：选项行前缀类型（字母/数字）与组 id（ROUTE_DIV 路线分歧 / TRUE_FINAL 最终选择 / …FINAL）
function matchBlockToOpt(tk, group, opts) {
  if (!opts.length) return -1;
  const letterOpts = typeof opts[0].k === 'string';  // A./B./…
  const numOpts = typeof opts[0].k === 'number';     // 1./2./…

  if (tk.type === 'routeBranch') {
    if (!letterOpts) return -1;
    const i = 'ABCDE'.indexOf(tk.letter);
    return i >= 0 && i < opts.length ? i : -1;
  }
  if (tk.type === 'letterBranch') {
    if (!letterOpts) return -1;
    const i = 'ABCDE'.indexOf(tk.letter);
    return i >= 0 && i < opts.length ? i : -1;
  }
  if (tk.type === 'routeTitle') {
    // 仅路线分歧组匹配 ROUTE 块（防止内层 FINAL 组误吞后续路线）
    if (group.id !== 'ROUTE_DIV') return -1;
    const m = tk.title.match(/^([A-E])\s+ROUTE/);
    if (m) {
      const i = 'ABCDE'.indexOf(m[1]);
      return i >= 0 && i < opts.length ? i : -1;
    }
    return -1;
  }
  if (tk.type === 'chapter') {
    if (group.id === 'ROUTE_DIV' && tk.title.startsWith('普通结局')) {
      // 普通结局 → E 选项（路线分歧最后一项）
      const i = opts.length - 1;
      return i >= 0 && opts[i] && opts[i].k === 'E' ? i : -1;
    }
    if (group.id === 'TRUE_FINAL') {
      // TRUE-X 章节 → 最终选择的对应选项
      const m = tk.title.match(/^TRUE-([A-E])/);
      if (m) {
        const i = 'ABCDE'.indexOf(m[1]);
        return i >= 0 && i < opts.length ? i : -1;
      }
    }
    return -1;
  }
  if (tk.type === 'subBlock') {
    if (!numOpts || tk.group !== group.id) return -1;
    return tk.n - 1 < opts.length ? tk.n - 1 : -1;
  }
  if (tk.type === 'letterBlock') {
    if (!letterOpts || tk.group !== group.id) return -1;
    const i = 'ABCDE'.indexOf(tk.letter);
    return i >= 0 && i < opts.length ? i : -1;
  }
  if (tk.type === 'numBranch') {
    if (!numOpts) return -1;
    return tk.n - 1 < opts.length ? tk.n - 1 : -1;
  }
  if (tk.type === 'endBlock') {
    if (!/FINAL/.test(group.id) || !['GOOD', 'NORMAL', 'BAD'].includes(tk.kind)) return -1;
    if (tk.kind === 'GOOD') return 0;
    if (tk.kind === 'NORMAL') return opts.length >= 2 ? 1 : -1;
    if (tk.kind === 'BAD') return opts.length >= 3 ? 2 : -1;
  }
  return -1;
}

// 块是否为"终点块"（走完回标题，无需 goto 汇合）
function isTerminalBlock(firstTk) {
  return firstTk.type === 'endBlock' || firstTk.type === 'routeTitle' || firstTk.type === 'chapter';
}

// 块内容的停止谓词：长块（ROUTE/章节型响应块）只到同类边界，短块到任何块标签
function blockContentStop(firstTk) {
  if (firstTk.type === 'routeTitle') {
    return tk => tk.type === 'routeTitle';
  }
  if (firstTk.type === 'chapter') {
    // 普通结局 / TRUE-X 响应块：到下一个 ROUTE 标题或章节型响应块边界
    return tk => tk.type === 'routeTitle'
      || (tk.type === 'chapter' && (/^TRUE-[A-E]/.test(tk.title) || tk.title.startsWith('追加共通日常')));
  }
  return isBlockStart;
}

let labelSeq = 0;
const newLabel = () => `L${++labelSeq}`;

// 场景名 → 背景 id（【场景】指令解析）
function sceneToBg(s) {
  if (/房间|家里/.test(s)) return /夜|晚/.test(s) ? 'room_night' : 'room';
  if (/商业街/.test(s)) return 'street';
  if (/仓库/.test(s)) return 'storage';
  if (/雨中街道|旧街/.test(s)) return 'rain_street';
  if (/广播室/.test(s)) return 'corridor_night';
  if (/教室|二年B班/.test(s)) return 'classroom';
  if (/学生会/.test(s)) return 'student_council';
  if (/操场/.test(s)) return 'playground';
  if (/图书馆/.test(s)) return 'library';
  if (/天文台/.test(s)) return 'observatory';
  if (/河堤/.test(s)) return 'riverside';
  if (/公园/.test(s)) return 'park_evening';
  if (/医院/.test(s)) return 'hospital';
  if (/车站/.test(s)) return 'station';
  return null;
}

// 章节标题 → 默认背景
function chapterBg(title) {
  for (const [re, bg] of CHAPTER_BG) if (re.test(title)) return bg;
  return null;
}

/**
 * 解析 token 流 [pos, end) 为节点数组。
 * stop: 停止函数（返回 true 时停止，不消费该 token）
 * 返回 { nodes, pos }
 */
function parseStream(T, pos, end, stop) {
  const nodes = [];
  let textBuf = null; // 当前旁白/系统文本缓冲 {t:'n'|'s', parts:[]}

  const flushText = () => {
    if (!textBuf) return;
    const joined = textBuf.parts.join('\n').trim();
    if (joined) nodes.push({ t: textBuf.t, x: joined });
    textBuf = null;
  };

  while (pos < end) {
    const tk = T[pos];
    if (stop && stop(tk)) break;

    switch (tk.type) {
      case 'chapter': {
        flushText();
        nodes.push({ t: 'ch', title: tk.title, bg: chapterBg(tk.title), ln: tk.ln });
        pos++;
        break;
      }
      case 'routeTitle': {
        flushText();
        nodes.push({ t: 'rt', title: tk.title, ln: tk.ln });
        pos++;
        break;
      }
      case 'narr': {
        flushText();
        textBuf = { t: 'n', parts: [] };
        pos++;
        break;
      }
      case 'sysMark': {
        flushText();
        textBuf = { t: 's', parts: [] };
        pos++;
        break;
      }
      case 'dlg': {
        flushText();
        nodes.push({ t: 'd', w: tk.who, x: tk.x, ln: tk.ln });
        pos++;
        break;
      }
      case 'scene': {
        flushText();
        const bg = sceneToBg(tk.x);
        if (bg) nodes.push({ t: 'bg', id: bg, ln: tk.ln });
        pos++;
        break;
      }
      case 'cast': {
        flushText();
        nodes.push({ t: 'cast', ids: tk.ids, ln: tk.ln });
        pos++;
        break;
      }
      case 'aff': {
        flushText();
        const who = AFF_WHO[tk.who];
        if (who) nodes.push({ t: 'a', w: who, v: tk.v, ln: tk.ln });
        pos++;
        break;
      }
      case 'flag': {
        flushText();
        nodes.push({ t: 'f', id: tk.id, ln: tk.ln });
        pos++;
        break;
      }
      case 'choice': {
        flushText();
        const r = parseChoice(T, pos, end);
        nodes.push(...r.nodes);
        pos = r.pos;
        break;
      }
      case 'condMark': {
        // 【开启条件】说明块：丢弃到下一个章节边界
        flushText();
        pos++;
        while (pos < end && !['chapter', 'routeTitle'].includes(T[pos].type)) pos++;
        break;
      }
      case 'endBlock': {
        flushText();
        // 正文内联结局终点（普通结局章节内的 END 00 等）
        nodes.push({ t: 'e', kind: tk.kind, line: tk.line, title: tk.title, ln: tk.ln });
        textBuf = { t: 'n', parts: [] }; // END 标记后的简写正文
        pos++;
        break;
      }
      case 'text': {
        if (!textBuf) textBuf = { t: 'n', parts: [] };
        textBuf.parts.push(tk.x);
        pos++;
        break;
      }
      case 'blank': {
        if (textBuf) textBuf.parts.push('');
        pos++;
        break;
      }
      default: {
        // 裸块标签在非选项上下文出现：记录并跳过（解析报告会显示）
        flushText();
        if (!['optL', 'optN'].includes(tk.type)) {
          nodes.push({ t: 'warn', x: `孤立标签@L${tk.ln}: ${JSON.stringify(tk).slice(0, 80)}` });
        }
        pos++;
        break;
      }
    }
  }
  flushText();
  return { nodes, pos };
}

/**
 * 解析选项组：选项行 + 响应块 + 汇合。
 */
function parseChoice(T, pos, end) {
  const group = T[pos]; // choice token
  pos++;

  // 收集选项行
  const opts = [];
  while (pos < end) {
    const tk = T[pos];
    if (tk.type === 'blank') { pos++; continue; }
    if (tk.type === 'optL') { opts.push({ k: tk.k, x: tk.x }); pos++; continue; }
    if (tk.type === 'optN') { opts.push({ k: tk.k, x: tk.x }); pos++; continue; }
    break;
  }

  const nodes = [];
  const optGoto = []; // 每个选项的目标 label
  opts.forEach(() => optGoto.push(null));

  // 收集响应块
  const blocks = []; // {matchIdx, firstTk, nodes}
  while (pos < end) {
    const tk = T[pos];
    if (!isBlockStart(tk)) break;
    // 归属判定
    const matchIdx = matchBlockToOpt(tk, group, opts);
    if (matchIdx < 0) break;
    // 解析块内容（跳过块标签）。停止条件按块类型：
    //  - ROUTE / 章节型响应块（普通结局、TRUE-X）是"长块"，只到下一个 ROUTE 标题或章节型边界
    //  - 短块（分支X/X1-N/END）到任何块标签
    const stop = blockContentStop(tk);
    const r = parseStream(T, pos + 1, end, stop);
    blocks.push({ matchIdx, firstTk: tk, nodes: r.nodes });
    pos = r.pos;
  }

  // 为每块开头放 label，块尾（非终点块）goto 汇合 label
  const joinLabel = newLabel();
  const blockLabels = blocks.map(() => newLabel());

  blocks.forEach((blk, i) => {
    nodes.push({ t: 'label', id: blockLabels[i] });
    // 块标签自身生成的节点（ROUTE 卡 / 章节卡；END 结局卡放正文之后）
    const ft = blk.firstTk;
    if (ft.type === 'routeTitle') {
      nodes.push({ t: 'rt', title: ft.title, ln: ft.ln });
    } else if (ft.type === 'chapter') {
      nodes.push({ t: 'ch', title: ft.title, bg: chapterBg(ft.title), ln: ft.ln });
    }
    // 去除结局简写正文中的引导前缀
    blk.nodes = blk.nodes.map(n =>
      (n.t === 'n' && typeof n.x === 'string') ? { ...n, x: n.x.replace(END_PREFIX_RE, '') } : n
    );
    nodes.push(...blk.nodes);
    if (ft.type === 'endBlock') {
      nodes.push({ t: 'e', kind: ft.kind, line: ft.line, title: ft.title, ln: ft.ln });
    }
    if (!isTerminalBlock(blk.firstTk)) {
      nodes.push({ t: 'g', l: joinLabel });
    }
    if (optGoto[blk.matchIdx] === null) optGoto[blk.matchIdx] = blockLabels[i];
  });

  nodes.push({ t: 'label', id: joinLabel });

  // FINAL 组：好感门槛（选 A 进 GOOD 需要信任）
  const lineLetter = (group.id.match(/^[A-D]/) || [null])[0];
  const needAff = /FINAL/.test(group.id) && lineLetter ? (AFF_NEED[lineLetter] || 0) : 0;
  const lineChar = { A: 'misaki', B: 'reina', C: 'himari', D: 'noa' }[lineLetter];

  const choiceNode = {
    t: 'c',
    o: opts.map((o, i) => {
      const target = optGoto[i] || joinLabel; // 无响应块的选项直接汇合
      // FINAL：A→GOOD（信任不足→NORMAL）、B→NORMAL、C→BAD 由块匹配完成；
      // 好感检查挂在 A 选项上
      if (/FINAL/.test(group.id) && i === 0 && needAff > 0 && lineChar && optGoto.length >= 3) {
        const normalTarget = optGoto[1] || joinLabel;
        return { x: o.x, l: target, na: { w: lineChar, v: needAff }, lf: normalTarget };
      }
      return { x: o.x, l: target };
    }),
    ln: group.ln,
  };
  return { nodes: [choiceNode, ...nodes], pos };
}

/* ---------------- label/goat → 索引 ---------------- */

function resolveLabels(nodes) {
  // label 在原数组的索引
  const labelIdx = new Map();
  nodes.forEach((n, i) => { if (n.t === 'label') labelIdx.set(n.id, i); });
  // 移除 label 后每个位置的前移量
  const shift = new Array(nodes.length);
  let s = 0;
  nodes.forEach((n, i) => { shift[i] = s; if (n.t === 'label') s++; });
  const remap = old => old - shift[old];

  const out = [];
  nodes.forEach((n) => {
    if (n.t === 'label') return; // 移除 label
    if (n.t === 'g') {
      const idx = labelIdx.get(n.l);
      if (idx != null) out.push({ t: 'g', i: remap(idx) });
      return; // 无目标则丢弃（段尾）
    }
    if (n.t === 'c') {
      n.o.forEach(o => {
        const li = labelIdx.get(o.l);
        o.i = li != null ? remap(li) : null;
        if (o.lf != null) {
          const fi = labelIdx.get(o.lf);
          o.ifail = fi != null ? remap(fi) : null;
        }
        delete o.l; delete o.lf;
      });
      out.push(n);
      return;
    }
    out.push(n);
  });
  return out;
}

/* ---------------- 主流程 ---------------- */

function main() {
  const raw = fs.readFileSync(SRC, 'utf8');
  const { tokens, unknown } = tokenize(raw);

  // 段切分：TRUE ROUTE 标题、追加日常第一章
  let trueStart = -1, extraStart = -1;
  tokens.forEach((tk, i) => {
    if (tk.type === 'routeTitle' && /^TRUE\s+ROUTE/.test(tk.title) && trueStart < 0) trueStart = i;
    if (tk.type === 'chapter' && tk.title.startsWith('追加共通日常01') && extraStart < 0) extraStart = i;
  });
  if (trueStart < 0 || extraStart < 0) {
    console.error('错误：未找到段切分点', { trueStart, extraStart });
    process.exit(1);
  }

  let mainNodes = parseStream(tokens, 0, trueStart, null).nodes;
  const trueNodes = parseStream(tokens, trueStart, extraStart, null).nodes;
  const extraNodes = parseStream(tokens, extraStart, tokens.length, null).nodes;

  // 丢弃文件头说明（第一个章节标题之前的元信息文本）
  const firstCh = mainNodes.findIndex(n => n.t === 'ch');
  if (firstCh > 0) mainNodes = mainNodes.slice(firstCh);

  const mainR = resolveLabels(mainNodes);
  const trueR = resolveLabels(trueNodes);
  const extraR = resolveLabels(extraNodes);

  // ---- 校验统计 ----
  const stats = { dialogue: 0, narr: 0, choice: 0, ends: [], warn: [] };
  [...mainR, ...trueR, ...extraR].forEach(n => {
    if (n.t === 'd') stats.dialogue++;
    if (n.t === 'n') stats.narr++;
    if (n.t === 'c') stats.choice++;
    if (n.t === 'e') stats.ends.push(`${n.kind} ${n.line || ''}《${n.title}》`);
    if (n.t === 'warn') stats.warn.push(n.x);
  });

  // 好感总量（每线可得上限估算）
  const affSum = {};
  [...mainR, ...trueR, ...extraR].forEach(n => {
    if (n.t === 'a') affSum[n.w] = (affSum[n.w] || 0) + Math.max(0, n.v);
  });

  // 孤立 label 检查（goto 指向不存在节点的在 resolveLabels 已丢弃）
  const data = {
    meta: {
      title: '在雨停之前',
      chars: CHARS,
      affNeed: AFF_NEED,
      affMax: affSum,
    },
    main: mainR,
    true: trueR,
    extra: extraR,
  };

  const js = '/* 由 tools/parse.js 生成，勿手改 */\nwindow.GAME_DATA = ' + JSON.stringify(data) + ';\n';
  fs.writeFileSync(OUT, js, 'utf8');

  console.log('=== 解析完成 ===');
  console.log(`main 节点: ${mainR.length}  true 节点: ${trueR.length}  extra 节点: ${extraR.length}`);
  console.log(`对话: ${stats.dialogue}  旁白段: ${stats.narr}  选项组: ${stats.choice}`);
  console.log(`结局 (${stats.ends.length}):`);
  stats.ends.forEach(e => console.log('  ' + e));
  console.log(`好感总量: ${JSON.stringify(affSum)}`);
  if (stats.warn.length) {
    console.log(`\n警告 ${stats.warn.length} 条:`);
    stats.warn.forEach(w => console.log('  ' + w));
  } else {
    console.log('\n无孤立标签警告');
  }
  console.log(`\n输出: ${OUT} (${(js.length / 1024).toFixed(1)} KB)`);
}

main();
