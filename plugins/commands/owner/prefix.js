/**
 * AstraX - plugins/commands/owner/setprefix.js
 * Change bot command prefix
 * Max 4 characters - letters, numbers, symbols allowed
 */

export default {
  name: 'setprefix',
  alias: ['prefix', 'setpref', 'changeprefix'],
  desc: 'Change bot command prefix',
  category: 'owner',
  usage: '.setprefix <new_prefix>',
  permission: 'owner',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      const currentPrefix = await db.get('prefix')
      const newPrefix = args[0]

      // ─── IF NO ARGS: SHOW CURRENT PREFIX ───────────────────
      if (!newPrefix) {
        const infoText = `
╭─────〔 PREFIX 〕─────┈⊷
│ ◦➛ Current: ${currentPrefix}
│ ◦➛ Max: 4 characters
╰─────────────────────────⊷

╭─────〔 USAGE 〕─────┈⊷
│ ◦➛ ${currentPrefix}setprefix!
│ ◦➛ ${currentPrefix}setprefix bot
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: infoText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── VALIDATE PREFIX ──────────────────────────────────
      if (newPrefix.length > 4) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Too long
│ ◦➛ Max: 4 characters
│ ◦➛ Your input: ${newPrefix.length}
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      if (newPrefix.includes(' ')) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Spaces not allowed
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── CHECK IF SAME ────────────────────────────────────
      if (currentPrefix === newPrefix) {
        const infoText = `
╭─────〔 INFO 〕─────┈⊷
│ ◦➛ Prefix is already ${newPrefix}
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: infoText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── SET NEW PREFIX ───────────────────────────────────
      await db.set('prefix', newPrefix)

      const successText = `
╭─────〔 PREFIX CHANGED 〕─────┈⊷
│ ◦➛ From: ${currentPrefix}
│ ◦➛ To: ${newPrefix}
│ ◦➛ Example: ${newPrefix}menu
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('SETPREFIX', `Prefix changed from ${currentPrefix} to ${newPrefix} by ${m.key.participant || from}`)

    } catch (e) {
      logger.error('SETPREFIX', 'Failed to set prefix', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ ${e.message}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}