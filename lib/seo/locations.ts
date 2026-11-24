// Location landing pages for local-intent queries ("coworking space Kottawa",
// "coworking Pannipitiya", "coworking space Sri Lanka").
//
// Every fact here must be true of the one real location at 349/A/3
// Avissawella Road, Pannipitiya. The drive times (5 min Kottawa, 10 min
// Maharagama, ~30 min Kadawatha via the expressway) are the ones already
// published on the About page. Do not add a page for a town unless the copy
// can honestly say how far the space is from it — thin "city swap" pages get
// filtered by Google and are never cited by AI answer engines.

export interface LocationFaq {
  question: string;
  answer: string;
}

export interface LocationPageData {
  slug: string;
  place: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  /** 40–60 word answer-first paragraph: the passage AI engines quote. */
  answer: string;
  gettingHereHeading: string;
  gettingHere: string[];
  whoFor: { heading: string; body: string }[];
  faqs: LocationFaq[];
  /** ISO date the copy was last reviewed — shown on the page and in JSON-LD. */
  updated: string;
}

const UPDATED = "2026-11-24";

export const LOCATION_PAGES: LocationPageData[] = [
  {
    slug: "coworking-space-kottawa",
    place: "Kottawa",
    title: "Coworking Space Near Kottawa | Hot Desks from LKR 490 | Cowork.lk",
    description:
      "Cowork.lk is a coworking space 5 minutes from Kottawa on Avissawella Road, Pannipitiya. Hot desks from LKR 490, meeting rooms, fiber WiFi, backup power. Book online.",
    eyebrow: "Coworking near Kottawa",
    h1: "Coworking Space Near Kottawa",
    answer:
      "Cowork.lk is a dedicated coworking space just 5 minutes' drive from Kottawa, at 349/A/3 Avissawella Road, Pannipitiya. It offers hot desks from LKR 490, workspace seats, and private 4- and 5-seater meeting rooms, with fiber WiFi, backup power, free coffee and online booking, open daily 8 AM to 8 PM.",
    gettingHereHeading: "Getting to Cowork.lk from Kottawa",
    gettingHere: [
      "Cowork.lk is about 5 minutes by car or tuk-tuk from Kottawa town, heading towards Maharagama along Avissawella Road (the High Level Road).",
      "We're on the 2nd floor of the Active Plus Building, 349/A/3 Avissawella Road, Pannipitiya 10230.",
      "Safe on-premise parking is available for a limited number of vehicles.",
      "Drivers coming off the Southern Expressway or the Outer Circular Highway at Kottawa can reach us in a few minutes without going into Colombo traffic.",
    ],
    whoFor: [
      {
        heading: "Remote workers living in Kottawa",
        body: "Skip the commute to Colombo. Book a hot desk or workspace seat by the half-day or full day, with no lease or membership contract.",
      },
      {
        heading: "Freelancers and IT professionals",
        body: "Stable SLT Mobitel fiber WiFi and a backup generator mean client calls don't drop during power cuts.",
      },
      {
        heading: "Small teams meeting clients",
        body: "Private 4- and 5-seater meeting rooms for interviews, client meetings and workshops, bookable online with instant confirmation.",
      },
    ],
    faqs: [
      {
        question: "Is there a coworking space in Kottawa?",
        answer:
          "Yes — Cowork.lk is a dedicated coworking space at 349/A/3 Avissawella Road, Pannipitiya — about 5 minutes' drive from Kottawa town. It offers hot desks, workspace seats and private meeting rooms, all bookable online.",
      },
      {
        question: "How much does a hot desk near Kottawa cost?",
        answer:
          "A hot desk at Cowork.lk starts at LKR 490 for a half day. Full-day and unlimited-day options are also available, and WiFi, coffee and tea are included in the price.",
      },
      {
        question: "Can I rent a meeting room near Kottawa for a few hours?",
        answer:
          "Yes. Cowork.lk's private 4-seater and 5-seater meeting rooms can be booked for a half day, full day or unlimited day access, starting from LKR 3,450. The Lobby Area can also be booked in short blocks for small groups.",
      },
      {
        question: "Does the coworking space near Kottawa have backup power?",
        answer:
          "Yes. Cowork.lk runs a backup power generator, so work continues during power cuts and grid outages.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "coworking-space-pannipitiya",
    place: "Pannipitiya",
    title: "Coworking Space in Pannipitiya | Desks & Meeting Rooms | Cowork.lk",
    description:
      "Cowork.lk is a coworking space in Pannipitiya at 349/A/3 Avissawella Road. Hot desks from LKR 490, workspace seats, private meeting rooms, fiber WiFi. Open daily 8am–8pm.",
    eyebrow: "Coworking in Pannipitiya",
    h1: "Coworking Space in Pannipitiya",
    answer:
      "Cowork.lk is a coworking space in Pannipitiya, Sri Lanka, located on the 2nd floor of the Active Plus Building at 349/A/3 Avissawella Road. It rents hot desks from LKR 490, workspace seats and private meeting rooms by the half-day or day, with fiber WiFi, backup power and free coffee, open 8 AM to 8 PM every day.",
    gettingHereHeading: "Where we are in Pannipitiya",
    gettingHere: [
      "Address: 2nd Floor, Active Plus Building, 349/A/3 Avissawella Road, Pannipitiya 10230, Western Province.",
      "About 5 minutes from Kottawa and 10 minutes from Maharagama by road.",
      "Roughly a 30-minute drive from Kadawatha via the expressway.",
      "Limited on-premise parking for members and guests.",
    ],
    whoFor: [
      {
        heading: "Professionals who live in Pannipitiya",
        body: "A quiet, air-conditioned desk close to home — book a half day when you need focus, a full day when you need the whole day.",
      },
      {
        heading: "Startups and small teams",
        body: "Use workspace seats for day-to-day work and book a private meeting room when clients visit.",
      },
      {
        heading: "Trainers and educators",
        body: "Meeting rooms and the Lobby Area work for training sessions, interviews and small workshops.",
      },
    ],
    faqs: [
      {
        question: "Where is the coworking space in Pannipitiya?",
        answer:
          "Cowork.lk is on the 2nd floor of the Active Plus Building at 349/A/3 Avissawella Road, Pannipitiya 10230, Sri Lanka — about 5 minutes from Kottawa and 10 minutes from Maharagama.",
      },
      {
        question: "What are the opening hours of Cowork.lk in Pannipitiya?",
        answer:
          "Cowork.lk is open every day, Monday to Sunday, from 8:00 AM to 8:00 PM. It is not a 24/7 space.",
      },
      {
        question: "Can I book a desk in Pannipitiya for just one day?",
        answer:
          "Yes. Every space at Cowork.lk can be booked for a half day, full day or unlimited day access with no lease or membership contract. Guest checkout is available, so you don't need an account.",
      },
      {
        question: "What amenities does the Pannipitiya coworking space include?",
        answer:
          "Every booking includes SLT Mobitel fiber WiFi, air conditioning, unlimited Nescafé coffee and Nest tea, lounge access, backup power and a foosball table. Extras like monitors and projectors can be added at checkout.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "coworking-space-sri-lanka",
    place: "Sri Lanka",
    title: "Coworking Space in Sri Lanka (Colombo Suburbs) | Cowork.lk",
    description:
      "Cowork.lk is a coworking space in Sri Lanka's Colombo suburbs (Pannipitiya, near Kottawa and Maharagama). Day passes from LKR 490, meeting rooms, real-time online booking.",
    eyebrow: "Coworking in Sri Lanka",
    h1: "Coworking Space in Sri Lanka's Colombo Suburbs",
    answer:
      "Cowork.lk is a coworking space in Sri Lanka run by Cowork Lanka (Pvt) Ltd, located in Pannipitiya in the Colombo suburbs, near Kottawa and Maharagama. It offers hot desks from LKR 490, workspace seats and private meeting rooms by the half-day or day, with real-time online booking and no long-term lease.",
    gettingHereHeading: "Where Cowork.lk is in Sri Lanka",
    gettingHere: [
      "Cowork.lk has one location: 349/A/3 Avissawella Road, Pannipitiya 10230, in Colombo District, Western Province.",
      "It serves the south-eastern Colombo suburbs — Kottawa (5 minutes), Maharagama (10 minutes) and nearby towns along Avissawella Road.",
      "Kadawatha is about 30 minutes away via the expressway, making it practical for people from the north of Colombo too.",
      "Book online in Sri Lankan rupees (LKR), pay by card, or pay by bank/QR transfer.",
    ],
    whoFor: [
      {
        heading: "Sri Lankan freelancers and remote workers",
        body: "Cowork.lk was founded by freelancers and remote developers from the Online Entrepreneurs Club, for people who export IT and creative services from Sri Lanka.",
      },
      {
        heading: "Digital nomads and visitors",
        body: "Book by the day with no contract, pay by card online, and get fiber WiFi and backup power for calls with overseas clients.",
      },
      {
        heading: "Companies needing a suburban base",
        body: "Teams based outside central Colombo can use workspace seats and meeting rooms instead of leasing an office.",
      },
    ],
    faqs: [
      {
        question: "How much does coworking cost in Sri Lanka?",
        answer:
          "At Cowork.lk, coworking starts at LKR 490 for a half-day hot desk. Workspace seats start at LKR 790 and private meeting rooms from LKR 3,450 for a half day. WiFi, coffee and tea are included.",
      },
      {
        question: "Is Cowork.lk in Colombo?",
        answer:
          "Cowork.lk is in Pannipitiya, a suburb in Colombo District, about 5 minutes from Kottawa and 10 minutes from Maharagama. It is not in central Colombo, which means easier parking and no city-centre traffic.",
      },
      {
        question: "Can foreigners and digital nomads use Cowork.lk?",
        answer:
          "Yes. Anyone can book a desk or meeting room online with guest checkout and pay by card. There is no membership contract or minimum stay.",
      },
      {
        question: "Does Cowork.lk have reliable internet and power?",
        answer:
          "Yes. Cowork.lk uses SLT Mobitel fiber WiFi and runs a backup power generator, so work continues during power cuts.",
      },
    ],
    updated: UPDATED,
  },
];

export function getLocationPage(slug: string) {
  const page = LOCATION_PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown location page: ${slug}`);
  return page;
}
