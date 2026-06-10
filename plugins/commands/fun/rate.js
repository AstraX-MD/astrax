/**
 * AstraX - plugins/commands/fun/rate.js
 * Rate Command - Rate anything from 1-10 with funny comments
 * Category: fun
 */

export default {
  name: 'rate',
  alias: ['rateit', 'score'],
  desc: 'Rate anything from 1-10 with funny comments',
  category: 'fun',
  usage: 'rate <thing> | rate @user',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── CHECK INPUT ──────────────────────────────────────
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      let target = ''
      let isUser = false

      if (mentioned.length > 0) {
        target = mentioned[0]
        isUser = true
      } else if (args.length > 0) {
        target = args.join(' ')
      } else {
        const errorText = `
╭─────〔 RATE 〕─────┈⊷
│ ◦➛ Usage: ${prefix}rate <thing>
│ ◦➛ Example: ${prefix}rate pizza
│ ◦➛ Example: ${prefix}rate @user
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── GET DISPLAY NAME ─────────────────────────────────
      let displayName = target
      if (isUser) {
        displayName = target.split('@')[0]
        try {
          const contact = await sock.onWhatsApp(target)
          if (contact[0]?.notify) displayName = contact[0].notify
        } catch (e) {}
      }

      // ─── CALCULATE RATING ─────────────────────────────────
      const seed = displayName.charCodeAt(0) + displayName.length + displayName.charCodeAt(displayName.length - 1)
      const rating = (seed % 10) + 1 // 1-10

      // ─── GET COMMENT BASED ON RATING ──────────────────────
      const comments = {
        1: ['Absolute trash 🗑️', 'Delete this immediately 💀', 'Even rats would not touch this 🐀', '0/10 would not recommend 🚫'],
        2: ['Pretty bad not gonna lie 😬', 'Could be worse... barely 😅', 'My grandma does better 👵', 'Disappointing fr 💔'],
        3: ['Below average chief 😕', 'Needs serious work 🛠️', 'Almost there... not really 😑', 'Try again next time 📉'],
        4: ['Mid at best 🤷', 'Nothing special here 😶', 'Decent I guess 🤔', 'Could use improvement 📊'],
        5: ['Average energy ⚖️', 'Not bad not good 😐', 'Middle of the road 🛣️', 'Perfectly okay ✅'],
        6: ['Getting there 🔥', 'Above average vibes 📈', 'Pretty solid ngl 💯', 'Not too shabby 👌'],
        7: ['Actually good 😎', 'Certified fresh ✨', 'We got a winner 🏆', 'Impressive fr 🔥'],
        8: ['Really good stuff 💎', 'High quality content 👑', 'Almost perfect 💫', 'Chef kiss quality 👨‍🍳'],
        9: ['Absolutely amazing 🌟', 'God tier material ⚡', 'Peak performance 📊', 'Nearly flawless 💖'],
        10: ['PERFECT 10/10 🔥', 'Masterpiece fr 🎨', 'GOAT status 🐐', 'Legendary tier 👑']
      }

      const ratingComments = comments[rating]
      const randomComment = ratingComments[Math.floor(Math.random() * ratingComments.length)]

      // ─── CREATE STAR RATING ───────────────────────────────
      const filledStars = '⭐'.repeat(rating)
      const emptyStars = '☆'.repeat(10 - rating)
      const starBar = filledStars + emptyStars

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 RATE 〕─────┈⊷
│ ◦➛ Item: ${displayName}
├─────────────────────────⊷
│ ◦➛ Score: ${rating}/10
│ ◦➛ ${starBar}
├─────────────────────────⊷
│ ◦➛ ${randomComment}
╰─────────────────────────⊷
`
      const messageOptions = {
        text: resultText.trim(),
        contextInfo
      }

      if (isUser) {
        messageOptions.mentions = [target]
      }

      await sock.sendMessage(from, messageOptions, { quoted: m })

      logger.success('RATE', `Rated ${displayName} = ${rating}/10`)

    } catch (e) {
      logger.error('RATE', 'Rate command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to rate
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}
