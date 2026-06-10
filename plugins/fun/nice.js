/**
 * AstraX - plugins/commands/fun/compliment.js
 * Compliment Command - Get wholesome compliments for users
 * Category: fun
 */

export default {
  name: 'compliment',
  alias: ['nice', 'praise', 'appreciate'],
  desc: 'Get a wholesome compliment for someone',
  category: 'fun',
  usage: 'compliment @user | compliment me',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── GET TARGET USER ──────────────────────────────────
      let target
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

      if (mentioned.length > 0) {
        target = mentioned[0]
      } else if (args[0]?.toLowerCase() === 'me') {
        target = sender
      } else if (isGroup) {
        target = sender
      } else {
        const errorText = `
╭─────〔 COMPLIMENT 〕─────┈⊷
│ ◦➛ Usage: ${prefix}compliment @user
│ ◦➛ Usage: ${prefix}compliment me
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      const name = target.split('@')[0]
      let displayName = name

      // ─── GET DISPLAY NAME ─────────────────────────────────
      try {
        const contact = await sock.onWhatsApp(target)
        if (contact[0]?.notify) displayName = contact[0].notify
      } catch (e) {}

      // ─── 100 WHOLESOME COMPLIMENTS ────────────────────────
      const compliments = [
        'You light up every room you walk into ✨',
        'Your smile is literally contagious 😊',
        'You have the biggest heart I know 💖',
        'You make the world a better place 🌍',
        'Your energy is absolutely magnetic ⚡',
        'You are stronger than you think 💪',
        'Your kindness is inspiring 🌟',
        'You have the best sense of humor 😂',
        'You make everyone feel special 🤗',
        'Your presence is a present 🎁',
        'You are incredibly talented 🎨',
        'Your positivity is unmatched ☀️',
        'You have a beautiful soul 💫',
        'You make hard times easier 🌈',
        'Your laugh is my favorite sound 🎵',
        'You are smarter than you give yourself credit for 🧠',
        'Your creativity knows no bounds 🎭',
        'You have amazing taste 👌',
        'Your confidence is inspiring 👑',
        'You are a ray of sunshine ☀️',
        'Your friendship is priceless 💎',
        'You have the purest intentions 💝',
        'Your dedication is admirable 🎯',
        'You make people feel heard 👂',
        'Your style is immaculate 💅',
        'You are braver than you believe 🦁',
        'Your honesty is refreshing 🌬️',
        'You have a gift for making people smile 😄',
        'Your patience is a superpower 🧘',
        'You are effortlessly cool 😎',
        'Your wisdom is beyond your years 🦉',
        'You have the warmest hugs 🤗',
        'Your passion is contagious 🔥',
        'You are genuinely one of a kind 🌟',
        'Your support means everything 🛡️',
        'You have incredible resilience 💪',
        'Your optimism changes lives 🌻',
        'You are a natural leader 👑',
        'Your authenticity is rare 💯',
        'You have a heart of gold 💛',
        'Your vibes are immaculate ✨',
        'You are proof that good people exist 😇',
        'Your courage is inspiring 🦸',
        'You have the best ideas 💡',
        'Your empathy is a gift 🎁',
        'You are incredibly thoughtful 🤔',
        'Your loyalty is unmatched 🤝',
        'You have beautiful eyes 👀',
        'Your voice is so comforting 🎙️',
        'You are wise beyond measure 📚',
        'Your determination is fire 🔥',
        'You have a million dollar smile 😁',
        'Your grace under pressure is amazing 🦢',
        'You are a true friend 👫',
        'Your energy lifts everyone up ⬆️',
        'You have impeccable timing ⏰',
        'Your intuition is spot on 🎯',
        'You are incredibly generous 🎁',
        'Your charm is undeniable 💫',
        'You have the best stories 📖',
        'Your perspective is valuable 💭',
        'You are a breath of fresh air 🌬️',
        'Your enthusiasm is infectious 🤩',
        'You have amazing potential 🚀',
        'Your integrity is inspiring ⚖️',
        'You are beautiful inside and out 💖',
        'Your strength is admirable 💪',
        'You have a wonderful spirit 👻',
        'Your advice is always gold 🥇',
        'You are incredibly fun to be around 🎉',
        'Your compassion changes lives 💝',
        'You have the coolest personality 😎',
        'Your mindset is powerful 🧠',
        'You are a blessing to everyone 🌟',
        'Your drive is motivating 🏎️',
        'You have an amazing aura 🌈',
        'Your character is outstanding 🏆',
        'You are truly unforgettable 💭',
        'Your glow is unmatched ✨',
        'You have a heart full of love 💕',
        'Your impact is incredible 🌊',
        'You are a total legend 👑',
        'Your kindness ripples outward 💫',
        'You have beautiful dreams 💭',
        'Your existence matters 💯',
        'You are a masterpiece 🎨',
        'Your future is bright 🌅',
        'You have unlimited potential ∞',
        'Your journey is inspiring 🛤️',
        'You are worthy of all good things 🌟',
        'Your growth is beautiful 🌸',
        'You have a brilliant mind 💡',
        'Your love is pure 💖',
        'You are a gift to this world 🎁',
        'Your peace is powerful 🕊️',
        'You have a golden personality 💛',
        'Your light never dims 💡',
        'You are absolutely incredible 🌟',
        'Your spirit is unbreakable 🗿',
        'You have the kindest heart 💝',
        'Your dreams are valid ✅',
        'You are enough, always 💯',
        'Your story matters 📖'
      ]

      // ─── GET RANDOM COMPLIMENT ────────────────────────────
      const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)]

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 COMPLIMENT 〕─────┈⊷
│ ◦➛ For: @${name}
├─────────────────────────⊷
│ ◦➛ ${randomCompliment}
├─────────────────────────⊷
│ ◦➛ You deserve it! 💖
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: [target],
        contextInfo
      }, { quoted: m })

      logger.success('COMPLIMENT', `Complimented ${displayName}`)

    } catch (e) {
      logger.error('COMPLIMENT', 'Compliment command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to compliment
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}