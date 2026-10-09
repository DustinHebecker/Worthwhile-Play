import type { LearningCatalogue } from './en';

const ko: LearningCatalogue = {
  'review.title': '복습할 만한 항목',
  'review.intro': '복습에서 평가한 카드는 일정 간격 뒤에 다시 나옵니다. 내키실 때 보세요. 보지 않아도 잃는 것은 없습니다.',
  'review.none': '지금은 복습을 기다리는 것이 없습니다.',
  'review.due': '복습할 만한 카드 {count}장',
  'review.action': '복습',
  'review.actionLabel': '{title} 복습',
  'review.seen': '지금까지 평가: {total}장 중 {seen}장',
  'review.howTitle': '복습 일정의 원리',
  'review.howText': '평가한 각 카드는 일곱 상자 중 하나에 들어 있습니다. "알았음"은 카드를 한 상자 위로 올리고, "거의"는 그 상자에 두며, "아직"은 첫 상자로 되돌립니다. 1번 상자는 1일 뒤에, 다음 상자들은 2, 4, 8, 16, 32, 64일 뒤에 다시 제안됩니다. 이렇게 간격을 두고 복습하면 기억에 도움이 되는 경우가 많지만, 제안일 뿐입니다. 기록은 이 기기에만 남으며, 알림이나 연속 기록은 없습니다.',
  'decks.review': '플래시카드로 복습'
};

export default ko;
