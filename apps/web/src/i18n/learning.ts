import type { SupportedLocale } from '@wp/localization';

/**
 * Strings of the "Items worth reviewing" parts of the deck pages. They are only used by the lazily loaded deck
 * pages, so they live in that chunk instead of the eagerly bundled UI catalogue (kept small: see architecture.md).
 */
const en = {
  'review.title': 'Items worth reviewing',
  'review.intro': 'Cards you rated in Review come back after a break. Look at them whenever you feel like it; nothing is lost if you don’t.',
  'review.none': 'Nothing is waiting for review right now.',
  'review.due': '{count} worth reviewing',
  'review.action': 'Review',
  'review.actionLabel': 'Review {title}',
  'review.seen': 'Rated so far: {seen} of {total} cards',
  'review.howTitle': 'How the review schedule works',
  'review.howText': 'Each card you rate sits in one of seven boxes. “Knew it” moves it up one box, “Almost” keeps it in its box, “Not yet” puts it back into the first box. Box 1 is suggested again after 1 day, the next boxes after 2, 4, 8, 16, 32 and 64 days. Spacing reviews out like this tends to help people remember, but it is only a suggestion. The records stay on this device; there are no reminders, notifications or streaks.',
  'decks.review': 'Review with flash cards'
} as const;

export type LearningUiKey = keyof typeof en;

