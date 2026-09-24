/* ============================================================
 * 资源配置 —— 美术接入接口
 * ------------------------------------------------------------
 * 【如何放入你的素材】
 * 背景：把图片放到 assets/bg/ 下，文件名与 bg[key].file 一致
 *       （或直接改这里的 file 路径指向你的文件）。
 * 立绘：把角色立绘（建议透明背景 PNG）放到 assets/char/ 下，
 *       与 char[key].img 路径一致。表情差分在 expr 中指定图片与触发台词。
 * 缺图时：背景自动回退为「场景色板渐变」，立绘自动隐藏，游戏不受影响。
 * 图片加载失败也会自动回退，因此可以先放部分图。
 * ============================================================ */

window.RES = {

  // ---------- 背景 ----------
  // tint: 缺图时的占位渐变 [顶色, 中色, 底色]
  bg: {
    station:          { name: '海陵站 · 雨',   file: 'assets/bg/station.jpg',          tint: ['#2a3540', '#3d4d5c', '#1e2730'] },
    classroom:        { name: '二年B班',        file: 'assets/bg/classroom.jpg',        tint: ['#4a4438', '#6b6250', '#2e2a22'] },
    rain_street:      { name: '雨中街道',       file: 'assets/bg/rain_street.jpg',      tint: ['#2c3338', '#414c54', '#20262b'] },
    corridor_night:   { name: '旧校舍走廊',     file: 'assets/bg/corridor_night.jpg',   tint: ['#1c2026', '#2c333c', '#14171c'] },
    room_night:       { name: '房间 · 夜',      file: 'assets/bg/room_night.jpg',       tint: ['#232028', '#383340', '#17151b'] },
    park_evening:     { name: '老公园 · 黄昏',  file: 'assets/bg/park_evening.jpg',     tint: ['#3d3648', '#705a5e', '#262230'] },
    street_dusk:      { name: '街道 · 暮色',    file: 'assets/bg/street_dusk.jpg',       tint: ['#463a4a', '#6e5462', '#2a2430'] },
    festival:         { name: '纪念祭 · 烟花', file: 'assets/bg/festival.jpg',         tint: ['#1a1f33', '#3a3860', '#121423'] },
    student_council:  { name: '学生会室',       file: 'assets/bg/student_council.jpg',  tint: ['#3a3c46', '#565a68', '#24262e'] },
    hospital_roof:    { name: '医院天台',       file: 'assets/bg/hospital_roof.jpg',    tint: ['#39434e', '#5d6b78', '#232a31'] },
    storage:          { name: '仓库',           file: 'assets/bg/storage.jpg',          tint: ['#2e2a26', '#463f38', '#1d1b18'] },
    street:           { name: '商业街',         file: 'assets/bg/street.jpg',           tint: ['#43423e', '#615e54', '#282723'] },
    riverside:        { name: '河堤',           file: 'assets/bg/riverside.jpg',        tint: ['#33402e', '#4e604a', '#212a1f'] },
    hospital:         { name: '医院',           file: 'assets/bg/hospital.jpg',         tint: ['#3d464e', '#5b666f', '#262c32'] },
    room:             { name: '林澈的房间',     file: 'assets/bg/room.jpg',             tint: ['#3c3a36', '#585449', '#242321'] },
    playground:      { name: '操场',           file: 'assets/bg/playground.jpg',       tint: ['#3e4438', '#5c6353', '#252a22'] },
    library:          { name: '旧图书馆',       file: 'assets/bg/library.jpg',          tint: ['#37322a', '#524a3c', '#201d18'] },
    observatory:     { name: '旧天文台',       file: 'assets/bg/observatory.jpg',     tint: ['#1d2030', '#333850', '#131521'] },
    principal:        { name: '校长室',         file: 'assets/bg/principal.jpg',        tint: ['#3a3230', '#554a46', '#221e1c'] },
    sea:              { name: '海边',           file: 'assets/bg/sea.jpg',              tint: ['#2a3c46', '#48626e', '#1a262d'] },
    station_year:     { name: '海陵站 · 一年后', file: 'assets/bg/station_year.jpg',     tint: ['#40382e', '#6b5d4a', '#262119'] },
  },

  // ---------- 立绘 ----------
  char: {
    misaki: {
      name: '佐藤美咲', color: '#e6a8c0', img: 'assets/char/misaki.png',
      expr: { tearful: { file: 'assets/char/misaki_tearful.png', lines: [
        '你真的回来了。', '不是照片，不是消息，也不是“以后有机会”。', '是真的回来了。',
        '替我决定“忘掉你比较好”。', '因为喜欢你啊。',
      ] } },
    },
    reina: {
      name: '黑川玲奈', color: '#8fa8d8', img: 'assets/char/reina.png',
      expr: { smile: { file: 'assets/char/reina_smile.png', lines: [
        '大家也会喜欢这样的我。', '但今天，是我自己决定留下。', '喜欢上一个麻烦的人。', '很好吃。',
      ] } },
    },
    himari: {
      name: '橘阳葵', color: '#e8b45c', img: 'assets/char/himari.png',
      expr: { serious: { file: 'assets/char/himari_serious.png', lines: [
        '如果你特别喜欢一件事，可身体突然说“你不行了”，怎么办？',
        '我从小学就跑。', '老师叫我“田径部的橘”。', '学妹叫我“短跑的橘学姐”。',
        '我爸只有我拿奖的时候最开心。', '如果不能跑了……', '那我还是我吗？',
        '我不知道！', '你骂我两句啊！', '骂我为什么逞强，为什么不早点来医院！',
        '至少让我觉得，这是因为我做错了什么。',
      ] } },
    },
    noa: {
      name: '白雪乃爱', color: '#a8a0d8', img: 'assets/char/noa.png',
      expr: { smile: { file: 'assets/char/noa_smile.png', lines: [
        '因为这次有人和我一起看。', '我也喜欢你。', '偶尔。', '突然喜欢了。',
      ] } },
    },
    haruka: {
      name: '白雪遥', color: '#8cc8c0', img: 'assets/char/haruka.png',
      expr: { worried: { file: 'assets/char/haruka_worried.png', lines: [
        '乃爱说，你一直觉得对不起我。', '那我正式告诉你。', '我不接受你的道歉。',
      ] } },
    },
  },

  // ---------- 标题画面与角色鉴赏 ----------
  title: {
    // 主视觉
    main: 'assets/title/title_main.jpg',
    // 与游戏中的立绘使用同一套正式素材
    gallery: [
      { char: 'misaki', file: 'assets/char/misaki.png' },
      { char: 'reina',  file: 'assets/char/reina.png' },
      { char: 'himari', file: 'assets/char/himari.png' },
      { char: 'noa',    file: 'assets/char/noa.png' },
      { char: 'haruka', file: 'assets/char/haruka.png' },
    ],
  },

  // ---------- BGM（可选，无文件则静音） ----------
  bgm: {
    title:  { name: '标题',   file: 'assets/bgm/title.ogg',  vol: 0.5 },
    daily:  { name: '日常',   file: 'assets/bgm/daily.ogg',  vol: 0.5 },
    rain:   { name: '雨',     file: 'assets/bgm/rain.ogg',   vol: 0.5 },
    sad:    { name: '低回',   file: 'assets/bgm/sad.ogg',    vol: 0.5 },
    ending: { name: '结局',   file: 'assets/bgm/ending.ogg', vol: 0.5 },
  },
};
