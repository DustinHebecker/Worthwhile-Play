import type { LearningCatalogue } from './en';

const ja: LearningCatalogue = {
  'review.title': '復習するとよい項目',
  'review.intro': '「復習」で評価したカードは、間隔をあけて戻ってきます。気が向いたときに見てください。見なくても何も失われません。',
  'review.none': '今は復習を待っているものはありません。',
  'review.due': '復習するとよいカード {count} 枚',
  'review.action': '復習',
  'review.actionLabel': '{title}を復習',
  'review.seen': 'これまでに評価：{total} 枚中 {seen} 枚',
  'review.howTitle': '復習スケジュールのしくみ',
  'review.howText': '評価したカードは7つの箱のどれかに入ります。「わかった」で1つ上の箱へ、「おしい」で同じ箱のまま、「まだ」で最初の箱に戻ります。箱1は1日後、次の箱は2、4、8、16、32、64日後に再び提案されます。このように間隔をあけて復習すると記憶に役立つことが多いですが、あくまで提案です。記録はこの端末にだけ残り、リマインダーや通知、連続記録はありません。',
  'decks.review': 'フラッシュカードで復習'
};

export default ja;
