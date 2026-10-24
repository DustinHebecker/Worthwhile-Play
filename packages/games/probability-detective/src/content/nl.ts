import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Het blauwe pakket',
      story: 'Bij de winkel op de hoek is een pakket zonder afzender aangekomen. Het moet komen uit een van de magazijnen die deze straat beleveren.',
      lead: 'Pakketten in deze straat komen uit:',
      hyps: { north: 'Magazijn Noord', south: 'Magazijn Zuid', east: 'Magazijn Oost' },
      clues: {
        blue: { label: 'In blauw papier verpakt', seen: 'Het pakket is in blauw papier verpakt.', notSeen: 'Het pakket is niet in blauw papier verpakt.' },
        'brown-tape': { label: 'Met bruine tape dichtgeplakt', seen: 'Het is met bruine tape dichtgeplakt.', notSeen: 'Het is niet met bruine tape dichtgeplakt.' },
        smudge: { label: 'Uitgelopen etiket', seen: 'Het adresetiket is uitgelopen.', notSeen: 'Het adresetiket is schoon.' },
        string: { label: 'Met touw dichtgebonden', seen: 'Het is met touw dichtgebonden.', notSeen: 'Het is niet met touw dichtgebonden.' },
        tuesday: { label: 'Op een dinsdag aangekomen', seen: 'Het kwam op een dinsdag. Alle magazijnen leveren op elke werkdag.', notSeen: 'Het kwam op een dinsdag. Alle magazijnen leveren op elke werkdag.' },
        'echo-blue': { label: 'De buurvrouw zag het ook', seen: 'De buurvrouw zegt ook dat het pakket blauw was – ze zag hetzelfde pakket.', notSeen: 'De buurvrouw zegt ook dat het pakket blauw was – ze zag hetzelfde pakket.' }
      }
    },
    'c-garden': {
      title: 'De aangevreten aardbeien',
      story: 'Vannacht is er iemand aan de aardbeien geweest. In deze tuin snoepen een paar soorten bezoekers ervan.',
      lead: 'In nachten waarin aardbeien worden aangevreten, is de bezoeker:',
      hyps: { birds: 'Vogels', snails: 'Slakken', hedgehog: 'Een egel' },
      clues: {
        slime: { label: 'Glanzend spoor', seen: 'Er ligt een glanzend spoor op het pad.', notSeen: 'Er is geen glanzend spoor.' },
        pecks: { label: 'Kleine pikgaatjes', seen: 'De vruchten hebben kleine pikgaatjes.', notSeen: 'Er zijn geen pikgaatjes.' },
        droppings: { label: 'Keutels onder de heg', seen: 'Er liggen keutels onder de heg.', notSeen: 'Onder de heg ligt niets.' },
        'net-moved': { label: 'Net opzij geschoven', seen: 'Het net over het bed is opzij geschoven.', notSeen: 'Het net ligt nog op zijn plaats.' },
        rain: { label: 'Het regende vannacht', seen: 'Het regende vannacht – bij regen komen ze allemaal naar buiten.', notSeen: 'Het regende vannacht – bij regen komen ze allemaal naar buiten.' },
        'echo-slime': { label: 'Ook ’s ochtends gezien', seen: 'Je buurman wijst je op hetzelfde glanzende spoor.', notSeen: 'Je buurman wijst je op hetzelfde glanzende spoor.' }
      }
    },
    'c-rain': {
      title: 'Heeft het vannacht geregend?',
      story: 'Je was een nacht weg en wilt weten of de zaailingen regen hebben gehad of nu water nodig hebben.',
      lead: 'Nachten in deze tijd van het jaar:',
      hyps: { rained: 'Het heeft geregend', dry: 'Het bleef droog' },
      clues: {
        'wet-grass': { label: 'Nat gras', seen: 'Het gras is nat (ook dauw maakt het nat).', notSeen: 'Het gras is droog.' },
        gauge: { label: 'Water in de regenmeter', seen: 'Er staat water in de regenmeter.', notSeen: 'De regenmeter is leeg.' },
        puddle: { label: 'Plas bij het hek', seen: 'Er ligt een plas bij het hek.', notSeen: 'Er ligt geen plas bij het hek.' },
        'snails-out': { label: 'Slakken op het pad', seen: 'Er zitten slakken op het pad.', notSeen: 'Er zitten geen slakken op het pad.' },
        wind: { label: 'Bladeren op de tafel', seen: 'Er zijn bladeren op de tafel gewaaid – het waaide hoe dan ook.', notSeen: 'Er zijn bladeren op de tafel gewaaid – het waaide hoe dan ook.' }
      }
    },
    'c-bird': {
      title: 'Welke vogel zat bij het voederhuisje?',
      story: 'Je zag maar heel even een kleine bruine vogel bij het voederhuisje voordat hij wegvloog. De aandelen hier zijn voor dit voederhuisje verzonnen; echte verschillen per plek.',
      lead: 'Kleine bruine bezoekers bij dit voederhuisje zijn:',
      hyps: { finch: 'Een vink', sparrow: 'Een mus' },
      clues: {
        'red-patch': { label: 'Een flits rood', seen: 'Je zag een flits rood op zijn kop.', notSeen: 'Je zag helemaal geen rood.' },
        ground: { label: 'Op de grond gegeten', seen: 'Hij at op de grond onder het voederhuisje.', notSeen: 'Hij at op het voederhuisje zelf.' },
        song: { label: 'Een kwetterend lied', seen: 'Hij liet een kwetterend lied horen.', notSeen: 'Hij tjilpte alleen.' },
        group: { label: 'Kwam met een groepje', seen: 'Hij kwam met een klein groepje.', notSeen: 'Hij kwam alleen.' },
        morning: { label: '’s Ochtends', seen: 'Het was vroeg in de ochtend – dan komen ze allebei.', notSeen: 'Het was vroeg in de ochtend – dan komen ze allebei.' }
      }
    },
    'c-plant': {
      title: 'De hangende kamerplant',
      story: 'De kantoorplant hangt slap en heeft gele bladeren. In dit kantoor is het meestal een van twee dingen.',
      lead: 'Als planten hier slap hangen, is de oorzaak:',
      hyps: { water: 'Te veel water', light: 'Te weinig licht' },
      clues: {
        'wet-soil': { label: 'Natte grond', seen: 'De grond is twee dagen na het water geven nog nat.', notSeen: 'De grond is droog.' },
        leaning: { label: 'Leunt naar het raam', seen: 'Hij leunt naar het raam.', notSeen: 'Hij staat recht.' },
        'soft-stem': { label: 'Zachte stengelvoet', seen: 'De onderkant van de stengel is zacht.', notSeen: 'De stengel is stevig.' },
        'pale-new': { label: 'Bleke nieuwe bladeren', seen: 'De nieuwe bladeren zijn bleek en klein.', notSeen: 'De nieuwe bladeren zien er gezond uit.' },
        'pot-colour': { label: 'Een blauwe pot', seen: 'Hij staat in een blauwe pot – dat verandert niets.', notSeen: 'Hij staat in een blauwe pot – dat verandert niets.' }
      }
    },
    'c-bus': {
      title: 'Waarom was de bus te laat?',
      story: 'Je bus kwam vanochtend veertig minuten te laat.',
      lead: 'Als deze bus erg laat is, is de reden:',
      hyps: { jam: 'Een file', breakdown: 'Pech' },
      clues: {
        'others-late': { label: 'Andere bussen ook te laat', seen: 'Andere bussen op dezelfde weg waren ook te laat.', notSeen: 'Andere bussen op de weg waren op tijd.' },
        replacement: { label: 'Er kwam een andere bus', seen: 'Er kwam een andere bus dan normaal.', notSeen: 'De gewone bus kwam.' },
        announcement: { label: 'Een melding', seen: 'Het scherm meldde: vertraging door een technische storing.', notSeen: 'Het scherm gaf geen reden.' },
        'rush-hour': { label: 'In de spits', seen: 'Het was spitsuur.', notSeen: 'Het was een rustig moment van de dag.' },
        rain: { label: 'Het regende', seen: 'Het regende – bij deze halte maakt dat geen verschil.', notSeen: 'Het regende – bij deze halte maakt dat geen verschil.' }
      }
    }
  }
};
