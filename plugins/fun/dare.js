/**
 * AstraX - plugins/commands/fun/dare.js
 * Dare Command - Get random dare challenges
 * Category: fun
 */

export default {
  name: 'dare',
  alias: ['dareq', 'd'],
  desc: 'Get a random dare challenge to complete',
  category: 'fun',
  usage: 'dare',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── 100 DARE CHALLENGES ──────────────────────────────
      const dares = [
        'Send a voice note singing your favorite song 🎤',
        'Change your profile pic to a funny meme for 1 hour 😂',
        'Text your crush "I like you" 💘',
        'Do 10 pushups right now 💪',
        'Send the last photo in your gallery 📸',
        'Call someone and sing Happy Birthday 🎂',
        'Post "I love AstraX" as your status 📱',
        'Send a selfie making a funny face 🤪',
        'Text your ex "I miss you" 😳',
        'Do your best dance move on video 💃',
        'Change your name to "I am cute" for 10 mins 😊',
        'Send a screenshot of your search history 🔍',
        'Call your mom and say "I love you" 📞',
        'Eat a spoon of hot sauce 🌶️',
        'Send your most embarrassing photo 📷',
        'Do an impression of someone in the group 🎭',
        'Text your boss "I quit" then say jk 😅',
        'Balance a book on your head for 1 minute 📚',
        'Send a voice note barking like a dog 🐕',
        'Post a selfie without filter 📷',
        'Call a random contact and sing 🎵',
        'Do 20 jumping jacks now 🤸',
        'Send your most used emoji 50 times 😂',
        'Text "I need money" to your dad 💰',
        'Make a TikTok dance video 💃',
        'Send a pic of your feet 🦶',
        'Call your best friend and confess love 💖',
        'Eat a raw onion 🧅',
        'Send your battery percentage 🔋',
        'Do your best celebrity impression 🌟',
        'Text your teacher "You are cool" 👩‍🏫',
        'Send a voice note laughing for 10s 😂',
        'Post "Single and ready" as status 💔',
        'Do plank for 30 seconds 💪',
        'Send your lock screen screenshot 📱',
        'Call someone and meow like a cat 🐱',
        'Eat ice cream with hot sauce 🍦',
        'Send your worst selfie ever 🤳',
        'Text "I am pregnant" to your mom 🤰',
        'Do your best evil laugh 😈',
        'Send a pic of your ceiling 📸',
        'Call your sibling and say sorry 📞',
        'Dance without music for 30s 💃',
        'Send your most recent meme 😂',
        'Text "Marry me" to someone random 💍',
        'Do 15 squats right now 🏋️',
        'Send a voice note whispering 🤫',
        'Post "I am the best" as status 🏆',
        'Eat lemon with the peel 🍋',
        'Send a pic of your shoes 👟',
        'Call someone and rap for 20s 🎤',
        'Do your best robot dance 🤖',
        'Send your alarm time screenshot ⏰',
        'Text "I lost my phone" to parents 📱',
        'Drink water upside down 💧',
        'Send a selfie with tongue out 😛',
        'Call your crush and hang up 📞',
        'Do wall sit for 30 seconds 🧱',
        'Send your last Google search 🔍',
        'Text "I am famous" to a friend 🌟',
        'Make a weird face and send pic 😜',
        'Call someone and count to 50 📞',
        'Eat a spoon of mustard 🌭',
        'Send your home screen screenshot 📱',
        'Do your best animal sound 🦁',
        'Text "I won lottery" to family 💰',
        'Spin around 10 times then walk 🌀',
        'Send a pic of your hand ✋',
        'Call and sing ABC song 🎵',
        'Do 10 burpees now 🤸',
        'Send your last WhatsApp sticker 😂',
        'Text "I am moving away" to bestie 😢',
        'Make a funny video filter 🤡',
        'Send a pic of your water bottle 💧',
        'Call someone and say nothing 🤐',
        'Eat cereal with water instead of milk 🥣',
        'Send your keyboard screenshot ⌨️',
        'Do your best cry face 😭',
        'Text "I failed exam" to parents 📝',
        'Hop on one foot for 30s 🦵',
        'Send a pic of your charger 🔌',
        'Call and speak in accent for 30s 🗣️',
        'Do 25 sit ups now 💪',
        'Send your most recent emoji 🤔',
        'Text "I am sick" to your boss 🤒',
        'Make a scary face selfie 😱',
        'Send a pic of your window view 🪟',
        'Call someone and yawn loudly 😴',
        'Eat ketchup straight 🍅',
        'Send your notification screenshot 📱',
        'Do your best superhero pose 🦸',
        'Text "I love you" to 3rd contact 💖',
        'Try to lick your elbow 👅',
        'Send a pic of your socks 🧦',
        'Call and say tongue twister fast 👅',
        'Do shadow boxing for 20s 🥊',
        'Send your calculator screenshot 🧮',
        'Text "I am bored" to everyone 💤',
        'Make a duck face selfie 🦆',
        'Send a pic of your door 🚪',
        'Call someone and breathe heavily 😮‍💨',
        'Try to touch your nose with tongue 👃'
      ]

      // ─── GET RANDOM DARE ──────────────────────────────────
      const randomDare = dares[Math.floor(Math.random() * dares.length)]
      const userName = sender.split('@')[0]

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 DARE 〕─────┈⊷
│ ◦➛ Player: @${userName}
├─────────────────────────⊷
│ ◦➛ ${randomDare}
├─────────────────────────⊷
│ ◦➛ Complete it or chicken out! 🐔
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: [sender],
        contextInfo
      }, { quoted: m })

      logger.success('DARE', `Sent dare to ${userName}`)

    } catch (e) {
      logger.error('DARE', 'Dare command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to get dare
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}