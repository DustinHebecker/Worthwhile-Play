/** English catalogue and start-screen texts of Atlas Explorer (shown before the game loads); every other locale has exactly these keys (checked by the type below). The in-game texts are in ../content/text (ADR 0011). */
export const en = {
  title: 'Atlas Explorer',
  tagline: 'Practice reading a world map: where places lie, how far apart they are and in which direction.',
  rules:
    'A calm world atlas with questions. Find it on the map: tap where a country, city, river, desert or coordinate is, then see how far you were and in which direction. Compare places: which is further north, closer, larger, where is the day longer, what time does the sun say. Mystery country: clues arrive one at a time; guess as often as you like. Overland route: travel from one country to another across as few land borders as possible. After each answer the map explains, and you can look around. Distances are on a sphere, about; day lengths are calculated from latitude, about; populations are estimates. Finding places is a visual task: with a screen reader, the keyboard cursor announces coordinates and nearby cities, and the other modes need no map. Map data: Natural Earth (public domain), version 5.1.2 (2022). Areas whose status is disputed are hatched and belong to no country in this game; this is not a statement about any claim. Only UN member states are asked about. No timer, nothing to collect.',
  'difficulty.easy': 'Easy (well-known places, more help on the map)',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard (all countries, less help)',
  'mode.label': 'Mode',
  'mode.hint': 'Find places on the map, compare places, guess a country from clues, or travel overland from one country to another. A bit of everything: all four.',
  'mode.find': 'Find it on the map',
  'mode.compare': 'Compare places',
  'mode.mystery': 'Mystery country',
  'mode.route': 'Overland route',
  'mode.mixed': 'A bit of everything',
  'region.label': 'Region',
  'region.world': 'Whole world',
  'region.africa': 'Africa',
  'region.americas': 'Americas',
  'region.asia': 'Asia',
  'region.europe': 'Europe',
  'region.oceania': 'Oceania'
};

export type AtlasMessages = Record<keyof typeof en, string>;
