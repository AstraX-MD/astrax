/**
 * AstraX - plugins/commands/fun/hot.js
 * Hot Command - Check how hot someone is
 * Category: fun
 */

export default {
  name: 'hot',
  alias: ['hotness', 'sexy', 'attractive'],
  desc: 'Check how hot someone is with hot meter',
  category: 'fun',
  usage: 'hot @user | hot me',
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
╭─────〔 HOT METER 〕─────┈⊷
│ ◦➛ Usage: ${prefix}hot @user
│ ◦➛ Usage: ${prefix}hot me
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

      // ─── CALCULATE HOTNESS ────────────────────────────────
      const seed = displayName.charCodeAt(0) + displayName.length + displayName.charCodeAt(displayName.length - 1)
      const hotness = (seed % 101) // 0-100

      // ─── GET COMMENT BASED ON HOTNESS ─────────────────────
      let comment = ''
      let emoji = ''
      let fireBar = ''

      if (hotness === 0) {
        comment = 'Ice cold... literally freezing 🥶'
        emoji = '🧊'
        fireBar = '⬜⬜⬜⬜⬜'
      } else if (hotness <= 10) {
        comment = 'Room temperature at best 🌡️'
        emoji = '😶'
        fireBar = '🔵⬜⬜'
      } else if (hotness <= 25) {
        comment = 'Slightly warm, like tap water 🚰'
        emoji = '😐'
        fireBar = '🟡⬜⬜⬜⬜'
      } else if (hotness <= 40) {
        comment = 'Getting toasty 🔥'
        emoji = '😊'
        fireBar = '🟠🟠⬜⬜⬜'
      } else if (hotness <= 55) {
        comment = 'Certified warm vibes ☀️'
        emoji = '😏'
        fireBar = '🟠🟠🟠⬜⬜'
      } else if (hotness <= 70) {
        comment = 'HOT HOT HOT 🌶️'
        emoji = '🥵'
        fireBar = '🔴🔴🔴⬜⬜'
      } else if (hotness <= 85) {
        comment = 'SIZZLING - Call the fire dept 🚒'
        emoji = '🔥'
        fireBar = '🔴🔴🔴🔴⬜'
      } else if (hotness < 100) {
        comment = 'VOLCANIC ERUPTION 🌋'
        emoji = '💥'
        fireBar = '🔴🔴🔴'
      } else {
        comment = 'SUN GODDESS/GOD LEVEL ☀️👑'
        emoji = '✨'
        fireBar = '🔥🔥🔥🔥🔥'
      }

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 HOT METER 〕─────┈⊷
│ ◦➛ User: @${name}
├─────────────────────────⊷
│ ◦➛ ${fireBar}
│ ◦➛ ${hotness}% Hot ${emoji}
├─────────────────────────⊷
│ ◦➛ ${comment}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: [target],
        contextInfo
      }, { quoted: m })

      logger.success('HOT', `${displayName} = ${hotness}% hot`)

    } catch (e) {
      logger.error('HOT', 'Hot command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to check hotness
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}