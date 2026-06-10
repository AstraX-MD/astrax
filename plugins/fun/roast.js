/**
 * AstraX - plugins/commands/fun/roast.js
 * Roast Command - Get savage roasts for users
 * Category: fun
 */

export default {
  name: 'roast',
  alias: ['insult', 'burn', 'savage'],
  desc: 'Get a savage roast for someone',
  category: 'fun',
  usage: 'roast @user | roast me',
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
╭─────〔 ROAST 〕─────┈⊷
│ ◦➛ Usage: ${prefix}roast @user
│ ◦➛ Usage: ${prefix}roast me
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

      // ─── 100 SAVAGE ROASTS ────────────────────────────────
      const roasts = [
        'You bring everyone so much joy... when you leave the room 😂',
        'If I wanted to kill myself I would climb your ego and jump to your IQ 🧠',
        'You are like a cloud. When you disappear, it is a beautiful day ☁️',
        'I would agree with you but then we would both be wrong 🤡',
        'You have something on your chin... no, the third one down 😬',
        'You are the reason the gene pool needs a lifeguard 🏊',
        'If laughter is the best medicine, your face must be curing the world 😂',
        'You are like Monday mornings, nobody likes you 😴',
        'I am jealous of people who have not met you 😏',
        'You are proof that evolution can go in reverse 🐒',
        'Your secrets are always safe with me. I never even listen 😴',
        'You are like a software update. Whenever I see you, I think "skip" 📱',
        'I would roast you but my mom said I should not burn trash 🗑️',
        'You have the perfect face for radio 📻',
        'If you were any more inbred you would be a sandwich 🥪',
        'You are the human version of period cramps 😫',
        'I would call you a tool but that implies you are actually useful 🔧',
        'You are like a participation trophy. Everyone got one but nobody wanted it 🏆',
        'If you were a spice, you would be flour 😑',
        'You are the reason shampoo has instructions 🧴',
        'Your family tree must be a cactus because everyone on it is a prick 🌵',
        'You are like a penny. Two-faced and not worth much 💰',
        'I would explain it to you but I left my crayons at home 🖍️',
        'You are the WiFi password nobody wants to ask for 📶',
        'If you were a vegetable, you would be a cabage... head 🥬',
        'You are like a slinky. Not really good for anything but fun to push down stairs 🪜',
        'You have an entire life to be an idiot. Why not take today off? 😂',
        'You are the puzzle piece that got lost under the couch 🧩',
        'If common sense was common, you would have some 🤔',
        'You are like a traffic jam. Nobody wants you around 🚗',
        'I would insult you but nature already did 😂',
        'You are the reason aliens do not visit us 👽',
        'If you were a browser, you would be Internet Explorer 🐌',
        'You are like a broken pencil. Pointless ✏️',
        'You have something money cannot buy... a personality nobody likes 💸',
        'You are the human equivalent of a typo ⌨️',
        'If laziness was an Olympic sport, you would come in fourth so you do not have to walk to the podium 🥉',
        'You are like a candle in the wind. Annoying and useless 🕯️',
        'I would make a joke about you but I see life already did 😂',
        'You are the reason "delete" button exists ⌫',
        'If you were any slower, you would be going backwards 🐢',
        'You are like a GPS with no signal. Lost and useless 🗺️',
        'You have the charisma of a wet sock 🧦',
        'If stupidity was a superpower, you would be Superman 🦸',
        'You are the email I send to spam 📧',
        'I would give you a nasty look but you already have one 😒',
        'You are like a chair. Everyone sits on you 🪑',
        'If you were a fruit, you would be a cantaloupe 🍈',
        'You are the reason warning labels exist ⚠️',
        'I would challenge you to a battle of wits but you are unarmed 🤺',
        'You are like a software bug. Nobody wants you but you keep showing up 🐛',
        'If you were any more basic, you would be a tutorial 📖',
        'You are the human version of a 404 error 🚫',
        'I would call you a clown but that would be insulting to clowns 🤡',
        'You are like a battery. Negative and drained 🔋',
        'If you were a season, you would be tax season 😩',
        'You are the reason "unsubscribe" was invented 📭',
        'I would say you are dumb as a rock but rocks are useful 🪨',
        'You are like a screen door on a submarine. Completely useless 🚪',
        'If you were any less interesting, we would be talking about paint drying 🎨',
        'You are the speed bump in the highway of life 🚧',
        'I would roast you harder but I would burn myself on your ego 🔥',
        'You are like a white crayon. Useless but still there 🖍️',
        'If you were a app, you would be uninstalled 📱',
        'You are the reason "mute" button was invented 🔇',
        'I would say get a life but you would not know what to do with it 😂',
        'You are like a dictionary. Full of words but no meaning 📚',
        'If you were any more dramatic, you would be a soap opera 📺',
        'You are the loading screen that never finishes ⏳',
        'I would give you advice but you would just ignore it like everything else 😴',
        'You are like a broken clock. Right twice a day but still broken 🕐',
        'If you were a joke, you would be the punchline nobody laughs at 😶',
        'You are the human version of a Monday morning ☕',
        'I would say you are unique but that would be a compliment 😂',
        'You are like a flat tire. Nobody wants to deal with you 🛞',
        'If you were any more fake, Barbie would be jealous 💅',
        'You are the reason "block" button exists 🚫',
        'I would say grow up but you already peaked in kindergarten 🎒',
        'You are like a expired coupon. Useless and disappointing 🎫',
        'If you were a drink, you would be lukewarm water 💧',
        'You are the pop-up ad of human beings 📢',
        'I would say you are special but that is what they call the bus 🚌',
        'You are like a participation award. Everyone has one but nobody cares 🏅',
        'If you were any more lost, you would be a sock in the dryer 🧦',
        'You are the reason "report" button exists 🚨',
        'I would say you are one of a kind but hopefully not 😂',
        'You are like a screen protector with bubbles. Annoying and useless 📱',
        'If you were a movie, you would be straight to DVD 📀',
        'You are the human version of buffering ⏳',
        'I would say you are a waste of space but space is useful 🌌',
        'You are like a printer. Always jamming when needed 🖨️',
        'If you were any more irrelevant, you would be a MySpace profile 💾',
        'You are the reason "close ad" exists ❌',
        'I would say touch grass but you would probably kill it 🌱',
        'You are like a broken record. Annoying and repetitive 📀',
        'If you were a font, you would be Comic Sans 😂',
        'You are the human equivalent of dial-up internet 📞',
        'I would say you are the worst but that would be giving you a ranking 🏆',
        'You are like a elevator music. Boring and unavoidable 🎵',
        'If you were any more bland, you would be unseasoned tofu 🍱',
        'You are the reason "skip intro" exists ⏭️'
      ]

      // ─── GET RANDOM ROAST ─────────────────────────────────
      const randomRoast = roasts[Math.floor(Math.random() * roasts.length)]

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 ROAST 〕─────┈⊷
│ ◦➛ Target: @${name}
├─────────────────────────⊷
│ ◦➛ ${randomRoast}
├─────────────────────────⊷
│ ◦➛ Just kidding... or not? 😈
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: [target],
        contextInfo
      }, { quoted: m })

      logger.success('ROAST', `Roasted ${displayName}`)

    } catch (e) {
      logger.error('ROAST', 'Roast command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to roast
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}