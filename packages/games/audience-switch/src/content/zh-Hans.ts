import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: '数据库迁移',
    situation: '你的团队正在把客户数据库迁移到新系统。测试发现了一个问题，切换要推迟。请解释这件事。',
    facts: {
      newDate: '切换推迟两天：从周二改到周四。',
      cause: '测试发现了一个此前未知的错误，涉及 ü 或 é 这样的特殊字符。',
      noLoss: '没有丢失任何数据。',
      encoding: '导入脚本用错误的字符编码读取文本。',
      apology: '给您带来不便，我们深表歉意。',
      regression: '一个新的自动化测试现在会检查特殊字符。',
      buffer: '这两天在项目的时间缓冲之内，不产生额外费用。',
      library: '错误的转换来自多年前选用的一个库。'
    },
    reasons: {
      'developer.cause': '开发人员需要知道测试到底发现了什么。',
      'developer.encoding': '这是他们要处理的根本原因。',
      'developer.apology': '向客户道歉并不能帮助同事修复错误。',
      'developer.regression': '他们需要知道这个错误现在已有测试覆盖。',
      'developer.buffer': '时间缓冲和预算是项目负责人关心的事。',
      'projectManager.newDate': '项目负责人要按新日期做计划。',
      'projectManager.noLoss': '数据丢失会彻底改变风险，所以他需要听到没有丢失。',
      'projectManager.encoding': '编码细节不会改变任何计划决定。',
      'projectManager.apology': '道歉是给客户的；项目负责人需要的是事实。',
      'projectManager.buffer': '进度和预算是否还能保住，正是他关心的问题。',
      'projectManager.library': '多年前是谁选了这个库，对现在的计划没有帮助。',
      'customer.newDate': '客户需要的是新日期，而不是错误类型。',
      'customer.noLoss': '客户最担心的是自己的数据，而数据是安全的。',
      'customer.cause': '错误细节只会让客户担心，却帮不上忙。',
      'customer.encoding': '技术内部细节对客户没有意义。',
      'customer.regression': '内部测试不是客户关心的事。',
      'customer.buffer': '内部缓冲和成本与客户无关。',
      'customer.library': '把责任推给一个旧库听起来像借口。'
    },
    messages: {
      'developer.fit': '提醒一下：导入脚本用错误的编码读取文本，所以 ü、é 这类特殊字符会出错。现在已有回归测试覆盖；切换改到周四。',
      'developer.missing': '迁移稍微延迟，没什么大事。细节稍后再说。',
      'developer.condescending': '特殊字符就是像 ü 这样不在基本字母表里的字母。计算机把字母存成数字，有时候数字会弄混。',
      'projectManager.fit': '迁移从周二推迟到周四。没有丢失数据，这两天也在我们的缓冲之内，不产生额外费用。原因：一个特殊字符错误，现在已有测试覆盖。',
      'projectManager.tooMuch': '导入脚本把输入按 Latin-1 而不是 UTF-8 解码，导致多字节字符损坏；我们正在修补读取器并添加回归测试。',
      'projectManager.missing': '我们发现了一个错误，正在处理。之后通知你。',
      'customer.fit': '您的数据是安全的。为确保每个姓名和地址都能正确迁移，我们把切换从周二推迟到周四。在此之前，一切照常运行。',
      'customer.tooMuch': '我们的导入脚本用错了字符编码，在测试运行中损坏了特殊字符，所以迁移需要占用我们缓冲中的额外两天。',
      'customer.condescending': '技术方面的事您不用操心，很复杂的。您只要知道会晚一点就行了。'
    }
  },
  skyBlue: {
    title: '天空为什么是蓝色的',
    situation: '有人问你天空为什么是蓝色的。你了解背后的物理原理。请解释。',
    facts: {
      sunlight: '阳光包含所有颜色。',
      scatter: '空气对蓝光的散射远强于红光。',
      rayleigh: '这种瑞利散射随频率的四次方增长（1/λ⁴）。',
      sunset: '日落时，光要穿过更多空气，所以天空变成红色和橙色。',
      everywhere: '被散射的蓝光从四面八方进入你的眼睛，所以整个天空看起来都是蓝的。',
      violet: '紫光散射得更强，但阳光中的紫光较少，而且我们的眼睛对它不太敏感。',
      molecules: '散射来自氮分子和氧分子，它们比光的波长小得多。',
      ocean: '天空是蓝色的，因为它反射了大海。'
    },
    reasons: {
      'child.sunlight': '孩子首先需要惊喜：白色的阳光里藏着所有颜色。',
      'child.scatter': '这是核心想法，用简单的话说出来。',
      'child.rayleigh': '一出现公式，孩子马上就听不下去了。',
      'child.everywhere': '它解释了孩子看到的现象：往哪儿看都是蓝色。',
      'child.violet': '在这个年龄，紫光的细节带来的困惑多于帮助。',
      'child.molecules': '分子和波长对孩子来说太抽象了。',
      'layperson.sunlight': '没有这一点，“蓝光被散射”就说不通。',
      'layperson.scatter': '这就是答案本身，用日常语言说出来。',
      'layperson.rayleigh': '公式没有给普通人带来任何可用的东西。',
      'expert.rayleigh': '专家期待精确的机制及其与波长的关系。',
      'expert.everywhere': '这对专家来说显而易见，只会浪费时间。',
      'expert.violet': '专家都知道那个显而易见的疑问：“为什么不是紫色？”——要回答它。',
      'expert.molecules': '说出散射体和尺寸比例，会让解释更精确。',
      ocean: '这是一个常见的误解；颜色并非来自大海。'
    },
    messages: {
      'child.fit': '阳光看起来是白色的，其实里面混着所有颜色。阳光穿过空气时，蓝色的部分被弹来弹去得最厉害，所以蓝色会从天空的各个地方跑进你的眼睛。',
      'child.tooMuch': '蓝光的波长更短，而瑞利散射与波长四次方的倒数成正比。',
      'child.missing': '天空就是这样的，它一直都是蓝色的。',
      'layperson.fit': '阳光包含所有颜色。空气对蓝光的散射比红光强得多，所以蓝光会从天空的每个方向到达我们。',
      'layperson.tooMuch': '这是瑞利散射：强度与 1/λ⁴ 成正比，所以短波长在天空的漫射辐射中占主导。',
      'layperson.condescending': '这对不搞科学的人来说有点复杂。就当是空气把它变蓝了吧。',
      'expert.fit': 'N₂ 和 O₂ 分子引起的瑞利散射，与 1/λ⁴ 成正比。紫光散射更强，但太阳光谱中紫光较少，而且我们的视锥细胞对它不太敏感。',
      'expert.condescending': '把阳光想象成一盒彩色蜡笔！空气最喜欢玩蓝色的那支。',
      'expert.missing': '空气对蓝光散射更强，就是这样。'
    }
  },
  clubRoof: {
    title: '俱乐部会所的屋顶',
    situation: '你们体育俱乐部会所的屋顶急需维修，费用比计划的高。请解释这件事。',
    facts: {
      cost: '维修费用为 8,000 欧元，比预算多 3,000 欧元。',
      decision: '理事会必须在周五前决定，是否从夏季节日预算中调拨 3,000 欧元。',
      storage: '器材室在维修完成前保持关闭；会所其他地方照常开放。',
      fees: '会费不变。',
      schedule: '屋顶工人 5 月 12 日开工，需要四天；停车场要用来搭脚手架。',
      tiles: '新瓦是炭灰色的混凝土瓦。',
      reserve: '如果改用储备金，它会低于规定的最低额度。',
      volunteer: '一位会员提出免费自己修屋顶，但他不是屋顶工人。'
    },
    reasons: {
      'executive.cost': '理事会需要知道金额和超支情况才能判断。',
      'executive.decision': '这是他们必须做出的决定，还有截止时间。',
      'executive.storage': '房间的日常使用不是理事会层面的问题。',
      'executive.schedule': '具体施工日期是协调人的事。',
      'executive.tiles': '瓦的类型和颜色不影响决定。',
      'executive.reserve': '它解释了为什么那个显而易见的替代方案行不通。',
      'projectManager.fees': '会费与组织维修无关。',
      'projectManager.schedule': '协调人要安排的正是这些日期和停车场。',
      'projectManager.reserve': '资金问题由理事会决定，不是协调人。',
      'layperson.storage': '会员想知道什么能用、什么不能用。',
      'layperson.fees': '他们自己的钱是他们首先关心的问题。',
      'layperson.tiles': '材料细节对会员来说无关紧要。',
      'layperson.reserve': '储备金规则是内部财务细节。',
      volunteer: '一个不具备相应资质的提议只会引发无谓的争论；它不是真正的选项。'
    },
    messages: {
      'executive.fit': '需在周五前做出决定：屋顶维修费用 8,000 欧元，比预算多 3,000 欧元。我们建议从夏季节日预算中调拨 3,000 欧元，因为动用储备金会使其低于最低额度。',
      'executive.tooMuch': '屋顶工人 5 月 12 日开工，用炭灰色混凝土瓦；脚手架会在停车场搭四天，器材室在此之前保持关闭。',
      'executive.missing': '屋顶维修变贵了。我们会随时告诉大家。',
      'projectManager.fit': '屋顶工人 5 月 12 日开工，需要四天。请从 5 月 11 日起为脚手架空出停车场。',
      'projectManager.tooMuch': '维修费用 8,000 欧元，超出预算 3,000 欧元；理事会可能从节日预算中调钱，因为储备金不能低于最低额度，会费保持不变。',
      'projectManager.missing': '五月份的某个时候屋顶要施工。',
      'layperson.fit': '会所屋顶将在五月维修。在此之前器材室保持关闭，其他地方照常开放。会费不变。',
      'layperson.tooMuch': '维修费用 8,000 欧元，超出预算 3,000 欧元；理事会正在考虑从节日预算中调拨，因为储备金不能低于最低额度。',
      'layperson.condescending': '屋顶的事大家别操心，大人的事理事会会处理。'
    }
  },
  shopOutage: {
    title: '网店宕机',
    situation: '你们公司的网店昨天宕机了三个小时。请解释发生了什么。',
    facts: {
      duration: '网店昨天晚上宕机了三个小时。',
      revenue: '损失了大约 40,000 欧元的订单。',
      cause: '一个过期的安全证书导致支付中断。',
      fixed: '证书已经更新；网店已恢复正常。',
      renewal: '续期将实现自动化，并提前两周发出警告；这需要团队一天时间。',
      voucher: '订单失败的客户将通过电子邮件收到一张 10% 的优惠券。',
      approval: '请管理层批准 5,000 欧元用于改进监控。',
      competitor: '一家竞争对手的网店上个月也发生过类似的宕机。'
    },
    reasons: {
      'projectManager.cause': '项目负责人需要知道原因，才能判断修复方案。',
      'projectManager.renewal': '这是他要安排的工作：团队一天的时间。',
      'projectManager.voucher': '优惠券由客服处理，不归项目管。',
      'executive.duration': '管理层需要知道事件的规模。',
      'executive.revenue': '对管理层来说，业务影响排在第一位。',
      'executive.cause': '技术细节不会改变他们的决定；说“漏掉了一次续期”就够了。',
      'executive.renewal': '他们需要听到这种事不会再发生。',
      'executive.approval': '这是他们必须做出的决定。',
      'customer.revenue': '你们损失的营业额不是客户关心的事。',
      'customer.cause': '技术原因对客户没有帮助。',
      'customer.fixed': '客户首先想知道自己又能购物了。',
      'customer.renewal': '内部流程的变化与客户无关。',
      'customer.voucher': '这是他们能得到的东西，他们应该留意邮件。',
      'customer.approval': '内部预算决定不是给客户的。',
      competitor: '指着别人听起来像找借口，而且什么也改变不了。'
    },
    messages: {
      'projectManager.fit': '昨天三小时的宕机是因为一个过期的安全证书导致支付中断。为防止再次发生，我们会把续期自动化并提前预警；这个冲刺需要团队一天时间。',
      'projectManager.tooMuch': '我们损失了大约 40,000 欧元的订单，客户会通过邮件收到 10% 的优惠券，而且一家竞争对手上个月也遇到了同样的问题。',
      'projectManager.missing': '网店昨天出了点小状况，现在都好了。',
      'executive.fit': '昨天网店宕机三小时，我们损失了大约 40,000 欧元的订单。原因是漏掉了一次例行续期，现在已实现自动化。为了及早发现这类问题，请批准 5,000 欧元用于监控。',
      'executive.tooMuch': '支付网关的 TLS 证书于 18:02 过期；我们现在通过 ACME 协议自动续期，并提前 14 天告警。',
      'executive.missing': '昨天出了个小技术问题，已经解决了。',
      'customer.fit': '非常抱歉：昨天晚上我们的网店有几个小时无法访问。现在一切恢复正常。如果您的订单未能完成，您将通过电子邮件收到一张 10% 的优惠券。',
      'customer.tooMuch': '一个过期的安全证书让我们的支付系统停止运行；我们损失了大约 40,000 欧元，现在会自动更新证书。',
      'customer.condescending': '有个技术上的东西坏了，说了您也不懂。再试一次就行。'
    }
  },
  signalFault: {
    title: '铁路信号故障',
    situation: '一处信号故障扰乱了一条铁路线路。你在铁路公司工作。请解释情况。',
    facts: {
      delay: '这条线路上的列车晚点约 40 分钟。',
      bus: '替代巴士每 20 分钟从车站前广场发车。',
      tickets: '车票也可用于巴士和后续列车。',
      signal: '道岔处的 14 号信号机因电缆故障一直显示红灯。',
      singleTrack: '列车凭书面命令以步行速度单线通过该区段。',
      repair: '技术人员预计维修还需要大约四个小时。',
      construction: '电缆很可能是被另一家公司的施工损坏的。',
      staff: '本周有两名技术人员病假。'
    },
    reasons: {
      'layperson.delay': '乘客首先想知道自己会晚多久。',
      'layperson.bus': '它告诉乘客现在马上可以怎么做。',
      'layperson.tickets': '它回答了乘客是否需要买新票的担心。',
      'layperson.signal': '信号机编号对乘客毫无意义。',
      'layperson.singleTrack': '行车规则对乘客没有帮助。',
      'layperson.construction': '猜测责任对乘客没有帮助，而且可能是错的。',
      'layperson.staff': '内部人员安排不是乘客关心的事。',
      'expert.tickets': '车票规则不影响列车运行。',
      'expert.signal': '同事需要确切的位置和故障。',
      'expert.singleTrack': '这是他必须执行的行车规则。',
      'expert.repair': '他要围绕预计结束时间安排运行图。',
      'expert.staff': '人员情况不会改变该区段的运行方式。',
      'executive.delay': '管理层需要知道中断的规模。',
      'executive.tickets': '车票通用是标准规则，不是管理层的议题。',
      'executive.repair': '他们需要知道影响会持续多久。',
      'executive.construction': '第三方可能造成的损坏关系到责任和费用。'
    },
    messages: {
      'layperson.fit': '这条线路的列车晚点约 40 分钟。替代巴士每 20 分钟从车站前广场发车，您的车票可以乘坐。',
      'layperson.tooMuch': '道岔处的 14 号信号机因电缆故障一直显示红灯；列车凭书面命令以步行速度单线运行。',
      'layperson.missing': '请耐心等待，目前有技术故障。',
      'expert.fit': '道岔处 14 号信号机因电缆故障卡在红灯。凭书面命令以步行速度单线运行；预计维修还需约四小时。',
      'expert.condescending': '信号机就像火车的红绿灯。其中一个坏了，所以火车必须开慢点。',
      'expert.missing': '线路上有问题，列车晚点了。巴士在运行。',
      'executive.fit': '电缆故障还将影响线路约四个小时；列车晚点约 40 分钟。电缆很可能是被另一家公司的施工损坏的，所以我们正在核查责任。',
      'executive.tooMuch': '14 号信号机持续红灯；凭书面命令以步行速度单线运行；巴士每 20 分钟从广场发车；车票可乘巴士。',
      'executive.missing': '信号出了点小问题，团队正在处理。'
    }
  },
  kettleLid: {
    title: '水壶盖',
    situation: '你们公司发现某款电水壶的壶盖可能会松脱。请解释这件事。',
    facts: {
      batches: '只有批号 2301 至 2315 的水壶受影响（印在底座下方）。',
      risk: '倒水时壶盖可能打开，热水可能溅出。',
      stop: '在更换之前，请停止使用受影响的水壶。',
      hinge: '一个塑料铰链销做得比规定细了 0.2 毫米。',
      free: '更换免费，包括运费。',
      cost: '更换将花费公司约 120,000 欧元。',
      supplier: '这些销来自一家新供应商，其样品曾通过检验。',
      injuries: '目前尚无已知的受伤情况。'
    },
    reasons: {
      'customer.batches': '客户必须能够核实自己的水壶是否受影响。',
      'customer.risk': '他们需要明白为什么这很重要。',
      'customer.stop': '这是保证他们安全的行动。',
      'customer.hinge': '毫米级的细节对客户没有帮助。',
      'customer.free': '知道不花钱，就少了一个拖延的理由。',
      'customer.cost': '公司的成本不是客户关心的事。',
      'customer.supplier': '供应商细节听起来像在推卸责任。',
      'executive.risk': '管理层必须首先了解安全风险。',
      'executive.hinge': '精确尺寸是工程师的事。',
      'executive.cost': '财务影响是他们决策的一部分。',
      'executive.injuries': '是否有人受伤会改变紧迫程度和应对方式。',
      'expert.stop': '给客户的指示无助于分析缺陷。',
      'expert.hinge': '工程师需要知道确切的缺陷。',
      'expert.free': '运费条款对技术分析无关紧要。',
      'expert.cost': '召回成本对改进零件没有用。',
      'expert.supplier': '它指出了质量检验需要改变的地方。'
    },
    messages: {
      'customer.fit': '请查看水壶底部的批号。如果在 2301 到 2315 之间，请停止使用：倒水时壶盖可能打开。我们将免费为您更换，包括运费。',
      'customer.tooMuch': '一家新供应商的铰链销细了 0.2 毫米；这次更换将花费我们约 120,000 欧元。',
      'customer.condescending': '有些水壶可能有个小问题。细节您不用懂；想的话就寄回来吧。',
      'executive.fit': '安全问题：批号 2301 至 2315 的水壶在倒热水时壶盖可能打开。目前尚无已知受伤情况。更换费用约为 120,000 欧元。',
      'executive.tooMuch': '铰链销直径比公差低 0.2 毫米；新供应商的样品符合规格，所以我们怀疑是模具磨损。',
      'executive.missing': '我们出于预防正在更换部分水壶。',
      'expert.fit': '新供应商的铰链销细了 0.2 毫米，因此倒水时壶盖可能打开。受影响批号：2301 至 2315。他们的样品通过了检验，所以我们的来料检验必须改进。',
      'expert.missing': '有些壶盖松了；客户可以免费更换。',
      'expert.condescending': '铰链就是让壶盖能转动的部件。如果它太细，就固定不牢。'
    }
  }
};
