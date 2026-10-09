/**
 * Common first names per UI locale, written in that locale's script: a mix of names usually given to
 * women and to men, deliberately ordinary (no famous people). Japanese names are in hiragana so the
 * reading is unambiguous. Pure data; the rules pick from the list of the current UI language.
 */
export const NAMES: Readonly<Record<string, readonly string[]>> = {
  en: ['Sarah', 'James', 'Emily', 'Daniel', 'Olivia', 'Michael', 'Grace', 'Thomas', 'Chloe', 'Ben', 'Hannah', 'Ryan', 'Lucy', 'Nathan', 'Amy', 'Owen', 'Zoe', 'Adam', 'Megan', 'Luke', 'Ruth', 'Sam', 'Holly', 'Jack', 'Laura', 'Peter', 'Isla', 'Victor', 'Kevin', 'Nina'],
  de: ['Anna', 'Lukas', 'Sophie', 'Jonas', 'Lea', 'Felix', 'Marie', 'Paul', 'Laura', 'Tim', 'Julia', 'Max', 'Lena', 'Jan', 'Hannah', 'Leon', 'Clara', 'David', 'Mia', 'Niklas', 'Emma', 'Moritz', 'Greta', 'Simon', 'Ida', 'Florian', 'Johanna', 'Tobias', 'Frieda', 'Erik'],
  nl: ['Emma', 'Daan', 'Sanne', 'Bram', 'Lotte', 'Thijs', 'Fleur', 'Joris', 'Anouk', 'Ruben', 'Femke', 'Sem', 'Iris', 'Lars', 'Noor', 'Jesse', 'Eva', 'Milan', 'Roos', 'Bas', 'Isa', 'Koen', 'Lisa', 'Stijn', 'Julia', 'Tim', 'Maud', 'Niels', 'Floor', 'Gijs'],
  es: ['Lucía', 'Pablo', 'Carmen', 'Javier', 'Elena', 'Diego', 'Marta', 'Alejandro', 'Sofía', 'Carlos', 'Laura', 'Miguel', 'Paula', 'Sergio', 'Alba', 'Daniel', 'Irene', 'Hugo', 'Andrea', 'Álvaro', 'Nerea', 'Raúl', 'Clara', 'Iván', 'Sara', 'Rubén', 'Noelia', 'Marcos', 'Inés', 'Adrián'],
  fr: ['Camille', 'Lucas', 'Léa', 'Hugo', 'Chloé', 'Louis', 'Manon', 'Théo', 'Inès', 'Antoine', 'Julie', 'Maxime', 'Sarah', 'Nicolas', 'Emma', 'Julien', 'Clara', 'Mathis', 'Pauline', 'Romain', 'Zoé', 'Thomas', 'Lucie', 'Bastien', 'Margaux', 'Quentin', 'Anaïs', 'Adrien', 'Élise', 'Paul'],
  ru: ['Анна', 'Иван', 'Мария', 'Дмитрий', 'Елена', 'Сергей', 'Ольга', 'Алексей', 'Наталья', 'Михаил', 'Татьяна', 'Андрей', 'Ксения', 'Павел', 'Дарья', 'Николай', 'Ирина', 'Артём', 'Светлана', 'Егор', 'Полина', 'Олег', 'Вера', 'Максим', 'Юлия', 'Роман', 'Алина', 'Кирилл', 'Софья', 'Глеб'],
  'zh-Hans': ['欣怡', '子轩', '雨涵', '浩然', '思琪', '宇航', '佳怡', '俊杰', '梓萱', '志强', '晓燕', '明辉', '婉婷', '建华', '丽娜', '文博', '雅琴', '天佑', '静怡', '嘉豪', '美玲', '凯文', '诗涵', '立伟', '晨曦', '国栋', '慧敏', '一鸣', '小雪', '振宇'],
  ko: ['지민', '서연', '민준', '하은', '도윤', '수아', '예준', '지우', '시우', '서윤', '주원', '하린', '건우', '유진', '현우', '소율', '지호', '민서', '준서', '채원', '은우', '다은', '태윤', '예린', '승현', '나연', '동현', '수빈', '재원', '혜진'],
  ja: ['さくら', 'はると', 'ゆい', 'そうた', 'あおい', 'れん', 'ひな', 'ゆうと', 'みお', 'たくみ', 'めい', 'けんた', 'あかり', 'しょうた', 'なな', 'だいき', 'はるか', 'りく', 'ゆな', 'こうき', 'まい', 'ゆうま', 'えみ', 'かいと', 'ちひろ', 'しゅん', 'ゆき', 'りょう', 'みさき', 'たいが'],
  ar: ['سارة', 'أحمد', 'ليلى', 'عمر', 'مريم', 'يوسف', 'نور', 'خالد', 'هدى', 'كريم', 'فاطمة', 'سامي', 'رنا', 'طارق', 'سلمى', 'ياسر', 'دينا', 'هشام', 'لينا', 'مازن', 'ريم', 'زياد', 'أمل', 'باسل', 'جنى', 'فادي', 'هالة', 'نبيل', 'سمر', 'رامي'],
  pt: ['Ana', 'João', 'Beatriz', 'Pedro', 'Mariana', 'Lucas', 'Inês', 'Rafael', 'Carolina', 'Tiago', 'Sofia', 'Gabriel', 'Leonor', 'Miguel', 'Camila', 'Diogo', 'Rita', 'Bruno', 'Larissa', 'André', 'Helena', 'Rodrigo', 'Joana', 'Vítor', 'Marta', 'Gonçalo', 'Luana', 'Filipe', 'Clara', 'Eduardo'],
  it: ['Giulia', 'Marco', 'Chiara', 'Luca', 'Francesca', 'Matteo', 'Sara', 'Andrea', 'Alessia', 'Davide', 'Martina', 'Simone', 'Elisa', 'Lorenzo', 'Valentina', 'Paolo', 'Federica', 'Stefano', 'Ilaria', 'Riccardo', 'Anna', 'Tommaso', 'Silvia', 'Giorgio', 'Marta', 'Emanuele', 'Laura', 'Pietro', 'Beatrice', 'Nicola'],
  pl: ['Zofia', 'Jakub', 'Anna', 'Piotr', 'Maja', 'Kacper', 'Julia', 'Tomasz', 'Natalia', 'Michał', 'Ewa', 'Bartek', 'Hanna', 'Paweł', 'Ola', 'Szymon', 'Kasia', 'Wojtek', 'Magda', 'Filip', 'Iga', 'Marek', 'Agata', 'Krzysztof', 'Lena', 'Adam', 'Monika', 'Igor', 'Basia', 'Damian'],
  tr: ['Elif', 'Mehmet', 'Zeynep', 'Ahmet', 'Ayşe', 'Emre', 'Selin', 'Burak', 'Merve', 'Can', 'Esra', 'Murat', 'Deniz', 'Kerem', 'Ece', 'Okan', 'Gizem', 'Serkan', 'Derya', 'Onur', 'Seda', 'Barış', 'İrem', 'Tolga', 'Buse', 'Cem', 'Pınar', 'Hakan', 'Nur', 'Umut'],
  uk: ['Олена', 'Андрій', 'Марія', 'Тарас', 'Оксана', 'Богдан', 'Ірина', 'Дмитро', 'Наталія', 'Олег', 'Софія', 'Максим', 'Ганна', 'Віктор', 'Юлія', 'Остап', 'Катерина', 'Роман', 'Дарина', 'Сергій', 'Леся', 'Ярослав', 'Анастасія', 'Іван', 'Христина', 'Назар', 'Тетяна', 'Василь', 'Злата', 'Петро'],
  hi: ['प्रिया', 'राहुल', 'अनीता', 'अमित', 'पूजा', 'विकास', 'नेहा', 'सुरेश', 'कविता', 'अर्जुन', 'मीना', 'रोहन', 'सीमा', 'करण', 'दीपा', 'आदित्य', 'रीना', 'मनोज', 'श्वेता', 'नितिन', 'आरती', 'विनय', 'सुनीता', 'गौरव', 'ज्योति', 'अजय', 'रश्मि', 'सचिन', 'पल्लवी', 'तरुण']
};

/** The name list for a UI locale (English as a fallback). */
export const namesFor = (locale: string): readonly string[] => NAMES[locale] ?? (NAMES.en as readonly string[]);
