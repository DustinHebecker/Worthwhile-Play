/**
 * English (source) content of Pond & Meadow.
 *
 * Note for translators: plain words; common names only ("water fleas", not "Daphnia" — an "about" line may add the
 * scientific name in brackets); no digits in the texts (numbers come from the model); spraying, fishing and
 * relocating are management actions, described neutrally. Keep sentences short.
 */
import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} week', other: '{n} weeks' },
  species: {
    algae: { name: 'Green algae', about: 'Tiny plants floating in the water. They grow fast on nutrients and light; water fleas and snails eat them. Many algae turn the water green and shade the plants below.' },
    bluegreen: { name: 'Blue-green algae', about: 'Strictly speaking bacteria (cyanobacteria). They grow slowly, need rich water and are hardly eaten, so they bloom when nutrients pile up.' },
    duckweed: { name: 'Duckweed', about: 'Small floating leaves. In rich water they cover the surface and shade everything below.' },
    pondweed: { name: 'Pondweed', about: 'Underwater plants rooted in the mud. They need clear water to get light, take nutrients away from the algae and give water fleas a place to hide from fish.' },
    fleas: { name: 'Water fleas', about: 'Tiny crustaceans (Daphnia) that graze the algae. Small fish eat them, but in pondweed and in the mud many stay out of reach.' },
    snails: { name: 'Pond snails', about: 'They eat dead plant matter and a few algae. Small fish eat some of them.' },
    minnows: { name: 'Small fish', about: 'They hunt water fleas and some snails. Their young take about six weeks to grow up. Pike eat them.' },
    pike: { name: 'Pike', about: 'A large hunter that eats small fish. Young pike take about twenty weeks to grow up.' },
    grass: { name: 'Grasses', about: 'Tall and fast-growing on rich soil. They shade the low plants and use a lot of water.' },
    flowers: { name: 'Wildflowers', about: 'Low plants that do well on poor soil. They need light, so tall grass pushes them out. Aphids and rabbits eat them.' },
    clover: { name: 'Clover', about: 'A low plant that makes its own nitrogen from the air, less so on rich soil. Its dead leaves feed the soil for its neighbours. Rabbits like it most.' },
    aphids: { name: 'Aphids', about: 'Tiny insects that suck plant sap, mostly from wildflowers. They multiply very fast. Ladybirds eat them.' },
    ladybirds: { name: 'Ladybirds', about: 'Beetles that eat aphids. Their larvae take about three weeks to grow up, so they react to more aphids with a delay.' },
    rabbits: { name: 'Rabbits', about: 'They graze clover first, then wildflowers and grass. Their young take about five weeks to grow up. Foxes hunt them; some are always safe in burrows.' },
    foxes: { name: 'Foxes', about: 'They hunt rabbits. Young foxes take about half a year to grow up.' },
    worms: { name: 'Earthworms', about: 'They eat dead leaves and turn them back into nutrients that plants can use.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Water fleas arrive',
      situation: 'A young pond has only green algae. Water fleas reach it, carried in by a bird.',
      think: 'Who eats the algae? What happens to the water fleas when the algae get fewer?',
      explain: 'Water fleas multiply on the algae until they eat as fast as the algae grow. From then on the water fleas, not the nutrients, set how much algae there is: a balancing loop (B1). The water turns clear and stays clear.',
      real: 'In real ponds, fish and the seasons usually keep this from being so neat.'
    },
    'enrich-swings': {
      title: 'More food for everyone',
      situation: 'Heavy runoff from a field starts to feed a pond of algae and water fleas.',
      think: 'More nutrients feed more algae. What do the water fleas do with more algae, and what do the algae do then?',
      explain: 'More nutrients let the algae race ahead; the water fleas follow, eat the algae down, then starve; the algae recover, and it starts again. Richer water made the system swing instead of settle. Ecologists call this the paradox of enrichment (B1).',
      real: 'In real ponds, many more species and the seasons damp or change these swings.'
    },
    'fish-stocked': {
      title: 'Fish in the pond',
      situation: 'Someone releases small fish into a pond that had none.',
      think: 'Fish eat water fleas. Who eats the algae, and what happens to them?',
      explain: 'The fish eat water fleas, so fewer water fleas graze the algae, and the algae grow. A change at the top reaches the bottom of the food chain: a trophic cascade. It builds up slowly, because young fish need weeks to grow up.',
      real: 'In real ponds, fish also stir up the mud, which clouds the water even more.'
    },
    'pike-return': {
      title: 'Pike come back',
      situation: 'A few young pike are released into a pond full of small fish.',
      think: 'Follow the chain: pike, small fish, water fleas, algae.',
      explain: 'Pike eat small fish; fewer small fish leave more water fleas; more water fleas eat more algae. Each step flips the direction, so the algae fall. It takes long because young pike need about twenty weeks to grow up.',
      real: 'In real lakes, removing small fish or adding pike is used to clear the water, with mixed and often short-lived success.'
    },
    'algae-treatment': {
      title: 'A quick fix for green water',
      situation: 'The pond is treated: nine in ten of the algae die and sink, but stay in the water.',
      think: 'Where do the nutrients in the dead algae go? And what happened to the water fleas while the algae were gone?',
      explain: 'The dead algae rot within days and give their nutrients back to the water. The water fleas went hungry while the algae were gone, so for a while nobody holds the algae in check, and they overshoot. A fix that removes the symptom but not the nutrients does not last.',
      real: 'In real ponds, rotting algae also use up oxygen, which can harm fish.'
    },
    'slow-runoff': {
      title: 'A field upstream',
      situation: 'A new field upstream starts to drain into the clear pond.',
      think: 'What do more nutrients do to the algae, and what do more algae do to the pondweed below them?',
      explain: 'For months nothing seems to happen: the pondweed even looks fine after half a year. Meanwhile nutrients pile up in the water and the mud. When the algae finally win, a reinforcing loop takes over: more algae, more shade, less pondweed, fewer hiding places for water fleas, even more algae (R1, R2). The flip is fast; the cause was slow.',
      real: 'In real lakes, such shifts from clear to green water are well documented, often after years of slow change.'
    },
    'no-way-back': {
      title: 'The runoff stops',
      situation: 'Two years later the runoff is stopped completely. Will the pondweed come back?',
      think: 'Is there any pondweed left to grow back? What keeps the water green now?',
      explain: 'Stopping the runoff removes the cause, but the pond stays green: the algae shade the bottom, and no pondweed is left to grow back. The reinforcing loop (R1) now holds the pond in its green state. Going back needs more than undoing the change, for example planting pondweed again.',
      real: 'In real lakes, recovery after the nutrients are cut often takes many years, and plants are sometimes replanted.'
    },
    shade: {
      title: 'A tree over the pond',
      situation: 'A tree grows over the pond and shades it.',
      think: 'Pondweed needs light at the bottom. What else takes light away from it?',
      explain: 'Less light slows the pondweed, so it holds the algae back less. The algae and the water fleas start to swing, and each burst of algae shades the pondweed further (R1): it falls step by step.',
      real: 'In real ponds, falling leaves from the tree would also add nutrients.'
    },
    spray: {
      title: 'Spraying against aphids',
      situation: 'The meadow is sprayed against aphids: nine in ten aphids and also nine in ten ladybirds die.',
      think: 'Who grows back faster: the aphids or the ladybirds that eat them?',
      explain: 'Spraying killed the aphids and the ladybirds that eat them. Aphids multiply much faster than ladybirds, so they came back first, with no one to stop them, and the wildflowers paid for it. Ecologists call this pest resurgence (B2 with a delay).',
      real: 'In real fields, spraying also harms bees and other insects, and pests can become resistant.'
    },
    'no-foxes': {
      title: 'The foxes leave',
      situation: 'The foxes leave the meadow.',
      think: 'Who kept the rabbits in check? What do more rabbits eat first?',
      explain: 'Without foxes the balancing loop that held the rabbits in check is gone (B2). The rabbits multiply and graze the clover, their favourite food, until little is left.',
      real: 'In real landscapes, rabbits also move away, and diseases can cut their numbers.'
    },
    fertilise: {
      title: 'A little fertiliser',
      situation: 'The farmer spreads some fertiliser every week.',
      think: 'Which plant profits most from rich soil, and what does it do to the low plants?',
      explain: 'Fertiliser feeds the grasses most. Taller grass shades the clover and the wildflowers, and clover loses its edge: on rich soil, making its own nitrogen no longer helps. More food for the meadow means fewer kinds of plants.',
      real: 'In real meadows, nitrogen from fertiliser and from the air is a main reason for lost wildflowers.'
    },
    drought: {
      title: 'A dry summer',
      situation: 'Twelve dry weeks, then normal rain again.',
      think: 'What do the grasses need besides nutrients? What happens when the rain comes back?',
      explain: 'Without rain the soil dries out and the grasses slow down and shrink. When the rain returns, the soil fills up and the grasses grow back, even past their old level, because nutrients piled up in the soil while they could not use them.',
      real: 'In real meadows, a long drought can also kill plants and let others take their place.'
    },
    'clover-poor': {
      title: 'Clover for a poor meadow',
      situation: 'Clover is sown into a poor meadow of wildflowers.',
      think: 'Clover makes nitrogen from the air. Where does that nitrogen go when its leaves die?',
      explain: 'Clover brings new nitrogen into the meadow. When its leaves die, earthworms turn them into nutrients that the wildflowers use. The neighbours profit, slowly, through the soil: a chain with a delay.',
      real: 'In real farming, clover is sown for exactly this reason.'
    },
    'worms-gone': {
      title: 'Where are the earthworms?',
      situation: 'The earthworms disappear from the meadow.',
      think: 'Who turns dead leaves back into food for plants? Which plant does not depend on that?',
      explain: 'Without earthworms, dead leaves pile up and their nutrients stay locked in. The grasses go hungry. Clover makes its own nitrogen, so it gains: a side effect few people expect.',
      real: 'In real soils, many more animals, fungi and bacteria break down dead leaves.'
    },
    'foxes-return': {
      title: 'The foxes come back',
      situation: 'Foxes return to a meadow overrun by rabbits.',
      think: 'How long do young foxes need to grow up? What do fewer rabbits mean for the clover?',
      explain: 'At first little happens: young foxes need about half a year to grow up. Then the foxes bring the rabbits down (B2), and the clover, freed from grazing, slowly comes back. The effect arrives years after the cause.',
      real: 'In real landscapes, foxes also hunt other animals, and rabbits find new places to live.'
    },
    'ladybirds-gone': {
      title: 'Ladybirds collected',
      situation: 'Most ladybirds are collected for a garden elsewhere.',
      think: 'Who eats the aphids? How fast can the remaining ladybirds come back?',
      explain: 'Without ladybirds the aphids multiply. The few remaining ladybirds now find plenty of food, and their numbers grow back after a delay. Then they bring the aphids down again (B2).',
      real: 'In real gardens, other aphid hunters such as hoverflies and birds help as well.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'A new field upstream starts to drain into the clear pond. Keep the pondweed alive for two years while the runoff continues.',
      target: 'Pondweed at least {v} every week until week {w}.',
      hint: 'Algae are a symptom. What feeds them, and how soon must it change?',
      explain: 'The pondweed falls only when the algae shade it, and the algae grow from the nutrients the field brings. Act on the cause, and act early: by the time the pondweed looks weak, the reinforcing loop has already taken over.',
      plans: {
        buffer: 'A buffer strip of plants along the field catches most of the runoff before it reaches the pond. Early enough, the algae never get ahead.',
        ditch: 'Closing the ditch stops the runoff completely, so the algae never get ahead.'
      }
    },
    'clear-pond': {
      story: 'The pond turned green after two years of runoff. Make the water clear again, with pondweed growing, for twelve weeks in a row.',
      target: 'Algae (green and blue-green) at most {v} and pondweed at least {p}, for twelve weeks in a row, by week {w}.',
      hint: 'Algae are a symptom. What feeds them? And what keeps them down once the water is clear?',
      explain: 'The green state holds itself: algae shade out the plants that would hold them back. Clearing the water needs the cause removed (the runoff), the stored nutrients taken out or flushed away, and the pondweed back, so that the reinforcing loop turns towards clear water.',
      plans: {
        restore: 'Stop the runoff, dredge the nutrient-rich mud, plant pondweed and take out most small fish (so more water fleas graze the algae). Together they turn the loop towards clear water.',
        flush: 'Stop the runoff and let a stream flush the nutrients and algae out for a while, then plant pondweed into the clear water.'
      }
    },
    'protect-flowers': {
      story: 'A neighbour has just sprayed the meadow: most aphids and most ladybirds died. Keep the wildflowers for a year.',
      target: 'Wildflowers at least {v} every week until week {w}.',
      hint: 'The aphids come back faster than the ladybirds. When would new ladybirds find something to eat?',
      explain: 'The aphids rebound before their hunters do. Ladybirds released too early starve, because there are no aphids yet; released too late, the wildflowers are already eaten. Timing decides.',
      plans: {
        ladybirds: 'Released after about ten weeks, when the aphids are back but before they peak, the ladybirds find food at once and stop the aphids in time.'
      }
    },
    'bring-back-clover': {
      story: 'Without foxes, rabbits have grazed the clover almost away. Bring the clover back for eight weeks in a row within four years.',
      target: 'Clover at least {v} for eight weeks in a row, by week {w}.',
      hint: 'Removing rabbits helps only for a while. What kept them in check before?',
      explain: 'Rabbits multiply fast, so removing some only buys time. Lasting change needs the balancing loop back: foxes. Young foxes need half a year to grow up, so the clover comes back years later.',
      plans: {
        foxes: 'Foxes alone are enough, but patience is needed: they bring the rabbits down slowly.',
        foxesRabbits: 'Foxes plus relocating half the rabbits: the foxes start with fewer rabbits to catch up with.',
        foxesRabbitsClover: 'Foxes, relocating most rabbits and sowing clover: the fastest way, because the clover gets a head start while the foxes grow up.'
      }
    }
  },
  loops: {
    graze: 'Water fleas graze the algae down; fewer algae, fewer water fleas.',
    fishFleas: 'Small fish eat water fleas; fewer water fleas, fewer young fish.',
    pikeFish: 'Pike eat small fish; fewer small fish, fewer young pike.',
    clearWater: 'Algae shade the pondweed; pondweed holds the algae back. Whoever is ahead pulls further ahead.',
    shelter: 'Pondweed hides water fleas from fish, and water fleas eat algae.',
    recycle: 'Dead algae rot and feed new algae.',
    aphidsFlowers: 'Aphids feed on the wildflowers; fewer wildflowers, fewer aphids.',
    ladybirdsAphids: 'Ladybirds eat aphids; fewer aphids, fewer young ladybirds.',
    rabbitsClover: 'Rabbits graze the clover; less clover, fewer young rabbits.',
    foxesRabbits: 'Foxes hunt rabbits; fewer rabbits, fewer young foxes.',
    thirst: 'Grasses use the soil water; dry soil slows the grasses.',
    wormsDead: 'Earthworms eat dead leaves; fewer dead leaves, fewer earthworms.',
    flowerUptake: 'Wildflowers take up the nutrients they grow from.'
  }
};
