/**
 * AstraX - plugins/commands/group management/leave.js
 * Group Leave Command - Bot exits group
 * No admin check from router - handles errors directly
 * Category: group management
 */

export default {
  name: 'leave',
  alias: ['exit', 'out', 'bye'],
  desc: 'Make bot leave the group',
  category: 'group management',
  usage: 'leave',
  permission: 'isOwner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── CHECK IF GROUP ───────────────────────────────────
      if (!isGroup) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Group command only
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── GET GROUP METADATA ───────────────────────────────
      let groupMetadata
      try {
        groupMetadata = await sock.groupMetadata(from)
      } catch (e) {
        const errorText = `
╭─────〔 ERROR 403 〕─────┈⊷
│ ◦➛ Bot not in group
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── SEND GOODBYE MESSAGE ─────────────────────────────
      const goodbyeText = `
╭─────〔 LEAVING 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata.subject}
│ ◦➛ Bye bye 👋
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: goodbyeText.trim(),
        contextInfo
      }, { quoted: m })

      // ─── EXECUTE LEAVE ────────────────────────────────────
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
        await sock.groupLeave(from)
        logger.success('LEAVE', `Bot left group ${groupMetadata.subject}`)
      } catch (e) {
        const errMsg = e.message || e.toString()
        logger.error('LEAVE', 'Failed to leave group', errMsg)

        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to leave
╰─────────────────────────⊷
`
        await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

    } catch (e) {
      logger.error('LEAVE', 'Leave command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to execute
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}