// Fictional future satire. Public figures' dialogue is invented, not historical quotation.
export const STORY_VERSION=1;
export const SAMPLE_NAMES={silver:'银叶叶绿体',dew:'露囊催化酶',moss:'蓝脉共生菌'};
export const VOICE_LINES={
 campIntro:"SpaceX，把我和氧气分开投递，真有你们的。先把收集管接到呼吸花，气体装进背罐。带回营地才能补给、接通地球。别忘了，我自己也得喘气。",
 campHint:"这台广告机没电了。真正的天线在营地。先带回四十升氧气，再问地球今天又发生了什么。",
 flower:"管线接好了，气体进背罐。野花免费，SpaceX 收我行李费。这家公司到底运输了什么？",
 dewCollect:"露囊完整。先别喝，给那只长得像肺的家伙。它吃营养液，我拿氧气。这比会员积分好懂多了。",
 feedHint:"这东西在等饭。去透明露囊灌木取营养液，再接收集管。别直接戳它，和生物做生意要讲礼貌。",
 symbiosis:"你吃饱，我呼吸。共生关系达成。比那艘垃圾飞船的服务条款公平多了。",
 pumpDeploy:"抽气器放好了。十八秒，回来拿。终于有个东西替我工作，不是让我填客服工单。",
 pumpReturn:"满罐回收。洞里的菌床比地球的充电站靠谱。装置也带走，下次还得靠它。",
 salvage:"居然还有一罐氧气。救生设备在货舱里，我在地上。SpaceX 的分布式生命维持，真先进。",
 deposit:"氧气罐回家了。先留点给自己，再给通信台。让我听听地球有没有人投诉这破飞船。",
 lowCamp:"氧气快见底了。背罐还有气就应急转过来，没有就回营地充装。别把自己留给那丛草当肥料。",
 stormCamp:"孢子锋面来了。钻洞，或者回营地。谁设计的旅行套餐，还附送肺部磨砂？",

 intro:'SpaceX，你们管这叫精准着陆？这破飞船把我扔到鸟不拉屎的地方，连客服都显示预计四十年后回复。行，先别骂到缺氧。找银白叶背、挂透明露珠的草。',
 silver:'行，这草真能产氧。SpaceX 的空气要订阅，野草居然免费。我先采一份叶绿体，剩下的留着长。',
 red:'红得像紧急按钮，你还真敢吸。过滤器都咳嗽了。记牢，银白叶背和透明露珠，才是活命套餐。',
 trump:'这尊大背头下面写着：川普的遗言，让空气再次伟大。下面小字：遗言由展馆编剧代写。行，连遗言都有外包。不过背面刻的银白叶脉和透明露珠，倒是真线索。',
 ronaldo:'C罗的石膏像还在宣布不退役。现在都二十五世纪了，他的退休申请还在补时？展牌说，日照下的银叶草产氧，红色的只负责制造争议。',
 lebron:'勒布朗第九代孙子没打篮球，在这儿修净水器。他说，家族总得有人拿点净水冠军。石台阴影下挂着透明露囊，得取水，不能挤破花粉袋。',
 musk:'马斯克已经到冥王星了，我还在草丛里找氧气。SpaceX，这服务差距，是我没开超级会员吗？牌子背后说，断柱旁的蓝脉苔能稳定制氧。总算有句人话。',
 dew:'这袋露水救命。九代人的篮球基因，最后进化成净水器售后。取一点催化酶，别把人家的祖传过滤器拆了。',
 moss:'蓝脉苔，第三种样本到手。马斯克去冥王星，我去修制氧机。大家都有光明的未来，除了这艘该死的飞船。',
 low:'氧气不多了。先找地图上亮起来的氧源，别跑。SpaceX 的客服还能等，我的肺不行。',
 death:'又被应急系统拖回来了。还好笔记没丢。这破飞船的逃生程序，居然比它的导航靠谱。',
 complete:'成了，制氧机转起来了。从今天起，这里的空气不需要订阅。SpaceX，退钱！先把退票按钮从冥王星搬回来！',
 wrong:'听起来很有气势，可惜气势不能当氧气。看清线索再选，别拿肺给广告做测试。',
 oxygen:'补到氧了。谢谢这丛草，售后比星际运输公司强。',
 relay:'遗迹里还有旧航线图。原来这不是没来过人的星球，是来过的人把差评藏起来了。收集三类产氧样本，回这儿接通制氧机。',
 storm:'压力锋面来了！去旧石墙背后避风。连天气都想找 SpaceX 算账。',
 shelter:'石墙，免费掩护，还不用积分。人类在订阅制出现以前就已经登顶了。',
 repair:'样本就位。指针进绿区时锁定。我飞了四十光年，不能输给一台破机器。',
 scan:'扫描发出。绿的是产氧组织，红的是想让我停止呼吸的东西。至少广告很诚实。'
};
export const STORY_NODES=[
 {id:'silver-a',type:'plant',species:'silver',x:-4.8,z:7,name:'银露草丛',question:'银白色叶背挂着透明露珠。你要怎么做？',hint:'透明露珠 + 银白叶脉 = 可采集氧源。',choices:[{text:'采集银叶与透明露珠',good:true},{text:'直接吸入花粉',good:false},{text:'给 SpaceX 留一星差评',joke:'差评已保存。网络预计在 40 年后恢复。先采草。'}]},
 {id:'red-a',type:'plant',species:'red',x:1,z:9,name:'赤冠灌木',question:'红色荚壳散出刺鼻气味，旁边贴着「旗舰氧气 Pro」。',hint:'红色荚壳不产氧。广告不是生物检测。',choices:[{text:'相信旗舰宣传，打开荚壳',good:false},{text:'绕开它，找银白叶背',safe:true}]},
 {id:'trump',type:'archive',portrait:'trump',x:-9,z:13,name:'「空气再次伟大」纪念碑',title:'川普的遗言（展馆虚构版）',body:'「让空气再次伟大。」\n落款：地球名人馆编剧部。真正的植物记录刻在背面：银白叶脉、透明露珠，才是可提取的产氧组织。',question:'哪条信息能帮你活下来？',choices:[{text:'辨认银白叶背和透明露珠',good:true},{text:'对着石膏像喊口号',good:false},{text:'把造型夸张的头发当空气过滤器',joke:'头发是石膏的，滤不了空气，但非常能吸引注意。'}],clue:'在西侧和南侧草丛寻找银露草。红色荚壳会堵塞过滤器。'},
 {id:'silver-b',type:'plant',species:'silver',x:-12,z:18,name:'石墙后的银露草',question:'墙根的银叶上凝着水珠。采集一份，留一份再生。',choices:[{text:'采集银叶样本',good:true},{text:'连根拔起',good:false}]},
 {id:'ronaldo',type:'archive',portrait:'ronaldo',x:1,z:19,name:'「永不退役」展台',title:'C 罗：退休申请仍在补时',body:'公元 2486 年，展馆合成留言第 900 次宣布「我还没退役」。旧球场种植记录附注：银露草每 55 秒恢复；一直狂奔只会让氧气更快见底。',question:'草已经采过，下一步怎么办？',choices:[{text:'探索别处，等草丛恢复',good:true},{text:'对草喊 SIUU，要求加时',joke:'草接受了鼓励，但生长进度没有加速。'},{text:'原地冲刺，把氧气跑回来',good:false}],clue:'银露草采集后 55 秒再生；跑步更耗氧，原地也会耗氧。'},
 {id:'dew-a',type:'plant',species:'dew',x:7,z:25,name:'阴影露囊灌木',question:'石台阴面长着透明囊袋；黄色花粉囊在另一侧。',hint:'取透明露囊，避开黄色花粉。',choices:[{text:'收集透明露囊里的催化酶',good:true},{text:'挤破黄色花粉囊',good:false}]},
 {id:'lebron',type:'archive',portrait:'lebron',x:11,z:29,name:'九代净水冠军工作台',title:'勒布朗九代孙：不打球，修水',body:'工作日志：「祖上拿过很多冠军。轮到我，至少拿个净水冠军。」\n维修笔记：取阴面透明露囊，别挤黄色花粉袋。三类样本里，露囊负责催化。',question:'你准备带走哪种东西？',choices:[{text:'透明露囊的催化酶',good:true},{text:'冠军纪念滤芯包装',joke:'包装上写着 GOAT，但里面没有滤芯。'},{text:'黄色花粉，颜色比较冠军',good:false}],clue:'净水工作台西南的阴影灌木中，可采集透明露囊。'},
 {id:'dew-b',type:'plant',species:'dew',x:14,z:35,name:'倒墙边的露囊',question:'这片灌木里的透明囊袋正在缓慢鼓起。',choices:[{text:'收集透明露囊',good:true},{text:'吸一口旁边的黄色粉尘',good:false}]},
 {id:'musk',type:'archive',portrait:'musk',x:-11,z:32,name:'冥王星客服中继站',title:'马斯克去冥王星了，客服也去了',body:'广告牌：「我们的下一站：冥王星。」\n售后小字：「您的当前位置不在免费救援范围。」\n前任维修员留下真线索：断柱下蓝色脉络的苔藓是第三种产氧样本。',question:'最后一份样本在哪里？',choices:[{text:'断柱下的蓝脉苔藓',good:true},{text:'付费升级冥王星救援包',joke:'支付失败：本星球尚未开通免密缺氧。'},{text:'把广告牌接到氧气管上',good:false}],clue:'断柱附近的蓝脉苔，是制氧系统的稳定剂。'},
 {id:'moss-a',type:'plant',species:'moss',x:-7,z:37,name:'断柱下的蓝脉苔',question:'苔藓的蓝色脉络缓慢发亮，灰色粉末落在旁边。',choices:[{text:'刮取蓝色脉络的共生菌',good:true},{text:'把灰色石膏粉灌进过滤器',good:false}]},
 {id:'moss-b',type:'plant',species:'moss',x:0,z:32,name:'凹石里的蓝脉苔',question:'凹石深处有蓝色脉络，仍能收集氧气。',choices:[{text:'采集共生菌',good:true},{text:'吸入灰尘',good:false}]},
 {id:'relay',type:'relay',x:4,z:40,name:'废弃制氧中继台',title:'空气，不需要订阅',body:'用银叶叶绿体产氧，透明露囊催化，蓝脉共生菌稳定反应。接通这个时代真正有用的东西。',question:'三类样本齐全后，选择正确的供气方式。',choices:[{text:'装入三种样本，启动生物制氧循环',good:true},{text:'只插上「无限氧气」广告牌',good:false},{text:'给 SpaceX 客服打电话',joke:'您前面还有 8,642,109 位用户。预计等待时间：一个文明周期。'}]}
];
