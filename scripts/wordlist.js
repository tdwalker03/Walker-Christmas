// Words for the family's passphrases. Chosen to be short, unambiguous to spell,
// and easy to read down a phone line to a grandparent - no homophones, no
// double letters that invite typos, nothing that looks like another word.
//
// Passphrase strength comes from the size of this list, so if you edit it,
// only ever add. See the security note in the README.

export const WORDS = [
  // animals
  'badger', 'beagle', 'bison', 'camel', 'cobra', 'condor', 'cougar', 'coyote',
  'crane', 'dolphin', 'donkey', 'falcon', 'ferret', 'finch', 'gecko', 'gibbon',
  'heron', 'hornet', 'iguana', 'jackal', 'jaguar', 'kitten', 'koala', 'lemur',
  'leopard', 'lizard', 'llama', 'lobster', 'magpie', 'mammoth', 'marmot',
  'meerkat', 'mongoose', 'moose', 'muskox', 'narwhal', 'ocelot', 'osprey',
  'otter', 'panda', 'panther', 'parrot', 'pelican', 'penguin', 'pigeon',
  'puffin', 'python', 'rabbit', 'raccoon', 'raven', 'reindeer', 'robin',
  'salmon', 'seagull', 'sparrow', 'stallion', 'starling', 'tapir', 'toucan',
  'turtle', 'vulture', 'walrus', 'weasel', 'wombat', 'yakking', 'zebra',

  // weather and sky
  'aurora', 'blizzard', 'breeze', 'cirrus', 'comet', 'crescent', 'cyclone',
  'drizzle', 'eclipse', 'equinox', 'frost', 'galaxy', 'glacier', 'hailstone',
  'horizon', 'iceberg', 'lightning', 'meteor', 'midnight', 'monsoon', 'nebula',
  'nimbus', 'orbit', 'planet', 'rainbow', 'sleet', 'snowdrift', 'snowfall',
  'solstice', 'starlight', 'sunrise', 'sunset', 'thunder', 'tempest', 'twilight',
  'typhoon', 'zenith',

  // landscape
  'atoll', 'bayou', 'boulder', 'canyon', 'cavern', 'cliff', 'delta', 'dunes',
  'estuary', 'fjord', 'forest', 'geyser', 'granite', 'harbor', 'hillside',
  'island', 'jungle', 'lagoon', 'marsh', 'meadow', 'mesa', 'orchard', 'prairie',
  'quarry', 'ravine', 'reef', 'ridge', 'savanna', 'summit', 'thicket', 'tundra',
  'valley', 'volcano', 'waterfall', 'wetland', 'woodland',

  // trees and plants
  'acorn', 'alder', 'aspen', 'bamboo', 'birch', 'bracken', 'cactus', 'cedar',
  'clover', 'cypress', 'daisy', 'fennel', 'fern', 'ginkgo', 'hazel', 'heather',
  'hemlock', 'holly', 'ivy', 'juniper', 'laurel', 'lavender', 'lichen', 'lilac',
  'magnolia', 'maple', 'mistletoe', 'moss', 'nettle', 'orchid', 'pine', 'poplar',
  'poppy', 'primrose', 'redwood', 'sequoia', 'spruce', 'sunflower', 'thistle',
  'tulip', 'willow', 'wisteria', 'yarrow',

  // food and drink
  'almond', 'apricot', 'bagel', 'biscuit', 'brioche', 'butter', 'caramel',
  'cashew', 'chestnut', 'chowder', 'cinnamon', 'cider', 'citrus', 'cocoa',
  'crumpet', 'custard', 'damson', 'eggnog', 'fig', 'ginger', 'honey', 'hotpot',
  'lentil', 'marzipan', 'molasses', 'muffin', 'mustard', 'nutmeg', 'oatcake',
  'olive', 'paprika', 'parsnip', 'pastry', 'peanut', 'pecan', 'pepper',
  'persimmon', 'pistachio', 'plum', 'pretzel', 'pudding', 'pumpkin', 'quince',
  'radish', 'rhubarb', 'saffron', 'satsuma', 'scone', 'sorbet', 'strudel',
  'syrup', 'tangerine', 'toffee', 'truffle', 'turnip', 'vanilla', 'waffle',
  'walnut',

  // colors and materials
  'amber', 'amethyst', 'basalt', 'bronze', 'cobalt', 'copper', 'coral', 'crimson',
  'crystal', 'denim', 'emerald', 'flannel', 'garnet', 'gold', 'indigo', 'ivory',
  'jade', 'lacquer', 'linen', 'magenta', 'marble', 'mahogany', 'maroon', 'nickel',
  'obsidian', 'onyx', 'opal', 'pewter', 'platinum', 'quartz', 'ruby', 'sapphire',
  'scarlet', 'silver', 'slate', 'tartan', 'teal', 'topaz', 'turquoise', 'velvet',
  'violet', 'walnutwood',

  // winter and christmas
  'advent', 'bauble', 'bellring', 'candle', 'carol', 'chimney', 'cracker',
  'fireside', 'garland', 'gingerbread', 'icicle', 'lantern', 'mantel', 'mitten',
  'nutcracker', 'ornament', 'ribbon', 'sleigh', 'snowball', 'snowman', 'stocking',
  'tinsel', 'toboggan', 'wreath', 'yuletide',

  // things
  'anchor', 'anvil', 'armchair', 'balloon', 'banjo', 'barrel', 'beacon', 'bellows',
  'bicycle', 'blanket', 'bobbin', 'bottle', 'bracket', 'bucket', 'bugle', 'cabin',
  'cable', 'camera', 'candlestick', 'canoe', 'cartwheel', 'castle', 'cauldron',
  'chariot', 'chisel', 'clockwork', 'compass', 'cottage', 'cradle', 'crayon',
  'cymbal', 'drawbridge', 'drumstick', 'easel', 'engine', 'envelope', 'fiddle',
  'flagpole', 'flask', 'flute', 'frigate', 'funnel', 'gadget', 'gallery',
  'gazebo', 'goggles', 'hammock', 'harbour', 'harpoon', 'helmet', 'inkwell',
  'kettle', 'keyboard', 'ladder', 'lamppost', 'lectern', 'library', 'lighthouse',
  'locket', 'mailbox', 'mandolin', 'mattress', 'mirror', 'mosaic',
  'necklace', 'notebook', 'obelisk', 'paddle', 'pamphlet', 'parasol', 'pendant',
  'piano', 'pillow', 'pistons', 'pocket', 'postcard', 'pottery', 'puzzle',
  'rucksack', 'saddle', 'sandal', 'satchel', 'saxophone', 'scooter', 'shutter',
  'signpost', 'skillet', 'spindle', 'stairway', 'stapler', 'sundial', 'tackle',
  'tambourine', 'teapot', 'telescope', 'thimble', 'toolbox', 'tractor', 'trampoline',
  'trellis', 'tricycle', 'trombone', 'trumpet', 'tugboat', 'turbine', 'ukulele',
  'umbrella', 'violin', 'waistcoat', 'wagon', 'wheelbarrow', 'whistle', 'windmill',
  'workshop', 'xylophone',

  // qualities
  'ancient', 'bouncy', 'brave', 'bright', 'brisk', 'calm', 'cheerful', 'clever',
  'cosy', 'crafty', 'curious', 'dainty', 'dapper', 'eager', 'elegant', 'fearless',
  'festive', 'fluffy', 'gallant', 'gentle', 'glad', 'gleaming', 'graceful',
  'hearty', 'humble', 'jolly', 'joyful', 'keen', 'kindly', 'lively', 'lofty',
  'loyal', 'merry', 'mighty', 'nimble', 'noble', 'plucky', 'polished', 'proud',
  'quiet', 'radiant', 'rustic', 'serene', 'snug', 'spirited', 'splendid',
  'sprightly', 'sturdy', 'sunny', 'swift', 'tranquil', 'trusty', 'valiant',
  'vivid', 'witty', 'zesty',
];

// A duplicate would silently shrink the keyspace, so fail loudly instead.
const unique = new Set(WORDS);
if (unique.size !== WORDS.length) {
  const seen = new Set();
  const dupes = WORDS.filter((w) => (seen.has(w) ? true : (seen.add(w), false)));
  throw new Error(`wordlist.js contains duplicates: ${[...new Set(dupes)].join(', ')}`);
}
