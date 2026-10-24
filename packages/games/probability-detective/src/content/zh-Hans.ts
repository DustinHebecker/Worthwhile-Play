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
  }
};
