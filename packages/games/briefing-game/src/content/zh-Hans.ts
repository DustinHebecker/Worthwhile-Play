import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Supplier delay before a launch',
    situation: 'Your company launches a new desk lamp on 14 May. The supplier of the lamp heads reports a delay. Prepare a briefing.',
    recipient: 'the head of product',
    cards: {
      c1: 'The new desk lamp launches on 14 May; 350 customers have pre-ordered it.',
      c2: 'The supplier has shipped only 200 of the 500 lamp heads we ordered.',
      c3: 'Once the parts are here, our workshop can assemble 100 lamps a day.',
      c4: 'The supplier has not yet given a date for shipping the remaining lamp heads.',
      c5: 'The supplier expects the rest to ship next week, probably on Tuesday.',
      c6: 'If the parts arrive after 10 May, the lamps cannot be assembled in time for the launch.',
      c7: 'The launch advert is booked for 14 May; moving it would cost a fee of 800 euros.',
      c8: 'Marketing needs to know by Friday whether the launch date holds.',
      c9: 'Jonas from purchasing can call the supplier tomorrow morning and ask for a firm date.',
      c10: 'The supplier moved into a new office building last year.',
      c11: 'So far only 200 of the 500 ordered lamp heads have been shipped.',
      c12: 'Honestly, this supplier has always been a bit chaotic.'
    },
    decisions: {
      right: 'Keep the launch on 14 May, or move it by one week?',
      notTheirs: 'Which shipping company should the supplier use?',
      premature: 'Should we replace this supplier for all future products?'
    },
    actions: {
      concrete: 'Jonas calls the supplier tomorrow at 9:00 and tells the head of product the confirmed date by 12:00.',
      vague: 'Someone should keep an eye on the supplier.',
      outOfScope: 'Start designing next year’s lamp collection.'
    }
  },
  basement: {
    title: 'Flooded basement in a shared house',
    situation: 'After heavy rain, water is standing in the basement of the shared house you live in. Prepare a briefing.',
    recipient: 'the landlord',
    cards: {
      c1: 'Five people share the house; the basement holds the heating boiler and everyone’s storage boxes.',
      c2: 'This morning about 10 cm of water stood in the basement.',
      c3: 'We switched off the power to the basement this morning as a precaution.',
      c4: 'Nobody knows yet whether the heating boiler has been damaged.',
      c5: 'The water has probably stopped rising; at noon it looked the same as in the morning.',
      c6: 'More rain is forecast for Thursday, and the water could rise again.',
      c7: 'The boiler stands 15 cm above the floor, so a few more centimetres of water would reach it.',
      c8: 'The plumber can only come this week if the landlord approves the call-out costs by tomorrow.',
      c9: 'A housemate who works from home could let the plumber in on Wednesday.',
      c10: 'The basement walls were last painted in 2015.',
      c11: 'When we checked this morning, the basement was under 10 cm of water.',
      c12: 'This house has always been damp, and nobody ever does anything about it.'
    },
    decisions: {
      right: 'Approve the plumber’s call-out costs for this week?',
      notTheirs: 'Which housemate should move their boxes first?',
      premature: 'Should the whole basement be waterproofed and renovated?'
    },
    actions: {
      concrete: 'The housemate who works from home books the plumber for Wednesday and sends the landlord the quote today.',
      vague: 'We will deal with it at some point.',
      outOfScope: 'Plan a house party to cheer everyone up.'
    }
  },
  schoolTrip: {
    title: 'School trip and a weather warning',
    situation: 'A class of 24 pupils is due to go hiking in the hills on Friday. A weather warning has been issued. Prepare a briefing.',
    recipient: 'the head teacher',
    cards: {
      c1: 'The class of 24 pupils, aged 11, is booked for a hiking trip on Friday with three accompanying adults.',
      c2: 'The weather service has issued a storm warning for Friday afternoon.',
      c3: 'The science museum in town still has room for a class visit on Friday.',
      c4: 'The forecast does not yet say whether the storm will arrive before or after midday.',
      c5: 'The park ranger thinks the main trail will most likely stay open.',
      c6: 'Strong wind can bring down branches on the forest trail.',
      c7: 'The only shelter on the route is a 40-minute walk from the end of the trail, too far to reach quickly in a storm.',
      c8: 'The bus company must be told by Wednesday evening whether the trip goes ahead; until then it can be cancelled free of charge.',
      c9: 'The class teacher can check the updated forecast on Wednesday at midday.',
      c10: 'The class voted for the hiking trip back in September.',
      c11: 'According to the weather service, a storm is expected on Friday afternoon.',
      c12: 'The children will be terribly disappointed if we cancel.'
    },
    decisions: {
      right: 'Go ahead with the hike, switch to the museum, or cancel the trip?',
      notTheirs: 'What should the pupils pack for lunch?',
      premature: 'Should the school stop all outdoor trips from now on?'
    },
    actions: {
      concrete: 'The class teacher checks the forecast on Wednesday at 12:00 and sends the head teacher a recommendation by 14:00.',
      vague: 'Let’s see how the weather turns out.',
      outOfScope: 'Start planning next year’s school festival.'
    }
  },
  volunteers: {
    title: 'Clean-up day short of helpers',
    situation: 'Your neighbourhood association runs a park clean-up on Saturday. Too few volunteers have signed up. Prepare a briefing.',
    recipient: 'the chair of the association',
    cards: {
      c1: 'The yearly park clean-up is on Saturday from 10:00 to 13:00; the city provides bags and gloves.',
      c2: 'So far 9 volunteers have signed up; we planned for 20.',
      c3: 'The city collects the filled bags only on Saturday at 13:00.',
      c4: 'The youth football team might send helpers, but the coach has not replied yet.',
      c5: 'Several neighbours said they will probably drop by if the weather is nice.',
      c6: 'With 9 people we can clean only about half of the park.',
      c7: 'Nobody has been named yet to fetch the gloves from the community centre, which closes at 9:30 on Saturday.',
      c8: 'We can either shrink the clean-up to the playground area or move it to the following Saturday.',
      c9: 'Two volunteers have offered to put up posters in the neighbourhood tomorrow.',
      c10: 'Last year’s clean-up ended with a barbecue.',
      c11: 'Only 9 of the 20 volunteers we planned for have registered.',
      c12: 'People just don’t care about their neighbourhood any more.'
    },
    decisions: {
      right: 'Hold a smaller clean-up this Saturday, or move it by one week?',
      notTheirs: 'Should the city change its collection times for the bags?',
      premature: 'Should the association hire a cleaning company in future years?'
    },
    actions: {
      concrete: 'The two volunteers put up posters tomorrow, and the secretary emails the football coach today and reports back by Thursday.',
      vague: 'We should somehow try to get more people.',
      outOfScope: 'Start planning the association’s summer party.'
    }
  },
  release: {
    title: 'Software release with a failing test',
    situation: 'Your team plans to release a new version of a booking app on Tuesday. One automated test fails. Prepare a briefing.',
    recipient: 'the product manager',
    cards: {
      c1: 'The new version adds online payment and has been announced to customers for Tuesday.',
      c2: 'One of 640 automated tests fails: the refund of a cancelled booking.',
      c3: 'The failure only appears for payments in a foreign currency.',
      c4: 'We do not know yet whether the bug is in our code or in the payment provider’s test system.',
      c5: 'The developer expects the fix to take about a day, but has not looked at the code yet.',
      c6: 'If the bug is real, some customers could be refunded the wrong amount.',
      c7: 'About 15% of bookings are paid in a foreign currency, so the bug would affect many customers.',
      c8: 'We can release on Tuesday with foreign-currency payments switched off, or postpone the whole release.',
      c9: 'The developer can check the payment provider’s test logs this afternoon.',
      c10: 'The new payment screen uses the company’s new shade of blue.',
      c11: 'A single test fails: refunds for cancelled bookings.',
      c12: 'This test has always been flaky; I would just ignore it.'
    },
    decisions: {
      right: 'Release on Tuesday without foreign-currency payments, or postpone the release?',
      notTheirs: 'Which programming technique should the developer use for the fix?',
      premature: 'Should we switch to a different payment provider?'
    },
    actions: {
      concrete: 'The developer checks the provider’s test logs this afternoon and tells the product manager by 17:00 whether the bug is ours.',
      vague: 'Someone will look into the test.',
      outOfScope: 'Start writing the release notes for the version after next.'
    }
  },
  careAppointment: {
    title: 'A care advice appointment for Grandmother',
    situation: 'Your grandmother has an appointment with a care advice service on Monday. The family has to sort out who goes with her. Prepare a briefing. (This is about organising, not about medical questions.)',
    recipient: 'your brother, who shares the decision with you',
    cards: {
      c1: 'Grandmother has an appointment with the care advice service on Monday at 10:00 to talk about help at home.',
      c2: 'She has asked for one family member to come with her.',
      c3: 'The letter says to bring her list of medicines and her insurance card.',
      c4: 'It is not clear yet whether Mum can take Monday off work.',
      c5: 'The advice centre is said to have a lift, but nobody has checked.',
      c6: 'If nobody can go, the next free appointment is in six weeks.',
      c7: 'Grandmother tires quickly, and the bus ride to the centre takes 50 minutes each way.',
      c8: 'The advice service needs to know by Friday whether the appointment takes place in person or by video call.',
      c9: 'You could call Mum tonight and ask about Monday.',
      c10: 'Grandmother’s neighbour recently got a new dog.',
      c11: 'She would like someone from the family to go with her.',
      c12: 'In my view, these advice services never really help anyway.'
    },
    decisions: {
      right: 'Who goes with Grandmother on Monday, and in person or by video call?',
      notTheirs: 'Which kind of help at home should Grandmother get?',
      premature: 'Should Grandmother move into a care home?'
    },
    actions: {
      concrete: 'You call Mum tonight and tell your brother by Wednesday evening who can go.',
      vague: 'We’ll sort it out somehow.',
      outOfScope: 'Start planning Grandmother’s birthday party.'
    }
  },
  cafeFreezer: {
    title: 'Broken freezer in a small café',
    situation: 'You work in a small café. This morning the freezer was not cold enough. The owner is away until tomorrow. Prepare a briefing.',
    recipient: 'the café owner',
    cards: {
      c1: 'The café sells homemade ice cream; the freezer holds about a week’s stock.',
      c2: 'At 7:00 the freezer showed −2 °C instead of the usual −18 °C.',
      c3: 'We moved the ice cream into the neighbouring bakery’s freezer at 7:30.',
      c4: 'We do not know whether the ice cream thawed during the night.',
      c5: 'The repair service will probably be able to come on Thursday.',
      c6: 'Ice cream that has thawed must not be sold, so we may have to throw away the stock.',
      c7: 'The bakery needs its freezer space back on Saturday, so our ice cream can only stay there until then.',
      c8: 'The repair service will only book a visit once the owner approves the call-out fee of 90 euros.',
      c9: 'The barista can read the freezer’s temperature log this afternoon.',
      c10: 'The café’s new menu boards arrive next week.',
      c11: 'This morning the freezer read −2 °C instead of −18 °C.',
      c12: 'That freezer was a bad buy from day one.'
    },
    decisions: {
      right: 'Approve the repair call-out fee of 90 euros?',
      notTheirs: 'Which cakes should the bakery sell this week?',
      premature: 'Should the café stop selling ice cream altogether?'
    },
    actions: {
      concrete: 'The barista reads the temperature log this afternoon and texts the owner the result by 16:00.',
      vague: 'We’ll keep an eye on it.',
      outOfScope: 'Redesign the café’s website.'
    }
  },
  tournament: {
    title: 'New venue for a chess tournament',
    situation: 'Your chess club hosts a youth tournament on Sunday. The school hall you booked is no longer available. Prepare a briefing.',
    recipient: 'the club board',
    cards: {
      c1: 'Sunday’s youth tournament has 48 registered players from six clubs.',
      c2: 'The school has cancelled our hall booking because of a leak in the roof.',
      c3: 'The town library offers its event room free of charge, but it only fits 32 players.',
      c4: 'The sports centre might have a free room, but it has not answered our email yet.',
      c5: 'The caretaker believes the school hall could be repaired in time, but nobody has confirmed it.',
      c6: 'If families hear about the change too late, some players may turn up at the old venue.',
      c7: 'Several families travel more than 100 km and have already booked their trains, so a change of date would hit them hardest.',
      c8: 'The invitations with the final venue must go out by Wednesday.',
      c9: 'The club secretary can phone the sports centre tomorrow morning.',
      c10: 'The club’s trophy cabinet was cleaned last month.',
      c11: 'The school has called off our booking for the hall.',
      c12: 'We should never have relied on that school.'
    },
    decisions: {
      right: 'Move to another venue, limit the tournament to 32 players, or postpone it?',
      notTheirs: 'When should the school repair its roof?',
      premature: 'Should the club build its own clubhouse?'
    },
    actions: {
      concrete: 'The secretary phones the sports centre tomorrow at 9:00 and reports to the board by 12:00.',
      vague: 'Let’s wait and see what turns up.',
      outOfScope: 'Order new chess sets for the club.'
    }
  }
};
