// COPY DECK — verbatim. Do not author new user-facing strings here.
// Anything missing renders via NEED() and is listed in the build report.
export const NEED = (purpose: string) => `[COPY NEEDED: ${purpose}]`;

export const COPY = {
  home: {
    name: 'Orbit & Wonder',
    tagline: 'Stardust Theory',
    headline: 'Gifts for the people who are impossible to shop for.',
    subhead: "Tell us what they love. Tell us what they'd never be caught dead with. We'll find what fits.",
    button: 'Start with one person',
    small: 'No account. Everything stays on this device.',
  },
  who: {
    title: "Who's the lucky planet?",
    nameLabel: 'Name or nickname',
    namePh: 'Mom, Bestie, the coworker who has everything',
    relLabel: 'Who are they to you?',
    rels: ['Friend', 'Partner', 'Family', 'Coworker', 'Secret Santa match', "It's complicated"],
    occLabel: "What's the occasion?",
    occs: ['Birthday', 'Holiday', 'Secret Santa', 'Thank you', 'Just because', 'I owe them one'],
    budgetLabel: "What's the damage?",
    budgetHelper: "A range is fine. We won't judge. Much.",
    next: 'Next: what they love',
  },
  love: {
    title: 'What do they love?',
    helper:
      'Bands, snacks, shows, characters, the weird specific thing they won\'t shut up about. Specific beats general: a band\'s name beats "music."',
    ph: 'Type a thing, hit enter',
    match: (m: string) => `Did you mean ${m}?`,
    yes: 'Yep',
    nope: 'Nope, the other one',
    noMatch: "Couldn't place that one. It stays on the list anyway.",
    next: "Next: the hard no's",
  },
  refuse: {
    title: "What's a hard no?",
    helper: "Colours, brands, materials, whole categories. If it's on this list, it's not getting through. Ever.",
    ph: 'Nothing pink. No candles. No "Live Laugh Love."',
    ownLabel: 'Already has',
    ownPh: 'A label maker. Several.',
    next: 'Find gifts',
  },
  loading: { l1: 'Mapping their constellation...', l2: 'Checking every idea against the no list.' },
  results: {
    heading: 'Six ideas. All of them passed the no list.',
    subhead: 'Keep the good ones. Toss the rest into space.',
    price: (p: string) => `Around ${p}`,
    where: (w: string) => `Look for it at ${w}`,
    because: (l: string) => `Because they love ${l}`,
    checked: (r: string) => `Checked against: ${r}`,
    keep: 'Keep it',
    notThis: 'Not this',
    more: 'More like this',
    prompt: "What's wrong with it?",
    reasons: ['Too generic', 'They already have it', 'Breaks a rule', 'Not their vibe', 'Over budget'],
    asteroid: 'Filtered out. It broke a rule.',
    satellite: 'Sent into orbit. Bye.',
    moreLoading: 'Finding more in that corner of the sky...',
  },
  saved: {
    title: 'Keepers',
    empty: 'Nothing saved yet. The good ones land here.',
    copy: 'Copy list',
    copied: "Copied. Paste it wherever you're plotting.",
    delPrompt: 'Remove this one?',
    remove: 'Remove',
    keep: 'Keep it',
    another: 'Shop for someone else',
  },
  errors: {
    none: 'The no list won this round. Loosen one rule or add another love, then try again.',
    backup: 'Running on backup stardust. Ideas still pass the no list.',
    offline: 'Lost the signal. Check your connection and try again.',
    storage: "This browser won't let us save. Copy your list before you close the page.",
    broke: "That wasn't supposed to happen. Try again.",
  },
  share: {
    question: 'What are we doing today?',
    options: [
      { id: 'hint', title: 'Drop a hint', desc: "Post it. Someone's paying attention." },
      { id: 'list', title: 'Send my list', desc: 'For the person who actually asked.' },
      { id: 'ask', title: 'Ask for hints', desc: "You're stumped. Admit it. Send them the card." },
    ] as const,
    previewHelper: 'Tap anything to take it off before it goes out. Your saved list stays the same.',
    nameLabel: 'Name on the card',
    nameHelper: "A nickname is fine. Strangers will see this.",
    budgetToggle: 'Show my budget',
    budgetLocked: 'Budget stays off public posts.',
    neutral: 'Switched to the neutral version so the card follows the no list too.',
    share: 'Share',
    download: 'Download PNG',
    blank: 'Download blank card',
    saved: 'Saved to your phone.',
    portrait: 'Portrait',
    square: 'Square',
  },
  opening: {
    santa_list: "Dear Secret Santa, here's your cheat sheet.",
    wish_hint: 'Just putting this out into the universe...',
    wish_list: 'Since you asked what I want...',
    tot_hint: 'A public service announcement about my very specific taste.',
    tot_list: 'So you can stop guessing.',
    stumped:
      "I want to get you something you'll actually love. Tell me what you love, what you absolutely don't want, and what you already own. Then send your answers back to me!",
  } as Record<string, string>,
  footer: (name: string, url: string) => `Made with ${name} · ${url}`,
  complete: {
    title: 'Somebody wants to get you something good.',
    intro: 'Fill this in, then send it back to them. No account, nothing saved anywhere.',
    make: 'Make my card',
    done: 'Done. Now send it back before they buy you a candle.',
    shareBack: 'Share it back',
    download: 'Download PNG',
  },
  settings: {
    motion: 'Calm the stars (reduce motion)',
    fine: 'Ideas, not endorsements. Prices are ballpark. Nothing here is sponsored.',
    privacy: 'Everything stays on this device. No account, no tracking.',
  },
};

// Template names and on-card titles/labels, verbatim from the spec.
export const TEMPLATE_NAMES = {
  santa: 'Secret Santa',
  wish: 'All I Want for Christmas',
  stumped: "Give Me a Hint / I'm Stumped",
  tot: "This or That: These are (and aren't) my Favorite Things",
} as const;

export const CARD_TEXT = {
  santa: {
    title: 'Dear Secret Santa...',
    loves: "Three things I'd love",
    nos: "Three things I'd rather not receive",
    budget: 'My gift budget',
  },
  wish: { title: 'All I Want for Christmas...', subtitle: 'A few extremely helpful hints.', because: 'Because...' },
  stumped: {
    title: "HELP. I'M STUMPED.",
    subtitle: "I want to get you something you'll actually love.",
    love: 'Things I love',
    no: 'Absolutely not',
    own: 'Things I already own',
    hint: 'One little hint',
  },
  tot: { title: 'This or That?', subtitle: "My favorites. My hard no's.", yes: 'YES, PLEASE', no: 'NO, THANK YOU' },
};
