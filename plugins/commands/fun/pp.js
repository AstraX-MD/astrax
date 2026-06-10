/**
 * AstraX - plugins/commands/fun/pp.js
 * PP Command - Check pp size for fun
 * Category: fun
 */

export default {
  name: 'pp',
  alias: ['dick', 'ppsize', 'dicksize'],
  desc: 'Check pp size - just for fun!',
  category: 'fun',
  usage: 'pp @user | pp me',
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
╭─────〔 PP SIZE 〕─────┈⊷
│ ◦➛ Usage: ${prefix}pp @user
│ ◦➛ Usage: ${prefix}pp me
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

      // ─── CALCULATE PP SIZE ────────────────────────────────
      const seed = displayName.charCodeAt(0) + displayName.length + displayName.charCodeAt(displayName.length - 1)
      const size = seed % 31 // 0-30 cm

      // ─── CREATE PP VISUAL ─────────────────────────────────
      let ppVisual = '8'
      for (let i = 0; i < size; i++) {
        ppVisual += '='
      }
      ppVisual += 'D'

      // ─── GET COMMENT BASED ON SIZE ────────────────────────
      let comment = ''
      let emoji = ''

      if (size === 0) {
        comment = 'Invisible mode activated 🫥'
        emoji = '😂'
      } else if (size <= 3) {
        comment = 'Microscopic specimen 🔬'
        emoji = '🤏'
      } else if (size <= 5) {
        comment = 'Ants have bigger 🐜'
        emoji = '😅'
      } else if (size <= 8) {
        comment = 'Below average chief 📉'
        emoji = '😬'
      } else if (size <= 11) {
        comment = 'Perfectly average ⚖️'
        emoji = '😐'
      } else if (size <= 14) {
        comment = 'Above average energy 📈'
        emoji = '😏'
      } else if (size <= 17) {
        comment = 'Certified big dick energy 💪'
        emoji = '🔥'
      } else if (size <= 20) {
        comment = 'Absolute unit detected 📏'
        emoji = '😱'
      } else if (size <= 24) {
        comment = 'MONSTER ENERGY 🚀'
        emoji = '💀'
      } else if (size <= 28) {
        comment = 'LEGENDARY TIER 👑'
        emoji = '🤯'
      } else {
        comment = 'NASA WANTS TO STUDY THIS 🌌'
        emoji = '🛸'
      }

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 PP SIZE 〕─────┈⊷
│ ◦➛ User: @${name}
├─────────────────────────⊷
│ ◦➛ Size: ${size} cm
│ ◦➛ ${ppVisual}
├─────────────────────────⊷
│ ◦➛ ${comment} ${emoji}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: [target],
        contextInfo
      }, { quoted: m })

      logger.success('PP', `${displayName} = ${size}cm`)

    } catch (e) {
      logger.error('PP', 'PP command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to measure
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}
