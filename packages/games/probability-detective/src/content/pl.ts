import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Niebieska paczka',
      story: 'Do sklepu na rogu przyszła paczka bez nadawcy. Musi pochodzić z jednego z magazynów, które dowożą na tę ulicę.',
      lead: 'Paczki na tej ulicy przychodzą z:',
      hyps: { north: 'Magazyn Północ', south: 'Magazyn Południe', east: 'Magazyn Wschód' },
      clues: {
        blue: { label: 'W niebieskim papierze', seen: 'Paczka jest owinięta niebieskim papierem.', notSeen: 'Paczka nie jest owinięta niebieskim papierem.' },
        'brown-tape': { label: 'Zaklejona brązową taśmą', seen: 'Jest zaklejona brązową taśmą.', notSeen: 'Nie jest zaklejona brązową taśmą.' },
        smudge: { label: 'Rozmazana etykieta', seen: 'Etykieta z adresem jest rozmazana.', notSeen: 'Etykieta z adresem jest czysta.' },
        string: { label: 'Przewiązana sznurkiem', seen: 'Jest przewiązana sznurkiem.', notSeen: 'Nie jest przewiązana sznurkiem.' },
        tuesday: { label: 'Przyszła we wtorek', seen: 'Przyszła we wtorek. Wszystkie magazyny dowożą w każdy dzień roboczy.', notSeen: 'Przyszła we wtorek. Wszystkie magazyny dowożą w każdy dzień roboczy.' },
        'echo-blue': { label: 'Sąsiadka też ją widziała', seen: 'Sąsiadka też mówi, że paczka była niebieska – widziała tę samą paczkę.', notSeen: 'Sąsiadka też mówi, że paczka była niebieska – widziała tę samą paczkę.' }
      }
    },
    'c-garden': {
      title: 'Nadgryzione truskawki',
      story: 'W nocy ktoś dobrał się do truskawek. W tym ogrodzie podjada je kilka rodzajów gości.',
      lead: 'W noce, gdy truskawki są nadgryzione, gościem jest:',
      hyps: { birds: 'Ptaki', snails: 'Ślimaki', hedgehog: 'Jeż' },
      clues: {
        slime: { label: 'Błyszczący ślad', seen: 'Na ścieżce jest błyszczący ślad.', notSeen: 'Nie ma błyszczącego śladu.' },
        pecks: { label: 'Małe dziobnięcia', seen: 'Owoce mają małe ślady dziobania.', notSeen: 'Nie ma śladów dziobania.' },
        droppings: { label: 'Odchody pod żywopłotem', seen: 'Pod żywopłotem są odchody.', notSeen: 'Pod żywopłotem nic nie ma.' },
        'net-moved': { label: 'Odsunięta siatka', seen: 'Siatka nad grządką jest odsunięta.', notSeen: 'Siatka wciąż jest na miejscu.' },
        rain: { label: 'W nocy padało', seen: 'W nocy padało – w deszczu wychodzą wszyscy.', notSeen: 'W nocy padało – w deszczu wychodzą wszyscy.' },
        'echo-slime': { label: 'Widziany znów rano', seen: 'Sąsiad pokazuje ci ten sam błyszczący ślad.', notSeen: 'Sąsiad pokazuje ci ten sam błyszczący ślad.' }
      }
    },
    'c-rain': {
      title: 'Czy w nocy padało?',
      story: 'Nie było cię w nocy w domu i chcesz wiedzieć, czy sadzonki dostały deszcz, czy trzeba je teraz podlać.',
      lead: 'Noce o tej porze roku:',
      hyps: { rained: 'Padało', dry: 'Było sucho' },
      clues: {
        'wet-grass': { label: 'Mokra trawa', seen: 'Trawa jest mokra (rosa też ją moczy).', notSeen: 'Trawa jest sucha.' },
        gauge: { label: 'Woda w deszczomierzu', seen: 'W deszczomierzu jest woda.', notSeen: 'Deszczomierz jest pusty.' },
        puddle: { label: 'Kałuża przy furtce', seen: 'Przy furtce jest kałuża.', notSeen: 'Przy furtce nie ma kałuży.' },
        'snails-out': { label: 'Ślimaki na ścieżce', seen: 'Na ścieżkę wyszły ślimaki.', notSeen: 'Na ścieżce nie ma ślimaków.' },
        wind: { label: 'Liście na stole', seen: 'Na stół nawiało liści – wiało tak czy inaczej.', notSeen: 'Na stół nawiało liści – wiało tak czy inaczej.' }
      }
    },
    'c-bird': {
      title: 'Jaki ptak był przy karmniku?',
      story: 'Tylko przez chwilę widziałeś małego brązowego ptaka przy karmniku, zanim odleciał. Udziały są tu wymyślone dla tego karmnika; prawdziwe zależą od miejsca.',
      lead: 'Mali brązowi goście tego karmnika to:',
      hyps: { finch: 'Zięba', sparrow: 'Wróbel' },
      clues: {
        'red-patch': { label: 'Błysk czerwieni', seen: 'Widziałeś błysk czerwieni na jego głowie.', notSeen: 'Nie widziałeś nic czerwonego.' },
        ground: { label: 'Jadł na ziemi', seen: 'Jadł na ziemi pod karmnikiem.', notSeen: 'Jadł w samym karmniku.' },
        song: { label: 'Świergotliwy śpiew', seen: 'Zaśpiewał świergotliwie.', notSeen: 'Tylko ćwierkał.' },
        group: { label: 'Przyleciał w grupie', seen: 'Przyleciał z małą grupką.', notSeen: 'Przyleciał sam.' },
        morning: { label: 'Rano', seen: 'Był wczesny ranek – o tej porze przylatują oba.', notSeen: 'Był wczesny ranek – o tej porze przylatują oba.' }
      }
    },
    'c-plant': {
      title: 'Oklapnięta roślina doniczkowa',
      story: 'Roślina w biurze oklapła i ma żółte liście. W tym biurze zwykle chodzi o jedną z dwóch rzeczy.',
      lead: 'Gdy rośliny tutaj oklapną, przyczyną jest:',
      hyps: { water: 'Za dużo wody', light: 'Za mało światła' },
      clues: {
        'wet-soil': { label: 'Mokra ziemia', seen: 'Ziemia jest wciąż mokra dwa dni po podlaniu.', notSeen: 'Ziemia jest sucha.' },
        leaning: { label: 'Pochyla się do okna', seen: 'Pochyla się w stronę okna.', notSeen: 'Stoi prosto.' },
        'soft-stem': { label: 'Miękka nasada łodygi', seen: 'Nasada łodygi jest miękka.', notSeen: 'Łodyga jest twarda.' },
        'pale-new': { label: 'Blade nowe liście', seen: 'Nowe liście są blade i małe.', notSeen: 'Nowe liście wyglądają zdrowo.' },
        'pot-colour': { label: 'Niebieska doniczka', seen: 'Stoi w niebieskiej doniczce – to niczego nie zmienia.', notSeen: 'Stoi w niebieskiej doniczce – to niczego nie zmienia.' }
      }
    },
    'c-bus': {
      title: 'Dlaczego autobus się spóźnił?',
      story: 'Twój autobus spóźnił się dziś rano czterdzieści minut.',
      lead: 'Gdy ten autobus bardzo się spóźnia, przyczyną jest:',
      hyps: { jam: 'Korek', breakdown: 'Awaria' },
      clues: {
        'others-late': { label: 'Inne autobusy też spóźnione', seen: 'Inne autobusy na tej samej drodze też się spóźniły.', notSeen: 'Inne autobusy na drodze były punktualne.' },
        replacement: { label: 'Przyjechał inny autobus', seen: 'Przyjechał inny autobus niż zwykle.', notSeen: 'Przyjechał zwykły autobus.' },
        announcement: { label: 'Komunikat', seen: 'Tablica podawała: opóźnienie z powodu usterki technicznej.', notSeen: 'Tablica nie podała powodu.' },
        'rush-hour': { label: 'W godzinach szczytu', seen: 'Były godziny szczytu.', notSeen: 'Była spokojna pora dnia.' },
        rain: { label: 'Padał deszcz', seen: 'Padał deszcz – na tym przystanku nie ma to znaczenia.', notSeen: 'Padał deszcz – na tym przystanku nie ma to znaczenia.' }
      }
    }
  }
};