export const LEARNING_UI_MESSAGES: Readonly<Record<SupportedLocale, Readonly<Record<LearningUiKey, string>>>> = {
  en,
  de: {
    'review.title': 'Zum Wiederholen',
    'review.intro': 'Karten, die du beim Wiederholen eingeschätzt hast, kommen nach einer Pause wieder. Sieh sie dir an, wann immer du Lust hast; nichts geht verloren, wenn nicht.',
    'review.none': 'Gerade wartet nichts auf eine Wiederholung.',
    'review.due': '{count} zum Wiederholen',
    'review.action': 'Wiederholen',
    'review.actionLabel': '{title} wiederholen',
    'review.seen': 'Bisher eingeschätzt: {seen} von {total} Karten',
    'review.howTitle': 'So funktioniert der Wiederholungsplan',
    'review.howText': 'Jede eingeschätzte Karte liegt in einem von sieben Fächern. „Gewusst“ schiebt sie ein Fach weiter, „Fast“ lässt sie in ihrem Fach, „Noch nicht“ legt sie zurück ins erste Fach. Fach 1 wird nach 1 Tag wieder vorgeschlagen, die nächsten Fächer nach 2, 4, 8, 16, 32 und 64 Tagen. Solche Abstände helfen Menschen oft, sich besser zu erinnern, aber es ist nur ein Vorschlag. Die Lernstände bleiben auf diesem Gerät; es gibt keine Erinnerungen, Benachrichtigungen oder Serien.',
    'decks.review': 'Mit Lernkarten wiederholen'
  },
  nl: {
    'review.title': 'Om te herhalen',
    'review.intro': 'Kaarten die je bij Herhalen hebt beoordeeld, komen na een pauze terug. Bekijk ze wanneer je zin hebt; er gaat niets verloren als je dat niet doet.',
    'review.none': 'Er wacht nu niets op herhaling.',
    'review.due': '{count} om te herhalen',
    'review.action': 'Herhalen',
    'review.actionLabel': '{title} herhalen',
    'review.seen': 'Tot nu toe beoordeeld: {seen} van {total} kaarten',
    'review.howTitle': 'Zo werkt het herhaalschema',
    'review.howText': 'Elke beoordeelde kaart zit in een van zeven bakjes. „Wist ik” zet hem een bakje verder, „Bijna” laat hem in zijn bakje, „Nog niet” legt hem terug in het eerste bakje. Bakje 1 wordt na 1 dag opnieuw voorgesteld, de volgende bakjes na 2, 4, 8, 16, 32 en 64 dagen. Zulke tussenpozen helpen mensen vaak om beter te onthouden, maar het is alleen een suggestie. De gegevens blijven op dit apparaat; er zijn geen herinneringen, meldingen of reeksen.',
    'decks.review': 'Herhalen met flitskaarten'
  },
  es: {
    'review.title': 'Para repasar',
    'review.intro': 'Las tarjetas que valoraste en Repasar vuelven tras una pausa. Míralas cuando te apetezca; no se pierde nada si no lo haces.',
    'review.none': 'Ahora no hay nada esperando un repaso.',
    'review.due': '{count} para repasar',
    'review.action': 'Repasar',
    'review.actionLabel': 'Repasar {title}',
    'review.seen': 'Valoradas hasta ahora: {seen} de {total} tarjetas',
    'review.howTitle': 'Cómo funciona el plan de repaso',
    'review.howText': 'Cada tarjeta que valoras está en una de siete cajas. «Lo sabía» la sube una caja, «Casi» la deja en su caja y «Todavía no» la devuelve a la primera. La caja 1 se propone de nuevo tras 1 día; las siguientes, tras 2, 4, 8, 16, 32 y 64 días. Espaciar los repasos así suele ayudar a recordar, pero es solo una sugerencia. Los registros se quedan en este dispositivo; no hay recordatorios, notificaciones ni rachas.',
    'decks.review': 'Repasar con tarjetas'
  },
  fr: {
    'review.title': 'À réviser',
    'review.intro': 'Les cartes que tu as évaluées dans Révision reviennent après une pause. Regarde-les quand tu en as envie ; rien n’est perdu si tu ne le fais pas.',
    'review.none': 'Rien n’attend de révision pour le moment.',
    'review.due': '{count} à réviser',
    'review.action': 'Réviser',
    'review.actionLabel': 'Réviser {title}',
    'review.seen': 'Évaluées jusqu’ici : {seen} cartes sur {total}',
    'review.howTitle': 'Comment fonctionne le planning de révision',
    'review.howText': 'Chaque carte évaluée se trouve dans l’une de sept boîtes. « Je savais » la fait monter d’une boîte, « Presque » la laisse dans sa boîte, « Pas encore » la remet dans la première. La boîte 1 est reproposée après 1 jour, les suivantes après 2, 4, 8, 16, 32 et 64 jours. Espacer les révisions ainsi aide souvent à retenir, mais ce n’est qu’une suggestion. Les données restent sur cet appareil ; il n’y a ni rappels, ni notifications, ni séries.',
    'decks.review': 'Réviser avec des cartes'
  },
  ru: {
    'review.title': 'Стоит повторить',
    'review.intro': 'Карточки, которые вы оценили в «Повторении», возвращаются после перерыва. Смотрите их, когда захочется; если нет — ничего не потеряно.',
    'review.none': 'Сейчас ничего не ждёт повторения.',
    'review.due': 'Стоит повторить: {count}',
    'review.action': 'Повторить',
    'review.actionLabel': 'Повторить: {title}',
    'review.seen': 'Уже оценено: {seen} из {total} карточек',
    'review.howTitle': 'Как работает расписание повторений',
    'review.howText': 'Каждая оценённая карточка лежит в одной из семи коробок. «Знал(а)» перемещает её на коробку выше, «Почти» оставляет на месте, «Пока нет» возвращает в первую. Коробка 1 предлагается снова через 1 день, следующие — через 2, 4, 8, 16, 32 и 64 дня. Такие промежутки обычно помогают лучше запоминать, но это лишь предложение. Записи остаются на этом устройстве; нет ни напоминаний, ни уведомлений, ни серий.',
    'decks.review': 'Повторять с карточками'
  },
  'zh-Hans': {
    'review.title': '值得复习的内容',
    'review.intro': '你在“复习”中评过的卡片会在一段间隔后回来。想看的时候再看；不看也不会失去什么。',
    'review.none': '现在没有等待复习的内容。',
    'review.due': '{count} 张值得复习',
    'review.action': '复习',
    'review.actionLabel': '复习{title}',
    'review.seen': '已评过：{seen} / {total} 张卡片',
    'review.howTitle': '复习安排如何运作',
    'review.howText': '每张评过的卡片都放在七个盒子中的一个里。“记得”把它往上移一个盒子，“差一点”让它留在原处，“还不会”把它放回第一个盒子。第 1 个盒子在 1 天后再次推荐，之后的盒子分别在 2、4、8、16、32 和 64 天后。这样拉开复习间隔通常有助于记忆，但这只是建议。记录只保存在此设备上；没有提醒、通知或连续打卡。',
    'decks.review': '用闪卡复习'
  },
  ko: {
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
  },
  ja: {
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
  },
  ar: {
    'review.title': 'عناصر تستحق المراجعة',
    'review.intro': 'البطاقات التي قيّمتها في «مراجعة» تعود بعد فترة. انظر إليها متى شئت؛ لا يضيع شيء إن لم تفعل.',
    'review.none': 'لا شيء ينتظر المراجعة الآن.',
    'review.due': '{count} تستحق المراجعة',
    'review.action': 'مراجعة',
    'review.actionLabel': 'مراجعة {title}',
    'review.seen': 'قيّمت حتى الآن: {seen} من {total} بطاقة',
    'review.howTitle': 'كيف يعمل جدول المراجعة',
    'review.howText': 'توضع كل بطاقة تقيّمها في واحد من سبعة صناديق. «عرفتها» تنقلها صندوقًا إلى الأعلى، و«تقريبًا» تبقيها في صندوقها، و«ليس بعد» تعيدها إلى الصندوق الأول. يُقترح الصندوق 1 مرة أخرى بعد يوم واحد، والصناديق التالية بعد 2 و4 و8 و16 و32 و64 يومًا. المباعدة بين المراجعات بهذه الطريقة تساعد الناس عادةً على التذكّر، لكنها مجرد اقتراح. تبقى السجلات على هذا الجهاز؛ لا توجد تذكيرات ولا إشعارات ولا سلاسل أيام.',
    'decks.review': 'المراجعة بالبطاقات'
  },
  pt: {
    'review.title': 'Itens que vale revisar',
    'review.intro': 'Os cartões que você avaliou em Revisão voltam depois de um intervalo. Veja-os quando tiver vontade; nada se perde se não vir.',
    'review.none': 'Nada está esperando revisão agora.',
    'review.due': '{count} para revisar',
    'review.action': 'Revisar',
    'review.actionLabel': 'Revisar {title}',
    'review.seen': 'Avaliados até agora: {seen} de {total} cartões',
    'review.howTitle': 'Como funciona o cronograma de revisão',
    'review.howText': 'Cada cartão avaliado fica em uma de sete caixas. “Eu sabia” sobe o cartão uma caixa, “Quase” o mantém na mesma caixa e “Ainda não” o devolve à primeira. A caixa 1 volta a ser sugerida após 1 dia; as seguintes, após 2, 4, 8, 16, 32 e 64 dias. Espaçar as revisões assim costuma ajudar a lembrar, mas é só uma sugestão. Os registros ficam neste aparelho; não há lembretes, notificações nem sequências.',
    'decks.review': 'Revisar com cartões'
  },
  it: {
    'review.title': 'Elementi da ripassare',
    'review.intro': 'Le carte che hai valutato in Ripasso tornano dopo una pausa. Guardale quando ne hai voglia; se non lo fai non si perde nulla.',
    'review.none': 'Al momento niente aspetta un ripasso.',
    'review.due': '{count} da ripassare',
    'review.action': 'Ripassa',
    'review.actionLabel': 'Ripassa {title}',
    'review.seen': 'Valutate finora: {seen} di {total} carte',
    'review.howTitle': 'Come funziona il piano di ripasso',
    'review.howText': 'Ogni carta valutata si trova in una di sette scatole. «Lo sapevo» la sposta in su di una scatola, «Quasi» la lascia nella sua scatola, «Non ancora» la rimette nella prima. La scatola 1 viene riproposta dopo 1 giorno, le successive dopo 2, 4, 8, 16, 32 e 64 giorni. Distanziare i ripassi così di solito aiuta a ricordare, ma è solo un suggerimento. I dati restano su questo dispositivo; non ci sono promemoria, notifiche o serie.',
    'decks.review': 'Ripassa con le flashcard'
  },
  pl: {
    'review.title': 'Warte powtórki',
    'review.intro': 'Karty ocenione w Powtórce wracają po przerwie. Zajrzyj do nich, kiedy masz ochotę; nic nie przepada, jeśli tego nie zrobisz.',
    'review.none': 'Teraz nic nie czeka na powtórkę.',
    'review.due': 'Warte powtórki: {count}',
    'review.action': 'Powtórz',
    'review.actionLabel': 'Powtórz: {title}',
    'review.seen': 'Ocenione do tej pory: {seen} z {total} kart',
    'review.howTitle': 'Jak działa harmonogram powtórek',
    'review.howText': 'Każda oceniona karta leży w jednym z siedmiu pudełek. „Wiedziałem” przesuwa ją o pudełko wyżej, „Prawie” zostawia ją w jej pudełku, „Jeszcze nie” odkłada ją do pierwszego. Pudełko 1 wraca po 1 dniu, kolejne po 2, 4, 8, 16, 32 i 64 dniach. Takie odstępy między powtórkami zwykle pomagają zapamiętać, ale to tylko propozycja. Zapisy zostają na tym urządzeniu; nie ma przypomnień, powiadomień ani serii.',
    'decks.review': 'Powtarzaj z fiszkami'
  },
  tr: {
    'review.title': 'Tekrara değer öğeler',
    'review.intro': 'Tekrar’da değerlendirdiğin kartlar bir aradan sonra geri gelir. Canın istediğinde bak; bakmazsan hiçbir şey kaybolmaz.',
    'review.none': 'Şu anda tekrar bekleyen bir şey yok.',
    'review.due': 'Tekrara değer: {count}',
    'review.action': 'Tekrar et',
    'review.actionLabel': '{title} tekrar et',
    'review.seen': 'Şimdiye kadar değerlendirilen: {seen} / {total} kart',
    'review.howTitle': 'Tekrar planı nasıl çalışır',
    'review.howText': 'Değerlendirdiğin her kart yedi kutudan birindedir. “Bildim” kartı bir kutu yukarı taşır, “Neredeyse” kendi kutusunda bırakır, “Henüz değil” ilk kutuya geri koyar. Kutu 1, 1 gün sonra; sonraki kutular 2, 4, 8, 16, 32 ve 64 gün sonra yeniden önerilir. Tekrarları böyle aralıklarla yapmak çoğu zaman hatırlamaya yardımcı olur, ama bu yalnızca bir öneridir. Kayıtlar bu cihazda kalır; hatırlatma, bildirim veya seri yoktur.',
    'decks.review': 'Bilgi kartlarıyla tekrar et'
  },
  uk: {
    'review.title': 'Варто повторити',
    'review.intro': 'Картки, які ви оцінили в «Повторенні», повертаються після перерви. Переглядайте їх, коли захочеться; якщо ні — нічого не втрачено.',
    'review.none': 'Зараз нічого не чекає на повторення.',
    'review.due': 'Варто повторити: {count}',
    'review.action': 'Повторити',
    'review.actionLabel': 'Повторити: {title}',
    'review.seen': 'Уже оцінено: {seen} з {total} карток',
    'review.howTitle': 'Як працює розклад повторень',
    'review.howText': 'Кожна оцінена картка лежить в одній із семи коробок. «Знав(-ла)» переміщує її на коробку вище, «Майже» залишає на місці, «Ще ні» повертає до першої. Коробка 1 пропонується знову через 1 день, наступні — через 2, 4, 8, 16, 32 і 64 дні. Такі проміжки зазвичай допомагають краще запам’ятовувати, але це лише пропозиція. Записи залишаються на цьому пристрої; немає ні нагадувань, ні сповіщень, ні серій.',
    'decks.review': 'Повторювати з картками'
  },
  hi: {
    'review.title': 'दोहराने लायक चीज़ें',
    'review.intro': 'जिन कार्डों को आपने “दोहराव” में आँका है, वे कुछ अंतराल के बाद लौटते हैं। जब मन करे तब देखें; न देखें तो भी कुछ नहीं खोता।',
    'review.none': 'अभी कुछ भी दोहराव का इंतज़ार नहीं कर रहा।',
    'review.due': '{count} दोहराने लायक',
    'review.action': 'दोहराएँ',
    'review.actionLabel': '{title} दोहराएँ',
    'review.seen': 'अब तक आँके गए: {total} में से {seen} कार्ड',
    'review.howTitle': 'दोहराव की योजना कैसे काम करती है',
    'review.howText': 'हर आँका गया कार्ड सात डिब्बों में से किसी एक में रहता है। “पता था” उसे एक डिब्बा ऊपर ले जाता है, “लगभग” उसे उसी डिब्बे में रखता है, “अभी नहीं” उसे पहले डिब्बे में वापस रखता है। डिब्बा 1 एक दिन बाद फिर सुझाया जाता है, अगले डिब्बे 2, 4, 8, 16, 32 और 64 दिन बाद। इस तरह अंतराल रखकर दोहराना अक्सर याद रखने में मदद करता है, लेकिन यह केवल एक सुझाव है। रिकॉर्ड इसी डिवाइस पर रहते हैं; कोई रिमाइंडर, सूचना या लगातार-दिनों की गिनती नहीं है।',
    'decks.review': 'फ़्लैश कार्ड से दोहराएँ'
  }
};
