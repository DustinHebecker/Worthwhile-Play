import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Database migration',
    situation: 'Your team is moving the customer database to a new system. Tests have found a problem, and the switch-over is delayed. Explain it.',
    facts: {
      newDate: 'The switch-over moves two days later: Thursday instead of Tuesday.',
      cause: 'Tests found a previously unknown bug with special characters such as ü or é.',
      noLoss: 'No data was lost.',
      encoding: 'The import script reads text in the wrong character encoding.',
      apology: 'We are sorry for the inconvenience.',
      regression: 'A new automated test now checks special characters.',
      buffer: 'The two days fit into the project’s time buffer, at no extra cost.',
      library: 'The faulty conversion comes from a library chosen years ago.'
    },
    reasons: {
      'developer.cause': 'Developers need to know what the tests actually found.',
      'developer.encoding': 'This is the root cause they will work on.',
      'developer.apology': 'An apology to customers does not help a colleague fix the bug.',
      'developer.regression': 'They need to know the bug is now covered by a test.',
      'developer.buffer': 'Time buffer and budget are the project lead’s concern.',
      'projectManager.newDate': 'The project lead plans with the new date.',
      'projectManager.noLoss': 'Data loss would change the risk completely, so they need to hear there is none.',
      'projectManager.encoding': 'The encoding detail does not change any planning decision.',
      'projectManager.apology': 'An apology is for customers; the project lead needs facts.',
      'projectManager.buffer': 'Whether schedule and budget still hold is exactly their question.',
      'projectManager.library': 'Who chose a library years ago does not help planning now.',
      'customer.newDate': 'The customer needs the new date, not the bug class.',
      'customer.noLoss': 'Their first worry is their data, and it is safe.',
      'customer.cause': 'Bug details worry customers without helping them.',
      'customer.encoding': 'Technical internals mean nothing to the customer.',
      'customer.regression': 'Internal testing is not the customer’s concern.',
      'customer.buffer': 'Internal buffers and costs are not the customer’s business.',
      'customer.library': 'Blaming an old library sounds like an excuse.'
    },
    messages: {
      'developer.fit': 'Heads-up: the import script reads text in the wrong encoding, so special characters like ü and é break. A regression test now covers it; the switch-over moves to Thursday.',
      'developer.missing': 'Small delay on the migration, nothing serious. Details later.',
      'developer.condescending': 'Special characters are letters like ü that are not in the basic alphabet. Computers store letters as numbers, and sometimes the numbers get mixed up.',
      'projectManager.fit': 'The migration moves from Tuesday to Thursday. No data was lost, and the two days fit into our buffer at no extra cost. Cause: a bug with special characters, now covered by a test.',
      'projectManager.tooMuch': 'The import script decodes the input as Latin-1 instead of UTF-8, so multi-byte characters get mangled; we are patching the reader and adding a regression test.',
      'projectManager.missing': 'We found a bug and are working on it. We will let you know.',
      'customer.fit': 'Your data is safe. To make sure every name and address comes across correctly, we are moving the switch-over from Tuesday to Thursday. Until then, everything works as usual.',
      'customer.tooMuch': 'Our import script used the wrong character encoding, which corrupted special characters in test runs, so the migration needs two extra days of our buffer.',
      'customer.condescending': 'Don’t worry about the technical side, it is complicated. Just know that it will be a bit later.'
    }
  },
  skyBlue: {
    title: 'Why the sky is blue',
    situation: 'Someone asks you why the sky is blue. You know the physics behind it. Explain it.',
    facts: {
      sunlight: 'Sunlight contains all colours.',
      scatter: 'Air scatters blue light much more than red light.',
      rayleigh: 'This Rayleigh scattering grows with the fourth power of the frequency (1/λ⁴).',
      sunset: 'At sunset, light travels through more air, so the sky turns red and orange.',
      everywhere: 'Scattered blue light reaches your eyes from every direction, so the whole sky looks blue.',
      violet: 'Violet is scattered even more, but sunlight contains less violet and our eyes are less sensitive to it.',
      molecules: 'The scattering comes from nitrogen and oxygen molecules, much smaller than the wavelength of light.',
      ocean: 'The sky is blue because it reflects the sea.'
    },
    reasons: {
      'child.sunlight': 'Children first need the surprise: white sunlight hides all the colours.',
      'child.scatter': 'This is the core idea, said in simple words.',
      'child.rayleigh': 'A formula loses a child immediately.',
      'child.everywhere': 'It explains what they see: blue wherever they look.',
      'child.violet': 'The violet detail confuses more than it helps at this age.',
      'child.molecules': 'Molecules and wavelengths are too abstract for a child.',
      'layperson.sunlight': 'Without it, “scattering blue light” makes no sense.',
      'layperson.scatter': 'This is the actual answer, in everyday words.',
      'layperson.rayleigh': 'The formula adds nothing a layperson can use.',
      'expert.rayleigh': 'An expert expects the precise mechanism and how it depends on wavelength.',
      'expert.everywhere': 'This is obvious to an expert and wastes their time.',
      'expert.violet': 'Experts know the obvious objection, “why not violet?” — answer it.',
      'expert.molecules': 'Naming the scatterers and the size ratio makes the explanation precise.',
      ocean: 'This is a common myth; the colour does not come from the sea.'
    },
    messages: {
      'child.fit': 'Sunlight looks white, but it is really all colours mixed together. When it flies through the air, the blue part gets bounced around the most, so blue comes to your eyes from all over the sky.',
      'child.tooMuch': 'Blue light has a shorter wavelength, and Rayleigh scattering grows with one over the wavelength to the fourth power.',
      'child.missing': 'That’s just how the sky is. It has always been blue.',
      'layperson.fit': 'Sunlight contains all colours. The air scatters blue light much more strongly than red, so blue light reaches us from every part of the sky.',
      'layperson.tooMuch': 'It is Rayleigh scattering: the intensity scales with 1/λ⁴, so short wavelengths dominate the diffuse radiance of the sky.',
      'layperson.condescending': 'It is a bit complicated for non-scientists. Let’s just say the air makes it blue.',
      'expert.fit': 'Rayleigh scattering by N₂ and O₂ molecules, proportional to 1/λ⁴. Violet scatters even more, but the solar spectrum has less violet and our cones are less sensitive to it.',
      'expert.condescending': 'Imagine sunlight as a box of crayons! The air likes to play with the blue crayon most.',
      'expert.missing': 'The air scatters blue light more, that’s why.'
    }
  },
  clubRoof: {
    title: 'Clubhouse roof',
    situation: 'The roof of your sports club’s clubhouse needs an urgent repair, and it costs more than planned. Explain it.',
    facts: {
      cost: 'The repair costs 8,000 euros, 3,000 more than budgeted.',
      decision: 'The board must decide by Friday whether to move 3,000 euros from the summer festival budget.',
      storage: 'The storage room stays closed until the repair; the rest of the clubhouse is open.',
      fees: 'Membership fees do not change.',
      schedule: 'The roofer starts on 12 May and needs four days; the car park is needed for scaffolding.',
      tiles: 'The new tiles are anthracite concrete tiles.',
      reserve: 'Using the reserve instead would push it below the required minimum.',
      volunteer: 'A member offered to repair the roof himself for free, but he is not a roofer.'
    },
    reasons: {
      'executive.cost': 'The board needs the amount and the overrun to judge it.',
      'executive.decision': 'This is the decision they must make, with its deadline.',
      'executive.storage': 'Day-to-day room use is not a board-level question.',
      'executive.schedule': 'The exact work days are the coordinator’s job.',
      'executive.tiles': 'Tile type and colour do not affect the decision.',
      'executive.reserve': 'It explains why the obvious alternative is not an option.',
      'projectManager.fees': 'Fees have nothing to do with organising the repair.',
      'projectManager.schedule': 'The coordinator organises exactly these dates and the car park.',
      'projectManager.reserve': 'Financing is the board’s decision, not the coordinator’s.',
      'layperson.storage': 'Members want to know what they can and cannot use.',
      'layperson.fees': 'Their own money is their first question.',
      'layperson.tiles': 'Material details do not matter to members.',
      'layperson.reserve': 'Reserve rules are internal finance details.',
      volunteer: 'An offer without the right qualification only starts a pointless debate; it is not a real option.'
    },
    messages: {
      'executive.fit': 'Decision needed by Friday: the roof repair costs 8,000 euros, 3,000 more than budgeted. We propose moving 3,000 from the summer festival budget, because the reserve would fall below its minimum.',
      'executive.tooMuch': 'The roofer starts on 12 May with anthracite concrete tiles; the scaffolding stands in the car park for four days, and the storage room stays closed until then.',
      'executive.missing': 'The roof is getting more expensive. We will keep you posted.',
      'projectManager.fit': 'The roofer starts on 12 May and needs four days. Please keep the car park free for the scaffolding from 11 May.',
      'projectManager.tooMuch': 'The repair costs 8,000 euros, 3,000 over budget; the board may move money from the festival, since the reserve must not fall below its minimum, and fees stay the same.',
      'projectManager.missing': 'There is some roof work coming up in May.',
      'layperson.fit': 'The clubhouse roof will be repaired in May. Until then, the storage room stays closed; everything else is open as usual. Membership fees do not change.',
      'layperson.tooMuch': 'The repair costs 8,000 euros, 3,000 over budget; the board is considering a transfer from the festival budget, because the reserve must not fall below its minimum.',
      'layperson.condescending': 'Don’t worry about the roof, the board will handle the grown-up stuff.'
    }
  },
  shopOutage: {
    title: 'Online shop outage',
    situation: 'Your company’s online shop was down for three hours yesterday. Explain what happened.',
    facts: {
      duration: 'The shop was down for three hours yesterday evening.',
      revenue: 'About 40,000 euros in orders were lost.',
      cause: 'An expired security certificate stopped payments.',
      fixed: 'The certificate has been renewed; the shop works normally again.',
      renewal: 'Renewal will be automated with a warning two weeks ahead; this takes the team one day.',
      voucher: 'Customers whose order failed receive a 10% voucher by email.',
      approval: 'Management is asked to approve 5,000 euros for better monitoring.',
      competitor: 'A competitor’s shop had a similar outage last month.'
    },
    reasons: {
      'projectManager.cause': 'The project lead needs the cause to judge the fix.',
      'projectManager.renewal': 'This is the work they must plan: one day of the team’s time.',
      'projectManager.voucher': 'Vouchers are handled by customer service, not by the project.',
      'executive.duration': 'Executives need the size of the incident.',
      'executive.revenue': 'Business impact comes first for executives.',
      'executive.cause': 'The technical detail does not change their decision; “a missed renewal” is enough.',
      'executive.renewal': 'They need to hear that it will not happen again.',
      'executive.approval': 'This is the decision they must make.',
      'customer.revenue': 'Your lost revenue is not the customer’s concern.',
      'customer.cause': 'Technical causes do not help customers.',
      'customer.fixed': 'Customers first want to know they can shop again.',
      'customer.renewal': 'Internal process changes are not the customer’s business.',
      'customer.voucher': 'This is what they get, and they should look for the email.',
      'customer.approval': 'Internal budget decisions are not for customers.',
      competitor: 'Pointing at others sounds like an excuse and changes nothing.'
    },
    messages: {
      'projectManager.fit': 'Yesterday’s three-hour outage came from an expired security certificate that stopped payments. To prevent a repeat, we automate renewal with an early warning; that takes the team one day this sprint.',
      'projectManager.tooMuch': 'We lost about 40,000 euros in orders, customers get a 10% voucher by email, and a competitor had the same problem last month.',
      'projectManager.missing': 'The shop had a short hiccup yesterday, all good now.',
      'executive.fit': 'Yesterday the shop was down for three hours; we lost about 40,000 euros in orders. A missed routine renewal caused it, and it is now automated. To catch such problems early, please approve 5,000 euros for monitoring.',
      'executive.tooMuch': 'The TLS certificate on the payment gateway expired at 18:02; we now renew it automatically via the ACME protocol, with alerts 14 days ahead.',
      'executive.missing': 'There was a small technical problem yesterday. It is fixed.',
      'customer.fit': 'We are sorry: yesterday evening our shop was unavailable for a few hours. Everything works again. If your order failed, you will receive a 10% voucher by email.',
      'customer.tooMuch': 'An expired security certificate stopped our payment system; we lost about 40,000 euros and now renew certificates automatically.',
      'customer.condescending': 'Some technical thing broke, nothing you would understand. Just try again.'
    }
  },
  signalFault: {
    title: 'Railway signal fault',
    situation: 'A signal fault is disrupting a railway line. You work for the railway. Explain the situation.',
    facts: {
      delay: 'Trains on this line are about 40 minutes late.',
      bus: 'Replacement buses leave from the station forecourt every 20 minutes.',
      tickets: 'Tickets are also valid on the buses and on later trains.',
      signal: 'Signal 14 at the junction shows a permanent red after a cable fault.',
      singleTrack: 'Trains pass the section on one track at walking speed, with written orders.',
      repair: 'Technicians expect the repair to take about four more hours.',
      construction: 'Construction work by another company probably damaged the cable.',
      staff: 'Two technicians are off sick this week.'
    },
    reasons: {
      'layperson.delay': 'Passengers first want to know how late they will be.',
      'layperson.bus': 'It tells them what they can do right now.',
      'layperson.tickets': 'It answers the worry whether they need a new ticket.',
      'layperson.signal': 'Signal numbers mean nothing to passengers.',
      'layperson.singleTrack': 'Operating rules do not help passengers.',
      'layperson.construction': 'Speculating about blame does not help passengers and may be wrong.',
      'layperson.staff': 'Internal staffing is not the passengers’ concern.',
      'expert.tickets': 'Ticket rules do not affect how trains are run.',
      'expert.signal': 'The colleague needs the exact location and fault.',
      'expert.singleTrack': 'This is the operating rule they must apply.',
      'expert.repair': 'They plan the timetable around the expected end.',
      'expert.staff': 'Staffing does not change how the section is operated.',
      'executive.delay': 'Management needs the scale of the disruption.',
      'executive.tickets': 'Ticket acceptance is a standard rule, not a management topic.',
      'executive.repair': 'They need to know how long the impact lasts.',
      'executive.construction': 'Possible damage by a third party matters for liability and costs.'
    },
    messages: {
      'layperson.fit': 'Trains on this line are about 40 minutes late. Replacement buses leave from the station forecourt every 20 minutes, and your ticket is valid on them.',
      'layperson.tooMuch': 'Signal 14 at the junction shows a permanent red after a cable fault; trains pass on one track at walking speed with written orders.',
      'layperson.missing': 'Please be patient, there is a technical disruption.',
      'expert.fit': 'Signal 14 at the junction is stuck at red after a cable fault. Single-track working at walking speed with written orders; repair expected to take about four more hours.',
      'expert.condescending': 'A signal is like a traffic light for trains. One of them is broken, so the trains have to go slowly.',
      'expert.missing': 'There is a problem on the line and trains are late. Buses are running.',
      'executive.fit': 'A cable fault will disrupt the line for about four more hours; trains run about 40 minutes late. Construction work by another company probably damaged the cable, so we are checking liability.',
      'executive.tooMuch': 'Signal 14 shows a permanent red; single-track working at walking speed with written orders; buses every 20 minutes from the forecourt; tickets valid on buses.',
      'executive.missing': 'Small signal problem, the team is on it.'
    }
  },
  kettleLid: {
    title: 'Kettle lid',
    situation: 'Your company has found that the lid of one kettle model can come loose. Explain it.',
    facts: {
      batches: 'Only kettles with batch numbers 2301 to 2315 are affected (printed under the base).',
      risk: 'The lid can open while pouring, so hot water may splash.',
      stop: 'Stop using an affected kettle until it is replaced.',
      hinge: 'A plastic hinge pin was made 0.2 mm too thin.',
      free: 'The replacement is free, including shipping.',
      cost: 'The exchange will cost the company about 120,000 euros.',
      supplier: 'The pins came from a new supplier whose samples had passed inspection.',
      injuries: 'There are no known injuries so far.'
    },
    reasons: {
      'customer.batches': 'Customers must be able to check whether their kettle is affected.',
      'customer.risk': 'They need to understand why it matters.',
      'customer.stop': 'This is the action that keeps them safe.',
      'customer.hinge': 'Millimetre details do not help customers.',
      'customer.free': 'Knowing it costs nothing removes a reason to wait.',
      'customer.cost': 'The company’s costs are not the customer’s concern.',
      'customer.supplier': 'Supplier details sound like shifting the blame.',
      'executive.risk': 'Executives must understand the safety risk first.',
      'executive.hinge': 'The exact dimension is for engineers.',
      'executive.cost': 'The financial impact is part of their decision.',
      'executive.injuries': 'Whether anyone was hurt changes the urgency and the response.',
      'expert.stop': 'Customer instructions do not help analyse the defect.',
      'expert.hinge': 'The engineer needs the exact defect.',
      'expert.free': 'Shipping terms do not matter for the technical analysis.',
      'expert.cost': 'Recall costs are not needed to fix the part.',
      'expert.supplier': 'It shows where the quality check must change.'
    },
    messages: {
      'customer.fit': 'Please check the batch number under your kettle. If it is between 2301 and 2315, stop using it: the lid can open while pouring. We will replace it free of charge, including shipping.',
      'customer.tooMuch': 'A hinge pin from a new supplier was 0.2 mm too thin; the exchange will cost us about 120,000 euros.',
      'customer.condescending': 'Some kettles might have a tiny problem. No need to understand the details; send it back if you like.',
      'executive.fit': 'Safety issue: on batches 2301 to 2315, the kettle lid can open while pouring hot water. No known injuries so far. The exchange will cost about 120,000 euros.',
      'executive.tooMuch': 'The hinge pin diameter is 0.2 mm below tolerance; the new supplier’s samples were within spec, so we suspect tool wear.',
      'executive.missing': 'We are replacing some kettles as a precaution.',
      'expert.fit': 'The hinge pins from the new supplier are 0.2 mm too thin, so the lid can open while pouring. Affected batches: 2301 to 2315. Their samples passed, so our incoming inspection must change.',
      'expert.missing': 'Some lids are loose; customers get a free replacement.',
      'expert.condescending': 'A hinge is the part that lets the lid turn. If it is too thin, it does not hold well.'
    }
  }
};
