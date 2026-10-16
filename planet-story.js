// Original narrative: connection without assuming the planet thinks like a person.
export const CHAPTERS=['01 · 非计划着陆','02 · 另一种节律','03 · 交换呼吸','04 · 留下余地','05 · 地球，请回答'];
export const WINDOW_SECONDS=900,UPLOAD_SECONDS=60,UPLOAD_OXYGEN=24;
export const ARC_VOICE={
 arc01_landing:{en:'SpaceX, you absolute bastards. You delivered the luggage more gently than me.',zh:'SpaceX，你们这帮混蛋。送行李都比送我温柔。'},
 arc02_closed:{en:'Open. Come on. Right. No customer-service button on a plant.',zh:'打开啊，快点。好吧。植物上没有客服按钮。'},
 arc03_first_breath:{en:'It opens, then closes. I was the one getting the timing wrong.',zh:'它会展开，也会闭合。一直弄错时机的是我。'},
 arc04_first_return:{en:'Air for the suit. Then the radio. Complaints can wait.',zh:'先给宇航服留氧，再开无线电。投诉可以晚一点。'},
 arc05_pump:{en:'Eighteen seconds. Fine. Something here gets to set its own schedule.',zh:'十八秒。行。这里总有东西能按自己的时间来。'},
 arc06_cave:{en:'The storm is still out there. This rock just happens to be in the way.',zh:'风暴还在外面。这块岩石只是刚好挡在这里。'},
 arc07_statue:{en:'Someone hid maintenance notes under the sales pitch. Best thing in this museum.',zh:'有人把维修笔记藏在了广告下面。这才是馆里最好的东西。'},
 arc08_pump_return:{en:'Same pulse, every time. I do not know what it means. I can work with it.',zh:'每次都是同样的起伏。我不知道它意味着什么。但我能顺着这个规律来。'},
 arc09_feed:{en:'It took the dew. That does not mean it likes me. Let us see what happens.',zh:'它吸收了露液。这不代表它喜欢我。再看看会发生什么。'},
 arc10_exhale:{en:'There. It breathes out. That is my opening.',zh:'就是现在。它正在排气。这是我取氧的机会。'},
 arc11_release:{en:'That is enough for the return trip. Disconnect.',zh:'够回营地了。断开。'},
 arc12_overdraw:{en:'More air. Less flow next time. I will remember that.',zh:'多拿了一点氧。下次的流量会更少。我得记住。'},
 arc13_lakeshore:{en:'I thought this place was empty. I just was not looking.',zh:'我以为这里什么都没有。只是我一直没认真看。'},
 arc14_final_valve:{en:'Watch the pressure. Do not rush it. I know this part now.',zh:'看着压力。别抢。这一段我已经懂了。'},
 arc15_contact:{en:'They have my coordinates. Good. I still want to go home.',zh:'他们收到我的坐标了。很好。我还是想回家。'},
 arc16_dawn:{en:'But I would like to see what this place does at sunrise. Just once.',zh:'不过，我想看看这里日出时会是什么样。哪怕一次。'},
 arc17_repair:{en:'That old pump is still draining the root bed. Shut it down. Leave something here.',zh:'旧泵还在抽干这片根床。关掉它。给这里留下一点。'},
 arc18_restored:{en:'The flow has changed. No thank you. No promise. It does not owe me either.',zh:'流向变了。没有感谢，也没有承诺。它本来就不欠我这些。'}
};
export const BRIEFS=[
 {title:'第一声回音',body:'短时殖民中继已连通。你正在使用的蓝息质会储存氧气。我们只能发来数据，无法隔着四十光年替你呼吸。强锋面将在倒计时结束时封锁中继。',clue:'先给宇航服补气。西南蓝脉洞窟有稳定菌床：放下唯一收集器，18 秒后最多收回 60 L；也可以提前收走已有产物。带回至少 20 L 洞穴气体。',reward:'解锁：锋面提前预报',node:'cave-siphon'},
 {title:'这里有自己的时间',body:'菌床的气体流量与湖岸起伏一致。相关性不等于它在回答你。先记录，再判断。旧展园的维修员似乎也发现过这种规律。',clue:'透明露囊可以喂给肺囊。喂养后等它排气，收取 48 L；强抽 70 L 会让它休眠更久。带回至少 24 L 共生气体。可以先在洞里放泵，沿途采集后再取回。',reward:'解锁：肺囊呼吸窗口与回程估算',node:'dew-a'},
 {title:'一处仍在扩大的伤口',body:'旧殖民项目把湖岸当作无穷的气源。根床旁的废泵还连着管线。记录中的变化未必针对人类，但持续抽取正在改变这片生态。',clue:'去旧根床：用一份露液和背罐 12 L 为组织回灌，关闭废泵。然后到湖岸观察六秒。带回至少 16 L 潮汐气体校准上行。沿途依然需要采集才能呼吸。',reward:'解锁：根床回灌接口与湖岸观测点',node:'root-wound'},
 {title:'把坐标送来，把这个地方留下',body:'流向改变已记录。我们不知道湖岸的同步起伏是交流、反馈，还是你尚未理解的过程。你的记录已经足够重要，不必用抽干它来证明。',clue:'返回营地。宇航服至少 35%，储备至少 42 L。上行持续 60 秒，通信本身消耗 24 L，另需留出呼吸用氧。可随时按 R 暂停上传、补给后继续；已确认分段保留。',reward:'解锁：最终上行与两种日志署名',node:'camp'},
 {title:'坐标已确认',body:'求救坐标与生态记录已送达。营救不会立刻到来，但你终于留下了一个可靠的位置。这里依然陌生，也依然值得明天再看。',clue:'本章已完成。可以查看结算，或带着现有储备继续探索。',reward:'记录已保存',node:'camp'}
];
export const ARCHIVE_CLUES={trump:'广告遮住了测量记录：银白叶片展开时可采集，赤冠孢子不能呼吸。',ronaldo:'维修节拍：气孔压力进入中间绿色区后再锁定；未完成的阀位也能提前回收。',lebron:'透明露囊喂肺囊。排气期间取氧，强抽会让肺囊休眠 180 秒。',musk:'废泵还连着旧根床。维修接口需要一份露液和 12 L 回灌气体，位置已标记。'};
