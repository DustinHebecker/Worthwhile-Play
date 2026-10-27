import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: '小二度',
    M2: '大二度',
    m3: '小三度',
    M3: '大三度',
    P4: '纯四度',
    TT: '增四度（三全音）',
    P5: '纯五度',
    m6: '小六度',
    M6: '大六度',
    m7: '小七度',
    M7: '大七度',
    P8: '纯八度'
  },
  chords: {
    maj: '大三和弦',
    min: '小三和弦',
    dim: '减三和弦',
    aug: '增三和弦',
    dom7: '属七和弦',
    maj7: '大七和弦',
    min7: '小七和弦'
  },
  scales: { major: '大调音阶', 'natural-minor': '自然小调音阶', 'harmonic-minor': '和声小调音阶', 'major-pentatonic': '大调五声音阶' },
  cadences: {
    finished: { name: '结束', explain: '属和弦（V）回到主和弦（I）：乐句听起来已经结束（完全终止）。' },
    open: { name: '开放', explain: '乐句停在属和弦（V）上：听起来像一个等待下文的问题（半终止）。' },
    surprise: { name: '意外', explain: '属和弦（V）没有回到主和弦，而是走向 vi：本以为会停下来，音乐却转向一旁（阻碍终止）。' }
  },
  classes: { perfect: '完全协和音程', imperfect: '不完全协和音程', mild: '轻度不协和音程', sharp: '尖锐不协和音程' },
  semitones: { other: '{n}个半音' },
  cents: { other: '{n}音分' },
  waveRepeat: { other: '基音之和：大约每 {n} 个低音波形重复一次。' },
  steps: { whole: '全', half: '半', three: '全+半' },
  up: '上行',
  down: '下行',
  tips: {
    interval: '{a}有{na}，{b}有{nb}。数一数从一个音到另一个音的琴键，或五线谱上的级数。',
    chord: '用半音数一数叠起来的三度：{a}是{ta}，{b}是{tb}。',
    scale: '比较音阶的步距：{a}是{pa}，{b}是{pb}（全＝全音，半＝半音）。',
    pair: '越稳定的音响，比例越简单：{a}是{ra}，{b}是{rb}。',
    cadence: '答案是“{a}”，不是“{b}”。听最后一个和弦：它回到主和弦（I），停在 V 上，还是转向 vi？',
    contour: '一步一步只看上行还是下行：答案是“{a}”，不是“{b}”。',
    changed: '把 A 和 B 一个音一个音地比较：变化的是第{a}个音，不是第{b}个音。',
    rhythm: '数“1 哒 2 哒 3 哒 4 哒”，听每个音从哪里开始。'
  },
  learned: '大多数听着西方音乐长大的人会觉得{name}更安定。这种偏好在一定程度上是后天习得的（McDermott 等，2016）。',
  ratioWhy: '比例越简单，合成的波形重复得越早；西方和声通常把这样的音响听作稳定。',
  closing: {
    intervals: '音程是旋律和和弦的基本单元。随时可以换个起始音再来一轮。',
    chords: '和弦由叠置的三度构成；三度的大小决定了每个和弦的色彩。',
    stability: '“稳定”和“紧张”描述的是西方和声通常怎样听这些音响；其他传统有不同的听法。',
    melody: '跟随旋律的走向，是唱出或弹出它的良好第一步。',
    rhythm: '数清拍子和半拍，任何节奏都能读懂。',
    build: '亲手搭建音程、和弦和音阶，就能看出它们是怎样构成的。'
  }
};
