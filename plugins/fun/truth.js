/**
 * AstraX - plugins/commands/fun/truth.js
 * Truth Command - Get random truth questions
 * Category: fun
 */

export default {
  name: 'truth',
  alias: ['truthq', 't'],
  desc: 'Get a random truth question to answer',
  category: 'fun',
  usage: 'truth',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── 100 TRUTH QUESTIONS ──────────────────────────────
      const truths = [
        'What is your biggest fear? 😱',
        'Who was your first crush? 💘',
        'What is your deepest secret? 🤫',
        'Have you ever lied to your best friend? 😬',
        'What is the most embarrassing thing you did? 😳',
        'Who do you secretly admire? 👀',
        'What is your worst habit? 😅',
        'Have you ever cheated in a game? 🎮',
        'What is your biggest regret? 😔',
        'Who was your last text to? 📱',
        'What is your hidden talent? 🎭',
        'Have you ever stolen something? 🫣',
        'What is your most expensive purchase? 💰',
        'Who is your celebrity crush? 🌟',
        'What is your biggest insecurity? 😟',
        'Have you ever been in love? 💖',
        'What is the meanest thing you said? 😈',
        'Who do you stalk on social media? 📱',
        'What is your guilty pleasure? 🍫',
        'Have you ever broken the law? 🚔',
        'What is your weirdest dream? 💭',
        'Who do you text the most? 💬',
        'What is your biggest turn off? 😒',
        'Have you ever been rejected? 💔',
        'What is your phone wallpaper? 📱',
        'Who is the last person you searched? 🔍',
        'What is your most used emoji? 😂',
        'Have you ever ghosted someone? 👻',
        'What is your biggest pet peeve? 😤',
        'Who makes you the happiest? 😊',
        'What is your worst date story? 💔',
        'Have you ever faked being sick? 🤒',
        'What is your most embarrassing nickname? 😂',
        'Who do you wish you were closer to? 🤗',
        'What is your biggest achievement? 🏆',
        'Have you ever cried during a movie? 😭',
        'What is your most played song? 🎵',
        'Who is your favorite family member? 👨‍👩‍👧‍👦',
        'What is your biggest fantasy? 💭',
        'Have you ever had a crush on a teacher? 👩‍🏫',
        'What is your most toxic trait? ☠️',
        'Who would you save first in a fire? 🔥',
        'What is your biggest lie told? 🤥',
        'Have you ever been friendzoned? 😢',
        'What is your dream job? 💼',
        'Who do you miss the most? 😢',
        'What is your worst cooking disaster? 🍳',
        'Have you ever peed in a pool? 🏊',
        'What is your biggest flex? 💪',
        'Who is your ride or die? 🚗',
        'What is your most used app? 📱',
        'Have you ever been caught lying? 😳',
        'What is your biggest red flag? 🚩',
        'Who do you trust the least? 🤔',
        'What is your worst fashion moment? 👗',
        'Have you ever sent wrong text? 📱',
        'What is your biggest weakness? 😰',
        'Who would you marry right now? 💍',
        'What is your most embarrassing moment? 😳',
        'Have you ever been in a fight? 👊',
        'What is your biggest fear in relationships? 💔',
        'Who is your secret obsession? 🤩',
        'What is your worst habit at home? 🏠',
        'Have you ever stalked your ex? 👀',
        'What is your biggest addiction? 📱',
        'Who do you call when sad? 📞',
        'What is your most childish trait? 👶',
        'Have you ever been dumped? 💔',
        'What is your biggest turn on? 😏',
        'Who knows you best? 👥',
        'What is your most embarrassing search? 🔍',
        'Have you ever had food poisoning? 🤢',
        'What is your biggest irrational fear? 😱',
        'Who would you not invite to your wedding? 💒',
        'What is your most expensive mistake? 💸',
        'Have you ever been catfished? 🐱',
        'What is your biggest life lesson? 📚',
        'Who is your favorite person here? 👤',
        'What is your most cringe moment? 😬',
        'Have you ever failed a test? 📝',
        'What is your biggest dream right now? 🌟',
        'Who do you wish was here? 😢',
        'What is your most used word? 📝',
        'Have you ever been betrayed? 💔',
        'What is your biggest life goal? 🎯',
        'Who makes you laugh the most? 😂',
        'What is your most annoying habit? 😤',
        'Have you ever broken someones heart? 💔',
        'What is your biggest what if? 🤔',
        'Who is your hero? 🦸',
        'What is your most embarrassing photo? 📸',
        'Have you ever been in trouble with police? 🚓',
        'What is your biggest regret in life? 😔',
        'Who do you want to impress most? 💪',
        'What is your most random talent? 🎪',
        'Have you ever been drunk? 🍺',
        'What is your biggest life motto? 📜',
        'Who would you take to an island? 🏝️',
        'What is your most prized possession? 💎',
        'Have you ever lost a best friend? 😢',
        'What is your biggest hope for future? 🌅',
        'Who do you look up to most? 👀'
      ]

      // ─── GET RANDOM TRUTH ─────────────────────────────────
      const randomTruth = truths[Math.floor(Math.random() * truths.length)]
      const userName = sender.split('@')[0]

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 TRUTH 〕─────┈⊷
│ ◦➛ Player: @${userName}
├─────────────────────────⊷
│ ◦➛ ${randomTruth}
├─────────────────────────⊷
│ ◦➛ Answer honestly! 🤞
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: [sender],
        contextInfo
      }, { quoted: m })

      logger.success('TRUTH', `Sent truth to ${userName}`)

    } catch (e) {
      logger.error('TRUTH', 'Truth command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to get truth
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}