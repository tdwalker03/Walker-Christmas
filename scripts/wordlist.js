// Words for the family's passphrases.
//
// Chosen to be short, common, concrete and easy to remember - the kind of word
// a grandparent can read off a text message and type without squinting. No
// tricky spellings, no double letters that invite typos.
//
// This list is small on purpose. It is NOT trying to be hard to guess; see the
// security note in the README.

export const WORDS = [
  // christmas
  'angel', 'bell', 'candle', 'candy', 'carol', 'cocoa', 'cookie', 'elf',
  'frost', 'gift', 'holly', 'icicle', 'mitten', 'pine', 'present', 'reindeer',
  'ribbon', 'robin', 'scarf', 'sleigh', 'snow', 'snowman', 'star', 'stocking',
  'tinsel', 'toy', 'wreath',

  // animals
  'bear', 'bird', 'bunny', 'cat', 'deer', 'dog', 'duck', 'fish', 'fox', 'frog',
  'goat', 'goose', 'horse', 'kitten', 'lamb', 'mouse', 'owl', 'panda', 'penguin',
  'pony', 'puppy', 'rabbit', 'sheep', 'squirrel', 'tiger', 'turtle', 'whale',

  // food
  'apple', 'bacon', 'berry', 'bread', 'butter', 'cake', 'cherry', 'donut',
  'honey', 'jelly', 'lemon', 'muffin', 'noodle', 'orange', 'pancake', 'peach',
  'pickle', 'pizza', 'popcorn', 'potato', 'pretzel', 'pudding', 'pumpkin',
  'sugar', 'waffle',

  // outdoors
  'beach', 'cabin', 'cloud', 'farm', 'forest', 'garden', 'hill', 'island',
  'lake', 'meadow', 'mountain', 'ocean', 'rainbow', 'river', 'rock', 'sand',
  'sky', 'storm', 'sunset', 'thunder', 'tree', 'valley', 'waterfall',

  // things
  'anchor', 'balloon', 'banjo', 'basket', 'bicycle', 'blanket', 'boat', 'book',
  'bubble', 'button', 'camera', 'castle', 'clock', 'compass', 'crayon', 'drum',
  'feather', 'fiddle', 'guitar', 'hammer', 'kite', 'ladder', 'lantern', 'marble',
  'mirror', 'penny', 'piano', 'pillow', 'pocket', 'puzzle', 'rocket', 'saddle',
  'teapot', 'telescope', 'trumpet', 'umbrella', 'wagon', 'window',

  // colours and simple words
  'amber', 'copper', 'crimson', 'emerald', 'golden', 'ivory', 'silver', 'violet',
  'happy', 'jolly', 'lucky', 'merry', 'sunny',
];

// A duplicate would silently shrink the keyspace, so fail loudly instead.
const unique = new Set(WORDS);
if (unique.size !== WORDS.length) {
  const seen = new Set();
  const dupes = WORDS.filter((w) => (seen.has(w) ? true : (seen.add(w), false)));
  throw new Error(`wordlist.js contains duplicates: ${[...new Set(dupes)].join(', ')}`);
}
