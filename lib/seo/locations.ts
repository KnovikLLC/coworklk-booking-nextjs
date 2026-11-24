import { FROM_PRICES, lkr } from "@/lib/seo/business";

// Location landing pages for local-intent queries ("coworking space Kottawa",
// "coworking Pannipitiya", "coworking space Sri Lanka").
//
// Every fact here must be true of the one real location at 349/A/3
// Avissawella Road, Kottawa, Pannipitiya. The drive times (5 min Kottawa town, 10 min
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
    title: `Coworking Space in Kottawa | Hot Desks from ${lkr(FROM_PRICES.hotDesk)} | Cowork.lk`,
    description:
      `Coworking space in Kottawa on Avissawella Road, Pannipitiya. Hot desks from ${lkr(FROM_PRICES.hotDesk)}, meeting rooms, 1 Gbps fiber + Starlink, backup power.`,
    eyebrow: "Coworking in Kottawa",
    h1: "Coworking Space in Kottawa",
    answer:
      `Cowork.lk is a dedicated coworking space in Kottawa, at 349/A/3 Avissawella Road, Kottawa, Pannipitiya 10230 — about 5 minutes from Kottawa town. It offers hot desks from ${lkr(FROM_PRICES.hotDesk)}, workspace seats, and private 4- and 5-seater meeting rooms, with 1 Gbps SLT fiber plus Starlink internet, backup power, free coffee and online booking, open daily 8 AM to 9 PM.`,
    gettingHereHeading: "Finding Cowork.lk in Kottawa",
    gettingHere: [
      "Landmarks: we're opposite Anura Tyres Kottawa near Mahalwarawa Junction, 20 m from Red Bell Kottawa, and 100 m from Taco Bell and Lyceum School Kottawa.",
      "Cowork.lk is on Avissawella Road (the High Level Road) in Kottawa, Pannipitiya — about 5 minutes by car or tuk-tuk from Kottawa town, heading towards Maharagama.",
      "We're on the 2nd floor of the Active Plus Building, 349/A/3 Avissawella Road, Kottawa, Pannipitiya 10230.",
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
        body: "A 1 Gbps SLT fiber line, a separate Starlink connection and a backup generator mean client calls don't drop when one line or the power goes out.",
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
          "Yes. Cowork.lk is a dedicated coworking space at 349/A/3 Avissawella Road, Kottawa, Pannipitiya 10230, about 5 minutes from Kottawa town, opposite Anura Tyres Kottawa near Mahalwarawa Junction, 20 m from Red Bell Kottawa and 100 m from Taco Bell and Lyceum School Kottawa. It offers hot desks, workspace seats and private meeting rooms, all bookable online.",
      },
      {
        question: "How much does a hot desk in Kottawa cost?",
        answer:
          `A hot desk at Cowork.lk starts at ${lkr(FROM_PRICES.hotDesk)} for a half day. Full-day, evening (5–9 PM) and unlimited-day options are also available, and WiFi, coffee and tea are included in the price.`,
      },
      {
        question: "Can I rent a meeting room in Kottawa for a few hours?",
        answer:
          `Yes. Cowork.lk's private 4-seater and 5-seater meeting rooms can be booked for a half day, full day, evening or unlimited day access, starting from ${lkr(FROM_PRICES.meetingRoom4)}. For groups of up to 10, the Lobby Area can be booked by the hour from ${lkr(FROM_PRICES.lobbyHour)}.`,
      },
      {
        question: "Does the coworking space in Kottawa have backup power?",
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
      `Cowork.lk is a coworking space in Pannipitiya at 349/A/3 Avissawella Road. Hot desks from ${lkr(FROM_PRICES.hotDesk)}, workspace seats, meeting rooms, 1 Gbps fiber + Starlink. Open daily 8am–9pm.`,
    eyebrow: "Coworking in Pannipitiya",
    h1: "Coworking Space in Pannipitiya",
    answer:
      `Cowork.lk is a coworking space in Pannipitiya, Sri Lanka, located on the 2nd floor of the Active Plus Building at 349/A/3 Avissawella Road. It rents hot desks from ${lkr(FROM_PRICES.hotDesk)}, workspace seats and private meeting rooms by the half-day or day, with 1 Gbps SLT fiber plus Starlink internet, backup power and free coffee, open 8 AM to 9 PM every day.`,
    gettingHereHeading: "Where we are in Pannipitiya",
    gettingHere: [
      "Address: 2nd Floor, Active Plus Building, 349/A/3 Avissawella Road, Kottawa, Pannipitiya 10230, Western Province.",
      "Opposite Anura Tyres Kottawa, near Mahalwarawa Junction; 20 m from Red Bell Kottawa, and 100 m from Taco Bell and Lyceum School Kottawa.",
      "About 5 minutes from Kottawa town and 10 minutes from Maharagama by road.",
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
          "Cowork.lk is on the 2nd floor of the Active Plus Building at 349/A/3 Avissawella Road, Kottawa, Pannipitiya 10230, Sri Lanka — opposite Anura Tyres Kottawa near Mahalwarawa Junction, 20 m from Red Bell Kottawa, 100 m from Taco Bell and Lyceum School Kottawa, about 5 minutes from Kottawa town and 10 minutes from Maharagama.",
      },
      {
        question: "What are the opening hours of Cowork.lk in Pannipitiya?",
        answer:
          "Cowork.lk is open every day, Monday to Sunday, from 8:00 AM to 9:00 PM, with day bookings from 8 AM and evening bookings from 5 PM to 9 PM. It is not a 24/7 space.",
      },
      {
        question: "Can I book a desk in Pannipitiya for just one day?",
        answer:
          "Yes. Every space at Cowork.lk can be booked for a half day, full day, evening (5–9 PM) or unlimited day access with no lease or membership contract. Guest checkout is available, so you don't need an account.",
      },
      {
        question: "What amenities does the Pannipitiya coworking space include?",
        answer:
          "Every booking includes WiFi on a 1 Gbps SLT fiber line with Starlink as a second connection, air conditioning, unlimited Nescafé coffee and Nest tea, lounge access, backup power and a foosball table. Extras like monitors and projectors can be added at checkout.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "coworking-space-sri-lanka",
    place: "Sri Lanka",
    title: "Coworking Space in Sri Lanka (Colombo Suburbs) | Cowork.lk",
    description:
      `Cowork.lk is a coworking space in Sri Lanka's Colombo suburbs (Kottawa, Pannipitiya, near Maharagama). Day passes from ${lkr(FROM_PRICES.hotDesk)}, meeting rooms, real-time online booking.`,
    eyebrow: "Coworking in Sri Lanka",
    h1: "Coworking Space in Sri Lanka's Colombo Suburbs",
    answer:
      `Cowork.lk is a coworking space in Sri Lanka run by Cowork Lanka (Pvt) Ltd, located in Kottawa, Pannipitiya in the Colombo suburbs, near Maharagama. It offers hot desks from ${lkr(FROM_PRICES.hotDesk)}, workspace seats and private meeting rooms by the half-day or day, with real-time online booking and no long-term lease.`,
    gettingHereHeading: "Where Cowork.lk is in Sri Lanka",
    gettingHere: [
      "Cowork.lk has one location: 349/A/3 Avissawella Road, Kottawa, Pannipitiya 10230, in Colombo District, Western Province.",
      "It serves the south-eastern Colombo suburbs — Kottawa town (5 minutes), Maharagama (10 minutes) and nearby towns along Avissawella Road.",
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
        body: "Book by the day with no contract, pay by card online, and get 1 Gbps fiber, a Starlink backup line and generator power for calls with overseas clients.",
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
          `At Cowork.lk, coworking starts at ${lkr(FROM_PRICES.hotDesk)} for a half-day hot desk. Workspace seats start at ${lkr(FROM_PRICES.workspace)} and private meeting rooms from ${lkr(FROM_PRICES.meetingRoom4)} for a half day. WiFi, coffee and tea are included.`,
      },
      {
        question: "Is Cowork.lk in Colombo?",
        answer:
          "Cowork.lk is in Pannipitiya, a suburb in Colombo District, about 5 minutes from Kottawa town and 10 minutes from Maharagama. It is not in central Colombo, which means easier parking and no city-centre traffic.",
      },
      {
        question: "Can foreigners and digital nomads use Cowork.lk?",
        answer:
          "Yes. Anyone can book a desk or meeting room online with guest checkout and pay by card. There is no membership contract or minimum stay.",
      },
      {
        question: "Does Cowork.lk have reliable internet and power?",
        answer:
          "Yes. Cowork.lk has two independent internet connections — a 1 Gbps SLT Fiber line and Starlink satellite — and a backup power generator, so work continues during line faults and power cuts.",
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
