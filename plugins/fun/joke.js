/**
 * AstraX - plugins/commands/fun/joke.js
 * Joke Command - Get random funny jokes
 * Category: fun
 */

export default {
  name: 'joke',
  alias: ['jokes', 'funny', 'lol'],
  desc: 'Get a random funny joke',
  category: 'fun',
  usage: 'joke',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── 100 FUNNY JOKES ──────────────────────────────────
      const jokes = [
        'Why dont scientists trust atoms? Because they make up everything! 😂',
        'What do you call a fake noodle? An impasta! 🍝',
        'Why did the scarecrow win an award? He was outstanding in his field! 🌾',
        'What do you call a bear with no teeth? A gummy bear! 🐻',
        'Why dont eggs tell jokes? They would crack each other up! 🥚',
        'What do you call a sleeping bull? A bulldozer! 🐂',
        'Why did the math book look sad? Too many problems! 📚',
        'What do you call a fish wearing a crown? A king fish! 👑',
        'Why cant your nose be 12 inches long? Because then it would be a foot! 👃',
        'What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks! 🦖',
        'Why did the coffee file a police report? It got mugged! ☕',
        'What do you call a can opener that doesnt work? A cant opener! 🥫',
        'Why did the golfer bring two pairs of pants? In case he got a hole in one! ⛳',
        'What do you call a pig that does karate? A pork chop! 🐷',
        'Why dont skeletons fight each other? They dont have the guts! 💀',
        'What do you call a boomerang that wont come back? A stick! 🪃',
        'Why did the tomato turn red? Because it saw the salad dressing! 🍅',
        'What do you call a snowman with a six-pack? An abdominal snowman! ⛄',
        'Why dont oysters donate to charity? Because they are shellfish! 🦪',
        'What do you call a factory that makes okay products? A satisfactory! 🏭',
        'Why did the bicycle fall over? Because it was two tired! 🚲',
        'What do you call a lazy kangaroo? A pouch potato! 🦘',
        'Why did the cookie go to the hospital? Because it felt crumbly! 🍪',
        'What do you call a dog magician? A labracadabrador! 🐕',
        'Why dont calendars work? Because their days are numbered! 📅',
        'What do you call a pile of cats? A meowtain! 🐱',
        'Why did the chicken join a band? Because it had the drumsticks! 🐔',
        'What do you call a fish with no eyes? Fsh! 🐟',
        'Why did the stadium get hot? All the fans left! 🏟️',
        'What do you call a duck that gets all A grades? A wise quacker! 🦆',
        'Why dont programmers like nature? It has too many bugs! 🐛',
        'What do you call a bear with no ears? B! 🐻',
        'Why did the banana go to the doctor? It wasnt peeling well! 🍌',
        'What do you call a cow with no legs? Ground beef! 🐄',
        'Why did the invisible man turn down the job? He couldnt see himself doing it! 👻',
        'What do you call a belt made of watches? A waist of time! ⌚',
        'Why did the picture go to jail? Because it was framed! 🖼️',
        'What do you call a sad strawberry? A blueberry! 🍓',
        'Why did the mushroom go to the party? Because he was a fungi! 🍄',
        'What do you call a dog that can do magic? A labracadabrador! 🐕‍🦺',
        'Why did the computer go to the doctor? It had a virus! 💻',
        'What do you call a sleeping pizza? A piZZZZa! 🍕',
        'Why dont eggs tell each other secrets? They might crack up! 🥚',
        'What do you call a fish that wears a bowtie? Sofishticated! 🐠',
        'Why did the golfer wear two pairs of socks? In case he got a hole in one! 🧦',
        'What do you call a cow in an earthquake? A milkshake! 🥤',
        'Why did the cookie cry? Because its mom was a wafer so long! 🍪',
        'What do you call a deer with no eyes? No eye deer! 🦌',
        'Why did the orange stop? It ran out of juice! 🍊',
        'What do you call a group of musical whales? An orca-stra! 🐋',
        'Why did the teddy bear say no to dessert? Because it was stuffed! 🧸',
        'What do you call a dinosaur with an extensive vocabulary? A thesaurus! 📖',
        'Why did the scarecrow become a successful neurosurgeon? He was outstanding in his field! 🌾',
        'What do you call a cat that lives in an igloo? An eskimew! 🐱',
        'Why did the man put his money in the freezer? He wanted cold hard cash! 💰',
        'What do you call a dog that can tell time? A watch dog! ⌚',
        'Why did the belt get arrested? For holding up pants! 👖',
        'What do you call a fly without wings? A walk! 🪰',
        'Why did the barber win the race? He took a shortcut! ✂️',
        'What do you call a horse that lives next door? A neighbor! 🐴',
        'Why did the cookie go to school? To get a little smarter! 🍪',
        'What do you call a rabbit with fleas? Bugs Bunny! 🐰',
        'Why did the elephant paint himself different colors? To hide in the crayon box! 🐘',
        'What do you call a sleeping wolf? An unaware-wolf! 🐺',
        'Why did the kid bring a ladder to school? To go to high school! 🪜',
        'What do you call a bear with a sore throat? A gummy bear! 🐻',
        'Why did the man throw butter out the window? To see butter fly! 🦋',
        'What do you call a shoe made of banana peels? A slipper! 🍌',
        'Why did the student eat his homework? The teacher said it was a piece of cake! 🍰',
        'What do you call a snake that works for the government? A civil serpent! 🐍',
        'Why did the skeleton go to the party alone? He had no body to go with! 💀',
        'What do you call a fish that needs help with vocals? Auto-tuna! 🎤',
        'Why did the man run around his bed? To catch up on sleep! 😴',
        'What do you call a penguin in the desert? Lost! 🐧',
        'Why did the computer keep sneezing? It had a virus! 🤧',
        'What do you call a monkey that loves chips? A chipmunk! 🐿️',
        'Why did the baseball team hire a baker? They needed a better batter! ⚾',
        'What do you call a cow that plays an instrument? A moosician! 🐄',
        'Why did the tree go to the dentist? It needed a root canal! 🌳',
        'What do you call a sheep with no legs? A cloud! ☁️',
        'Why did the tomato blush? It saw the salad dressing! 🥗',
        'What do you call a ghost with a broken leg? A hoblin goblin! 👻',
        'Why did the math teacher break up with the calculator? She felt he was too calculating! 🔢',
        'What do you call a dog that loves bubble baths? A shampoodle! 🐩',
        'Why did the cookie go to the doctor? It was feeling crummy! 🍪',
        'What do you call a frog that illegally parked? Toad! 🐸',
        'Why did the gym close down? It just didnt work out! 🏋️',
        'What do you call a train carrying bubblegum? A chew-chew train! 🚂',
        'Why did the man put his radio in the fridge? He wanted cool music! 🎵',
        'What do you call a camel with no humps? Humphrey! 🐪',
        'Why did the broom get a poor grade? It was always sweeping during class! 🧹',
        'What do you call a priest that becomes a lawyer? A father-in-law! ⚖️',
        'Why did the boy bring string to school? To tie up loose ends! 🧵',
        'What do you call a group of unorganized cats? A cat-astrophe! 🐈',
        'Why did the man stare at the orange juice? It said concentrate! 🍊',
        'What do you call a bee that cant make up its mind? A maybe! 🐝',
        'Why did the woman put her cake in the freezer? She wanted ice cake! 🎂',
        'What do you call a duck that steals? A robber ducky! 🦆',
        'Why did the golfer wear two pairs of trousers? In case he got a hole in one! 👖',
        'What do you call a dog that tells time? A watchdog! ⏰',
        'Why did the chicken cross the playground? To get to the other slide! 🐔',
        'What do you call a fish magician? A magic carp! 🎩',
        'Why did the melon jump into the lake? It wanted to be a watermelon! 🍉'
      ]

      // ─── GET RANDOM JOKE ──────────────────────────────────
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)]

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 JOKE 〕─────┈⊷
│ ◦➛ ${randomJoke}
├─────────────────────────⊷
│ ◦➛ Hope you laughed! 😂
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('JOKE', `Sent joke to ${sender.split('@')[0]}`)

    } catch (e) {
      logger.error('JOKE', 'Joke command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to get joke
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}