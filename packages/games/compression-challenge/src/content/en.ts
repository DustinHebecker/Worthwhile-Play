import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'App launch update',
    context: 'An email from the project lead to the whole team.',
    sentences: {
      s1: 'Hi everyone, I hope you all had a good weekend in the sunshine.',
      s2: 'The launch of our booking app moves from 2 April to 14 May.',
      s3: 'The reason is that the payment provider has not yet finished its security certification, and we cannot take payments without it.',
      s4: 'The provider says it has a backlog of applications.',
      s5: 'The design team will use the extra weeks to polish the onboarding screens.',
      s6: 'Our 300 beta testers can keep using the test version until the launch.',
      s7: 'A competitor launched a similar app last year and needed three attempts.',
      s8: 'Marketing must move the campaign, so please decide on the new campaign start by Friday.',
      s9: 'The budget stays the same, because the agency does not charge for moving the campaign.',
      s10: 'The certification itself takes about three weeks once it starts.',
      s11: 'Thanks again for all your hard work!',
      s12: 'I will send an updated project plan on Wednesday.'
    },
    bullets: {
      gold1: 'The launch moves from 2 April to 14 May.',
      gold2: 'Cause: the payment provider’s security certification is not finished.',
      gold3: 'Marketing must decide on the new campaign start by Friday.',
      minor: 'The design team will polish the onboarding screens.',
      distort: 'The app has failed its security check.',
      dup: 'The launch is delayed.',
      subtle: 'The launch moves from 2 April to 4 May.'
    },
    bulletNotes: {
      distort: 'The text says the certification is not finished yet, not that the app failed a check.',
      dup: 'Repeats the point about the new date without the date, so it wastes a slot.',
      subtle: 'Almost right, but the new date is 14 May, not 4 May.'
    },
    summaries: {
      faithful: 'The launch moves to 14 May because the payment provider’s certification is not finished, and marketing must decide on the new campaign start by Friday.',
      vague: 'There are some changes to the launch timing that the team should be aware of.',
      drops: 'Because the payment provider is not ready yet, the launch has been postponed, but the budget stays the same.',
      adds: 'The launch moves to 14 May because the payment provider’s certification is not finished, and the delay will make the project more expensive.',
      subtle: 'The launch moves to 14 May because our app failed the payment provider’s certification, and marketing must decide on the new campaign start by Friday.'
    },
    summaryNotes: {
      drops: 'It leaves out the new date and the decision marketing has to make.',
      adds: 'The text says the budget stays the same; higher costs are made up.',
      subtle: 'The app has not failed anything: the certification is simply not finished yet.'
    },
    task: 'The marketing team has to act on this one-liner.',
    oneLiner: 'Move the launch to May.',
    details: {
      d1: 'The exact new date: 14 May',
      d2: 'Who must act: marketing moves the campaign',
      d3: 'The deadline: decide on the new campaign start by Friday',
      d4: 'Why the provider is behind schedule',
      d5: 'The design team’s plans for the onboarding screens',
      d6: 'The sunny weekend'
    },
    versions: {
      actionable: 'The launch moves from 2 April to 14 May. Marketing: please move the campaign and decide on the new start date by Friday. The budget stays the same.',
      vague: 'We are moving the launch to May. Please adjust your plans accordingly and let us know if anything comes up.',
      invented: 'The launch moves to 1 May. Marketing: please cancel the campaign and plan a new one by the end of the month.'
    },
    versionNote: 'The new date is 14 May, not 1 May, and the campaign is moved, not cancelled.'
  },
  library: {
    title: 'Library renovation',
    context: 'A notice on the door of the local library branch.',
    sentences: {
      s1: 'Many of you have told us how much you love the old armchairs in the reading corner.',
      s2: 'From 3 June, the library will be closed for renovation for eight weeks.',
      s3: 'The roof will be repaired, and the building will get a lift and new lighting.',
      s4: 'During the closure, a library bus will stop at the market square every Tuesday.',
      s5: 'The bus carries about 2,000 books and can order any title from the central library.',
      s6: 'All loans that would fall due during the closure are extended automatically, so nobody pays late fees.',
      s7: 'Books can also be returned at any time in the return box next to the town hall.',
      s8: 'The town hall itself was renovated in a similar way ten years ago.',
      s9: 'Our e-books and audiobooks remain available online as usual.',
      s10: 'We are already looking forward to next year’s summer reading festival.',
      s11: 'The renovation is paid for by a regional building fund.'
    },
    bullets: {
      gold1: 'Closed for renovation for eight weeks from 3 June.',
      gold2: 'A library bus stops at the market square every Tuesday.',
      gold3: 'Loans due during the closure are extended automatically.',
      minor: 'The building will get new lighting.',
      distort: 'All library services stop for eight weeks.',
      dup: 'The library will be closed for a while.',
      subtle: 'Closed for renovation for six weeks from 3 June.'
    },
    bulletNotes: {
      distort: 'Not true: the bus and the return box keep working during the closure.',
      dup: 'Repeats the closure without the start date or the length.',
      subtle: 'Almost right, but the closure lasts eight weeks, not six.'
    },
    summaries: {
      faithful: 'The library closes for eight weeks from 3 June; meanwhile a bus visits the market square every Tuesday, and loans due in that time are extended automatically.',
      vague: 'There will be some changes at the library over the summer, so keep an eye out.',
      drops: 'The library is being renovated and will get a repaired roof, a lift and new lighting.',
      adds: 'The library closes for eight weeks from 3 June and will charge a small fee for loans after it reopens.',
      subtle: 'Because the roof is unsafe, the library closes for eight weeks from 3 June; meanwhile a bus visits the market square every Tuesday.'
    },
    summaryNotes: {
      drops: 'It describes the building work but not when the library closes or what readers can do meanwhile.',
      adds: 'Nothing in the notice mentions fees after the reopening.',
      subtle: 'The notice says the roof will be repaired, not that it is unsafe; that cause is added.'
    },
    task: 'A neighbour who wants to keep borrowing books asks you about it.',
    oneLiner: 'The library is closed in summer.',
    details: {
      d1: 'When exactly: for eight weeks from 3 June',
      d2: 'Where to borrow meanwhile: the bus at the market square on Tuesdays',
      d3: 'Where to return books: the box next to the town hall',
      d4: 'What the renovation includes',
      d5: 'The armchairs in the reading corner',
      d6: 'Next year’s reading festival'
    },
    versions: {
      actionable: 'From 3 June the library is closed for eight weeks. You can borrow books from the library bus at the market square every Tuesday and return them any time in the box next to the town hall. Loans due in that time are extended automatically.',
      vague: 'The library will be closed for a while in the summer because of building work. There will be other options, so check the notice for more.',
      invented: 'From 3 June the library is closed for eight weeks. You can borrow books from the library bus at the station every Friday. Please return all books before the closure.'
    },
    versionNote: 'The bus stops at the market square on Tuesdays, and nobody has to return books before the closure.'
  },
  leaves: {
    title: 'Why leaves change colour',
    context: 'A short article from a nature magazine for curious readers.',
    sentences: {
      s1: 'Autumn is many people’s favourite season for long walks.',
      s2: 'Leaves are green because they contain a lot of chlorophyll, the pigment plants use to capture sunlight.',
      s3: 'As the days get shorter, many trees stop making chlorophyll and break it down.',
      s4: 'Yellow and orange pigments, called carotenoids, were in the leaf all along; they only become visible when the green fades.',
      s5: 'Carotenoids are the same kind of pigment that makes carrots orange.',
      s6: 'Red is different: some trees, such as many maples, make new red pigments in autumn.',
      s7: 'Researchers think these red pigments may protect the leaf from strong light while the tree takes back nutrients.',
      s8: 'Sunny days and cool nights tend to make the reds brighter.',
      s9: 'In some regions, colourful forests attract many tourists every year.',
      s10: 'Finally, a thin layer of cells forms where the leaf joins the twig, and the leaf falls.',
      s11: 'Don’t forget a warm jacket if you go out to look at the trees.'
    },
    bullets: {
      gold1: 'In autumn, trees stop making green chlorophyll and break it down.',
      gold2: 'Yellow and orange pigments were there all along and become visible.',
      gold3: 'Some trees, such as maples, make new red pigments.',
      minor: 'A thin layer of cells forms, and the leaf falls.',
      distort: 'All autumn colours are new pigments made by the tree.',
      dup: 'Leaves lose their green colour.',
      subtle: 'Red pigments protect the leaf from strong light.'
    },
    bulletNotes: {
      distort: 'Only the reds are new; yellow and orange were in the leaf all along.',
      dup: 'Says less than the point about chlorophyll and wastes a slot.',
      subtle: 'The text only says researchers think the red pigments may protect the leaf; this bullet states it as a fact.'
    },
    summaries: {
      faithful: 'In autumn many trees break down their green chlorophyll, which reveals yellow and orange pigments that were there all along, while some trees also make new red ones.',
      vague: 'Leaves change colour in autumn because of various natural processes in the tree.',
      drops: 'In autumn, leaves turn yellow, orange and red, and then they fall from the trees.',
      adds: 'In autumn many trees break down their green chlorophyll, which reveals yellow and orange pigments, and the redder the leaves, the colder the coming winter.',
      subtle: 'In autumn many trees break down their green chlorophyll, which reveals yellow and orange pigments, and cold nights make the trees produce red ones.'
    },
    summaryNotes: {
      drops: 'It describes what we see, but not why it happens.',
      adds: 'The text says nothing about predicting the winter.',
      subtle: 'Cool nights only tend to make the reds brighter; the text does not say they cause the red pigments.'
    },
    task: 'A teacher wants to explain this one-liner to a class, using real leaves.',
    oneLiner: 'The chlorophyll breaks down, so other colours show.',
    details: {
      d1: 'What chlorophyll is: the green pigment that captures sunlight',
      d2: 'That yellow and orange were in the leaf all along',
      d3: 'That some trees, such as maples, make new red pigments',
      d4: 'That autumn is a popular season for walks',
      d5: 'That you need a warm jacket outside',
      d6: 'How the leaf finally falls off'
    },
    versions: {
      actionable: 'Leaves are green because of chlorophyll, a pigment that captures sunlight. In autumn many trees stop making it and break it down. Then yellow and orange pigments that were there all along become visible, and some trees, like maples, make new red ones.',
      vague: 'In autumn the leaves change because the green goes away and other colours come out. Nature is fascinating that way.',
      invented: 'Leaves are green because of chlorophyll. In autumn the frost freezes the chlorophyll, and then the tree paints its leaves yellow, orange and red with new pigments.'
    },
    versionNote: 'The text does not say that frost freezes the chlorophyll, and only the reds are new pigments.'
  },
  club: {
    title: 'Sports club board meeting',
    context: 'The minutes of a sports club board meeting, sent to all members.',
    sentences: {
      s1: 'The meeting took place in the clubhouse and started a little late because of a football match.',
      s2: 'The board proposes raising the annual membership fee from 60 to 66 euros from next January.',
      s3: 'The reason is that the rent for the sports hall has gone up by 15 percent.',
      s4: 'The fee has not changed for eight years.',
      s5: 'Members under 18 will keep paying the old fee.',
      s6: 'The members will vote on the proposal at the general meeting on 12 March.',
      s7: 'The board also discussed new nets for the tennis courts but postponed a decision.',
      s8: 'If the proposal is rejected, the board will look at cutting some training times instead.',
      s9: 'A neighbouring club recently raised its fee as well, to 75 euros.',
      s10: 'The hall belongs to the town, which sets the rent.',
      s11: 'Many thanks to the youth team for the delicious cakes!'
    },
    bullets: {
      gold1: 'Proposal: the annual fee rises from 60 to 66 euros from January.',
      gold2: 'Members under 18 keep paying the old fee.',
      gold3: 'Members vote on it at the general meeting on 12 March.',
      minor: 'New nets for the tennis courts were discussed.',
      distort: 'The board has decided to raise the fee.',
      dup: 'The membership fee may go up.',
      subtle: 'Proposal: the annual fee rises from 60 to 76 euros from January.'
    },
    bulletNotes: {
      distort: 'Nothing is decided yet: it is a proposal, and the members vote on it.',
      dup: 'A vaguer repeat of the fee point, without the amounts.',
      subtle: 'Almost right, but the proposed fee is 66 euros, not 76.'
    },
    summaries: {
      faithful: 'Because the hall rent rose, the board proposes raising the annual fee from 60 to 66 euros from January, with under-18s exempt, and members vote on it on 12 March.',
      vague: 'The board talked about money matters and some changes for members.',
      drops: 'Because the rent for the sports hall has gone up, the club’s finances were the main topic of the board meeting.',
      adds: 'The board proposes raising the annual fee from 60 to 66 euros from January, and members who do not pay by March will lose their membership.',
      subtle: 'Because the hall rent rose, the board has decided to raise the annual fee from 60 to 66 euros from January, with under-18s exempt.'
    },
    summaryNotes: {
      drops: 'It leaves out the proposed new fee and the vote on 12 March.',
      adds: 'The minutes say nothing about losing the membership.',
      subtle: 'It is only a proposal that the members still vote on, so “has decided” is wrong.'
    },
    task: 'A member asks you what this means for them.',
    oneLiner: 'The fees are going up.',
    details: {
      d1: 'The amounts: from 60 to 66 euros a year',
      d2: 'That it is a proposal, voted on at the general meeting on 12 March',
      d3: 'That members under 18 keep the old fee',
      d4: 'That the meeting started late',
      d5: 'The cakes from the youth team',
      d6: 'The discussion about tennis nets'
    },
    versions: {
      actionable: 'The board proposes raising the annual fee from 60 to 66 euros from January, because the hall rent went up. Members under 18 keep the old fee. Nothing is decided yet: you can vote on it at the general meeting on 12 March.',
      vague: 'The fees are going up next year because things have become more expensive. More information will follow at some point.',
      invented: 'From January the fee rises from 60 to 66 euros for everyone. Please update your bank transfer before the general meeting on 12 March.'
    },
    versionNote: 'It treats a proposal as decided and forgets that members under 18 keep the old fee.'
  },
  trip: {
    title: 'Change to the class trip',
    context: 'A message from a teacher to the parents of a school class.',
    sentences: {
      s1: 'I hope the children are as excited about the trip as I am!',
      s2: 'Because of a rail strike, we will travel to the coast by coach instead of by train.',
      s3: 'This means we leave one hour earlier than planned.',
      s4: 'The meeting point is no longer the station but the car park behind the school.',
      s5: 'The coach company has a lot of experience with school groups.',
      s6: 'The return trip on Friday stays as planned.',
      s7: 'There are no extra costs for families; the school covers the difference.',
      s8: 'The coach journey takes about 40 minutes longer than the train.',
      s9: 'Last year’s class went to the mountains, which was also a great trip.',
      s10: 'There is a short break halfway, at a service station.',
      s11: 'Thank you all for your help with the packing lists.'
    },
    bullets: {
      gold1: 'Coach instead of train because of a rail strike.',
      gold2: 'Departure one hour earlier, from the car park behind the school.',
      gold3: 'No extra costs for families.',
      minor: 'The coach company is experienced with school groups.',
      distort: 'The trip is shortened because of the strike.',
      dup: 'The travel plans have changed.',
      subtle: 'Departure two hours earlier, from the car park behind the school.'
    },
    bulletNotes: {
      distort: 'Only the journey there changes; the trip is not shortened.',
      dup: 'Says only that something changed, which the other points already show.',
      subtle: 'Almost right, but departure is one hour earlier, not two.'
    },
    summaries: {
      faithful: 'Because of a rail strike, the class travels by coach, leaving one hour earlier from the car park behind the school, at no extra cost to families.',
      vague: 'There are a few changes to the trip arrangements that parents should know about.',
      drops: 'Because of a rail strike, the class will travel to the coast by coach, which costs families nothing extra.',
      adds: 'Because of a rail strike, the class travels by coach, leaving one hour earlier from the car park behind the school, and parents pay a small extra fee.',
      subtle: 'Because the coach is faster than the train, the class travels by coach, leaving one hour earlier from the car park behind the school, at no extra cost to families.'
    },
    summaryNotes: {
      drops: 'It leaves out what parents must act on: the earlier departure and the new meeting point.',
      adds: 'The message says the school covers the difference, so there is no fee.',
      subtle: 'The reason is the rail strike, and the coach is even slower than the train.'
    },
    task: 'A parent who missed the message asks another parent what to do.',
    oneLiner: 'The class goes by coach now.',
    details: {
      d1: 'The new meeting point: the car park behind the school',
      d2: 'The new time: one hour earlier than planned',
      d3: 'That there are no extra costs',
      d4: 'That the coach company is experienced',
      d5: 'Why they are not taking the train',
      d6: 'That the teacher is looking forward to the trip'
    },
    versions: {
      actionable: 'The class goes by coach. Bring your child to the car park behind the school, not to the station, one hour earlier than planned. It costs nothing extra, and the return on Friday is unchanged.',
      vague: 'There is a strike, so they are taking a coach now. Times and places are a bit different, so check what the teacher wrote.',
      invented: 'The class goes by coach. Bring your child to the station one hour earlier, and give them some money for the coach ticket.'
    },
    versionNote: 'The meeting point is the car park behind the school, not the station, and the school covers the cost.'
  },
  bikes: {
    title: 'E-bikes for bike sharing',
    context: 'An announcement from a city’s bike-sharing service to its users.',
    sentences: {
      s1: 'Cycling is a great way to stay active and explore the city.',
      s2: 'From 1 July, our bike-sharing service adds 200 electric bikes to its fleet.',
      s3: 'An e-bike costs 20 cents per minute; the regular bikes keep their current price.',
      s4: 'To unlock an e-bike, you need the latest version of our app.',
      s5: 'The e-bikes have a range of about 60 kilometres per charge.',
      s6: 'E-bikes must be returned to one of 12 charging stations; they cannot be left anywhere else.',
      s7: 'A map of the charging stations is in the app.',
      s8: 'If an e-bike is left outside a station, a fee of 10 euros is charged.',
      s9: 'Several other cities have introduced similar services in recent years.',
      s10: 'The bikes were tested by 50 volunteers over the winter.',
      s11: 'Thank you for riding with us!'
    },
    bullets: {
      gold1: 'From 1 July: 200 e-bikes at 20 cents per minute.',
      gold2: 'Unlocking them needs the latest app version.',
      gold3: 'E-bikes must be returned to one of 12 charging stations.',
      minor: 'A map of the charging stations is in the app.',
      distort: 'The e-bikes replace the regular bikes.',
      dup: 'There are new bikes.',
      subtle: 'From 1 July: 200 e-bikes at 25 cents per minute.'
    },
    bulletNotes: {
      distort: 'The e-bikes are added; the regular bikes stay, at their current price.',
      dup: 'A vaguer repeat of the first point, without date, number or price.',
      subtle: 'Almost right, but the price is 20 cents per minute, not 25.'
    },
    summaries: {
      faithful: 'From 1 July there are 200 e-bikes at 20 cents per minute; they need the latest app to unlock and must be returned to one of 12 charging stations.',
      vague: 'The bike-sharing service is introducing something new this summer that users may find interesting.',
      drops: 'The bike-sharing service adds 200 e-bikes with a range of about 60 kilometres, so longer trips become easier.',
      adds: 'From 1 July there are 200 e-bikes at 20 cents per minute, and the regular bikes will be phased out next year.',
      subtle: 'From 1 July there are 200 e-bikes at 20 cents per minute; they need the latest app to unlock and can be returned to any bike station.'
    },
    summaryNotes: {
      drops: 'It leaves out the price and what users must do: update the app and return e-bikes to a charging station.',
      adds: 'Nothing in the announcement says the regular bikes will be phased out.',
      subtle: 'E-bikes can only be returned to the 12 charging stations, not to any station.'
    },
    task: 'A friend wants to try an e-bike next week.',
    oneLiner: 'There are e-bikes now.',
    details: {
      d1: 'The price: 20 cents per minute',
      d2: 'That unlocking needs the latest app version',
      d3: 'That e-bikes must go back to a charging station',
      d4: 'That cycling keeps you active',
      d5: 'How many e-bikes there are in total',
      d6: 'That the regular bikes keep their price'
    },
    versions: {
      actionable: 'From 1 July you can rent e-bikes for 20 cents per minute. Update the app first, because you need the latest version to unlock them. Afterwards, return the bike to one of the 12 charging stations shown on the map in the app.',
      vague: 'There are e-bikes now, and they are easy to use. Just get the app and ride off.',
      invented: 'From 1 July you can rent e-bikes for 20 cents per minute without the app, and you can leave them anywhere in the city afterwards.'
    },
    versionNote: 'You need the latest app to unlock them, and they must go back to a charging station.'
  }
};
