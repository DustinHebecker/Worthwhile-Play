import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: '단2도',
    M2: '장2도',
    m3: '단3도',
    M3: '장3도',
    P4: '완전4도',
    TT: '증4도(트라이톤)',
    P5: '완전5도',
    m6: '단6도',
    M6: '장6도',
    m7: '단7도',
    M7: '장7도',
    P8: '완전8도(옥타브)'
  },
  chords: {
    maj: '장3화음(메이저)',
    min: '단3화음(마이너)',
    dim: '감3화음',
    aug: '증3화음',
    dom7: '속7화음',
    maj7: '장7화음(메이저 세븐스)',
    min7: '단7화음(마이너 세븐스)'
  },
  scales: { major: '장음계', 'natural-minor': '자연단음계', 'harmonic-minor': '화성단음계', 'major-pentatonic': '메이저 펜타토닉' },
  cadences: {
    finished: { name: '끝남', explain: '딸림화음(V)이 으뜸화음(I)으로 돌아가 악구가 끝난 것처럼 들립니다(정격 종지).' },
    open: { name: '열림', explain: '악구가 딸림화음(V)에서 멈춰, 다음을 기다리는 질문처럼 들립니다(반종지).' },
    surprise: { name: '뜻밖', explain: '딸림화음(V)이 으뜸화음 대신 vi로 갑니다. 쉼을 기대했는데 음악이 옆으로 비켜 갑니다(거짓 종지).' }
  },
  classes: { perfect: '완전 협화음정', imperfect: '불완전 협화음정', mild: '약한 불협화음정', sharp: '강한 불협화음정' },
  semitones: { other: '반음 {n}개' },
  cents: { other: '{n}센트' },
  waveRepeat: { other: '기본음의 합: 낮은 음의 파동 약 {n}번마다 되풀이됩니다.' },
  steps: { whole: '온', half: '반', three: '온+반' },
  up: '위로',
  down: '아래로',
  noteValues: {
    eighth: { single: '8분음표', count: { other: '8분음표 {n}개' } },
    quarter: { single: '4분음표', count: { other: '4분음표 {n}개' } },
    'dotted-quarter': { single: '점4분음표', count: { other: '점4분음표 {n}개' } },
    half: { single: '2분음표', count: { other: '2분음표 {n}개' } },
    'rest-eighth': { single: '8분쉼표', count: { other: '8분쉼표 {n}개' } },
    'rest-quarter': { single: '4분쉼표', count: { other: '4분쉼표 {n}개' } },
    'rest-half': { single: '2분쉼표', count: { other: '2분쉼표 {n}개' } }
  },
  tips: {
    interval: '{a}: {na}, {b}: {nb}. 한 음에서 다른 음까지 건반을 세거나 오선의 칸과 줄을 세어 보세요.',
    chord: '쌓인 3도를 반음으로 세어 보세요. {a}: {ta}, {b}: {tb}.',
    scale: '음 사이 간격을 비교해 보세요. {a}: {pa}, {b}: {pb} (온 = 온음, 반 = 반음).',
    pair: '더 안정된 소리일수록 비율이 단순합니다. {a}: {ra}, {b}: {rb}.',
    cadence: '정답은 「{a}」이고 「{b}」가 아닙니다. 마지막 화음을 들어 보세요. 으뜸화음(I)으로 돌아가나요, V에서 멈추나요, vi로 비켜 가나요?',
    contour: '위아래 움직임만 한 걸음씩 따라가 보세요. 정답은 「{a}」, 「{b}」가 아닙니다.',
    changed: 'A와 B를 한 음씩 비교해 보세요. 바뀐 것은 {a}번째 음이고 {b}번째 음이 아닙니다.',
    rhythm: '「1 앤 2 앤 3 앤 4 앤」 하고 세면서 각 음이 어디서 시작하는지 들어 보세요.'
  },
  learned: '서양 음악을 들으며 자란 사람 대부분은 {name} 쪽을 더 편안하게 듣습니다. 이 선호는 부분적으로 학습된 것입니다(McDermott 외, 2016).',
  ratioWhy: '비율이 단순할수록 합쳐진 파형이 더 빨리 되풀이됩니다. 서양 화성에서는 그런 소리를 대개 안정적이라고 듣습니다.',
  closing: {
    intervals: '음정은 선율과 화음의 기본 단위입니다. 다른 시작음으로 한 판 더 언제든 할 수 있습니다.',
    chords: '화음은 3도를 쌓아 만들고, 그 크기가 화음마다 색깔을 줍니다.',
    stability: '「안정」과 「긴장」은 서양 화성이 이런 소리를 보통 어떻게 듣는지를 나타냅니다. 다른 전통에서는 다르게 듣습니다.',
    melody: '선율의 모양을 따라가는 것은 노래하거나 연주하기 위한 좋은 첫걸음입니다.',
    rhythm: '박과 그 절반을 세면 어떤 리듬도 읽을 수 있습니다.',
    build: '음정, 화음, 음계를 직접 쌓아 보면 어떻게 만들어지는지 보입니다.'
  }
};
