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
    // 大学阶段夏日番外：竖幅奖励画面，按原始比例展示。
    swim_misaki_pool_sunset: { name: '美咲 · 暮色泳池', file: 'swimsuit_set_01-10/01_misaki_pool_sunset.png', portrait: true, tint: ['#684358','#c58878','#283849'] },
    swim_misaki_beach_day: { name: '美咲 · 海边晴日', file: 'swimsuit_set_01-10/02_misaki_beach_day.png', portrait: true, tint: ['#5487a4','#cad4c0','#35536a'] },
    swim_himari_pool_resort: { name: '阳葵 · 泳池假日', file: 'swimsuit_set_01-10/03_himari_pool_resort.png', portrait: true, tint: ['#497f95','#dbad80','#41546a'] },
    swim_misaki_pool_red: { name: '美咲 · 池畔夕照', file: 'swimsuit_set_01-10/04_misaki_pool_red_swimsuit.png', portrait: true, tint: ['#744a61','#e3a173','#345470'] },
    swim_misaki_beach_lounge: { name: '美咲 · 海边午后', file: 'swimsuit_set_01-10/05_misaki_beach_lounge.png', portrait: true, tint: ['#598ba3','#d7bc9a','#4b6877'] },
    swim_misaki_pool_onepiece: { name: '美咲 · 泳池留影', file: 'swimsuit_set_01-10/06_misaki_pool_onepiece.png', portrait: true, tint: ['#577f9c','#bcc9ba','#3c536d'] },
    swim_reina_beach_day: { name: '玲奈 · 海滨白昼', file: 'swimsuit_set_01-10/07_reina_beach_day.png', portrait: true, tint: ['#6595b3','#d4d6cc','#526c84'] },
    swim_reina_pool_sunset: { name: '玲奈 · 池畔晚霞', file: 'swimsuit_set_01-10/08_reina_pool_sunset.png', portrait: true, tint: ['#575577','#be8f8b','#363c60'] },
    swim_himari_beach_day: { name: '阳葵 · 海滩晴日', file: 'swimsuit_set_01-10/09_himari_beach_day.png', portrait: true, tint: ['#6299b1','#e6bb87','#516a73'] },
    swim_himari_pool_sunset: { name: '阳葵 · 泳池落日', file: 'swimsuit_set_01-10/10_himari_pool_sunset.png', portrait: true, tint: ['#7b6275','#e5a16e','#484a68'] },
    misaki_station: { name: '海陵站 · 冬夜', file: 'assets/cg/misaki_station.png', tint: ['#263349','#5b5660','#181d29'] },
    misaki_kitchen: { name: '美咲家 · 年末', file: 'assets/cg/misaki_kitchen.png', tint: ['#5b4138','#8c6853','#302329'] },
    misaki_park: { name: '老公园 · 毕业前夜', file: 'assets/cg/misaki_park.png', tint: ['#2e304c','#76546b','#1b223b'] },
    misaki_tokyo_date: { name: '东京 · 再次牵手', file: 'assets/cg/misaki_tokyo_date.png', tint: ['#45354c','#855c69','#2a233a'] },
    misaki_bookshop: { name: '东京 · 旧书店', file: 'assets/cg/misaki_bookshop.png', tint: ['#76534a','#c49472','#382a31'] },
    misaki_festival: { name: '夏夜 · 灯笼街', file: 'assets/cg/misaki_festival.png', tint: ['#5a3846','#af645d','#28243c'] },
    misaki_seaside_cafe: { name: '海边 · 冰茶', file: 'assets/cg/misaki_seaside_cafe.png', tint: ['#5c8da5','#a9c4c2','#436074'] },
    misaki_balcony: { name: '东京 · 阳台夜话', file: 'assets/cg/misaki_balcony.png', tint: ['#4c466d','#a07b80','#25243e'] },
    reina_library: { name: '大学资料室 · 黄昏', file: 'assets/cg/reina_library.png', tint: ['#51404c','#786474','#262130'] },
    reina_riverside: { name: '河边步道 · 二月', file: 'assets/cg/reina_riverside.png', tint: ['#28334e','#546484','#1d273a'] },
    reina_diner: { name: '海陵小食堂 · 夜', file: 'assets/cg/reina_diner.png', tint: ['#4a342c','#85604a','#241d21'] },
    reina_campus_date: { name: '大学咖啡馆 · 黄昏', file: 'assets/cg/reina_campus_date.png', tint: ['#5a4750','#a87868','#2e2936'] },
    reina_archive: { name: '大学档案室 · 收工', file: 'assets/cg/reina_archive.png', tint: ['#6a5650','#b79270','#312d36'] },
    reina_waterfront: { name: '秋夜 · 港边散步', file: 'assets/cg/reina_waterfront.png', tint: ['#293a59','#65668c','#1a243e'] },
    reina_kitchen: { name: '周末 · 两人的厨房', file: 'assets/cg/reina_kitchen.png', tint: ['#62504b','#a77b62','#2e2b32'] },
    reina_gallery: { name: '展厅 · 开幕', file: 'assets/cg/reina_gallery.png', tint: ['#777079','#b7a5a0','#393641'] },
    himari_track: { name: '训练场 · 夕阳', file: 'assets/cg/himari_track.png', tint: ['#644758','#94705b','#322a35'] },
    himari_riverside: { name: '河堤跑道 · 冬日', file: 'assets/cg/himari_riverside.png', tint: ['#76504b','#ae7655','#43303b'] },
    himari_aquarium: { name: '水族馆 · 蓝色回忆', file: 'assets/cg/himari_aquarium.png', tint: ['#17426a','#3570a2','#102a47'] },
    himari_relay_date: { name: '接力赛后 · 夕阳', file: 'assets/cg/himari_relay_date.png', tint: ['#77504c','#b77d60','#49303b'] },
    himari_training: { name: '大学跑道 · 训练后', file: 'assets/cg/himari_training.png', tint: ['#a7654b','#e7a66d','#58424b'] },
    himari_boardwalk: { name: '夏日 · 海边栈道', file: 'assets/cg/himari_boardwalk.png', tint: ['#6092a6','#ddb98a','#455d73'] },
    himari_lab: { name: '运动康复室 · 新方向', file: 'assets/cg/himari_lab.png', tint: ['#718aa0','#c6d1d0','#455268'] },
    himari_festival: { name: '夏夜祭 · 慢慢走', file: 'assets/cg/himari_festival.png', tint: ['#76536b','#dc916e','#3c3557'] },
    noa_stars: { name: '科学馆 · 星图', file: 'assets/cg/noa_stars.png', tint: ['#20243d','#494865','#15182a'] },
    noa_museum: { name: '纪念馆 · 冬夜录音', file: 'assets/cg/noa_museum.png', tint: ['#252743','#4b4767','#171b30'] },
    noa_rooftop: { name: '学校屋顶 · 寄出的信', file: 'assets/cg/noa_rooftop.png', tint: ['#6a6780','#b7a1a4','#3c4562'] },
    noa_kyoto_date: { name: '京都 · 灯笼小巷', file: 'assets/cg/noa_kyoto_date.png', tint: ['#39304d','#765a6d','#201d34'] },
    noa_planetarium: { name: '京都 · 星象馆', file: 'assets/cg/noa_planetarium.png', tint: ['#232c5e','#5b5d9c','#17213e'] },
    noa_roof_night: { name: '屋顶 · 读星图', file: 'assets/cg/noa_roof_night.png', tint: ['#26375c','#5d6489','#1b2540'] },
    noa_river_festival: { name: '河边 · 灯会', file: 'assets/cg/noa_river_festival.png', tint: ['#534861','#a67c76','#25283d'] },
    noa_station_reunion: { name: '站台 · 再相见', file: 'assets/cg/noa_station_reunion.png', tint: ['#5c5065','#b88979','#2d3147'] },
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
        '我也会。我只是想听你亲口说。', '你也别把「支持我」说得像一句没有成本的好话。你会难过吧？',
      ] } },
    },
    reina: {
      name: '黑川玲奈', color: '#8fa8d8', img: 'assets/char/reina.png',
      expr: { smile: { file: 'assets/char/reina_smile.png', lines: [
        '大家也会喜欢这样的我。', '但今天，是我自己决定留下。', '喜欢上一个麻烦的人。', '很好吃。',
        '我也想吃。', '我卸任了，终于有空诚实评价。',
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
        '所以更吓人。以前我只要说「等腿好了再想」。腿好了，借口也好了。',
        '我能不能一边认真训练，一边学这个？',
      ] } },
    },
    noa: {
      name: '白雪乃爱', color: '#a8a0d8', img: 'assets/char/noa.png',
      expr: { smile: { file: 'assets/char/noa_smile.png', lines: [
        '因为这次有人和我一起看。', '我也喜欢你。', '偶尔。', '突然喜欢了。',
        '至少比消失好。', '我喜欢他们听明白时突然抬头的表情。以前我只会纠正错误，不太会等人理解。',
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
    main: 'assets/bg/sea.jpg',
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
