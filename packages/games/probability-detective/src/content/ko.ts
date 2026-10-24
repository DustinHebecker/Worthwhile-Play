import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: '파란 소포',
      story: '모퉁이 가게에 보낸 사람이 없는 소포가 도착했습니다. 이 거리에 배송하는 창고 중 한 곳에서 온 것이 틀림없습니다.',
      lead: '이 거리의 소포가 오는 곳:',
      hyps: { north: '북쪽 창고', south: '남쪽 창고', east: '동쪽 창고' },
      clues: {
        blue: { label: '파란 종이로 포장', seen: '소포가 파란 종이로 포장되어 있습니다.', notSeen: '소포가 파란 종이로 포장되어 있지 않습니다.' },
        'brown-tape': { label: '갈색 테이프로 봉함', seen: '갈색 테이프로 봉해져 있습니다.', notSeen: '갈색 테이프로 봉해져 있지 않습니다.' },
        smudge: { label: '번진 라벨', seen: '주소 라벨이 번져 있습니다.', notSeen: '주소 라벨이 깨끗합니다.' },
        string: { label: '끈으로 묶음', seen: '끈으로 묶여 있습니다.', notSeen: '끈으로 묶여 있지 않습니다.' },
        tuesday: { label: '화요일에 도착', seen: '화요일에 도착했습니다. 모든 창고가 평일마다 배송합니다.', notSeen: '화요일에 도착했습니다. 모든 창고가 평일마다 배송합니다.' },
        'echo-blue': { label: '이웃도 봤음', seen: '이웃도 소포가 파란색이었다고 말합니다 – 같은 소포를 본 것입니다.', notSeen: '이웃도 소포가 파란색이었다고 말합니다 – 같은 소포를 본 것입니다.' }
      }
    },
    'c-garden': {
      title: '갉아 먹힌 딸기',
      story: '밤사이 누군가 딸기를 먹었습니다. 이 정원에는 딸기를 즐겨 먹는 손님이 몇 종류 있습니다.',
      lead: '딸기가 갉아 먹힌 밤의 손님은:',
      hyps: { birds: '새', snails: '달팽이', hedgehog: '고슴도치' },
      clues: {
        slime: { label: '반짝이는 자국', seen: '길에 반짝이는 자국이 있습니다.', notSeen: '반짝이는 자국이 없습니다.' },
        pecks: { label: '작은 쪼은 자국', seen: '열매에 작은 쪼은 자국이 있습니다.', notSeen: '쪼은 자국이 없습니다.' },
        droppings: { label: '울타리 밑의 배설물', seen: '생울타리 밑에 배설물이 있습니다.', notSeen: '생울타리 밑에는 아무것도 없습니다.' },
        'net-moved': { label: '젖혀진 그물', seen: '밭 위의 그물이 옆으로 젖혀져 있습니다.', notSeen: '그물이 제자리에 있습니다.' },
        rain: { label: '어젯밤 비가 옴', seen: '어젯밤 비가 왔습니다 – 비가 오면 모두 나옵니다.', notSeen: '어젯밤 비가 왔습니다 – 비가 오면 모두 나옵니다.' },
        'echo-slime': { label: '아침에 다시 봄', seen: '이웃이 같은 반짝이는 자국을 가리킵니다.', notSeen: '이웃이 같은 반짝이는 자국을 가리킵니다.' }
      }
    },
    'c-rain': {
      title: '밤사이 비가 왔을까?',
      story: '밤새 집을 비웠습니다. 모종이 비를 맞았는지, 지금 물을 줘야 하는지 알고 싶습니다.',
      lead: '이맘때의 밤은:',
      hyps: { rained: '비가 왔다', dry: '건조했다' },
      clues: {
        'wet-grass': { label: '젖은 풀', seen: '풀이 젖어 있습니다(이슬로도 젖습니다).', notSeen: '풀이 말라 있습니다.' },
        gauge: { label: '우량계의 물', seen: '우량계에 물이 고여 있습니다.', notSeen: '우량계가 비어 있습니다.' },
        puddle: { label: '대문 옆 웅덩이', seen: '대문 옆에 웅덩이가 있습니다.', notSeen: '대문 옆에 웅덩이가 없습니다.' },
        'snails-out': { label: '길 위의 달팽이', seen: '길에 달팽이가 나와 있습니다.', notSeen: '길에 달팽이가 없습니다.' },
        wind: { label: '탁자 위의 나뭇잎', seen: '탁자 위로 나뭇잎이 날려 왔습니다 – 어느 쪽이든 바람은 불었습니다.', notSeen: '탁자 위로 나뭇잎이 날려 왔습니다 – 어느 쪽이든 바람은 불었습니다.' }
      }
    },
    'c-bird': {
      title: '모이통에 온 새는?',
      story: '모이통의 작은 갈색 새를 날아가기 전에 잠깐 보았을 뿐입니다. 여기의 비율은 이 모이통을 위해 지어낸 것이고, 실제 비율은 장소마다 다릅니다.',
      lead: '이 모이통에 오는 작은 갈색 손님은:',
      hyps: { finch: '되새류', sparrow: '참새' },
      clues: {
        'red-patch': { label: '언뜻 보인 빨간색', seen: '머리에 빨간색이 언뜻 보였습니다.', notSeen: '빨간색은 전혀 보지 못했습니다.' },
        ground: { label: '땅에서 먹음', seen: '모이통 아래 땅에서 먹었습니다.', notSeen: '모이통 위에서 먹었습니다.' },
        song: { label: '지저귀는 노래', seen: '지저귀며 노래했습니다.', notSeen: '짹짹거리기만 했습니다.' },
        group: { label: '무리와 함께 옴', seen: '작은 무리와 함께 왔습니다.', notSeen: '혼자 왔습니다.' },
        morning: { label: '아침에', seen: '이른 아침이었습니다 – 둘 다 그 시간에 옵니다.', notSeen: '이른 아침이었습니다 – 둘 다 그 시간에 옵니다.' }
      }
    },
    'c-plant': {
      title: '축 처진 화분',
      story: '사무실 식물이 축 처지고 잎이 노랗게 변했습니다. 이 사무실에서는 보통 두 가지 중 하나가 원인입니다.',
      lead: '이곳 식물이 처질 때의 원인:',
      hyps: { water: '물이 너무 많음', light: '빛이 너무 적음' },
      clues: {
        'wet-soil': { label: '젖은 흙', seen: '물을 준 지 이틀이 지나도 흙이 젖어 있습니다.', notSeen: '흙이 말라 있습니다.' },
        leaning: { label: '창 쪽으로 기울어짐', seen: '창 쪽으로 기울어 있습니다.', notSeen: '똑바로 서 있습니다.' },
        'soft-stem': { label: '물러진 줄기 밑동', seen: '줄기 밑동이 물러져 있습니다.', notSeen: '줄기가 단단합니다.' },
        'pale-new': { label: '창백한 새잎', seen: '새잎이 창백하고 작습니다.', notSeen: '새잎이 건강해 보입니다.' },
        'pot-colour': { label: '파란 화분', seen: '파란 화분에 심겨 있습니다 – 그것은 아무것도 바꾸지 않습니다.', notSeen: '파란 화분에 심겨 있습니다 – 그것은 아무것도 바꾸지 않습니다.' }
      }
    },
    'c-bus': {
      title: '버스는 왜 늦었을까?',
      story: '오늘 아침 버스가 사십 분 늦게 왔습니다.',
      lead: '이 버스가 아주 늦을 때의 이유:',
      hyps: { jam: '교통 체증', breakdown: '고장' },
      clues: {
        'others-late': { label: '다른 버스도 늦음', seen: '같은 도로의 다른 버스들도 늦었습니다.', notSeen: '도로의 다른 버스들은 제시간에 왔습니다.' },
        replacement: { label: '다른 버스가 옴', seen: '평소와 다른 버스가 왔습니다.', notSeen: '평소의 버스가 왔습니다.' },
        announcement: { label: '안내 표시', seen: '안내판에 "기술적 결함으로 인한 지연"이라고 나왔습니다.', notSeen: '안내판에 이유가 나오지 않았습니다.' },
        'rush-hour': { label: '출퇴근 시간', seen: '출퇴근 시간이었습니다.', notSeen: '하루 중 한가한 시간이었습니다.' },
        rain: { label: '비가 왔음', seen: '비가 왔습니다 – 이 정류장에서는 상관이 없습니다.', notSeen: '비가 왔습니다 – 이 정류장에서는 상관이 없습니다.' }
      }
    }
  }
};
