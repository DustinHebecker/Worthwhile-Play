import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: '短2度',
    M2: '長2度',
    m3: '短3度',
    M3: '長3度',
    P4: '完全4度',
    TT: '増4度（三全音）',
    P5: '完全5度',
    m6: '短6度',
    M6: '長6度',
    m7: '短7度',
    M7: '長7度',
    P8: '完全8度（オクターブ）'
  },
  chords: {
    maj: '長三和音（メジャー）',
    min: '短三和音（マイナー）',
    dim: '減三和音',
    aug: '増三和音',
    dom7: '属七の和音',
    maj7: '長七の和音（メジャーセブンス）',
    min7: '短七の和音（マイナーセブンス）'
  },
  scales: { major: '長音階', 'natural-minor': '自然短音階', 'harmonic-minor': '和声短音階', 'major-pentatonic': 'メジャー・ペンタトニック' },
  cadences: {
    finished: { name: '終わる', explain: '属和音（V）から主和音（I）へ戻り、フレーズが終わったように聞こえます（完全終止）。' },
    open: { name: '開いたまま', explain: 'フレーズが属和音（V）で止まり、続きを待つ問いかけのように聞こえます（半終止）。' },
    surprise: { name: '意外', explain: '属和音（V）が主和音ではなく vi へ進みます。落ち着くと思ったところで音楽が脇へそれます（偽終止）。' }
  },
  classes: { perfect: '完全協和音程', imperfect: '不完全協和音程', mild: '穏やかな不協和音程', sharp: '鋭い不協和音程' },
  semitones: { other: '{n}半音' },
  cents: { other: '{n}セント' },
  waveRepeat: { other: '基音の合計：低い音の波およそ{n}回ごとに繰り返します。' },
  steps: { whole: '全', half: '半', three: '全+半' },
  up: '上がる',
  down: '下がる',
  noteValues: {
    eighth: { single: '八分音符', count: { other: '八分音符{n}つ' } },
    quarter: { single: '四分音符', count: { other: '四分音符{n}つ' } },
    'dotted-quarter': { single: '付点四分音符', count: { other: '付点四分音符{n}つ' } },
    half: { single: '二分音符', count: { other: '二分音符{n}つ' } },
    'rest-eighth': { single: '八分休符', count: { other: '八分休符{n}つ' } },
    'rest-quarter': { single: '四分休符', count: { other: '四分休符{n}つ' } },
    'rest-half': { single: '二分休符', count: { other: '二分休符{n}つ' } }
  },
  tips: {
    interval: '{a}は{na}、{b}は{nb}です。一方の音からもう一方の音まで鍵盤を数えるか、五線上の段を数えましょう。',
    chord: '積み重なった3度を半音で数えましょう。{a}は{ta}、{b}は{tb}です。',
    scale: '歩幅を比べましょう。{a}は{pa}、{b}は{pb}です（全＝全音、半＝半音）。',
    pair: 'より安定した響きほど比が単純です。{a}は{ra}、{b}は{rb}です。',
    cadence: '答えは「{a}」で、「{b}」ではありません。最後の和音を聞きましょう。主和音（I）に戻るか、V で止まるか、vi へそれるか。',
    contour: '上がるか下がるかだけを一歩ずつ追いましょう。正しくは「{a}」で、「{b}」ではありません。',
    changed: 'A と B を一音ずつ比べましょう。変わったのは{a}番目の音で、{b}番目ではありません。',
    rhythm: '「1 と 2 と 3 と 4 と」と数え、それぞれの音がどこで始まるかを聞きましょう。'
  },
  learned: '西洋音楽に親しんで育った人の多くは、{name}のほうを落ち着いた響きとして聞きます。この好みは一部が学習によるものです（McDermott ほか 2016）。',
  ratioWhy: '比が単純なほど合成された波は早く繰り返します。西洋の和声では、そうした響きを安定していると聞くのが一般的です。',
  closing: {
    intervals: '音程はメロディーと和音の基本単位です。別の出だしの音でもう一回、いつでもどうぞ。',
    chords: '和音は3度を積み重ねてできています。その大きさが和音ごとの色を決めます。',
    stability: '「安定」と「緊張」は、西洋の和声がこれらの響きを一般にどう聞くかを表しています。ほかの伝統では別の聞き方をします。',
    melody: 'メロディーの形を追うことは、歌ったり弾いたりするための良い第一歩です。',
    rhythm: '拍とその半分を数えれば、どんなリズムも読めるようになります。',
    build: '音程・和音・音階を自分の手で組み立てると、その仕組みが見えてきます。'
  }
};
