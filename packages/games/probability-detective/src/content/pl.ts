import type { ContentText } from './types';

/**
 * English (source) wording; the reference for every translation.
 * Writing rules: no digits in sentences (numbers are shown in structured rows); no person names; hypotheses are
 * things, places, animals or causes. Neutral and echo clues always show, so `notSeen` repeats `seen`.
 */
export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'The blue parcel',
      story: 'A parcel without a sender has arrived at the corner shop. It must come from one of the warehouses that deliver to this street.',
      lead: 'Parcels on this street come from:',
      hyps: { north: 'Warehouse North', south: 'Warehouse South', east: 'Warehouse East' },
      clues: {
        blue: { label: 'Wrapped in blue paper', seen: 'The parcel is wrapped in blue paper.', notSeen: 'The parcel is not wrapped in blue paper.' },
        'brown-tape': { label: 'Sealed with brown tape', seen: 'It is sealed with brown tape.', notSeen: 'It is not sealed with brown tape.' },
        smudge: { label: 'Smudged label', seen: 'The address label is smudged.', notSeen: 'The address label is clean.' },
        string: { label: 'Tied with string', seen: 'It is tied with string.', notSeen: 'It is not tied with string.' },
        tuesday: { label: 'Arrived on a Tuesday', seen: 'It arrived on a Tuesday. All the warehouses deliver on every weekday.', notSeen: 'It arrived on a Tuesday. All the warehouses deliver on every weekday.' },
        'echo-blue': { label: 'The neighbour saw it too', seen: 'The neighbour also says the parcel was blue — she saw the same parcel.', notSeen: 'The neighbour also says the parcel was blue — she saw the same parcel.' }
      }
    },
    'c-garden': {
      title: 'The nibbled strawberries',
      story: 'Someone has been at the strawberries overnight. In this garden, a few kinds of visitors are known to snack on them.',
      lead: 'On nights when strawberries get nibbled, the visitor is:',
      hyps: { birds: 'Birds', snails: 'Snails', hedgehog: 'A hedgehog' },
      clues: {
        slime: { label: 'Shiny trail', seen: 'There is a shiny trail on the path.', notSeen: 'There is no shiny trail.' },
        pecks: { label: 'Small peck marks', seen: 'The fruit has small peck marks.', notSeen: 'There are no peck marks.' },
        droppings: { label: 'Droppings under the hedge', seen: 'There are droppings under the hedge.', notSeen: 'There is nothing under the hedge.' },
        'net-moved': { label: 'Net pushed aside', seen: 'The net over the bed is pushed aside.', notSeen: 'The net is still in place.' },
        rain: { label: 'It rained last night', seen: 'It rained last night — all of them come out in the rain.', notSeen: 'It rained last night — all of them come out in the rain.' },
        'echo-slime': { label: 'Seen again in the morning', seen: 'Your neighbour points out the same shiny trail.', notSeen: 'Your neighbour points out the same shiny trail.' }
      }
    },
    'c-rain': {
      title: 'Did it rain overnight?',
      story: 'You were away overnight and want to know whether the seedlings got rain or need watering now.',
      lead: 'Nights at this time of year:',
      hyps: { rained: 'It rained', dry: 'It stayed dry' },
      clues: {
        'wet-grass': { label: 'Wet grass', seen: 'The grass is wet (dew can wet it too).', notSeen: 'The grass is dry.' },
        gauge: { label: 'Water in the rain gauge', seen: 'There is water in the rain gauge.', notSeen: 'The rain gauge is empty.' },
        puddle: { label: 'Puddle by the gate', seen: 'There is a puddle by the gate.', notSeen: 'There is no puddle by the gate.' },
        'snails-out': { label: 'Snails on the path', seen: 'Snails are out on the path.', notSeen: 'There are no snails on the path.' },
        wind: { label: 'Leaves on the table', seen: 'Leaves have blown onto the table — it was windy either way.', notSeen: 'Leaves have blown onto the table — it was windy either way.' }
      }
    },
    'c-bird': {
      title: 'Which bird was at the feeder?',
      story: 'You only caught a glimpse of a small brown bird at the feeder before it flew off. The shares here are invented for this feeder; real ones vary by place.',
      lead: 'Small brown visitors at this feeder are:',
      hyps: { finch: 'A finch', sparrow: 'A sparrow' },
      clues: {
        'red-patch': { label: 'A flash of red', seen: 'You saw a flash of red on its head.', notSeen: 'You saw no red at all.' },
        ground: { label: 'Fed on the ground', seen: 'It fed on the ground below the feeder.', notSeen: 'It fed on the feeder itself.' },
        song: { label: 'A twittering song', seen: 'It gave a twittering song.', notSeen: 'It only chirped.' },
        group: { label: 'Came with a group', seen: 'It came with a small group.', notSeen: 'It came alone.' },
        morning: { label: 'In the morning', seen: 'It was early morning — both come at that time.', notSeen: 'It was early morning — both come at that time.' }
      }
    },
    'c-plant': {
      title: 'The drooping houseplant',
      story: 'The office plant is drooping and has yellow leaves. In this office, it is usually one of two things.',
      lead: 'When plants here droop, the cause is:',
      hyps: { water: 'Too much water', light: 'Too little light' },
      clues: {
        'wet-soil': { label: 'Wet soil', seen: 'The soil is still wet two days after watering.', notSeen: 'The soil is dry.' },
        leaning: { label: 'Leaning to the window', seen: 'It leans towards the window.', notSeen: 'It stands straight.' },
        'soft-stem': { label: 'Soft stem base', seen: 'The base of the stem is soft.', notSeen: 'The stem is firm.' },
        'pale-new': { label: 'Pale new leaves', seen: 'The new leaves are pale and small.', notSeen: 'The new leaves look healthy.' },
        'pot-colour': { label: 'A blue pot', seen: 'It is in a blue pot — that changes nothing.', notSeen: 'It is in a blue pot — that changes nothing.' }
      }
    },
    'c-bus': {
      title: 'Why was the bus late?',
      story: 'Your bus came forty minutes late this morning.',
      lead: 'When this bus is very late, the reason is:',
      hyps: { jam: 'A traffic jam', breakdown: 'A breakdown' },
      clues: {
        'others-late': { label: 'Other buses late too', seen: 'Other buses on the same road were late too.', notSeen: 'Other buses on the road were on time.' },
        replacement: { label: 'A different bus came', seen: 'A different bus than usual came.', notSeen: 'The usual bus came.' },
        announcement: { label: 'An announcement', seen: 'The display said: delay due to a technical fault.', notSeen: 'The display gave no reason.' },
        'rush-hour': { label: 'During rush hour', seen: 'It was rush hour.', notSeen: 'It was a quiet time of day.' },
        rain: { label: 'It was raining', seen: 'It was raining — at this stop that makes no difference.', notSeen: 'It was raining — at this stop that makes no difference.' }
      }
    }
  }
};
