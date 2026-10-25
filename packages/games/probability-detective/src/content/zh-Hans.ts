import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: '蓝色包裹',
      story: '街角小店收到一个没有寄件人的包裹。它一定来自给这条街送货的某个仓库。',
      lead: '这条街的包裹来自：',
      hyps: { north: '北仓', south: '南仓', east: '东仓' },
      clues: {
        blue: { label: '用蓝纸包着', seen: '包裹用蓝纸包着。', notSeen: '包裹没有用蓝纸包着。' },
        'brown-tape': { label: '用棕色胶带封口', seen: '它用棕色胶带封口。', notSeen: '它没有用棕色胶带封口。' },
        smudge: { label: '标签模糊', seen: '地址标签模糊不清。', notSeen: '地址标签很干净。' },
        string: { label: '用绳子捆着', seen: '它用绳子捆着。', notSeen: '它没有用绳子捆着。' },
        tuesday: { label: '星期二送到', seen: '它是星期二送到的。所有仓库每个工作日都送货。', notSeen: '它是星期二送到的。所有仓库每个工作日都送货。' },
        'echo-blue': { label: '邻居也看到了', seen: '邻居也说包裹是蓝色的——她看到的是同一个包裹。', notSeen: '邻居也说包裹是蓝色的——她看到的是同一个包裹。' }
      }
    },
    'c-garden': {
      title: '被啃过的草莓',
      story: '夜里有谁吃了草莓。这个花园里有几种访客都爱偷吃草莓。',
      lead: '草莓被啃的夜晚，访客是：',
      hyps: { birds: '鸟', snails: '蜗牛', hedgehog: '刺猬' },
      clues: {
        slime: { label: '发亮的痕迹', seen: '小路上有一道发亮的痕迹。', notSeen: '没有发亮的痕迹。' },
        pecks: { label: '小小的啄痕', seen: '果子上有小小的啄痕。', notSeen: '没有啄痕。' },
        droppings: { label: '树篱下的粪便', seen: '树篱下有粪便。', notSeen: '树篱下什么也没有。' },
        'net-moved': { label: '网被拨开', seen: '菜畦上的网被拨到一边。', notSeen: '网还在原处。' },
        rain: { label: '昨晚下了雨', seen: '昨晚下了雨——下雨时它们都会出来。', notSeen: '昨晚下了雨——下雨时它们都会出来。' },
        'echo-slime': { label: '早上又看到了', seen: '邻居指给你看的是同一道发亮的痕迹。', notSeen: '邻居指给你看的是同一道发亮的痕迹。' }
      }
    },
    'c-cups': {
      title: '有裂纹的杯子',
      story: '一位顾客退回一只有细裂纹的杯子。作坊里所有机器都做同一种杯子，但每台机器都有自己的小毛病。',
      lead: '作坊的杯子出自：',
      hyps: { a: '机器甲', b: '机器乙', c: '机器丙' },
      clues: {
        crack: { label: '细裂纹', seen: '杯子上有一道细裂纹。', notSeen: '杯子上有一道细裂纹。' },
        glaze: { label: '釉色偏深', seen: '釉色比平常略深。', notSeen: '釉色看起来正常。' },
        stamp: { label: '杯底印章清晰', seen: '杯底的制造印章很清晰。', notSeen: '杯底的印章模糊。' },
        handle: { label: '把手略歪', seen: '把手稍微偏离中间。', notSeen: '把手是正的。' },
        box: { label: '装在灰盒子里', seen: '它装在常用的灰盒子里寄来——所有机器的杯子都这样。', notSeen: '它装在常用的灰盒子里寄来——所有机器的杯子都这样。' }
      }
    },
    'c-key': {
      title: '不见了的钥匙',
      story: '备用钥匙又不见了。它几乎总在那么几个老地方之一。',
      lead: '钥匙不见时，它会出现在：',
      hyps: { coat: '外套里', car: '车里', office: '办公室' },
      clues: {
        'search-coat': { label: '快速翻一下外套就找到', seen: '你在外套里找到了钥匙。', notSeen: '你快速翻了翻外套口袋：没有钥匙。快速翻找可能会漏掉。' },
        'search-car': { label: '快速看一下车里就找到', seen: '你在车里找到了钥匙。', notSeen: '你快速看了看车里：没有钥匙。快速查看可能会漏掉。' },
        jingle: { label: '门厅里的叮当声', seen: '你记得挂外套时有一声叮当。', notSeen: '你不记得有叮当声。' },
        drove: { label: '你昨天开过车', seen: '你昨天开过车。', notSeen: '你昨天没有开车。' },
        'office-day': { label: '你去过办公室', seen: '你昨天去过办公室。', notSeen: '你昨天在家办公。' },
        weekday: { label: '今天是工作日', seen: '今天是工作日——这不影响钥匙最后在哪里。', notSeen: '今天是工作日——这不影响钥匙最后在哪里。' }
      }
    },
    'c-coin': {
      title: '集市上的硬币',
      story: '你在集市上一个卖魔术道具的摊位找到一枚旧硬币。光看分不出它和普通硬币有什么不同，于是你抛一抛。',
      lead: '摊位旧硬币盒里的硬币是：',
      hyps: { ordinary: '普通硬币', weighted: '偏重的硬币', 'two-headed': '两面都是正面的硬币' },
      clues: {
        toss1: { label: '第一次抛出正面', seen: '第一次：正面。', notSeen: '第一次：反面。' },
        toss2: { label: '第二次抛出正面', seen: '第二次：正面。', notSeen: '第二次：反面。' },
        toss3: { label: '第三次抛出正面', seen: '第三次：正面。', notSeen: '第三次：反面。' },
        toss4: { label: '第四次抛出正面', seen: '第四次：正面。', notSeen: '第四次：反面。' }
      }
    },
    'c-message': {
      title: '“俱乐部”发来的消息',
      story: '一条消息自称来自你的体育俱乐部，要求你确认会员资格。',
      lead: '自称来自俱乐部的消息：',
      hyps: { real: '真的来自俱乐部', fake: '是假的' },
      clues: {
        link: { label: '带有链接', seen: '里面有一个链接。', notSeen: '里面没有链接。' },
        sender: { label: '陌生的发件地址', seen: '发件地址不是俱乐部平常用的。', notSeen: '发件地址是平常那个。' },
        hurry: { label: '催你赶快', seen: '它说你必须今天回复。', notSeen: '它没有设期限。' },
        'your-name': { label: '叫出你的名字', seen: '它用你的名字称呼你。', notSeen: '它只写着“亲爱的会员”。' },
        evening: { label: '晚上收到', seen: '它是晚上到的——两种消息随时都会来。', notSeen: '它是晚上到的——两种消息随时都会来。' }
      }
    },
    'c-oven': {
      title: '烤焦的面包',
      story: '今早这一炉里有一个面包一侧烤焦了。面包房用两台烤炉烤面包。',
      lead: '这里的面包出自：',
      hyps: { old: '旧烤炉', new: '新烤炉' },
      clues: {
        'burnt-side': { label: '一侧烤焦', seen: '它一侧烤焦了。', notSeen: '它一侧烤焦了。' },
        'pale-top': { label: '顶部发白', seen: '顶部颜色发白。', notSeen: '顶部均匀金黄。' },
        'tray-mark': { label: '新烤盘的花纹', seen: '底部有新烤盘的花纹。', notSeen: '底部是光滑的。' },
        early: { label: '第一炉的', seen: '它是第一炉烤的。', notSeen: '它是后面几炉烤的。' },
        seeds: { label: '上面有籽', seen: '上面撒了籽——两台烤炉都烤带籽的面包。', notSeen: '上面撒了籽——两台烤炉都烤带籽的面包。' }
      }
    },
    'c-beep': {
      title: '收音机里微弱的哔声',
      story: '无线电俱乐部的接收机收到一个微弱而规律的哔声。这类哔声大多是干扰，但也有一颗小卫星从头顶飞过。',
      lead: '这台接收机上微弱规律的哔声是：',
      hyps: { satellite: '小卫星的信号', interference: '普通干扰' },
      clues: {
        'pass-time': { label: '卫星过境时', seen: '它出现时卫星正该从头顶经过。', notSeen: '它出现时并没有过境安排。' },
        drift: { label: '音调慢慢漂移', seen: '音调慢慢漂移，就像移动的信号源那样。', notSeen: '音调保持不变。' },
        fades: { label: '过一会儿就消失', seen: '大约十分钟后它就消失了。', notSeen: '它一直响个不停。' },
        rhythm: { label: '节奏均匀', seen: '它以均匀的节奏响着——两者都会这样。', notSeen: '它以均匀的节奏响着——两者都会这样。' },
        'other-receiver': { label: '另一台接收机也收到', seen: '城另一头的俱乐部成员也听到了。', notSeen: '城另一头的接收机什么也没收到。' }
      }
    },
    'c-rain': {
      title: '夜里下雨了吗？',
      story: '你夜里不在家，想知道幼苗淋到雨了没有，还是现在就得浇水。',
      lead: '每年这个时候的夜晚：',
      hyps: { rained: '下了雨', dry: '没下雨' },
      clues: {
        'wet-grass': { label: '草是湿的', seen: '草是湿的（露水也会打湿它）。', notSeen: '草是干的。' },
        gauge: { label: '雨量计里有水', seen: '雨量计里有水。', notSeen: '雨量计是空的。' },
        puddle: { label: '门边的水洼', seen: '门边有一个水洼。', notSeen: '门边没有水洼。' },
        'snails-out': { label: '小路上的蜗牛', seen: '小路上有蜗牛爬出来。', notSeen: '小路上没有蜗牛。' },
        wind: { label: '桌上的落叶', seen: '风把叶子吹到了桌上——无论如何都刮了风。', notSeen: '风把叶子吹到了桌上——无论如何都刮了风。' }
      }
    },
    'c-bird': {
      title: '喂食器旁是什么鸟？',
      story: '你只瞥见喂食器旁有一只棕色小鸟，它就飞走了。这里的比例是为这个喂食器编造的；真实比例因地而异。',
      lead: '来这个喂食器的棕色小访客是：',
      hyps: { finch: '一只雀', sparrow: '一只麻雀' },
      clues: {
        'red-patch': { label: '一抹红色', seen: '你看到它头上有一抹红色。', notSeen: '你完全没看到红色。' },
        ground: { label: '在地上吃食', seen: '它在喂食器下面的地上吃食。', notSeen: '它在喂食器上吃食。' },
        song: { label: '婉转的鸣唱', seen: '它婉转地鸣唱。', notSeen: '它只是叽叽叫。' },
        group: { label: '成群而来', seen: '它和一小群一起来的。', notSeen: '它是独自来的。' },
        morning: { label: '早上', seen: '那是清晨——两种鸟都会在这个时候来。', notSeen: '那是清晨——两种鸟都会在这个时候来。' }
      }
    },
    'c-plant': {
      title: '耷拉的盆栽',
      story: '办公室的植物耷拉着，叶子发黄。在这间办公室，通常是两种原因之一。',
      lead: '这里的植物耷拉时，原因是：',
      hyps: { water: '浇水太多', light: '光照太少' },
      clues: {
        'wet-soil': { label: '土是湿的', seen: '浇水两天后土还是湿的。', notSeen: '土是干的。' },
        leaning: { label: '向窗户倾斜', seen: '它向窗户倾斜。', notSeen: '它长得笔直。' },
        'soft-stem': { label: '茎基发软', seen: '茎的底部发软。', notSeen: '茎很结实。' },
        'pale-new': { label: '新叶发白', seen: '新叶颜色浅、个头小。', notSeen: '新叶看起来很健康。' },
        'pot-colour': { label: '蓝色花盆', seen: '它种在蓝色花盆里——这不改变任何事。', notSeen: '它种在蓝色花盆里——这不改变任何事。' }
      }
    },
    'c-bus': {
      title: '公交车为什么晚点？',
      story: '今天早上你坐的公交车晚了四十分钟。',
      lead: '这路车严重晚点时，原因是：',
      hyps: { jam: '堵车', breakdown: '故障' },
      clues: {
        'others-late': { label: '其他车也晚点', seen: '同一条路上的其他公交车也晚点了。', notSeen: '路上的其他公交车都准点。' },
        replacement: { label: '来了另一辆车', seen: '来的不是平常那辆车。', notSeen: '来的是平常那辆车。' },
        announcement: { label: '一条通知', seen: '显示屏写着：因技术故障延误。', notSeen: '显示屏没有说明原因。' },
        'rush-hour': { label: '高峰时段', seen: '当时是高峰时段。', notSeen: '当时是一天中清闲的时段。' },
        rain: { label: '在下雨', seen: '当时在下雨——在这个车站这没有影响。', notSeen: '当时在下雨——在这个车站这没有影响。' }
      }
    }
  },
