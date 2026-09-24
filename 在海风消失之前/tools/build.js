#!/usr/bin/env node
// 将完整续作原稿编译为网页游戏数据。选项反馈和跳转在此维护，原稿不改。
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, '在海风消失之前_正统续作完整Galgame剧本_UTF-8.txt'), 'utf8').split(/\r?\n/);
const chars = {
  林澈:{id:'rinche',color:'#9fb8cf',sprite:false}, 美咲:{id:'misaki',color:'#e6a8c0',sprite:true},
  玲奈:{id:'reina',color:'#8fa8d8',sprite:true}, 阳葵:{id:'himari',color:'#e8b45c',sprite:true},
  乃爱:{id:'noa',color:'#a8a0d8',sprite:true}, 遥:{id:'haruka',color:'#8cc8c0',sprite:true}
};
const data = {meta:{title:'在海风消失之前',chars},main:[],A:[],B:[],C:[],D:[],E:[],true:[]};
let seg='main', narr=[], chapter=null, pending=null, ending=null, scene='';
const choices=[]; const starts={}; const endingStarts={};
const push=n=>data[seg].push(n);
function flush(){if(narr.length){const x=narr.join('\n').trim(); if(x) push({t:'n',x,ln:narr.ln}); narr=[];}}
function closeEnding(){flush();if(ending){push({t:'e',...ending});ending=null;}}
function cleanChoice(x){return x.replace(/\s*[→⇒].*$/,'').replace(/——获得.*$/,'').trim();}
const bgFor=s=>{
  if(/海陵站|车站|站台/.test(s))return 'station_year';
  if(/纪念馆|星图室|天文馆|科学馆/.test(s))return 'observatory';
  if(/教室|广播室/.test(s))return 'classroom';
  if(/图书|资料室/.test(s))return 'library';
  if(/学生会/.test(s))return 'student_council';
  if(/操场|跑道|训练营|试训/.test(s))return 'playground';
  if(/河堤|河边/.test(s))return 'riverside';
  if(/港|海边|防波堤|水族馆/.test(s))return 'sea';
  if(/医院/.test(s))return 'hospital';
  if(/食堂|小食堂|拉面摊/.test(s))return 'street';
  if(/公园/.test(s))return 'park_evening';
  if(/家|房间|书桌/.test(s))return 'room';
  return 'street_dusk';
};
const cgScene={
  A:[[/海陵站，冬夜/,'misaki_station'],[/美咲家厨房/,'misaki_kitchen'],[/老公园，毕业典礼前夜/,'misaki_park']],
  B:[[/海陵大学公开讲座/,'reina_library'],[/河边步道/,'reina_riverside'],[/海陵小食堂/,'reina_diner']],
  C:[[/河堤跑道，冬日黄昏/,'himari_riverside'],[/北陆大学试训营/,'himari_track'],[/水族馆，毕业前/,'himari_aquarium']],
  D:[[/纪念馆星图室，十二月夜/,'noa_museum'],[/京都科学馆/,'noa_stars'],[/学校屋顶，毕业纪念册截稿日/,'noa_rooftop']]
};
const goodEpilogues={
  A:{bg:'misaki_tokyo_date',lines:[
    {t:'n',x:'两年后的秋天，我在东京听完美咲的第一次公开朗读。散场后，她换上酒红色短裙和浅色露肩毛衣，笑我在台下比作者本人还紧张。雨刚停，我们沿着有灯的街道走，她主动牵住我的手。'},
    {t:'d',w:'美咲',x:'今晚别急着赶末班车。明早陪我去那家旧书店，好吗？'},
    {t:'d',w:'林澈',x:'好。明天的事，明天一起决定。'},
    {t:'n',x:'她踮起脚吻了我一下，又把手指扣得更紧。楼道的灯亮起时，我们仍在讨论书店几点开门。那些曾经说不出口的愿望，如今可以说得很轻。'}
  ]},
  B:{bg:'reina_campus_date',lines:[
    {t:'n',x:'大学二年级的一个傍晚，我在咖啡馆等玲奈交完访谈稿。她穿着黑色短裙，外套随意搭在肩上，把一杯还温着的咖啡推到我面前。'},
    {t:'d',w:'玲奈',x:'今晚的计划表只有一项：和你散步。你有异议吗？'},
    {t:'d',w:'林澈',x:'能加一项牵手吗？'},
    {t:'n',x:'她先装作审阅提案，随后把手放进我掌心。窗外的夕光慢慢暗下去，我们谁也没有急着为这一天写出正确答案。'}
  ]},
  C:{bg:'himari_relay_date',lines:[
    {t:'n',x:'散场后，阳葵换上一件轻外套，运动短裙的衣角被晚风吹起。她从看台下跑来，手伸得比终点线还早。我握住她的手，她却顺势把我拉近。'},
    {t:'d',w:'阳葵',x:'这次不用跑，你陪我慢慢走回去。'},
    {t:'d',w:'林澈',x:'四星服务，今天能升五星吗？'},
    {t:'n',x:'她笑着在我脸颊亲了一下，随即又说别让我得意。跑道的灯一盏盏亮起，我们并肩走出了体育场。'}
  ]},
  D:{bg:'noa_kyoto_date',lines:[
    {t:'n',x:'又过一年，我到京都看乃爱主持的科学馆夜场。散场后，她穿着深蓝短裙与轻开衫，在巷口的灯笼下等我。她没有像从前那样先问我是否会误会，只向我伸出手。'},
    {t:'d',w:'乃爱',x:'今晚先陪我走一段。明天我还想带你看新的星图。'},
    {t:'d',w:'林澈',x:'明天见。今晚也见。'},
    {t:'n',x:'她笑出声，靠近时轻轻吻了我。风从街口吹来，我们牵着手继续往前走；下一颗星的位置，可以明天再找。'}
  ]}
};
const adultScenes={
  A:[
    {bg:'misaki_bookshop',lines:[
      {t:'n',x:'第二天的旧书店藏在一条很窄的巷子里。美咲翻出一本绝版诗集，我替她从最高一层取下。她把书塞进我手里，说这是给迟到两年的共同书架的第一本。'},
      {t:'d',w:'美咲',x:'你选一本，我选一本。下次见面再交换读后感。'}]},
    {bg:'misaki_festival',lines:[
      {t:'n',x:'夏天再见时，夜祭的灯笼从街口一直亮到河边。她走在前面，忽然放慢脚步等我；烟花响起，我们才发现手一直牵着。'},
      {t:'d',w:'美咲',x:'这次我没有在心里排练要说什么。只是想和你一起看完。'}]},
    {bg:'misaki_seaside_cafe',lines:[
      {t:'n',x:'返乡的周末，我们在海边咖啡馆碰面。美咲把第二杯冰茶推给我，像当年递来那把伞一样自然。她说新稿写的是两个不断出发、也不断回家的人。'},
      {t:'d',w:'林澈',x:'那他们后来呢？'},
      {t:'d',w:'美咲',x:'还没写到后来。你陪我慢慢想。'}]},
    {bg:'misaki_balcony',lines:[
      {t:'n',x:'秋末，她把公寓阳台上的两盆花往避风处挪了挪。远处电车经过，灯光像一行尚未落笔的句子。我们对着明年的日历，认真圈出能一起度过的日子。'},
      {t:'d',w:'美咲',x:'不用每一次都完美。能一起商量，就已经很好。'}]}
  ],
  B:[
    {bg:'reina_archive',lines:[
      {t:'n',x:'玲奈的访谈项目终于收尾。档案室里只剩我们，她把最后一份资料递来，难得没有催我核对编号。'},
      {t:'d',w:'玲奈',x:'今天的归档可以延后十分钟。我想先听你说说近况。'}]},
    {bg:'reina_waterfront',lines:[
      {t:'n',x:'秋夜的港口风大，我们沿着护栏慢慢走。她说起下一学期的调查计划，也听完我对未来仍不确定的部分。'},
      {t:'d',w:'玲奈',x:'计划可以改。你说的话，我会记得。'}]},
    {bg:'reina_kitchen',lines:[
      {t:'n',x:'周末第一次一起做晚饭，玲奈负责看菜谱，我负责把盐和糖放回正确位置。锅里的热气升起，她终于承认两人一起摸索比照着步骤做有趣。'},
      {t:'d',w:'林澈',x:'那下周还做吗？'},
      {t:'d',w:'玲奈',x:'可以。记得带你上次说的那本书。'}]},
    {bg:'reina_gallery',lines:[
      {t:'n',x:'她的小型展览开幕那天，照片旁写着受访者亲自确认过的话。玲奈站在入口，等最后一位来宾离开后才朝我伸手。'},
      {t:'d',w:'玲奈',x:'这一次，我想把完成的东西先给你看。'}]}
  ],
  C:[
    {bg:'himari_training',lines:[
      {t:'n',x:'大学校队训练结束后，阳葵还留在跑道边做拉伸。她朝我挥手，呼吸尚未平稳，笑容却一点没变。'},
      {t:'d',w:'阳葵',x:'今天不比速度。你陪我把最后一圈走完。'}]},
    {bg:'himari_boardwalk',lines:[
      {t:'n',x:'暑假返乡，我们沿海边栈道走到太阳快落下。她拎着鞋，说自己终于学会在训练表以外给一天留空。'},
      {t:'d',w:'阳葵',x:'空出来的这一格，今天给你。'}]},
    {bg:'himari_lab',lines:[
      {t:'n',x:'新学期，她带我看运动康复实验室的训练记录。图表上有她研究的方向，也有她希望帮助的运动员。她讲得比介绍比赛成绩时还兴奋。'},
      {t:'d',w:'林澈',x:'我听得懂一半。剩下的一半，再教我。'}]},
    {bg:'himari_festival',lines:[
      {t:'n',x:'那晚她没赶最后一班回宿舍的车。夜祭人群里，阳葵拉着我穿过灯笼下的长街，在烟花声里放慢了脚步。'},
      {t:'d',w:'阳葵',x:'慢一点也没关系。反正你在旁边。'}]}
  ],
  D:[
    {bg:'noa_planetarium',lines:[
      {t:'n',x:'闭馆后的星象馆只留下淡蓝的投影。乃爱站在星图下，把新节目里一颗不太起眼的星指给我看。'},
      {t:'d',w:'乃爱',x:'从前我总怕说错。现在想先说，再和你一起找答案。'}]},
    {bg:'noa_roof_night',lines:[
      {t:'n',x:'回到住处，我们在屋顶继续看星。她把星图折好，靠着栏杆，允许这一晚没有任何需要完成的任务。'},
      {t:'d',w:'林澈',x:'今晚最亮的是哪一颗？'},
      {t:'d',w:'乃爱',x:'我还没决定。先陪我多看一会儿。'}]},
    {bg:'noa_river_festival',lines:[
      {t:'n',x:'河边灯会比预想热闹。乃爱看着一盏盏灯顺水而去，忽然握住我的手，说下次也想带遥来看看。'},
      {t:'d',w:'乃爱',x:'过去和以后，都可以一起放在这里。'}]},
    {bg:'noa_station_reunion',lines:[
      {t:'n',x:'后来，我们仍常在两座城市之间往返。站台的灯刚亮，她从车门走来，隔着人群就找到了我。'},
      {t:'d',w:'乃爱',x:'这次换我先到。路上想到一件事，等会儿慢慢告诉你。'}]}
  ]
};
function addGoodEpilogue(ln){const e=goodEpilogues[seg];if(!e)return;for(const scene of [e,...adultScenes[seg]]){push({t:'bg',id:scene.bg,ln});push({t:'cast',ids:[],ln});for(const node of scene.lines)push({...node,ln});}}
for(let i=0;i<src.length;i++){
  const s=src[i].trim(), ln=i+1;
  if(!s){if(narr.length)narr.push('');continue;}
  if(/^#+$/.test(s)){
    const next=(src[i+1]||'').trim();
    let route=/^([ABCD]) ROUTE/.exec(next);
    if(route){closeEnding();seg=route[1];starts[seg]=0;i+=2;continue;}
    if(/^普通结局 E/.test(next)){closeEnding();seg='E';starts.E=0;i+=2;continue;}
    if(/^TRUE ROUTE/.test(next)){closeEnding();seg='true';starts.true=0;i+=2;continue;}
    continue;
  }
  if(/^=+$/.test(s)&&src[i+2]&&/^=+$/.test(src[i+2].trim())){
    flush();chapter=src[i+1].trim();push({t:'ch',title:chapter,ln});i+=2;continue;
  }
  if(s==='【旁白】'){flush();narr.ln=ln;continue;}
  let m=s.match(/^「(.+?)」：(.*)$/);
  if(m){flush();push({t:'d',w:m[1],x:m[2],ln});continue;}
  m=s.match(/^【场景】(.+)$/);
  if(m){flush();scene=m[1];const cg=cgScene[seg]?.find(([re])=>re.test(scene))?.[1];const bg=cg||bgFor(scene);push({t:'bg',id:bg,ln});if(cg)push({t:'cast',ids:[],ln});continue;}
  if(s==='【路线选择】'){flush();pending={kind:'route',opts:[],ln};push({t:'c',o:pending.opts,ln});choices.push({seg,index:data[seg].length-1,pending});continue;}
  m=s.match(/^【选择 ([^】]+)】$/);
  if(m){flush();pending={kind:/FINAL/.test(m[1])?'final':'local',id:m[1],opts:[],ln};push({t:'c',o:pending.opts,ln});choices.push({seg,index:data[seg].length-1,pending});continue;}
  m=s.match(/^([A-E1-3])．(.+)$/);
  if(m&&pending){pending.opts.push({key:m[1],x:cleanChoice(m[2])});continue;}
  m=s.match(/^【(GOOD|NORMAL|BAD|TRUE) END(?: ([A-D]|00(?:-ALT)?))?：?《(.+?)》】(.*)$/);
  if(m){closeEnding();ending={kind:m[1],line:m[2]||'T',title:m[3],ln};endingStarts[`${seg}_${ending.kind}_${ending.line}`]=data[seg].length;
    let tail=m[4].trim();
    if(m[1]==='GOOD')tail='';
    else tail=tail.replace(/^选择\s*[A-C]，?/,'').replace(/^选\s*[123](?:\s*或\s*[123])?[。。，]?/,'')
      .replace(/^且双方愿意继续坦白。/,'').replace(/^或连续压下美咲的愿望。/,'')
      .replace(/^之后主动解释隐瞒。/,'').replace(/^且拒绝承认越界。/,'')
      .replace(/^且无视阳葵对职业与课程的双重兴趣。/,'')
      .replace(/^且始终要求乃爱把留在海陵当作爱情证明。/,'')
      .replace(/^后，/,'');
    if(tail)push({t:'n',x:tail,ln});
    continue;}
  if(/^【END [A-D]-GOOD】$/.test(s)){flush();addGoodEpilogue(ln);closeEnding();continue;}
  if(/^【/.test(s)){flush();pending=null;continue;}
  // 路线标题下的承接说明、角色设定以及原稿的作者注不作为对白展示。
  if(/^(继承原作|原作|本作|四条|【|——《|《在海风|林澈，十八岁|佐藤美咲，十八岁|黑川玲奈，十八岁|橘阳葵，十八岁|白雪乃爱，十八岁|白雪遥，二十岁)/.test(s)&&!narr.length)continue;
  if(narr.length===0)narr.ln=ln;
  narr.push(s);
}
closeEnding();
// 为所有选项提供可见的局部反应，避免点击后无反馈；反应段置于本段末尾并跳回正文。
const replies={
 'C-1':['我先填下稳妥的方向，打算再找父亲谈谈。','两种可能都写在纸上。看着它们并排，我反而松了一口气。','空白交上去后，我知道迟早还要亲口解释。'],
 'C-2：雨停前':['美咲说起东京文学馆里那些普通人的手稿，声音渐渐亮起来。','美咲停了一下：「别用保证替明天作证。」','她点头道谢。夜里，一份改了许多遍的草稿才发到我的手机上。'],
 'C-3：如何回应他人的远行':['我说出祝福，没说出口的舍不得仍留在心里。','「高兴，也会舍不得。」说完后，我第一次觉得这两句话可以同时成立。','我把话题推到以后，却知道日历不会替我开口。'],
 'A-2':['美咲接过我的话，开始认真数哪几个周末能见面。','美咲轻声问：「没有意见，也可能是把谈话关掉吧？」','美咲没有马上回答。我们都明白，这句话仍需重新谈。'],
 'B-2：协助玲奈':['玲奈把两份课程表推到中间，我们一条一条地核对。','玲奈合上文件夹：「谢谢，但先让我自己想完。」','玲奈望着我：「考试不是为了证明去年谁对谁错。」'],
 'C-2：训练营邀请':['阳葵说她想知道自己喜欢的究竟是比赛，还是一直向前跑的感觉。','阳葵笑着让我先查车票和自己的课表。','她把邀请函收好，第一次没有接我的玩笑。'],
 'D-2：面对遥的记忆':['乃爱沉默了一会儿，终于把那些难以启齿的心情讲完。','遥说，她不愿替我们证明任何关系。','乃爱点头，却不再把后半句话说出来。'],
 'T-2：展览的边界':['征集说明改了。每个人都能决定自己的文字是否留下。','作者撤回了投稿，我们重新确认每一份材料的授权。','阳葵提醒我们：尚未决定去处的人也属于这一届。']
};
for(const {seg:sn,index,pending:p} of choices){
  const n=data[sn][index];if(!n)throw Error(`choice lost ${sn}:${index}`);
  if(p.kind==='route'){n.o=p.opts.map(o=>({x:o.x,seg:o.key,i:0}));continue;}
  if(p.kind==='final'){
    const map=sn==='E'?{'1':'NORMAL_00','2':'NORMAL_00-ALT','3':'NORMAL_00'}:sn==='true'?{'A':'TRUE_T','B':'TRUE_T','C':'TRUE_T'}:{A:`GOOD_${sn}`,B:`BAD_${sn}`,C:`NORMAL_${sn}`};
    n.o=p.opts.map(o=>({x:o.x,i:endingStarts[`${sn}_${map[o.key]}`]}));continue;
  }
  const a=data[sn],ret=index+1;
  n.o=p.opts.map((o,j)=>{const i=a.length;a.push({t:'n',x:replies[p.id]?.[j]||'我把自己的想法说了出来。',ln:p.ln},{t:'g',i:ret});return{x:o.x,i};});
}
fs.writeFileSync(path.join(root,'js','data.js'),'// 由 tools/build.js 生成，请勿直接编辑。\nwindow.GAME_DATA = '+JSON.stringify(data)+';\n');
const summary=Object.fromEntries(Object.entries(data).filter(([k])=>k!=='meta').map(([k,v])=>[k,{nodes:v.length,choices:v.filter(n=>n.t==='c').length,endings:v.filter(n=>n.t==='e').map(n=>n.kind+n.line+':'+n.title)}]));
console.log(JSON.stringify(summary,null,2));
