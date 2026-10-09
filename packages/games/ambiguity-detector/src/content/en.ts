import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'Your team lead writes to you in the team chat. You are working on three different reports at the moment.',
    text: 'Please finish this tomorrow.',
    ask: { what: 'Which of the three reports do you mean?' },
    given: { when: 'The day is stated: tomorrow.', who: 'The message is addressed to you directly.' },
    replies: {
      clear: 'Sure. Which of the three reports do you mean: the budget, the sales or the staff report?',
      vague: 'Okay, will do!',
      assume: 'No problem, I will finish the sales report tomorrow.'
    }
  },
  'concert-entrance': {
    context: 'A friend texts you about the concert on Saturday, which starts at 8 pm. The hall has four entrances.',
    text: 'Let’s meet at the entrance before the concert.',
    ask: { when: 'What time should we meet, how long before 8 pm?', where: 'Which of the four entrances?' },
    given: { what: 'What is planned is clear: meeting before the concert.' },
    replies: {
      clear: 'Good idea! Which entrance, and what time? Would 7:30 work?',
      vague: 'Sounds good, see you there!',
      rude: 'You always say things like that. Be precise for once!'
    }
  },
  'party-photos': {
    context: 'Your aunt writes to you after a family party where you took about 200 photos.',
    text: 'Can you send me the photos from Sunday?',
    ask: { what: 'All 200, or only some of them, for example the ones with you in them?', format: 'How should I send them: as a download link, by email or as prints?' },
    given: { who: 'It is clear who should send them: you.' },
    replies: {
      clear: 'Of course! All 200 or just a selection? And is a download link okay for you?',
      vague: 'Sure, I will send them sometime.',
      assume: 'I have ordered prints of all 200 photos for you.'
    }
  },
  'water-plants': {
    context: 'Your neighbour leaves for a two-week trip tomorrow. You have their spare key.',
    text: 'Could you water the plants while I’m away?',
    ask: { when: 'How often do they need water: every day or twice a week?', where: 'Which plants: inside, on the balcony or both?' },
    given: { what: 'The task is clear: watering the plants.', who: 'You are asked directly.' },
    replies: {
      clear: 'Happy to! Which plants, and how often should I water them?',
      vague: 'Sure, no problem.',
      assume: 'Sure, I will water the balcony plants every evening.'
    }
  },
  'train-tickets': {
    context: 'You and a friend are planning a weekend by the sea. She writes:',
    text: 'I’ll book the hotel. Can you book the train?',
    ask: { when: 'Which day and roughly what time do we travel there and back?' },
    given: { what: 'The task is clear: train tickets for the trip.', who: 'You are asked to book them.' },
    replies: {
      clear: 'Yes! Which day and what time do you want to leave, and when do we come back?',
      vague: 'Okay, I will do that.',
      assume: 'Done: Friday at 5:30 in the morning, first class.'
    }
  },
  'bins-tonight': {
    context: 'A message in the group chat of five flatmates.',
    text: 'Someone needs to take the bins out tonight.',
    ask: { who: 'Who exactly should do it tonight? Whose turn is it?' },
    given: { what: 'The task is clear: taking the bins out.', when: 'The time is stated: tonight.' },
    replies: {
      clear: 'Who should do it tonight? Is there a rota we can check?',
      vague: 'Yes, someone should.',
      rude: 'Obviously not me. Sort it out among yourselves.'
    }
  },
  'school-form': {
    context: 'A note from your child’s teacher in the school app. This week your child brought home two forms: one for a trip and one for class photos.',
    text: 'Please return the signed form by Thursday.',
    ask: { what: 'Which form do you mean: the trip form or the photo form?', format: 'Should I return it on paper or as a photo in the app?' },
    given: { when: 'The deadline is stated: Thursday.' },
    replies: {
      clear: 'Thank you! Which form do you mean, the trip or the photo form? And on paper or through the app?',
      vague: 'Okay, noted.',
      assume: 'Done: I signed both forms and uploaded photos of them.'
    }
  },
  'holiday-keys': {
    context: 'You have rented a holiday flat. The host writes to you the day before you arrive.',
    text: 'I’ll leave the keys for you.',
    ask: { where: 'Where exactly will you leave the keys?' },
    given: { what: 'It is clear what this is about: the keys.', who: 'The host leaves them herself.' },
    replies: {
      clear: 'Thank you! Where exactly will they be: in a key box, or with a neighbour?',
      vague: 'Great, thanks!',
      assume: 'Perfect, I will take them from under the doormat.'
    }
  },
  'project-slides': {
    context: 'Your manager writes to you on Tuesday morning.',
    text: 'Can you put together some slides about the project?',
    ask: {
      when: 'By when do you need the slides?',
      audience: 'Who will see them: the team, management or the client?',
      scope: 'How long should it be: a few slides or a full presentation?',
      purpose: 'What should it achieve: a status update or a decision?'
    },
    given: { what: 'The deliverable is clear: slides about the project.', who: 'You are asked directly.' },
    replies: {
      clear: 'Happy to. For whom, by when, roughly how long, and should it lead to a decision or just give an update?',
      vague: 'Sure, I will make some slides.',
      assume: 'I will prepare 40 slides for the board meeting on Friday.'
    }
  },
  'cafe-website': {
    context: 'The owner of a small café writes to you, the web designer who built her website.',
    text: 'The website looks weird, can you fix it?',
    ask: {
      what: 'What exactly looks wrong: text, pictures or the layout?',
      where: 'On which page and on which device do you see it?',
      priority: 'Is it urgent? Does it stop customers from ordering?'
    },
    given: { who: 'You are asked, as the designer of the site.' },
    replies: {
      clear: 'Sorry to hear that! What exactly looks wrong, on which page and device? And does it stop customers from ordering?',
      vague: 'I will take a look.',
      assume: 'I will redesign the whole website this week.'
    }
  },
  'walk-report': {
    context: 'The chair of your hiking club writes to you after the spring walk.',
    text: 'Could you write a short report about the walk?',
    ask: {
      when: 'By when do you need the report?',
      format: 'Text only or with photos? For print or for the website?',
      audience: 'Who will read it: club members or the local newspaper?'
    },
    given: { what: 'The deliverable is clear: a report about the walk.', scope: '“Short” gives a rough size; you could still confirm a word count.' },
    replies: {
      clear: 'Gladly! Who is it for, by when do you need it, and should I add photos?',
      vague: 'Okay, I will write something.',
      assume: 'I will send a three-page report with 50 photos to the newspaper tomorrow.'
    }
  },
  'office-paper': {
    context: 'The office manager writes in the team channel.',
    text: 'We’re running low on printer paper, someone please order more.',
    ask: {
      when: 'By when do we need it?',
      who: 'Who should place the order?',
      scope: 'How much should we order?'
    },
    given: { what: 'It is clear what is needed: printer paper.' },
    replies: {
      clear: 'I can order it. How many packs, and by when do we need them?',
      vague: 'Yes, someone should.',
      assume: 'I have ordered 100 boxes; they will arrive next month.'
    }
  },
  'anniversary': {
    context: 'Your partner calls you. Their parents’ 40th wedding anniversary is in two months.',
    text: 'We should organise something for my parents.',
    ask: {
      what: 'What are you thinking of: a dinner, a party or a gift?',
      when: 'When: on the day itself or on a weekend nearby?',
      who: 'Who takes care of which part: you, me, your siblings?',
      scope: 'How big: just the family or many guests?'
    },
    given: { audience: 'It is clear who it is for: the parents.', purpose: 'The occasion is clear: the 40th wedding anniversary.' },
    replies: {
      clear: 'Lovely idea! What do you have in mind, when, for how many people, and who does what?',
      vague: 'Yes, we should.',
      assume: 'I have booked a restaurant for 60 people next Saturday.'
    }
  },
  'customer-reply': {
    context: 'Your manager forwards you a customer’s complaint about a delivery that is two weeks late.',
    text: 'Please get back to the customer.',
    ask: {
      what: 'What may I offer: an apology, a discount, a new delivery date?',
      when: 'How soon: today?',
      format: 'Should I call or write?'
    },
    given: { audience: 'It is clear who to contact: the customer.', purpose: 'The reason is clear: the late delivery.' },
    replies: {
      clear: 'Will do. Should I call or email, by when, and what can I offer them?',
      vague: 'Okay.',
      assume: 'I have promised the customer a full refund and free delivery for a year.'
    }
  },
  'shop-translation': {
    context: 'A friend who runs a small online shop writes to you because you speak Spanish.',
    text: 'Could you translate the shop texts for me?',
    ask: {
      when: 'By when do you need the translation?',
      audience: 'Are your customers in Spain or in Latin America?',
      scope: 'Which texts, and how many: product descriptions, the whole site?'
    },
    given: { what: 'The task is clear: a translation into Spanish.', who: 'You are asked directly.' },
    replies: {
      clear: 'Happy to help! Which texts, by when, and are your customers in Spain or in Latin America?',
      vague: 'Sure, send it over sometime.',
      assume: 'Sure, I will translate the whole site into Spanish, Portuguese and French by tomorrow.'
    }
  },
  'basement': {
    context: 'The caretaker of your apartment building writes to all residents.',
    text: 'Please clear your things out of the basement.',
    ask: {
      when: 'By when does the basement have to be empty?',
      where: 'Where can we store our things in the meantime?',
      purpose: 'What is the reason, and is it only for a while?'
    },
    given: { what: 'It is clear what is meant: your own things in the basement.', who: 'All residents are asked.' },
    replies: {
      clear: 'Thanks for letting us know. By when, for what reason, and is there a place where we can store our things meanwhile?',
      vague: 'Okay.',
      rude: 'I am not moving anything. Find another solution.'
    }
  },
  'board-report': {
    context: 'Your manager writes on Wednesday. Last week she told you the quarterly report goes to the board and must be at most two pages long.',
    text: 'Please send me the report by Friday.',
    ask: {
      format: 'Do you want an editable file or a PDF?',
      criterion: 'Which figures or sections must it contain to be complete?'
    },
    given: {
      what: 'It is clear which report: the quarterly report.',
      when: 'The deadline is stated: Friday.',
      audience: 'Given earlier: the report goes to the board.',
      scope: 'Given earlier: at most two pages.'
    },
    replies: {
      clear: 'Will do. Which sections must be in it, and do you want an editable file or a PDF?',
      vague: 'Sure, by Friday.',
      redundant: 'Who is it for, how long should it be, and which report do you mean?'
    }
  },
  'school-pickup': {
    context: 'Your sister writes to you. Her two children finish school at 3 pm every day; on Tuesdays the older one has football practice until 5.',
    text: 'Can you pick up the kids on Tuesday?',
    ask: {
      where: 'Where should I take them afterwards: home to you, or to my place?',
      scope: 'Both children, or only the younger one, since the older one has football?'
    },
    given: { when: 'Known from the context: school ends at 3 pm.', who: 'You are asked directly.' },
    replies: {
      clear: 'Yes, I can. Both of them or just the younger one? And should I bring them home to you or to my place?',
      vague: 'Yes, sure.',
      redundant: 'What time do they finish school, and on which day?'
    }
  },
  'checkout-bug': {
    context: 'A product manager comments in the team’s bug tracker on a ticket titled “Checkout button does nothing on phones since update 2.3”.',
    text: 'Urgent, please fix this as soon as possible.',
    ask: {
      who: 'Who on the team should take it?',
      criterion: 'On which phones and browsers must it work before we close the ticket?'
    },
    given: {
      what: 'The ticket title names the problem.',
      where: 'The title says where: on phones.',
      priority: '“Urgent” makes the priority clear.'
    },
    replies: {
      clear: 'On it. Who takes it? And which phones and browsers must we test before we close the ticket?',
      vague: 'We will look into it.',
      redundant: 'What exactly is broken, and is it urgent?'
    }
  },
  'client-room': {
    context: 'Your colleague Ana writes to you. She is visiting with two clients next week; it will be just the three of them.',
    text: 'Could you book a meeting room for me next week?',
    ask: {
      when: 'Which day and time, and for how long?',
      format: 'Do you need a screen or video equipment?'
    },
    given: {
      what: 'The task is clear: booking a meeting room.',
      who: 'You are asked to book it.',
      scope: 'Known from the context: three people.'
    },
    replies: {
      clear: 'Sure. Which day and time, for how long, and do you need a screen?',
      vague: 'Okay, I will book something.',
      redundant: 'How many people are coming, and what do you need the room for?'
    }
  },
  'newsletter': {
    context: 'The editor of your sports club’s newsletter writes to you. The newsletter goes to all members on the first Monday of each month; every article has about 200 words.',
    text: 'Could you write something about the new training times?',
    ask: {
      what: 'Should it list the full new schedule or only what has changed?',
      when: 'By when do you need my text? The newsletter date is not the same as my deadline.'
    },
    given: { audience: 'Known from the context: all club members.', scope: 'Known from the context: about 200 words.' },
    replies: {
      clear: 'Gladly. By when do you need it, and should I list the full schedule or only the changes?',
      vague: 'Sure, I will write something.',
      redundant: 'Who reads the newsletter, and how long should the text be?'
    }
  },
  'airport': {
    context: 'Your cousin sends you her flight details: landing on Saturday at 14:20, terminal 2. She will stay with you for a week.',
    text: 'Can you pick me up?',
    ask: { scope: 'Are you coming alone, and how much luggage do you have? Will it fit in a small car?' },
    given: {
      when: 'Known from the flight details: Saturday at 14:20.',
      where: 'Known from the flight details: terminal 2.',
      purpose: 'Known from the context: she is staying with you, so it is clear where to go.'
    },
    replies: {
      clear: 'Of course! Are you coming alone, and how much luggage do you have?',
      vague: 'Yes, see you then.',
      redundant: 'When do you land, and at which terminal?'
    }
  },
  'contract-check': {
    context: 'A colleague from purchasing emails you a 30-page supplier contract. Subject: “Please check section 7 (liability) by Thursday noon”.',
    text: 'Please have a look.',
    ask: {
      format: 'How do you want my feedback: comments in the document or a short email?',
      criterion: 'What should I look for: risks, unclear wording or the amounts?'
    },
    given: { what: 'The subject names the part: section 7.', when: 'The subject names the deadline: Thursday noon.' },
    replies: {
      clear: 'Will do by Thursday noon. What should I focus on in section 7, and do you want comments in the file or a short summary?',
      vague: 'Will look at it.',
      redundant: 'Which part should I read, and by when?'
    }
  },
  'shared-dinner': {
    context: 'Lina writes in the group chat of four friends. Earlier today everyone agreed on dinner at her place on Saturday at 7 pm.',
    text: 'Can everyone bring something?',
    ask: {
      what: 'What should each of us bring: a starter, dessert or drinks?',
      criterion: 'Is there anything someone cannot or does not eat?'
    },
    given: { when: 'Agreed earlier: Saturday at 7 pm.', where: 'Agreed earlier: at Lina’s place.' },
    replies: {
      clear: 'Gladly! Shall we split it into starter, dessert and drinks? And is there anything someone cannot eat?',
      vague: 'Sure, I will bring something.',
      redundant: 'Where are we meeting, and at what time?'
    }
  }
};
