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
    'c-cups': {
      title: 'The cracked cup',
      story: 'A customer returns a cup with a hairline crack. The workshop’s machines all make the same cup, but each has its quirks.',
      lead: 'The workshop’s cups are made by:',
      hyps: { a: 'Machine A', b: 'Machine B', c: 'Machine C' },
      clues: {
        crack: { label: 'Hairline crack', seen: 'The cup has a hairline crack.', notSeen: 'The cup has a hairline crack.' },
        glaze: { label: 'Darker glaze', seen: 'The glaze is a little darker than usual.', notSeen: 'The glaze looks normal.' },
        stamp: { label: 'Crisp stamp on the base', seen: 'The maker’s stamp on the base is crisp.', notSeen: 'The stamp on the base is blurred.' },
        handle: { label: 'Handle slightly off-centre', seen: 'The handle is slightly off-centre.', notSeen: 'The handle is straight.' },
        box: { label: 'Packed in a grey box', seen: 'It came in the usual grey box — all the machines’ cups do.', notSeen: 'It came in the usual grey box — all the machines’ cups do.' }
      }
    },
    'c-key': {
      title: 'The missing key',
      story: 'The spare key is missing again. It is almost always in one of the same few places.',
      lead: 'When the key goes missing, it turns up:',
      hyps: { coat: 'In the coat', car: 'In the car', office: 'At the office' },
      clues: {
        'search-coat': { label: 'Quick search of the coat finds it', seen: 'You find the key in the coat.', notSeen: 'You check the coat pockets quickly: no key. A quick search can miss it.' },
        'search-car': { label: 'Quick look in the car finds it', seen: 'You find the key in the car.', notSeen: 'You look in the car quickly: no key. A quick look can miss it.' },
        jingle: { label: 'A jingle in the hallway', seen: 'You remember a jingle as the coat was hung up.', notSeen: 'You don’t remember any jingle.' },
        drove: { label: 'You drove yesterday', seen: 'You drove yesterday.', notSeen: 'You did not drive yesterday.' },
        'office-day': { label: 'You were at the office', seen: 'You were at the office yesterday.', notSeen: 'You worked from home yesterday.' },
        weekday: { label: 'It is a weekday', seen: 'Today is a weekday — that doesn’t change where keys end up.', notSeen: 'Today is a weekday — that doesn’t change where keys end up.' }
      }
    },
    'c-coin': {
      title: 'The coin from the fair',
      story: 'You found an old coin at a fair stall that sells trick props. You can’t tell it apart from an ordinary coin by looking, so you toss it.',
      lead: 'Coins in the stall’s old-coin box are:',
      hyps: { ordinary: 'An ordinary coin', weighted: 'A weighted coin', 'two-headed': 'A two-headed coin' },
      clues: {
        toss1: { label: 'Heads on the first toss', seen: 'First toss: heads.', notSeen: 'First toss: tails.' },
        toss2: { label: 'Heads on the second toss', seen: 'Second toss: heads.', notSeen: 'Second toss: tails.' },
        toss3: { label: 'Heads on the third toss', seen: 'Third toss: heads.', notSeen: 'Third toss: tails.' },
        toss4: { label: 'Heads on the fourth toss', seen: 'Fourth toss: heads.', notSeen: 'Fourth toss: tails.' }
      }
    },
    'c-message': {
      title: 'The message from the club',
      story: 'A message says it comes from your sports club and asks you to confirm your membership.',
      lead: 'Messages that say they are from the club are:',
      hyps: { real: 'Really from the club', fake: 'A fake' },
      clues: {
        link: { label: 'Contains a link', seen: 'It contains a link.', notSeen: 'It has no link.' },
        sender: { label: 'Unknown sender address', seen: 'The sender address is not the club’s usual one.', notSeen: 'The sender address is the usual one.' },
        hurry: { label: 'Asks you to hurry', seen: 'It says you must reply today.', notSeen: 'It sets no deadline.' },
        'your-name': { label: 'Uses your name', seen: 'It greets you by your name.', notSeen: 'It just says “Dear member”.' },
        evening: { label: 'Arrived in the evening', seen: 'It arrived in the evening — both kinds arrive at any time.', notSeen: 'It arrived in the evening — both kinds arrive at any time.' }
      }
    },
    'c-oven': {
      title: 'The burnt loaf',
      story: 'One loaf from this morning’s batch came out burnt on one side. The bakery bakes in two ovens.',
      lead: 'Loaves here are baked in:',
      hyps: { old: 'The old oven', new: 'The new oven' },
      clues: {
        'burnt-side': { label: 'Burnt on one side', seen: 'It is burnt on one side.', notSeen: 'It is burnt on one side.' },
        'pale-top': { label: 'Pale top', seen: 'The top is pale.', notSeen: 'The top is evenly brown.' },
        'tray-mark': { label: 'Pattern of the new trays', seen: 'The bottom shows the pattern of the new trays.', notSeen: 'The bottom is smooth.' },
        early: { label: 'From the first batch', seen: 'It came from the first batch.', notSeen: 'It came from a later batch.' },
        seeds: { label: 'Seeds on top', seen: 'It has seeds on top — both ovens bake seeded loaves.', notSeen: 'It has seeds on top — both ovens bake seeded loaves.' }
      }
    },
    'c-beep': {
      title: 'The faint beep on the radio',
      story: 'The radio club’s receiver picked up a faint, regular beep. Most such beeps are interference, but a small satellite also passes overhead.',
      lead: 'Faint regular beeps at this receiver are:',
      hyps: { satellite: 'A signal from a small satellite', interference: 'Ordinary interference' },
      clues: {
        'pass-time': { label: 'During a satellite pass', seen: 'It came while the satellite was due overhead.', notSeen: 'It came when no pass was due.' },
        drift: { label: 'The tone drifts slowly', seen: 'The tone drifts slowly, as a moving source’s would.', notSeen: 'The tone stays steady.' },
        fades: { label: 'Fades out after a while', seen: 'It fades out after about ten minutes.', notSeen: 'It keeps going.' },
        rhythm: { label: 'A steady rhythm', seen: 'It beeps in a steady rhythm — both do.', notSeen: 'It beeps in a steady rhythm — both do.' },
        'other-receiver': { label: 'A second receiver hears it', seen: 'A club member across town hears it too.', notSeen: 'The receiver across town hears nothing.' }
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
  },
  checks: {
    'k-picnic': {
      title: 'Outdoors or in the hall?',
      story: 'The neighbourhood picnic is this afternoon. You can hold it on the green, or book the community hall.',
      lead: 'Afternoons at this time of year are:',
      hyps: { dry: 'Dry', rain: 'Rainy' },
      question: 'How likely is a dry afternoon?',
      options: { outdoors: 'Picnic on the green', hall: 'Book the hall', tent: 'Put up a tent on the green' },
      checks: {
        sky: { label: 'Look at the sky at noon', yes: 'Dark clouds by noon.', no: 'No dark clouds by noon.' },
        barometer: { label: 'Check the barometer', yes: 'The barometer is falling.', no: 'The barometer is steady.' },
        farmer: { label: 'Ask the farmer down the road', yes: 'The farmer expects rain.', no: 'The farmer expects a dry afternoon.' },
        service: { label: 'Call the weather service', yes: 'The weather service warns of rain.', no: 'The weather service gives no warning.' },
        swallows: { label: 'Watch the swallows', yes: 'The swallows fly low.', no: 'The swallows fly high.' }
      }
    },
    'k-bike': {
      title: 'Buy the second-hand bike?',
      story: 'A second-hand bike is for sale at a good price. Bikes like this are usually fine, but some have hidden damage.',
      lead: 'Second-hand bikes like this one are:',
      hyps: { sound: 'Sound', damaged: 'Hidden damage' },
      question: 'How likely is it that the bike is sound?',
      options: { buy: 'Buy it', skip: 'Leave it', 'offer-less': 'Offer less and take the risk' },
      checks: {
        ride: { label: 'Take a test ride', yes: 'The test ride is smooth.', no: 'The test ride is bumpy.' },
        chain: { label: 'Look at the chain', yes: 'The chain is rusty.', no: 'The chain is clean.' },
        receipts: { label: 'Ask for repair receipts', yes: 'The seller has repair receipts.', no: 'The seller has no receipts.' },
        mechanic: { label: 'Pay a mechanic to look', yes: 'The mechanic finds a problem.', no: 'The mechanic finds nothing wrong.' },
        'seller-says': { label: 'Ask the seller', yes: 'The seller says it is fine.', no: 'The seller is unsure.' }
      }
    },
    'k-seeds': {
      title: 'Sow the old seeds?',
      story: 'A forgotten packet of seeds turned up in the shed. Sowing them takes a weekend; fresh seeds cost a little.',
      lead: 'Forgotten packets like this one are:',
      hyps: { good: 'Still good', dead: 'Mostly dead' },
      question: 'How likely is it that the seeds are still good?',
      options: { sow: 'Sow the old seeds', fresh: 'Buy fresh seeds' },
      checks: {
        float: { label: 'Put some in water', yes: 'Most seeds sink.', no: 'Most seeds float.' },
        sprout: { label: 'Try a few on a damp towel', yes: 'Most of them sprout.', no: 'Few of them sprout.' },
        date: { label: 'Read the packet date', yes: 'The date is recent.', no: 'The date is old.' },
        shrivelled: { label: 'Look at the seeds closely', yes: 'The seeds look shrivelled.', no: 'The seeds look plump.' },
        smell: { label: 'Smell them', yes: 'They smell fresh.', no: 'They smell musty.' }
      }
    },
    'k-melon': {
      title: 'Buy this melon?',
      story: 'At the market, one melon is left at a good price.',
      lead: 'Melons left at this stall at this time are:',
      hyps: { ripe: 'Ripe', unripe: 'Not ripe yet' },
      question: 'How likely is it that the melon is ripe?',
      options: { buy: 'Buy it', leave: 'Leave it' },
      checks: {
        knock: { label: 'Knock on it', yes: 'It sounds hollow.', no: 'It sounds dull.' },
        smell: { label: 'Smell it', yes: 'It smells sweet.', no: 'It smells of nothing much.' },
        'soft-end': { label: 'Press the end', yes: 'The end gives a little.', no: 'The end is hard.' },
        taste: { label: 'Taste a slice from the same crate', yes: 'The slice is sweet.', no: 'The slice is bland.' },
        sticker: { label: 'Read the sticker', yes: 'It has a “ripe” sticker.', no: 'It has no sticker.' }
      }
    },
    'k-bread': {
      title: 'Bake extra for the market?',
      story: 'Tomorrow is market day. Extra bread sells well on a busy day but goes stale on a quiet one.',
      lead: 'Market days here are:',
      hyps: { busy: 'Busy', quiet: 'Quiet' },
      question: 'How likely is a busy market day?',
      options: { extra: 'Bake a lot extra', normal: 'Bake the usual amount', 'little-extra': 'Bake a little extra' },
      checks: {
        calendar: { label: 'Check the town calendar', yes: 'The calendar lists an event.', no: 'The calendar lists nothing.' },
        neighbour: { label: 'Ask the cheese stall', yes: 'The cheese stall expects a crowd.', no: 'The cheese stall expects a calm day.' },
        sunny: { label: 'Read the forecast', yes: 'Sun is forecast.', no: 'Clouds are forecast.' },
        office: { label: 'Call the market office', yes: 'The market office expects many visitors.', no: 'The market office expects the usual.' },
        'last-week': { label: 'Think of last week', yes: 'Last week was busy.', no: 'Last week was quiet.' }
      }
    },
    'k-laptop': {
      title: 'Repair it yourself?',
      story: 'The laptop shuts down at random. A repair at home is cheap if the fault is minor, but wasted effort if it is major.',
      lead: 'Faults like this one are:',
      hyps: { minor: 'A minor fault', major: 'A major fault' },
      question: 'How likely is a minor fault?',
      options: { repair: 'Repair it at home', shop: 'Take it to a shop', wait: 'Wait and watch' },
      checks: {
        'error-code': { label: 'Restart and watch', yes: 'An error code appears.', no: 'No error code appears.' },
        diagnostics: { label: 'Run the diagnostic tool', yes: 'The tool reports a fault.', no: 'The tool reports nothing.' },
        cable: { label: 'Swap the power cable', yes: 'It works with another cable.', no: 'It still shuts down.' },
        fan: { label: 'Listen to the fan', yes: 'The fan makes a grinding noise.', no: 'The fan sounds normal.' },
        forum: { label: 'Read the forum', yes: 'Others with this model say it was minor.', no: 'Others with this model report mixed causes.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'The lamp sensor',
      story: 'The town checks its old street lamps with a sensor. Of all the lamps, {f} are actually faulty. The sensor flags {s} of the faulty lamps, but it also flags {q} of the working lamps by mistake. Lamp {lamp} has just been flagged.',
      questions: { q1: 'Is lamp {lamp} more likely faulty or working?', q2: 'How likely is it that lamp {lamp} is faulty?' },
      options: { faulty: 'More likely faulty', working: 'More likely working' },
      explain: 'Count the flagged lamps: {k} of the {n} flagged lamps are really faulty, so the chance is {p}. Whether a flag can be trusted depends on how rare faulty lamps are, not only on how good the sensor is.',
      labels: { faulty: 'Faulty lamps', working: 'Working lamps', fit: 'flagged' }
    },
    't-wheel': {
      title: 'The spinner',
      story: 'A fair spinner has {k} equal sections, and {r} of them show a star. The last {s} spins all missed the star.',
      questions: { q1: 'On the next spin, a star is…', q2: 'How likely is a star on the next spin?' },
      options: { more: 'more likely than usual', less: 'less likely than usual', same: 'just as likely as always' },
      explain: 'The spinner has no memory: every spin is a fresh start, so a star still comes up {p} of the time.',
      labels: { spins: 'The missed spins and the next one' }
    },
    't-sequence': {
      title: 'Which result is more likely?',
      story: 'A fair coin is tossed {n} times (● heads, ○ tails). Two possible results: A {a} and B {b}.',
      questions: { q1: 'Which exact result is more likely?', q2: 'How likely is exactly result B?' },
      options: { a: 'A', b: 'B', same: 'Both are equally likely' },
      explain: 'There are {total} possible results, and each exact one has the same chance, {p}. B only looks more typical because mixed results, as a group, are common.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Rain and wind',
      story: 'Tomorrow’s forecast gives rain a {a} chance. On rainy days here, it is windy {b} of the time; on dry days, {w} of the time.',
      questions: { q1: 'Which is more likely tomorrow?', q2: 'How likely is a day that is both rainy and windy?' },
      options: { windy: 'A windy day', both: 'A rainy and windy day', same: 'Both the same' },
      explain: 'Imagine {days} days like tomorrow: {both} are rainy and windy, but {windy} are windy in all. Every rainy and windy day is also a windy day, so “rainy and windy” can never be more likely than “windy”.',
      labels: { windy: 'Windy', calm: 'Calm', rainy: 'Rainy days', dry: 'Dry days' }
    },
    't-simpson': {
      title: 'The two delivery services',
      story: 'Two delivery services report how often they were on time last month. Service A: short routes {aSk} of {aSn}, long routes {aLk} of {aLn}. Service B: short routes {bSk} of {bSn}, long routes {bLk} of {bLn}.',
      questions: { q1: 'Which service was on time more often overall?', q2: 'Your parcel goes on a long route. Which service has the better record for long routes?' },
      options: { a: 'Service A', b: 'Service B', same: 'Both the same' },
      explain: 'A is better on short routes and on long routes, yet B is better overall ({b} against {a} deliveries on time), because B mostly does the easier short routes. Compare like with like.',
      labels: { a: 'Service A', b: 'Service B', short: 'Short routes', long: 'Long routes', overall: 'Overall' }
    },
    't-paw': {
      title: 'The paw print in the flour',
      story: 'Someone walked through the flour on the bakery floor overnight. The paw print matches the neighbour’s cat. Only {r} cats have a print like this. About {n} cats live close enough to have come in.',
      questions: { q1: 'Does “only {r}” mean it was almost certainly the neighbour’s cat?', q2: 'How likely is it that it was the neighbour’s cat? Assume each nearby cat was equally likely to come in.' },
      options: { yes: 'Yes, about {sure} sure', no: 'No, much less sure than that' },
      explain: 'Among {n} nearby cats, about {others} others have a matching print too. The neighbour’s cat is only one of several that fit: {p}.',
      labels: { neighbour: 'Nights the neighbour’s cat came in', others: 'Nights another cat came in', fit: 'print matches' }
    },
    't-bakery': {
      title: 'The small and the large bakery',
      story: 'Two bakeries sell rye and wheat loaves. On average half of the loaves sold are rye, and each loaf is a separate choice. The small bakery sells {n1} loaves a day, the large one {n2}.',
      questions: { q1: 'Which bakery has more days on which more than {t} of the loaves sold are rye?', q2: 'On what share of days does the small bakery sell more than {t} rye?' },
      options: { small: 'The small bakery', large: 'The large bakery', same: 'About the same' },
      explain: 'Small samples swing more. The small bakery has such days {small} of the time, the large one only {large}.',
      labels: { small: 'Small bakery', large: 'Large bakery' }
    },
    't-drawers': {
      title: 'The caretaker who knows',
      story: 'One of {n} closed drawers holds the key. You point to one drawer. The caretaker, who knows where the key is, then opens {opened} of the other drawers, all empty, and leaves exactly one other drawer closed. The caretaker always does this and never opens yours.',
      questions: { q1: 'Keep your drawer, or switch to the other closed one?', q2: 'How likely is it that the key is in the other closed drawer?' },
      options: { switch: 'Switch', keep: 'Keep my drawer', same: 'It makes no difference' },
      explain: 'Imagine {total} games. Your first pick is right in only some of them. In the other {wins}, the caretaker has to leave the key’s drawer closed, so switching wins: {p}.',
      labels: { right: 'Games where your first pick has the key', wrong: 'Games where it does not', fit: 'switching wins' }
    },
    't-week': {
      title: 'At least one rainy day',
      story: 'You plan a trip of {m} days. Each day has a {q} chance of rain, separately from the other days.',
      questions: { q1: 'How likely is at least one rainy day?' },
      options: {},
      explain: 'Adding the chances would give {sum}, which cannot be right. Multiply the chances of a dry day instead: no rain at all has a chance of {none}, so at least one rainy day has {p}.',
      labels: { step: 'Still dry after day {n}' }
    },
    't-numbers': {
      title: 'The same number twice',
      story: 'Each of {g} people secretly picks a whole number from one to {r}, at random.',
      questions: { q1: 'How likely is it that at least two of them pick the same number? Your gut feeling first:', q2: 'Now your estimate: how likely is at least one shared number?' },
      options: { low: 'Less than one in four', even: 'Somewhere around an even chance', high: 'More than three in four' },
      explain: 'With {g} people there are {pairs} pairs that could match, so a match comes sooner than it feels: {p}.',
      labels: { step: 'All different among the first {n}' }
    },
    't-tyres': {
      title: 'Fewer punctures',
      story: 'A new kind of tyre cuts punctures from {b} in every hundred rides to {a} in every hundred rides. The maker calls it {rel} fewer punctures.',
      questions: { q1: 'Out of {rides} rides, how many fewer punctures?' },
      options: {},
      explain: 'Out of {rides} rides there are {old} punctures before and {new} after: {fewer} fewer. “{rel} fewer” sounds large; the absolute change is what you notice.',
      labels: { old: 'Old tyres', new: 'New tyres', fit: 'punctures' }
    },
    't-dice': {
      title: 'Two dice',
      story: 'You roll two ordinary dice and add the numbers.',
      questions: { q1: 'Which sum is more likely: {s1} or {s2}?', q2: 'How likely is the sum {s1}?' },
      options: { first: '{s1}', second: '{s2}', same: 'Equally likely' },
      explain: 'Of the thirty-six equally likely outcomes, {c1} give {s1} and {c2} give {s2}.',
      labels: {}
    }
  }
};