checks: {
    'k-picnic': {
      title: '在户外还是在礼堂？',
      story: '社区野餐在今天下午。你可以在草坪上办，也可以订社区礼堂。',
      lead: '每年这个时候的下午：',
      hyps: { dry: '晴', rain: '下雨' },
      question: '下午晴天的可能性有多大？',
      options: { outdoors: '在草坪上野餐', hall: '订礼堂', tent: '在草坪上搭帐篷' },
      checks: {
        sky: { label: '中午看看天', yes: '中午前乌云密布。', no: '中午前没有乌云。' },
        barometer: { label: '看看气压计', yes: '气压在下降。', no: '气压稳定。' },
        farmer: { label: '问问附近的农民', yes: '农民觉得会下雨。', no: '农民觉得下午会晴。' },
        service: { label: '打电话给气象服务', yes: '气象服务发出降雨预警。', no: '气象服务没有发出预警。' },
        swallows: { label: '看看燕子', yes: '燕子飞得很低。', no: '燕子飞得很高。' }
      }
    },
    'k-bike': {
      title: '买这辆二手自行车吗？',
      story: '一辆二手自行车价格不错。这种车通常没问题，但有些有暗伤。',
      lead: '这样的二手自行车：',
      hyps: { sound: '完好', damaged: '有暗伤' },
      question: '这辆车完好的可能性有多大？',
      options: { buy: '买下', skip: '不买', 'offer-less': '压低价钱，承担风险' },
      checks: {
        ride: { label: '试骑一下', yes: '试骑很顺。', no: '试骑很颠。' },
        chain: { label: '看看链条', yes: '链条生锈了。', no: '链条很干净。' },
        receipts: { label: '要维修单据', yes: '卖家有维修单据。', no: '卖家没有单据。' },
        mechanic: { label: '花钱请修车师傅看看', yes: '师傅发现了问题。', no: '师傅什么也没发现。' },
        'seller-says': { label: '问卖家', yes: '卖家说没问题。', no: '卖家也说不准。' }
      }
    },
    'k-seeds': {
      title: '播下旧种子吗？',
      story: '棚子里翻出一包忘了的种子。播种要花一个周末；新种子要花一点钱。',
      lead: '这样被遗忘的种子包：',
      hyps: { good: '还能用', dead: '大多已死' },
      question: '种子还能用的可能性有多大？',
      options: { sow: '播下旧种子', fresh: '买新种子' },
      checks: {
        float: { label: '放几粒到水里', yes: '大多数种子沉下去了。', no: '大多数种子浮着。' },
        sprout: { label: '在湿布上试几粒', yes: '大多数发了芽。', no: '只有少数发芽。' },
        date: { label: '看包装上的日期', yes: '日期很近。', no: '日期很旧。' },
        shrivelled: { label: '仔细看看种子', yes: '种子看起来干瘪。', no: '种子看起来饱满。' },
        smell: { label: '闻一闻', yes: '闻起来新鲜。', no: '闻起来有霉味。' }
      }
    },
    'k-melon': {
      title: '买这个瓜吗？',
      story: '市场上还剩一个价格不错的甜瓜。',
      lead: '这个时候这个摊上剩下的瓜：',
      hyps: { ripe: '熟了', unripe: '还没熟' },
      question: '这个瓜熟了的可能性有多大？',
      options: { buy: '买下', leave: '不买' },
      checks: {
        knock: { label: '敲一敲', yes: '声音发空。', no: '声音发闷。' },
        smell: { label: '闻一闻', yes: '闻起来很甜。', no: '几乎没什么味道。' },
        'soft-end': { label: '按一按瓜蒂那头', yes: '那头有点软。', no: '那头很硬。' },
        taste: { label: '尝一片同一箱的', yes: '那片很甜。', no: '那片没味道。' },
        sticker: { label: '看看标签', yes: '上面贴着“已熟”标签。', no: '上面没有标签。' }
      }
    },
    'k-bread': {
      title: '为集市多烤些吗？',
      story: '明天是集市日。多烤的面包在热闹的日子好卖，在冷清的日子会变硬。',
      lead: '这里的集市日：',
      hyps: { busy: '热闹', quiet: '冷清' },
      question: '集市日热闹的可能性有多大？',
      options: { extra: '多烤很多', normal: '按平常的量烤', 'little-extra': '稍微多烤一点' },
      checks: {
        calendar: { label: '查镇上的活动日历', yes: '日历上有一个活动。', no: '日历上什么也没有。' },
        neighbour: { label: '问问奶酪摊', yes: '奶酪摊预计人会很多。', no: '奶酪摊预计会很清静。' },
        sunny: { label: '看天气预报', yes: '预报有太阳。', no: '预报多云。' },
        office: { label: '打电话给集市办公室', yes: '集市办公室预计访客很多。', no: '集市办公室预计和平常一样。' },
        'last-week': { label: '想想上周', yes: '上周很热闹。', no: '上周很冷清。' }
      }
    },
    'k-laptop': {
      title: '自己修吗？',
      story: '笔记本电脑会突然关机。如果是小毛病，在家修很便宜；如果是大毛病，就白费力气。',
      lead: '这样的故障：',
      hyps: { minor: '小毛病', major: '大毛病' },
      question: '是小毛病的可能性有多大？',
      options: { repair: '在家修', shop: '送去维修店', wait: '先观察' },
      checks: {
        'error-code': { label: '重启并观察', yes: '出现一个错误代码。', no: '没有出现错误代码。' },
        diagnostics: { label: '运行诊断工具', yes: '工具报告了故障。', no: '工具什么也没报告。' },
        cable: { label: '换一根电源线', yes: '换线后就能用。', no: '还是会关机。' },
        fan: { label: '听听风扇', yes: '风扇有摩擦声。', no: '风扇声音正常。' },
        forum: { label: '看看论坛', yes: '同型号的人说是小毛病。', no: '同型号的人说原因各不相同。' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: '路灯传感器',
      story: '镇上用传感器检查旧路灯。所有路灯中，{f} 确实坏了。传感器会标出坏路灯中的 {s}，但也会误标好路灯中的 {q}。刚刚 {lamp} 号路灯被标出来了。',
      questions: { q1: '{lamp} 号路灯更可能是坏的还是好的？', q2: '{lamp} 号路灯是坏的概率有多大？' },
      options: { faulty: '更可能是坏的', working: '更可能是好的' },
      explain: '数一数被标出的路灯：被标出的 {n} 盏中有 {k} 盏真的坏了，所以概率是 {p}。能不能相信一次标记，不只取决于传感器有多好，还取决于坏路灯有多罕见。',
      labels: { faulty: '坏路灯', working: '好路灯', fit: '被标出' }
    },
    't-wheel': {
      title: '转盘',
      story: '一个公平的转盘有 {k} 个相等的扇区，其中 {r} 个画着星星。最近 {s} 次都没转到星星。',
      questions: { q1: '下一次转，星星……', q2: '下一次转到星星的概率有多大？' },
      options: { more: '比平常更可能出现', less: '比平常更不可能出现', same: '和往常一样可能出现' },
      explain: '转盘没有记忆：每一次都从头开始，所以星星仍然有 {p} 的机会出现。',
      labels: { spins: '没转到的几次和下一次' }
    },
    't-sequence': {
      title: '哪个结果更可能？',
      story: '一枚公平的硬币抛 {n} 次（● 正面，○ 反面）。两种可能的结果：甲 {a}，乙 {b}。',
      questions: { q1: '哪个确切结果更可能出现？', q2: '恰好得到结果乙的概率有多大？' },
      options: { a: '甲', b: '乙', same: '两者一样可能' },
      explain: '一共有 {total} 种可能的结果，每一种确切结果的概率都一样，都是 {p}。乙只是看起来更常见，因为混杂的结果作为一类很常见。',
      labels: { a: '甲', b: '乙' }
    },
    't-conjunction': {
      title: '雨和风',
      story: '明天的预报说下雨的可能性是 {a}。这里下雨的日子里有 {b} 会刮风；晴天里有 {w} 会刮风。',
      questions: { q1: '明天哪种情况更可能？', q2: '又下雨又刮风的一天的概率有多大？' },
      options: { windy: '刮风的一天', both: '又下雨又刮风的一天', same: '两者一样' },
      explain: '想象 {days} 个像明天这样的日子：其中 {both} 天又下雨又刮风，但刮风的总共有 {windy} 天。每个又下雨又刮风的日子也都是刮风的日子，所以“下雨又刮风”永远不可能比“刮风”更可能。',
      labels: { windy: '刮风', calm: '无风', rainy: '雨天', dry: '晴天' }
    },
    't-simpson': {
      title: '两家快递公司',
      story: '两家快递公司公布了上个月准时送达的次数。甲公司：短途 {aSn} 单中 {aSk} 单，长途 {aLn} 单中 {aLk} 单。乙公司：短途 {bSn} 单中 {bSk} 单，长途 {bLn} 单中 {bLk} 单。',
      questions: { q1: '总体上哪家公司准时的次数更多？', q2: '你的包裹要走长途。哪家公司长途的记录更好？' },
      options: { a: '甲公司', b: '乙公司', same: '一样' },
      explain: '甲在短途和长途上都更好，但乙总体更好（准时 {b} 单对 {a} 单），因为乙主要跑更容易的短途。要拿同类相比。',
      labels: { a: '甲公司', b: '乙公司', short: '短途', long: '长途', overall: '总体' }
    },
    't-paw': {
      title: '面粉上的爪印',
      story: '夜里有谁踩过了面包房地上的面粉。爪印和邻居家的猫吻合。只有 {r} 的猫有这样的爪印。附近大约有 {n} 只猫住得够近，可能进来过。',
      questions: { q1: '“只有 {r}”是不是说几乎可以肯定是邻居家的猫？', q2: '是邻居家的猫的概率有多大？假设附近每只猫进来的可能性都一样。' },
      options: { yes: '是，大约 {sure} 肯定', no: '不是，远没有那么肯定' },
      explain: '附近的 {n} 只猫里，大约还有 {others} 只的爪印也吻合。邻居家的猫只是几只符合的猫之一：{p}。',
      labels: { neighbour: '邻居家的猫进来的夜晚', others: '别的猫进来的夜晚', fit: '爪印吻合' }
    },
    't-bakery': {
      title: '小面包房和大面包房',
      story: '两家面包房卖黑麦面包和小麦面包。平均来说卖出的面包有一半是黑麦的，每个面包都是独立的选择。小面包房每天卖 {n1} 个，大面包房卖 {n2} 个。',
      questions: { q1: '哪家面包房里，卖出的面包中黑麦超过 {t} 的日子更多？', q2: '小面包房黑麦超过 {t} 的日子占多少？' },
      options: { small: '小面包房', large: '大面包房', same: '差不多' },
      explain: '小样本波动更大。小面包房这样的日子占 {small}，大面包房只占 {large}。',
      labels: { small: '小面包房', large: '大面包房' }
    },
    't-drawers': {
      title: '知情的管理员',
      story: '{n} 个关着的抽屉里有一个放着钥匙。你指了一个抽屉。知道钥匙在哪的管理员接着打开其他抽屉中的 {opened} 个，全是空的，只留另外一个关着。他每次都这样做，而且从不打开你选的那个。',
      questions: { q1: '守着你的抽屉，还是换成另一个关着的？', q2: '钥匙在另一个关着的抽屉里的概率有多大？' },
      options: { switch: '换', keep: '守着我的', same: '没区别' },
      explain: '想象 {total} 局游戏。你一开始选对的只是其中一部分。在其余 {wins} 局里，管理员只能让有钥匙的抽屉关着，所以换就赢：{p}。',
      labels: { right: '第一次就选中钥匙的局', wrong: '没选中的局', fit: '换就赢' }
    },
    't-week': {
      title: '至少一个雨天',
      story: '你计划一趟 {m} 天的旅行。每天下雨的可能性都是 {q}，和其他天无关。',
      questions: { q1: '至少有一个雨天的概率有多大？' },
      options: {},
      explain: '把概率加起来会得到 {sum}，这不可能对。应该把晴天的概率相乘：完全不下雨的概率是 {none}，所以至少有一个雨天的概率是 {p}。',
      labels: { step: '到第 {n} 天仍是晴天' }
    },
    't-numbers': {
      title: '同一个数出现两次',
      story: '{g} 个人每人偷偷随机选一个从一到 {r} 的整数。',
      questions: { q1: '至少两个人选到同一个数的概率有多大？先凭直觉：', q2: '现在估计一下：至少有一个相同数字的概率是多少？' },
      options: { low: '不到四分之一', even: '大约一半一半', high: '超过四分之三' },
      explain: '{g} 个人之间有 {pairs} 对可能相同，所以相同比感觉中来得更快：{p}。',
      labels: { step: '前 {n} 个人各不相同' }
    },
    't-tyres': {
      title: '扎胎减半',
      story: '一种新轮胎把每一百次骑行中的扎胎从 {b} 次降到 {a} 次。厂家称之为“扎胎减少 {rel}”。',
      questions: { q1: '骑行 {rides} 次，扎胎会少几次？' },
      options: {},
      explain: '骑行 {rides} 次，之前扎胎 {old} 次，之后 {new} 次：少了 {fewer} 次。“减少 {rel}”听起来很多；你真正感受到的是绝对变化。',
      labels: { old: '旧轮胎', new: '新轮胎', fit: '扎胎' }
    },
    't-dice': {
      title: '两颗骰子',
      story: '你掷两颗普通的骰子，把点数加起来。',
      questions: { q1: '哪个和更可能：{s1} 还是 {s2}？', q2: '和为 {s1} 的概率有多大？' },
      options: { first: '{s1}', second: '{s2}', same: '一样可能' },
      explain: '在三十六种等可能的结果中，{c1} 种的和是 {s1}，{c2} 种的和是 {s2}。',
      labels: {}
    }
  }
};
