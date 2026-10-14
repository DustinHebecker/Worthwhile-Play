import type { VocabularyLanguage } from './builtin/first-words';

/**
 * Translated prose of the guide for AIs (`./ai-guide.ts`). `{max}` and `{importUrl}` are filled in by the
 * generator. English and German written first; the other 14 languages are AI-assisted translations awaiting
 * native-speaker review (like the UI).
 */
export interface DeckGuideText {
  title: string;
  intro: string;
  /** Names the person's language (the language of this guide). */
  language: string;
  deliveryTitle: string;
  deliveryLink: string;
  deliveryFile: string;
  deliveryConfirm: string;
  contentTitle: string;
  rules: readonly string[];
  sidesTitle: string;
  sides: string;
  exampleTitle: string;
  exampleIntro: string;
  exampleLink: string;
  checklistTitle: string;
  checklist: readonly string[];
  referenceTitle: string;
  referenceNote: string;
}

export const DECK_GUIDE_TEXT: Readonly<Record<VocabularyLanguage, DeckGuideText>> = {
  en: {
    title: 'Guide for AIs: create a learning deck for Worthwhile Play',
    intro: 'You are helping a person create a learning deck (flash cards with a front and a back) for Worthwhile Play, a free web app with games and learning exercises that runs offline in the browser. Create the deck from the person’s description in the JSON format described below.',
    language: 'The person uses the app in English. Answer in English unless they ask otherwise. Write the cards in the languages they want to learn.',
    deliveryTitle: 'How to deliver the deck',
    deliveryLink: 'Preferred: a direct link that opens the app’s import preview with the deck (see “Direct link” in the technical reference). Build the link only with a code tool, never by hand, and check it by decoding it again.',
    deliveryFile: 'If you cannot run code, or the link would be longer than {max} characters, create a JSON file instead (for example deck.json) or give the JSON in a code block for the person to save as a file. They select the file on the import page: {importUrl}',
    deliveryConfirm: 'Either way, the app checks the deck, shows a preview and saves it only after the person confirms. The deck stays on their device; nothing is uploaded.',
    contentTitle: 'Content rules',
    rules: [
      'Write original content in your own words. Do not copy text from books, dictionaries, websites or other copyrighted sources.',
      'Check every fact. If you are not sure about something, leave that card out rather than guess.',
      'Keep both sides short: a word, a term, a phrase or one short sentence. One fact per card.',
      'Make every front and every back unique within the deck, so that each pair has exactly one match.',
      'Do not include personal data: no names of private persons, addresses, phone numbers, e-mail addresses or health information.',
      'Give each side its language as a language tag (lang), for example en, de, pt-BR or zh-Hans.',
      'Use no images or audio from other websites; such links are removed. An emoji in symbol can serve as a picture.'
    ],
    sidesTitle: 'Front and back',
    sides: 'The front is the prompt: what is shown first (a word, a question, a term or a picture as an emoji). The back is the answer (a translation, a definition, a fact). In the Memory game the two sides of a card form a pair; when reviewing with flash cards, the person sees one side and tries to recall the other.',
    exampleTitle: 'Complete example',
    exampleIntro: 'A small deck: the Spanish word (with an emoji) on the front, the English word on the back.',
    exampleLink: 'The same deck as a direct link:',
    checklistTitle: 'Before you answer',
    checklist: [
      'The JSON is valid (double quotes, no trailing commas, no comments).',
      'There is at least one card; every card has a unique id and a front and back that are not empty.',
      'All texts are within the limits of the technical reference.',
      'A direct link decodes back to exactly your JSON; otherwise deliver a JSON file.',
      'Tell the person to review the cards before learning with them.'
    ],
    referenceTitle: 'Technical reference',
    referenceNote: 'This section is the same in every language version of this guide.'
  },
  de: {
    title: 'Anleitung für KIs: ein Lerndeck für Worthwhile Play erstellen',
    intro: 'Du hilfst einer Person, ein Lerndeck (Lernkarten mit Vorder- und Rückseite) für Worthwhile Play zu erstellen, eine kostenlose Web-App mit Spielen und Lernübungen, die offline im Browser läuft. Erstelle das Deck nach der Beschreibung der Person im unten beschriebenen JSON-Format.',
    language: 'Die Person nutzt die App auf Deutsch. Antworte auf Deutsch, sofern sie nichts anderes wünscht. Schreibe die Karten in den Sprachen, die sie lernen möchte.',
    deliveryTitle: 'So lieferst du das Deck',
    deliveryLink: 'Am besten: ein direkter Link, der die Import-Vorschau der App mit dem Deck öffnet (siehe „Direct link“ in der technischen Referenz). Erzeuge den Link nur mit einem Code-Werkzeug, nie von Hand, und prüfe ihn, indem du ihn wieder dekodierst.',
    deliveryFile: 'Wenn du keinen Code ausführen kannst oder der Link länger als {max} Zeichen würde, erstelle stattdessen eine JSON-Datei (zum Beispiel deck.json) oder gib das JSON in einem Codeblock aus, den die Person als Datei speichert. Sie wählt die Datei auf der Import-Seite aus: {importUrl}',
    deliveryConfirm: 'In beiden Fällen prüft die App das Deck, zeigt eine Vorschau und speichert es erst, wenn die Person bestätigt. Das Deck bleibt auf ihrem Gerät; nichts wird hochgeladen.',
    contentTitle: 'Regeln für den Inhalt',
    rules: [
      'Schreibe eigene Inhalte in eigenen Worten. Kopiere keine Texte aus Büchern, Wörterbüchern, Websites oder anderen urheberrechtlich geschützten Quellen.',
      'Prüfe jede Tatsache. Wenn du dir bei etwas nicht sicher bist, lass die Karte weg, statt zu raten.',
      'Halte beide Seiten kurz: ein Wort, ein Begriff, eine Wendung oder ein kurzer Satz. Eine Tatsache pro Karte.',
      'Jede Vorderseite und jede Rückseite muss im Deck einmalig sein, damit jedes Paar genau eine Lösung hat.',
      'Keine personenbezogenen Daten: keine Namen von Privatpersonen, Adressen, Telefonnummern, E-Mail-Adressen oder Gesundheitsangaben.',
      'Gib bei jeder Seite ihre Sprache als Sprachcode an (lang), zum Beispiel en, de, pt-BR oder zh-Hans.',
      'Verwende keine Bilder oder Audiodateien von anderen Websites; solche Links werden entfernt. Ein Emoji in symbol kann als Bild dienen.'
    ],
    sidesTitle: 'Vorder- und Rückseite',
    sides: 'Die Vorderseite ist die Frage: das, was zuerst gezeigt wird (ein Wort, eine Frage, ein Begriff oder ein Bild als Emoji). Die Rückseite ist die Antwort (eine Übersetzung, eine Definition, eine Tatsache). Im Spiel Memory bilden die beiden Seiten einer Karte ein Paar; beim Wiederholen mit Lernkarten sieht die Person eine Seite und versucht, sich an die andere zu erinnern.',
    exampleTitle: 'Vollständiges Beispiel',
    exampleIntro: 'Ein kleines Deck: vorne das spanische Wort (mit Emoji), hinten das englische Wort.',
    exampleLink: 'Dasselbe Deck als direkter Link:',
    checklistTitle: 'Bevor du antwortest',
    checklist: [
      'Das JSON ist gültig (doppelte Anführungszeichen, keine abschließenden Kommas, keine Kommentare).',
      'Es gibt mindestens eine Karte; jede Karte hat eine eindeutige id und eine nicht leere Vorder- und Rückseite.',
      'Alle Texte halten die Grenzen der technischen Referenz ein.',
      'Ein direkter Link ergibt dekodiert genau dein JSON; sonst liefere eine JSON-Datei.',
      'Sag der Person, dass sie die Karten prüfen soll, bevor sie damit lernt.'
    ],
    referenceTitle: 'Technische Referenz',
    referenceNote: 'Dieser Abschnitt ist in allen Sprachfassungen dieser Anleitung gleich (auf Englisch).'
  },
  nl: {
    title: 'Handleiding voor AI’s: een leerdeck maken voor Worthwhile Play',
    intro: 'Je helpt iemand een leerdeck (flitskaarten met een voorkant en een achterkant) te maken voor Worthwhile Play, een gratis web-app met spellen en leeroefeningen die offline in de browser werkt. Maak het deck op basis van de beschrijving van die persoon in het JSON-formaat dat hieronder wordt beschreven.',
    language: 'Deze persoon gebruikt de app in het Nederlands. Antwoord in het Nederlands, tenzij anders gevraagd. Schrijf de kaarten in de talen die deze persoon wil leren.',
    deliveryTitle: 'Hoe je het deck aanlevert',
    deliveryLink: 'Bij voorkeur: een directe link die de importvoorvertoning van de app met het deck opent (zie “Direct link” in de technische referentie). Maak de link alleen met een codetool, nooit met de hand, en controleer hem door hem opnieuw te decoderen.',
    deliveryFile: 'Als je geen code kunt uitvoeren of de link langer dan {max} tekens zou worden, maak dan een JSON-bestand (bijvoorbeeld deck.json) of geef de JSON in een codeblok dat de persoon als bestand opslaat. Het bestand wordt gekozen op de importpagina: {importUrl}',
    deliveryConfirm: 'In beide gevallen controleert de app het deck, toont een voorvertoning en slaat het pas op nadat de persoon heeft bevestigd. Het deck blijft op het apparaat; er wordt niets geüpload.',
    contentTitle: 'Regels voor de inhoud',
    rules: [
      'Schrijf originele inhoud in je eigen woorden. Kopieer geen tekst uit boeken, woordenboeken, websites of andere auteursrechtelijk beschermde bronnen.',
      'Controleer elk feit. Als je iets niet zeker weet, laat die kaart dan weg in plaats van te gokken.',
      'Houd beide kanten kort: een woord, een term, een uitdrukking of één korte zin. Eén feit per kaart.',
      'Maak elke voorkant en elke achterkant uniek binnen het deck, zodat elk paar precies één match heeft.',
      'Geen persoonsgegevens: geen namen van privépersonen, adressen, telefoonnummers, e-mailadressen of gezondheidsgegevens.',
      'Geef bij elke kant de taal aan met een taalcode (lang), bijvoorbeeld en, de, pt-BR of zh-Hans.',
      'Gebruik geen afbeeldingen of audio van andere websites; zulke links worden verwijderd. Een emoji in symbol kan als afbeelding dienen.'
    ],
    sidesTitle: 'Voorkant en achterkant',
    sides: 'De voorkant is de vraag: wat eerst wordt getoond (een woord, een vraag, een term of een afbeelding als emoji). De achterkant is het antwoord (een vertaling, een definitie, een feit). In het spel Memory vormen de twee kanten van een kaart een paar; bij het herhalen met flitskaarten ziet de persoon één kant en probeert de andere te herinneren.',
    exampleTitle: 'Volledig voorbeeld',
    exampleIntro: 'Een klein deck: het Spaanse woord (met een emoji) op de voorkant, het Engelse woord op de achterkant.',
    exampleLink: 'Hetzelfde deck als directe link:',
    checklistTitle: 'Voordat je antwoordt',
    checklist: [
      'De JSON is geldig (dubbele aanhalingstekens, geen komma’s aan het eind, geen opmerkingen).',
      'Er is minstens één kaart; elke kaart heeft een unieke id en een voorkant en achterkant die niet leeg zijn.',
      'Alle teksten blijven binnen de grenzen van de technische referentie.',
      'Een directe link levert na decoderen precies jouw JSON op; lever anders een JSON-bestand.',
      'Zeg tegen de persoon dat die de kaarten moet nakijken voordat die ermee leert.'
    ],
    referenceTitle: 'Technische referentie',
    referenceNote: 'Dit deel is in alle taalversies van deze handleiding hetzelfde (in het Engels).'
  },
  es: {
    title: 'Guía para IA: crear un mazo de aprendizaje para Worthwhile Play',
    intro: 'Estás ayudando a una persona a crear un mazo de aprendizaje (tarjetas con anverso y reverso) para Worthwhile Play, una aplicación web gratuita con juegos y ejercicios de aprendizaje que funciona sin conexión en el navegador. Crea el mazo a partir de la descripción de la persona en el formato JSON que se describe abajo.',
    language: 'La persona usa la aplicación en español. Responde en español, salvo que pida otra cosa. Escribe las tarjetas en los idiomas que quiera aprender.',
    deliveryTitle: 'Cómo entregar el mazo',
    deliveryLink: 'Lo mejor: un enlace directo que abra la vista previa de importación de la aplicación con el mazo (ver «Direct link» en la referencia técnica). Genera el enlace solo con una herramienta de código, nunca a mano, y compruébalo decodificándolo de nuevo.',
    deliveryFile: 'Si no puedes ejecutar código o el enlace superaría los {max} caracteres, crea en su lugar un archivo JSON (por ejemplo deck.json) o da el JSON en un bloque de código para que la persona lo guarde como archivo. Lo selecciona en la página de importación: {importUrl}',
    deliveryConfirm: 'En ambos casos, la aplicación comprueba el mazo, muestra una vista previa y solo lo guarda cuando la persona lo confirma. El mazo se queda en su dispositivo; no se sube nada.',
    contentTitle: 'Reglas para el contenido',
    rules: [
      'Escribe contenido original con tus propias palabras. No copies textos de libros, diccionarios, sitios web ni otras fuentes protegidas por derechos de autor.',
      'Comprueba cada dato. Si no estás seguro de algo, omite esa tarjeta en lugar de adivinar.',
      'Mantén ambos lados breves: una palabra, un término, una expresión o una frase corta. Un dato por tarjeta.',
      'Cada anverso y cada reverso debe ser único en el mazo, para que cada pareja tenga exactamente una correspondencia.',
      'No incluyas datos personales: ni nombres de particulares, ni direcciones, números de teléfono, correos electrónicos o datos de salud.',
      'Indica el idioma de cada lado con una etiqueta de idioma (lang), por ejemplo en, de, pt-BR o zh-Hans.',
      'No uses imágenes ni audio de otros sitios web; esos enlaces se eliminan. Un emoji en symbol puede servir de imagen.'
    ],
    sidesTitle: 'Anverso y reverso',
    sides: 'El anverso es la pregunta: lo que se muestra primero (una palabra, una pregunta, un término o una imagen como emoji). El reverso es la respuesta (una traducción, una definición, un dato). En el juego Memory los dos lados de una tarjeta forman una pareja; al repasar con tarjetas, la persona ve un lado e intenta recordar el otro.',
    exampleTitle: 'Ejemplo completo',
    exampleIntro: 'Un mazo pequeño: la palabra en español (con un emoji) en el anverso y la palabra en inglés en el reverso.',
    exampleLink: 'El mismo mazo como enlace directo:',
    checklistTitle: 'Antes de responder',
    checklist: [
      'El JSON es válido (comillas dobles, sin comas finales, sin comentarios).',
      'Hay al menos una tarjeta; cada tarjeta tiene un id único y un anverso y un reverso que no están vacíos.',
      'Todos los textos respetan los límites de la referencia técnica.',
      'Un enlace directo, al decodificarse, da exactamente tu JSON; si no, entrega un archivo JSON.',
      'Pide a la persona que revise las tarjetas antes de estudiar con ellas.'
    ],
    referenceTitle: 'Referencia técnica',
    referenceNote: 'Esta sección es igual en todas las versiones de esta guía (en inglés).'
  },
  fr: {
    title: 'Guide pour les IA : créer un paquet d’apprentissage pour Worthwhile Play',
    intro: 'Vous aidez une personne à créer un paquet d’apprentissage (des cartes avec un recto et un verso) pour Worthwhile Play, une application web gratuite de jeux et d’exercices d’apprentissage qui fonctionne hors ligne dans le navigateur. Créez le paquet d’après la description de la personne, au format JSON décrit ci-dessous.',
    language: 'La personne utilise l’application en français. Répondez en français, sauf demande contraire. Rédigez les cartes dans les langues qu’elle souhaite apprendre.',
    deliveryTitle: 'Comment livrer le paquet',
    deliveryLink: 'De préférence : un lien direct qui ouvre l’aperçu d’importation de l’application avec le paquet (voir « Direct link » dans la référence technique). Créez le lien uniquement avec un outil d’exécution de code, jamais à la main, et vérifiez-le en le décodant à nouveau.',
    deliveryFile: 'Si vous ne pouvez pas exécuter de code, ou si le lien dépasserait {max} caractères, créez plutôt un fichier JSON (par exemple deck.json) ou donnez le JSON dans un bloc de code que la personne enregistre comme fichier. Elle sélectionne le fichier sur la page d’importation : {importUrl}',
    deliveryConfirm: 'Dans les deux cas, l’application vérifie le paquet, affiche un aperçu et ne l’enregistre qu’après confirmation de la personne. Le paquet reste sur son appareil ; rien n’est envoyé.',
    contentTitle: 'Règles pour le contenu',
    rules: [
      'Rédigez un contenu original, avec vos propres mots. Ne copiez pas de textes de livres, de dictionnaires, de sites web ou d’autres sources protégées par le droit d’auteur.',
      'Vérifiez chaque fait. En cas de doute, laissez la carte de côté plutôt que de deviner.',
      'Gardez les deux faces courtes : un mot, un terme, une expression ou une phrase courte. Un fait par carte.',
      'Chaque recto et chaque verso doit être unique dans le paquet, pour que chaque paire ait exactement une correspondance.',
      'Aucune donnée personnelle : pas de noms de particuliers, d’adresses, de numéros de téléphone, d’adresses e-mail ni d’informations de santé.',
      'Indiquez la langue de chaque face avec un code de langue (lang), par exemple en, de, pt-BR ou zh-Hans.',
      'N’utilisez pas d’images ni de sons d’autres sites web ; ces liens sont supprimés. Un emoji dans symbol peut servir d’image.'
    ],
    sidesTitle: 'Recto et verso',
    sides: 'Le recto est la question : ce qui est montré en premier (un mot, une question, un terme ou une image sous forme d’emoji). Le verso est la réponse (une traduction, une définition, un fait). Dans le jeu Memory, les deux faces d’une carte forment une paire ; lors de la révision avec des cartes, la personne voit une face et essaie de se rappeler l’autre.',
    exampleTitle: 'Exemple complet',
    exampleIntro: 'Un petit paquet : le mot espagnol (avec un emoji) au recto, le mot anglais au verso.',
    exampleLink: 'Le même paquet sous forme de lien direct :',
    checklistTitle: 'Avant de répondre',
    checklist: [
      'Le JSON est valide (guillemets doubles, pas de virgule finale, pas de commentaires).',
      'Il y a au moins une carte ; chaque carte a un id unique et un recto et un verso non vides.',
      'Tous les textes respectent les limites de la référence technique.',
      'Un lien direct, une fois décodé, redonne exactement votre JSON ; sinon, livrez un fichier JSON.',
      'Invitez la personne à relire les cartes avant d’apprendre avec.'
    ],
    referenceTitle: 'Référence technique',
    referenceNote: 'Cette section est identique dans toutes les versions linguistiques de ce guide (en anglais).'
  },
  ru: {
    title: 'Руководство для ИИ: как создать учебную колоду для Worthwhile Play',
    intro: 'Вы помогаете человеку создать учебную колоду (карточки с лицевой и оборотной стороной) для Worthwhile Play — бесплатного веб-приложения с играми и учебными упражнениями, которое работает в браузере без подключения к интернету. Создайте колоду по описанию этого человека в формате JSON, описанном ниже.',
    language: 'Человек пользуется приложением на русском языке. Отвечайте по-русски, если он не попросит иначе. Пишите карточки на тех языках, которые он хочет изучать.',
    deliveryTitle: 'Как передать колоду',
    deliveryLink: 'Лучше всего — прямая ссылка, которая открывает предпросмотр импорта в приложении с этой колодой (см. «Direct link» в технической справке). Создавайте ссылку только с помощью инструмента для выполнения кода, никогда вручную, и проверьте её, декодировав обратно.',
    deliveryFile: 'Если вы не можете выполнять код или ссылка получится длиннее {max} символов, создайте вместо неё файл JSON (например, deck.json) или выдайте JSON в блоке кода, чтобы человек сохранил его как файл. Файл выбирается на странице импорта: {importUrl}',
    deliveryConfirm: 'В обоих случаях приложение проверяет колоду, показывает предпросмотр и сохраняет её только после подтверждения. Колода остаётся на устройстве человека; ничего не загружается на сервер.',
    contentTitle: 'Правила для содержания',
    rules: [
      'Пишите оригинальный текст своими словами. Не копируйте тексты из книг, словарей, сайтов и других источников, защищённых авторским правом.',
      'Проверяйте каждый факт. Если вы в чём-то не уверены, лучше не добавляйте эту карточку, чем угадывать.',
      'Обе стороны должны быть короткими: слово, термин, выражение или одно короткое предложение. Один факт на карточку.',
      'Каждая лицевая и каждая оборотная сторона должна быть в колоде единственной, чтобы у каждой пары было ровно одно соответствие.',
      'Никаких персональных данных: ни имён частных лиц, ни адресов, телефонов, адресов электронной почты или сведений о здоровье.',
      'Указывайте язык каждой стороны кодом языка (lang), например en, de, pt-BR или zh-Hans.',
      'Не используйте изображения и аудио с других сайтов: такие ссылки удаляются. Вместо картинки можно использовать эмодзи в поле symbol.'
    ],
    sidesTitle: 'Лицевая и оборотная сторона',
    sides: 'Лицевая сторона — это вопрос: то, что показывается сначала (слово, вопрос, термин или картинка в виде эмодзи). Оборотная сторона — это ответ (перевод, определение, факт). В игре Memory две стороны карточки образуют пару; при повторении с карточками человек видит одну сторону и пытается вспомнить другую.',
    exampleTitle: 'Полный пример',
    exampleIntro: 'Небольшая колода: на лицевой стороне испанское слово (с эмодзи), на оборотной — английское.',
    exampleLink: 'Та же колода в виде прямой ссылки:',
    checklistTitle: 'Прежде чем ответить',
    checklist: [
      'JSON корректен (двойные кавычки, без лишних запятых в конце, без комментариев).',
      'Есть хотя бы одна карточка; у каждой карточки уникальный id и непустые лицевая и оборотная стороны.',
      'Все тексты укладываются в ограничения из технической справки.',
      'Прямая ссылка после декодирования даёт ровно ваш JSON; иначе передайте файл JSON.',
      'Попросите человека проверить карточки, прежде чем учиться по ним.'
    ],
    referenceTitle: 'Техническая справка',
    referenceNote: 'Этот раздел одинаков во всех языковых версиях руководства (на английском).'
  },
  'zh-Hans': {
    title: 'AI 指南：为 Worthwhile Play 创建学习卡组',
    intro: '你正在帮助一个人为 Worthwhile Play 创建学习卡组（有正面和背面的抽认卡）。Worthwhile Play 是一款免费的网页应用，提供游戏和学习练习，可在浏览器中离线使用。请根据此人的描述，按照下面说明的 JSON 格式创建卡组。',
    language: '此人使用简体中文界面。除非对方另有要求，请用简体中文回答。卡片请使用对方想学习的语言。',
    deliveryTitle: '如何交付卡组',
    deliveryLink: '首选：一个直接链接，在应用中打开包含该卡组的导入预览（见技术参考中的“Direct link”）。只能用代码工具生成链接，切勿手动编码，并通过重新解码来检查它。',
    deliveryFile: '如果你无法运行代码，或者链接会超过 {max} 个字符，请改为创建一个 JSON 文件（例如 deck.json），或在代码块中给出 JSON，让对方保存为文件。对方在导入页面选择该文件：{importUrl}',
    deliveryConfirm: '无论哪种方式，应用都会检查卡组、显示预览，并且只有在对方确认后才保存。卡组只保存在对方的设备上，不会上传任何内容。',
    contentTitle: '内容规则',
    rules: [
      '用自己的话编写原创内容。不要复制书籍、词典、网站或其他受版权保护来源中的文字。',
      '核实每一个事实。如果不确定，宁可不放这张卡片，也不要猜测。',
      '两面都要简短：一个词、一个术语、一个短语或一个短句。每张卡片一个知识点。',
      '卡组中每个正面和每个背面都必须唯一，这样每一对都只有一个匹配。',
      '不要包含个人数据：不要有普通个人的姓名、地址、电话号码、电子邮件地址或健康信息。',
      '用语言标签（lang）标明每一面的语言，例如 en、de、pt-BR 或 zh-Hans。',
      '不要使用来自其他网站的图片或音频，这类链接会被删除。可以在 symbol 中用表情符号代替图片。'
    ],
    sidesTitle: '正面和背面',
    sides: '正面是提示：最先显示的内容（一个词、一个问题、一个术语或用表情符号表示的图片）。背面是答案（翻译、定义或事实）。在 Memory 游戏中，一张卡片的两面组成一对；用抽认卡复习时，对方看到一面，并尝试回想另一面。',
    exampleTitle: '完整示例',
    exampleIntro: '一个小卡组：正面是西班牙语单词（带表情符号），背面是英语单词。',
    exampleLink: '同一个卡组的直接链接：',
    checklistTitle: '回答之前',
    checklist: [
      'JSON 有效（使用双引号，没有多余的结尾逗号，没有注释）。',
      '至少有一张卡片；每张卡片都有唯一的 id，正面和背面都不为空。',
      '所有文本都在技术参考规定的限制之内。',
      '直接链接解码后与你的 JSON 完全一致；否则请交付 JSON 文件。',
      '提醒对方在用这些卡片学习之前先检查一遍。'
    ],
    referenceTitle: '技术参考',
    referenceNote: '本节在本指南的所有语言版本中都相同（英文）。'
  },
  ko: {
    title: 'AI를 위한 안내: Worthwhile Play 학습 덱 만들기',
    intro: '당신은 한 사람이 Worthwhile Play용 학습 덱(앞면과 뒷면이 있는 플래시 카드)을 만드는 것을 돕고 있습니다. Worthwhile Play는 게임과 학습 연습을 제공하는 무료 웹 앱으로, 브라우저에서 오프라인으로 작동합니다. 그 사람의 설명을 바탕으로 아래에 설명된 JSON 형식으로 덱을 만드세요.',
    language: '이 사람은 앱을 한국어로 사용합니다. 따로 요청하지 않으면 한국어로 답하세요. 카드는 그 사람이 배우고 싶은 언어로 작성하세요.',
    deliveryTitle: '덱을 전달하는 방법',
    deliveryLink: '권장: 덱이 담긴 앱의 가져오기 미리보기를 여는 직접 링크(기술 참고 자료의 “Direct link” 참고). 링크는 반드시 코드 도구로 만들고 손으로 인코딩하지 마세요. 다시 디코딩해서 확인하세요.',
    deliveryFile: '코드를 실행할 수 없거나 링크가 {max}자보다 길어진다면, 대신 JSON 파일(예: deck.json)을 만들거나 그 사람이 파일로 저장할 수 있도록 JSON을 코드 블록으로 제공하세요. 파일은 가져오기 페이지에서 선택합니다: {importUrl}',
    deliveryConfirm: '어느 쪽이든 앱은 덱을 검사하고 미리보기를 보여 주며, 그 사람이 확인한 뒤에만 저장합니다. 덱은 그 사람의 기기에만 남고 아무것도 업로드되지 않습니다.',
    contentTitle: '내용 규칙',
    rules: [
      '자신의 말로 독창적인 내용을 쓰세요. 책, 사전, 웹사이트 등 저작권이 있는 자료의 글을 복사하지 마세요.',
      '모든 사실을 확인하세요. 확실하지 않다면 추측하지 말고 그 카드를 빼세요.',
      '양면을 짧게 유지하세요: 단어, 용어, 표현 또는 짧은 문장 하나. 카드 한 장에 사실 하나.',
      '덱 안에서 모든 앞면과 모든 뒷면이 서로 달라야 각 쌍의 짝이 정확히 하나가 됩니다.',
      '개인 정보를 넣지 마세요: 일반인의 이름, 주소, 전화번호, 이메일 주소, 건강 정보는 안 됩니다.',
      '각 면의 언어를 언어 태그(lang)로 표시하세요. 예: en, de, pt-BR, zh-Hans.',
      '다른 웹사이트의 이미지나 오디오를 쓰지 마세요. 그런 링크는 삭제됩니다. symbol에 이모지를 넣어 그림으로 쓸 수 있습니다.'
    ],
    sidesTitle: '앞면과 뒷면',
    sides: '앞면은 질문입니다. 먼저 보이는 내용(단어, 질문, 용어 또는 이모지로 된 그림)입니다. 뒷면은 답입니다(번역, 정의, 사실). Memory 게임에서는 카드의 두 면이 한 쌍이 되고, 플래시 카드로 복습할 때는 한 면을 보고 다른 면을 떠올립니다.',
    exampleTitle: '전체 예시',
    exampleIntro: '작은 덱: 앞면에는 스페인어 단어(이모지 포함), 뒷면에는 영어 단어.',
    exampleLink: '같은 덱을 직접 링크로 나타내면:',
    checklistTitle: '답하기 전에',
    checklist: [
      'JSON이 올바릅니다(큰따옴표 사용, 끝에 불필요한 쉼표 없음, 주석 없음).',
      '카드가 하나 이상 있고, 모든 카드에 고유한 id와 비어 있지 않은 앞면과 뒷면이 있습니다.',
      '모든 텍스트가 기술 참고 자료의 제한을 지킵니다.',
      '직접 링크를 디코딩하면 정확히 당신의 JSON이 나옵니다. 그렇지 않다면 JSON 파일로 전달하세요.',
      '카드로 공부하기 전에 내용을 검토하라고 그 사람에게 알려 주세요.'
    ],
    referenceTitle: '기술 참고 자료',
    referenceNote: '이 부분은 이 안내의 모든 언어 버전에서 같습니다(영어).'
  },
  ja: {
    title: 'AI 向けガイド：Worthwhile Play の学習デッキを作る',
    intro: 'あなたは、ある人が Worthwhile Play 用の学習デッキ（表と裏があるフラッシュカード）を作るのを手伝っています。Worthwhile Play は、ゲームと学習用の練習ができる無料のウェブアプリで、ブラウザでオフラインでも動きます。その人の説明をもとに、下に説明する JSON 形式でデッキを作ってください。',
    language: 'この人はアプリを日本語で使っています。特に希望がなければ日本語で答えてください。カードは、その人が学びたい言語で書いてください。',
    deliveryTitle: 'デッキの渡し方',
    deliveryLink: 'おすすめ：デッキを含んだアプリのインポートプレビューを開く直接リンク（技術リファレンスの「Direct link」を参照）。リンクは必ずコード実行ツールで作り、手作業でエンコードしないでください。もう一度デコードして確認してください。',
    deliveryFile: 'コードを実行できない場合や、リンクが {max} 文字を超える場合は、代わりに JSON ファイル（例：deck.json）を作るか、その人がファイルとして保存できるように JSON をコードブロックで示してください。ファイルはインポートページで選びます：{importUrl}',
    deliveryConfirm: 'どちらの場合も、アプリはデッキをチェックしてプレビューを表示し、その人が確認してから保存します。デッキはその人の端末に残り、何もアップロードされません。',
    contentTitle: '内容のルール',
    rules: [
      '自分の言葉でオリジナルの内容を書いてください。本、辞書、ウェブサイトなど著作権のある資料から文章をコピーしないでください。',
      'すべての事実を確認してください。確信が持てないときは、推測せずにそのカードを入れないでください。',
      '表も裏も短くしてください：単語、用語、言い回し、または短い文ひとつ。1 枚のカードに事実はひとつ。',
      'デッキの中で表と裏はそれぞれすべて異なるようにし、どのペアも相手がちょうどひとつになるようにしてください。',
      '個人データを入れないでください：一般の人の名前、住所、電話番号、メールアドレス、健康に関する情報は不可です。',
      '各面の言語を言語タグ（lang）で示してください。例：en、de、pt-BR、zh-Hans。',
      'ほかのウェブサイトの画像や音声は使わないでください。そのようなリンクは削除されます。symbol に絵文字を入れると絵の代わりになります。'
    ],
    sidesTitle: '表と裏',
    sides: '表は問いです。最初に見せるもの（単語、質問、用語、または絵文字の絵）です。裏は答えです（訳語、定義、事実）。Memory ゲームではカードの表と裏がペアになり、フラッシュカードで復習するときは片方の面を見て、もう片方を思い出します。',
    exampleTitle: '完全な例',
    exampleIntro: '小さなデッキ：表にスペイン語の単語（絵文字付き）、裏に英語の単語。',
    exampleLink: '同じデッキを直接リンクにしたもの：',
    checklistTitle: '答える前に',
    checklist: [
      'JSON が正しいこと（ダブルクォート、末尾の余分なカンマなし、コメントなし）。',
      'カードが 1 枚以上あり、どのカードにも一意の id と、空でない表と裏があること。',
      'すべてのテキストが技術リファレンスの制限内であること。',
      '直接リンクをデコードすると、あなたの JSON とまったく同じになること。そうでなければ JSON ファイルで渡すこと。',
      'カードで学習する前に内容を確認するよう、その人に伝えること。'
    ],
    referenceTitle: '技術リファレンス',
    referenceNote: 'この部分は、このガイドのすべての言語版で同じです（英語）。'
  },
  ar: {
    title: 'دليل للذكاء الاصطناعي: إنشاء مجموعة بطاقات تعليمية لتطبيق Worthwhile Play',
    intro: 'أنت تساعد شخصًا على إنشاء مجموعة بطاقات تعليمية (بطاقات لها وجه وظهر) لتطبيق Worthwhile Play، وهو تطبيق ويب مجاني فيه ألعاب وتمارين تعليمية ويعمل في المتصفح دون اتصال. أنشئ المجموعة وفق وصف هذا الشخص وبصيغة JSON الموضحة أدناه.',
    language: 'يستخدم هذا الشخص التطبيق باللغة العربية. أجب بالعربية ما لم يطلب غير ذلك. اكتب البطاقات باللغات التي يريد تعلّمها.',
    deliveryTitle: 'كيف تسلّم المجموعة',
    deliveryLink: 'الأفضل: رابط مباشر يفتح معاينة الاستيراد في التطبيق مع المجموعة (انظر «Direct link» في المرجع التقني). أنشئ الرابط بأداة لتشغيل الشيفرة فقط، ولا ترمّزه يدويًا أبدًا، وتحقّق منه بفك ترميزه من جديد.',
    deliveryFile: 'إذا لم تستطع تشغيل الشيفرة، أو كان الرابط سيتجاوز {max} حرف، فأنشئ بدلًا منه ملف JSON (مثل deck.json) أو قدّم JSON في كتلة شيفرة ليحفظها الشخص ملفًا. يختار الشخص الملف في صفحة الاستيراد: {importUrl}',
    deliveryConfirm: 'في الحالتين يتحقق التطبيق من المجموعة ويعرض معاينة، ولا يحفظها إلا بعد أن يؤكد الشخص. تبقى المجموعة على جهازه، ولا يُرفع أي شيء.',
    contentTitle: 'قواعد المحتوى',
    rules: [
      'اكتب محتوى أصليًا بكلماتك. لا تنسخ نصوصًا من الكتب أو القواميس أو المواقع أو غيرها من المصادر المحمية بحقوق النشر.',
      'تحقّق من كل معلومة. إن لم تكن متأكدًا من شيء فاترك تلك البطاقة بدل التخمين.',
      'اجعل الوجهين قصيرين: كلمة أو مصطلح أو عبارة أو جملة قصيرة واحدة. معلومة واحدة لكل بطاقة.',
      'اجعل كل وجه وكل ظهر فريدًا داخل المجموعة، حتى يكون لكل زوج تطابق واحد فقط.',
      'لا تضع بيانات شخصية: لا أسماء أفراد عاديين ولا عناوين ولا أرقام هواتف ولا عناوين بريد إلكتروني ولا معلومات صحية.',
      'حدّد لغة كل وجه برمز اللغة (lang)، مثل en أو de أو pt-BR أو zh-Hans.',
      'لا تستخدم صورًا أو ملفات صوتية من مواقع أخرى؛ فهذه الروابط تُحذف. يمكن أن يقوم رمز تعبيري في symbol مقام الصورة.'
    ],
    sidesTitle: 'الوجه والظهر',
    sides: 'الوجه هو السؤال: ما يُعرض أولًا (كلمة أو سؤال أو مصطلح أو صورة على شكل رمز تعبيري). الظهر هو الجواب (ترجمة أو تعريف أو معلومة). في لعبة Memory يشكّل وجها البطاقة زوجًا؛ وعند المراجعة بالبطاقات يرى الشخص وجهًا ويحاول تذكّر الآخر.',
    exampleTitle: 'مثال كامل',
    exampleIntro: 'مجموعة صغيرة: الكلمة الإسبانية (مع رمز تعبيري) على الوجه، والكلمة الإنجليزية على الظهر.',
    exampleLink: 'المجموعة نفسها رابطًا مباشرًا:',
    checklistTitle: 'قبل أن تجيب',
    checklist: [
      'ملف JSON صالح (علامات اقتباس مزدوجة، بلا فواصل زائدة في النهاية، بلا تعليقات).',
      'توجد بطاقة واحدة على الأقل؛ لكل بطاقة id فريد ووجه وظهر غير فارغين.',
      'كل النصوص ضمن حدود المرجع التقني.',
      'فك ترميز الرابط المباشر يعيد ملف JSON الخاص بك تمامًا؛ وإلا فسلّم ملف JSON.',
      'اطلب من الشخص مراجعة البطاقات قبل التعلّم بها.'
    ],
    referenceTitle: 'المرجع التقني',
    referenceNote: 'هذا القسم متطابق في كل النسخ اللغوية لهذا الدليل (بالإنجليزية).'
  },
  pt: {
    title: 'Guia para IA: criar um baralho de estudo para o Worthwhile Play',
    intro: 'Você está ajudando uma pessoa a criar um baralho de estudo (cartões com frente e verso) para o Worthwhile Play, um aplicativo web gratuito com jogos e exercícios de aprendizagem que funciona offline no navegador. Crie o baralho a partir da descrição da pessoa, no formato JSON descrito abaixo.',
    language: 'A pessoa usa o aplicativo em português. Responda em português, a menos que ela peça outra coisa. Escreva os cartões nos idiomas que ela quer aprender.',
    deliveryTitle: 'Como entregar o baralho',
    deliveryLink: 'De preferência: um link direto que abre a pré-visualização de importação do aplicativo com o baralho (veja “Direct link” na referência técnica). Gere o link somente com uma ferramenta de código, nunca à mão, e confira-o decodificando-o de novo.',
    deliveryFile: 'Se você não puder executar código, ou se o link passar de {max} caracteres, crie um arquivo JSON (por exemplo deck.json) ou entregue o JSON em um bloco de código para a pessoa salvar como arquivo. Ela seleciona o arquivo na página de importação: {importUrl}',
    deliveryConfirm: 'Nos dois casos, o aplicativo verifica o baralho, mostra uma pré-visualização e só o salva depois que a pessoa confirma. O baralho fica no dispositivo dela; nada é enviado.',
    contentTitle: 'Regras para o conteúdo',
    rules: [
      'Escreva conteúdo original, com suas próprias palavras. Não copie textos de livros, dicionários, sites ou outras fontes protegidas por direitos autorais.',
      'Confira cada fato. Se não tiver certeza de algo, deixe esse cartão de fora em vez de adivinhar.',
      'Mantenha os dois lados curtos: uma palavra, um termo, uma expressão ou uma frase curta. Um fato por cartão.',
      'Cada frente e cada verso deve ser único no baralho, para que cada par tenha exatamente uma correspondência.',
      'Não inclua dados pessoais: nada de nomes de pessoas físicas, endereços, telefones, e-mails ou informações de saúde.',
      'Indique o idioma de cada lado com um código de idioma (lang), por exemplo en, de, pt-BR ou zh-Hans.',
      'Não use imagens nem áudio de outros sites; esses links são removidos. Um emoji em symbol pode servir de imagem.'
    ],
    sidesTitle: 'Frente e verso',
    sides: 'A frente é a pergunta: o que aparece primeiro (uma palavra, uma pergunta, um termo ou uma imagem como emoji). O verso é a resposta (uma tradução, uma definição, um fato). No jogo Memory, os dois lados de um cartão formam um par; ao revisar com cartões, a pessoa vê um lado e tenta lembrar o outro.',
    exampleTitle: 'Exemplo completo',
    exampleIntro: 'Um baralho pequeno: a palavra em espanhol (com um emoji) na frente e a palavra em inglês no verso.',
    exampleLink: 'O mesmo baralho como link direto:',
    checklistTitle: 'Antes de responder',
    checklist: [
      'O JSON é válido (aspas duplas, sem vírgulas sobrando no fim, sem comentários).',
      'Há pelo menos um cartão; cada cartão tem um id único e uma frente e um verso que não estão vazios.',
      'Todos os textos respeitam os limites da referência técnica.',
      'Um link direto, decodificado, resulta exatamente no seu JSON; caso contrário, entregue um arquivo JSON.',
      'Peça à pessoa que revise os cartões antes de estudar com eles.'
    ],
    referenceTitle: 'Referência técnica',
    referenceNote: 'Esta seção é igual em todas as versões deste guia (em inglês).'
  },
  it: {
    title: 'Guida per le IA: creare un mazzo di studio per Worthwhile Play',
    intro: 'Stai aiutando una persona a creare un mazzo di studio (carte con fronte e retro) per Worthwhile Play, un’app web gratuita con giochi ed esercizi di apprendimento che funziona offline nel browser. Crea il mazzo in base alla descrizione della persona, nel formato JSON descritto qui sotto.',
    language: 'La persona usa l’app in italiano. Rispondi in italiano, salvo diversa richiesta. Scrivi le carte nelle lingue che vuole imparare.',
    deliveryTitle: 'Come consegnare il mazzo',
    deliveryLink: 'Meglio: un link diretto che apre l’anteprima di importazione dell’app con il mazzo (vedi “Direct link” nel riferimento tecnico). Crea il link solo con uno strumento per eseguire codice, mai a mano, e controllalo decodificandolo di nuovo.',
    deliveryFile: 'Se non puoi eseguire codice, o se il link supererebbe i {max} caratteri, crea invece un file JSON (per esempio deck.json) oppure fornisci il JSON in un blocco di codice che la persona salva come file. Il file si seleziona nella pagina di importazione: {importUrl}',
    deliveryConfirm: 'In entrambi i casi l’app controlla il mazzo, mostra un’anteprima e lo salva solo dopo la conferma della persona. Il mazzo resta sul suo dispositivo; non viene caricato nulla.',
    contentTitle: 'Regole per il contenuto',
    rules: [
      'Scrivi contenuti originali con parole tue. Non copiare testi da libri, dizionari, siti web o altre fonti protette dal diritto d’autore.',
      'Verifica ogni fatto. Se non sei sicuro di qualcosa, lascia fuori quella carta invece di tirare a indovinare.',
      'Tieni brevi entrambi i lati: una parola, un termine, un’espressione o una frase breve. Un fatto per carta.',
      'Ogni fronte e ogni retro deve essere unico nel mazzo, così ogni coppia ha esattamente una corrispondenza.',
      'Niente dati personali: niente nomi di privati, indirizzi, numeri di telefono, indirizzi e-mail o informazioni sulla salute.',
      'Indica la lingua di ogni lato con un codice di lingua (lang), per esempio en, de, pt-BR o zh-Hans.',
      'Non usare immagini o audio di altri siti web: questi link vengono rimossi. Un’emoji in symbol può fare da immagine.'
    ],
    sidesTitle: 'Fronte e retro',
    sides: 'Il fronte è la domanda: ciò che viene mostrato per primo (una parola, una domanda, un termine o un’immagine come emoji). Il retro è la risposta (una traduzione, una definizione, un fatto). Nel gioco Memory i due lati di una carta formano una coppia; ripassando con le carte, la persona vede un lato e prova a ricordare l’altro.',
    exampleTitle: 'Esempio completo',
    exampleIntro: 'Un piccolo mazzo: la parola spagnola (con un’emoji) sul fronte, la parola inglese sul retro.',
    exampleLink: 'Lo stesso mazzo come link diretto:',
    checklistTitle: 'Prima di rispondere',
    checklist: [
      'Il JSON è valido (virgolette doppie, nessuna virgola finale, nessun commento).',
      'C’è almeno una carta; ogni carta ha un id univoco e un fronte e un retro non vuoti.',
      'Tutti i testi rispettano i limiti del riferimento tecnico.',
      'Un link diretto, decodificato, restituisce esattamente il tuo JSON; altrimenti consegna un file JSON.',
      'Chiedi alla persona di controllare le carte prima di studiare con esse.'
    ],
    referenceTitle: 'Riferimento tecnico',
    referenceNote: 'Questa sezione è uguale in tutte le versioni linguistiche della guida (in inglese).'
  },
  pl: {
    title: 'Przewodnik dla AI: jak utworzyć talię do nauki dla Worthwhile Play',
    intro: 'Pomagasz komuś utworzyć talię do nauki (fiszki z awersem i rewersem) dla Worthwhile Play – bezpłatnej aplikacji internetowej z grami i ćwiczeniami do nauki, która działa offline w przeglądarce. Utwórz talię na podstawie opisu tej osoby, w formacie JSON opisanym poniżej.',
    language: 'Ta osoba używa aplikacji po polsku. Odpowiadaj po polsku, chyba że poprosi o coś innego. Karty pisz w językach, których chce się uczyć.',
    deliveryTitle: 'Jak przekazać talię',
    deliveryLink: 'Najlepiej: bezpośredni link, który otwiera w aplikacji podgląd importu z talią (zob. „Direct link” w dokumentacji technicznej). Twórz link wyłącznie narzędziem do uruchamiania kodu, nigdy ręcznie, i sprawdź go, dekodując ponownie.',
    deliveryFile: 'Jeśli nie możesz uruchamiać kodu albo link byłby dłuższy niż {max} znaków, utwórz zamiast tego plik JSON (na przykład deck.json) lub podaj JSON w bloku kodu, który ta osoba zapisze jako plik. Plik wybiera się na stronie importu: {importUrl}',
    deliveryConfirm: 'W obu przypadkach aplikacja sprawdza talię, pokazuje podgląd i zapisuje ją dopiero po potwierdzeniu. Talia zostaje na urządzeniu tej osoby; nic nie jest wysyłane.',
    contentTitle: 'Zasady dotyczące treści',
    rules: [
      'Pisz oryginalne treści własnymi słowami. Nie kopiuj tekstów z książek, słowników, stron internetowych ani innych źródeł chronionych prawem autorskim.',
      'Sprawdzaj każdy fakt. Jeśli nie masz pewności, pomiń tę kartę zamiast zgadywać.',
      'Obie strony mają być krótkie: słowo, termin, wyrażenie lub jedno krótkie zdanie. Jeden fakt na kartę.',
      'Każdy awers i każdy rewers musi być w talii niepowtarzalny, aby każda para miała dokładnie jedno dopasowanie.',
      'Bez danych osobowych: żadnych nazwisk osób prywatnych, adresów, numerów telefonów, adresów e-mail ani informacji o zdrowiu.',
      'Podawaj język każdej strony jako kod języka (lang), na przykład en, de, pt-BR lub zh-Hans.',
      'Nie używaj obrazów ani dźwięków z innych stron; takie linki są usuwane. Emoji w polu symbol może służyć jako obrazek.'
    ],
    sidesTitle: 'Awers i rewers',
    sides: 'Awers to pytanie: to, co widać najpierw (słowo, pytanie, termin albo obrazek w postaci emoji). Rewers to odpowiedź (tłumaczenie, definicja, fakt). W grze Memory obie strony karty tworzą parę; podczas powtórek z fiszkami osoba widzi jedną stronę i próbuje przypomnieć sobie drugą.',
    exampleTitle: 'Pełny przykład',
    exampleIntro: 'Mała talia: na awersie hiszpańskie słowo (z emoji), na rewersie angielskie.',
    exampleLink: 'Ta sama talia jako bezpośredni link:',
    checklistTitle: 'Zanim odpowiesz',
    checklist: [
      'JSON jest poprawny (cudzysłowy podwójne, bez przecinków na końcu, bez komentarzy).',
      'Jest co najmniej jedna karta; każda karta ma unikalne id oraz niepusty awers i rewers.',
      'Wszystkie teksty mieszczą się w limitach z dokumentacji technicznej.',
      'Bezpośredni link po zdekodowaniu daje dokładnie twój JSON; w przeciwnym razie przekaż plik JSON.',
      'Poproś tę osobę, aby sprawdziła karty, zanim zacznie się z nich uczyć.'
    ],
    referenceTitle: 'Dokumentacja techniczna',
    referenceNote: 'Ta część jest taka sama we wszystkich wersjach językowych przewodnika (po angielsku).'
  },
  tr: {
    title: 'Yapay zekâ için kılavuz: Worthwhile Play için bir öğrenme destesi oluşturma',
    intro: 'Bir kişinin Worthwhile Play için öğrenme destesi (ön ve arka yüzü olan bilgi kartları) oluşturmasına yardım ediyorsun. Worthwhile Play, oyunlar ve öğrenme alıştırmaları sunan, tarayıcıda çevrimdışı çalışan ücretsiz bir web uygulamasıdır. Desteyi, kişinin açıklamasına göre aşağıda anlatılan JSON biçiminde oluştur.',
    language: 'Kişi uygulamayı Türkçe kullanıyor. Aksini istemedikçe Türkçe yanıt ver. Kartları kişinin öğrenmek istediği dillerde yaz.',
    deliveryTitle: 'Deste nasıl teslim edilir',
    deliveryLink: 'Tercih edilen: uygulamanın içe aktarma önizlemesini desteyle birlikte açan doğrudan bir bağlantı (teknik başvurudaki “Direct link” bölümüne bak). Bağlantıyı yalnızca kod çalıştırma aracıyla oluştur, asla elle kodlama; yeniden çözerek kontrol et.',
    deliveryFile: 'Kod çalıştıramıyorsan ya da bağlantı {max} karakterden uzun olacaksa, bunun yerine bir JSON dosyası (örneğin deck.json) oluştur veya kişinin dosya olarak kaydedeceği JSON’u bir kod bloğunda ver. Kişi dosyayı içe aktarma sayfasında seçer: {importUrl}',
    deliveryConfirm: 'Her iki durumda da uygulama desteyi denetler, bir önizleme gösterir ve ancak kişi onayladıktan sonra kaydeder. Deste kişinin cihazında kalır; hiçbir şey yüklenmez.',
    contentTitle: 'İçerik kuralları',
    rules: [
      'Kendi sözcüklerinle özgün içerik yaz. Kitaplardan, sözlüklerden, web sitelerinden veya telif hakkıyla korunan başka kaynaklardan metin kopyalama.',
      'Her bilgiyi kontrol et. Bir şeyden emin değilsen tahmin etmek yerine o kartı ekleme.',
      'İki yüzü de kısa tut: bir sözcük, bir terim, bir ifade ya da kısa bir cümle. Kart başına bir bilgi.',
      'Destedeki her ön yüz ve her arka yüz benzersiz olsun; böylece her çiftin tam olarak bir eşi olur.',
      'Kişisel veri ekleme: sıradan kişilerin adları, adresler, telefon numaraları, e-posta adresleri veya sağlık bilgileri olmasın.',
      'Her yüzün dilini bir dil koduyla (lang) belirt; örneğin en, de, pt-BR veya zh-Hans.',
      'Başka web sitelerinden resim veya ses kullanma; bu tür bağlantılar kaldırılır. symbol alanındaki bir emoji resim yerine geçebilir.'
    ],
    sidesTitle: 'Ön yüz ve arka yüz',
    sides: 'Ön yüz sorudur: önce gösterilen şey (bir sözcük, bir soru, bir terim ya da emoji olarak bir resim). Arka yüz cevaptır (bir çeviri, bir tanım, bir bilgi). Memory oyununda bir kartın iki yüzü bir çift oluşturur; kartlarla tekrar yaparken kişi bir yüzü görür ve diğerini hatırlamaya çalışır.',
    exampleTitle: 'Eksiksiz örnek',
    exampleIntro: 'Küçük bir deste: ön yüzde İspanyolca sözcük (emoji ile), arka yüzde İngilizce sözcük.',
    exampleLink: 'Aynı deste doğrudan bağlantı olarak:',
    checklistTitle: 'Yanıt vermeden önce',
    checklist: [
      'JSON geçerli (çift tırnak, sonda fazladan virgül yok, yorum yok).',
      'En az bir kart var; her kartın benzersiz bir id’si ve boş olmayan bir ön ve arka yüzü var.',
      'Tüm metinler teknik başvurudaki sınırlar içinde.',
      'Doğrudan bağlantı çözüldüğünde tam olarak senin JSON’unu veriyor; aksi hâlde bir JSON dosyası teslim et.',
      'Kişiye, kartlarla çalışmadan önce onları gözden geçirmesini söyle.'
    ],
    referenceTitle: 'Teknik başvuru',
    referenceNote: 'Bu bölüm, kılavuzun tüm dil sürümlerinde aynıdır (İngilizce).'
  },
  uk: {
    title: 'Посібник для ШІ: як створити навчальну колоду для Worthwhile Play',
    intro: 'Ви допомагаєте людині створити навчальну колоду (картки з лицьовим і зворотним боком) для Worthwhile Play — безкоштовного вебзастосунку з іграми та навчальними вправами, який працює в браузері без інтернету. Створіть колоду за описом цієї людини у форматі JSON, описаному нижче.',
    language: 'Людина користується застосунком українською мовою. Відповідайте українською, якщо вона не попросить інакше. Пишіть картки тими мовами, які вона хоче вивчати.',
    deliveryTitle: 'Як передати колоду',
    deliveryLink: 'Найкраще — пряме посилання, яке відкриває в застосунку попередній перегляд імпорту з цією колодою (див. «Direct link» у технічній довідці). Створюйте посилання лише за допомогою інструмента для виконання коду, ніколи вручну, і перевірте його, декодувавши знову.',
    deliveryFile: 'Якщо ви не можете виконувати код або посилання вийде довшим за {max} символів, створіть натомість файл JSON (наприклад, deck.json) або наведіть JSON у блоці коду, щоб людина зберегла його як файл. Файл вибирають на сторінці імпорту: {importUrl}',
    deliveryConfirm: 'В обох випадках застосунок перевіряє колоду, показує попередній перегляд і зберігає її лише після підтвердження. Колода залишається на пристрої людини; нічого не надсилається.',
    contentTitle: 'Правила щодо вмісту',
    rules: [
      'Пишіть оригінальний вміст власними словами. Не копіюйте тексти з книжок, словників, вебсайтів чи інших джерел, захищених авторським правом.',
      'Перевіряйте кожен факт. Якщо ви в чомусь не впевнені, краще не додавайте цю картку, ніж вгадувати.',
      'Обидва боки мають бути короткими: слово, термін, вислів або одне коротке речення. Один факт на картку.',
      'Кожен лицьовий і кожен зворотний бік має бути в колоді унікальним, щоб кожна пара мала рівно одну відповідність.',
      'Жодних персональних даних: ні імен приватних осіб, ні адрес, номерів телефонів, адрес електронної пошти чи відомостей про здоров’я.',
      'Указуйте мову кожного боку кодом мови (lang), наприклад en, de, pt-BR або zh-Hans.',
      'Не використовуйте зображення чи аудіо з інших сайтів: такі посилання вилучаються. Замість зображення можна використати емодзі в полі symbol.'
    ],
    sidesTitle: 'Лицьовий і зворотний бік',
    sides: 'Лицьовий бік — це запитання: те, що показується спочатку (слово, запитання, термін або зображення у вигляді емодзі). Зворотний бік — це відповідь (переклад, визначення, факт). У грі Memory два боки картки утворюють пару; під час повторення з картками людина бачить один бік і намагається згадати інший.',
    exampleTitle: 'Повний приклад',
    exampleIntro: 'Невелика колода: на лицьовому боці іспанське слово (з емодзі), на зворотному — англійське.',
    exampleLink: 'Та сама колода у вигляді прямого посилання:',
    checklistTitle: 'Перш ніж відповісти',
    checklist: [
      'JSON коректний (подвійні лапки, без зайвих ком у кінці, без коментарів).',
      'Є принаймні одна картка; кожна картка має унікальний id і непорожні лицьовий та зворотний боки.',
      'Усі тексти вкладаються в обмеження з технічної довідки.',
      'Пряме посилання після декодування дає саме ваш JSON; інакше передайте файл JSON.',
      'Попросіть людину перевірити картки, перш ніж вчитися за ними.'
    ],
    referenceTitle: 'Технічна довідка',
    referenceNote: 'Цей розділ однаковий в усіх мовних версіях посібника (англійською).'
  },
  hi: {
    title: 'AI के लिए गाइड: Worthwhile Play के लिए सीखने का डेक बनाना',
    intro: 'आप किसी व्यक्ति को Worthwhile Play के लिए सीखने का डेक (आगे और पीछे के भाग वाले फ़्लैश कार्ड) बनाने में मदद कर रहे हैं। Worthwhile Play खेलों और सीखने के अभ्यासों वाला एक मुफ़्त वेब ऐप है, जो ब्राउज़र में ऑफ़लाइन चलता है। उस व्यक्ति के विवरण के अनुसार, नीचे बताए गए JSON फ़ॉर्मैट में डेक बनाइए।',
    language: 'यह व्यक्ति ऐप हिन्दी में इस्तेमाल करता है। जब तक वह कुछ और न कहे, हिन्दी में जवाब दीजिए। कार्ड उन भाषाओं में लिखिए जो वह सीखना चाहता है।',
    deliveryTitle: 'डेक कैसे दें',
    deliveryLink: 'सबसे अच्छा: एक सीधा लिंक, जो ऐप में डेक के साथ इम्पोर्ट का पूर्वावलोकन खोलता है (तकनीकी संदर्भ में “Direct link” देखें)। लिंक केवल कोड चलाने वाले टूल से बनाइए, कभी हाथ से नहीं, और उसे फिर से डिकोड करके जाँचिए।',
    deliveryFile: 'अगर आप कोड नहीं चला सकते या लिंक {max} अक्षरों से लंबा हो जाएगा, तो इसके बजाय एक JSON फ़ाइल (जैसे deck.json) बनाइए या JSON को कोड ब्लॉक में दीजिए, ताकि व्यक्ति उसे फ़ाइल के रूप में सहेज सके। फ़ाइल इम्पोर्ट पेज पर चुनी जाती है: {importUrl}',
    deliveryConfirm: 'दोनों तरीक़ों में ऐप डेक की जाँच करता है, पूर्वावलोकन दिखाता है और व्यक्ति की पुष्टि के बाद ही उसे सहेजता है। डेक उसी डिवाइस पर रहता है; कुछ भी अपलोड नहीं होता।',
    contentTitle: 'सामग्री के नियम',
    rules: [
      'अपने शब्दों में मौलिक सामग्री लिखिए। किताबों, शब्दकोशों, वेबसाइटों या कॉपीराइट वाले दूसरे स्रोतों से पाठ कॉपी मत कीजिए।',
      'हर तथ्य की जाँच कीजिए। अगर किसी बात पर पक्का भरोसा न हो, तो अनुमान लगाने के बजाय वह कार्ड छोड़ दीजिए।',
      'दोनों भाग छोटे रखिए: एक शब्द, एक पद, एक वाक्यांश या एक छोटा वाक्य। हर कार्ड पर एक तथ्य।',
      'डेक में हर आगे का भाग और हर पीछे का भाग अलग होना चाहिए, ताकि हर जोड़ी का ठीक एक मेल हो।',
      'निजी डेटा मत डालिए: आम लोगों के नाम, पते, फ़ोन नंबर, ईमेल पते या स्वास्थ्य से जुड़ी जानकारी नहीं।',
      'हर भाग की भाषा भाषा-कोड (lang) से बताइए, जैसे en, de, pt-BR या zh-Hans।',
      'दूसरी वेबसाइटों की तस्वीरें या ऑडियो इस्तेमाल मत कीजिए; ऐसे लिंक हटा दिए जाते हैं। symbol में कोई इमोजी तस्वीर का काम कर सकता है।'
    ],
    sidesTitle: 'आगे का भाग और पीछे का भाग',
    sides: 'आगे का भाग सवाल है: जो सबसे पहले दिखता है (कोई शब्द, सवाल, पद या इमोजी के रूप में तस्वीर)। पीछे का भाग जवाब है (अनुवाद, परिभाषा या तथ्य)। Memory खेल में कार्ड के दोनों भाग एक जोड़ी बनाते हैं; फ़्लैश कार्ड से दोहराते समय व्यक्ति एक भाग देखता है और दूसरे को याद करने की कोशिश करता है।',
    exampleTitle: 'पूरा उदाहरण',
    exampleIntro: 'एक छोटा डेक: आगे स्पैनिश शब्द (इमोजी के साथ), पीछे अंग्रेज़ी शब्द।',
    exampleLink: 'यही डेक सीधे लिंक के रूप में:',
    checklistTitle: 'जवाब देने से पहले',
    checklist: [
      'JSON मान्य है (डबल कोट, अंत में कोई फ़ालतू कॉमा नहीं, कोई टिप्पणी नहीं)।',
      'कम से कम एक कार्ड है; हर कार्ड की id अलग है और आगे और पीछे के भाग ख़ाली नहीं हैं।',
      'सभी पाठ तकनीकी संदर्भ की सीमाओं के भीतर हैं।',
      'सीधे लिंक को डिकोड करने पर ठीक आपका JSON मिलता है; नहीं तो JSON फ़ाइल दीजिए।',
      'व्यक्ति से कहिए कि कार्डों से सीखने से पहले उन्हें जाँच ले।'
    ],
    referenceTitle: 'तकनीकी संदर्भ',
    referenceNote: 'यह भाग इस गाइड के सभी भाषा संस्करणों में एक जैसा है (अंग्रेज़ी में)।'
  }
};
