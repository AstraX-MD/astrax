/**
 * AstraX - plugins/commands/group management/setgcdesc.js
 * Set Group Description Command - Change group description
 * Supports: Args, Reply to message with text
 * Category: group management
 */

export default {
  name: 'setgcdesc',
  alias: ['setgroupdesc', 'setdesc', 'gcdesc'],
  desc: 'Change group description',
  category: 'group management',
  usage: 'setgcdesc <text> | reply to message with text',
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

      // ─── GET DESC FROM ARGS OR REPLY ──────────────────────
      let newDesc = args.join(' ').trim()

      // Check reply message for text
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!newDesc && quoted) {
        newDesc = quoted.conversation ||
                  quoted.extendedTextMessage?.text ||
                  quoted.imageMessage?.caption ||
                  quoted.videoMessage?.caption || ''
        newDesc = newDesc.trim()
      }

      // ─── VALIDATE NEW DESC ────────────────────────────────
      if (!newDesc) {
        const errorText = `
╭─────〔 SETGCDESC 〕─────┈⊷
│ ◦➛ Usage: ${prefix}setgcdesc <text>
│ ◦➛ Or reply to msg with text
│ ◦➛ Example: ${prefix}setgcdesc Welcome all!
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── VALIDATE DESC LENGTH ─────────────────────────────
      if (newDesc.length > 2048) {
        const errorText = `
╭─────〔 ERROR 400 〕─────┈⊷
│ ◦➛ Description too long
│ ◦➛ Max: 2048 characters
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
│ ◦➛ Bot needs to be in group
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      const oldDesc = groupMetadata.desc || 'No description'

      // ─── CHECK IF SAME DESC ───────────────────────────────
      if (oldDesc === newDesc) {
        const errorText = `
╭─────〔 ERROR 409 〕─────┈⊷
│ ◦➛ Same as current desc
│ ◦➛ No changes made
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── EXECUTE DESC CHANGE ──────────────────────────────
      try {
        await sock.groupUpdateDescription(from, newDesc)

        const truncatedOld = oldDesc.length > 50 ? oldDesc.substring(0, 50) + '...' : oldDesc
        const truncatedNew = newDesc.length > 50 ? newDesc.substring(0, 50) + '...' : newDesc

        const successText = `
╭─────〔 SUCCESS 200 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata.subject}
│ ◦➛ Old: ${truncatedOld}
│ ◦➛ New: ${truncatedNew}
│ ◦➛ Status: Updated ✅
╰─────────────────────────⊷
`
        await sock.sendMessage(from, {
          text: successText.trim(),
          contextInfo
        }, { quoted: m })

        logger.success('SETGCDESC', `Changed group desc for ${groupMetadata.subject}`)

      } catch (e) {
        const errMsg = e.message || e.toString()
        let errorText = ''

        // 403 - Bot not admin
        if (errMsg.includes('403') || errMsg.includes('forbidden')) {
          errorText = `
╭─────〔 ERROR 403 〕─────┈⊷
│ ◦➛ Bot needs admin rights
╰─────────────────────────⊷
`
        }
        // 401 - Not admin / Not authorized
        else if (errMsg.includes('401') || errMsg.includes('not-authorized')) {
          errorText = `
╭─────〔 ERROR 401 〕─────┈⊷
│ ◦➛ You need admin rights
╰─────────────────────────⊷
`
        }
        // 400 - Bad request / Invalid desc
        else if (errMsg.includes('400') || errMsg.includes('bad-request')) {
          errorText = `
╭─────〔 ERROR 400 〕─────┈⊷
│ ◦➛ Invalid description
│ ◦➛ Contains bad characters
╰─────────────────────────⊷
`
        }
        // 429 - Rate limited
        else if (errMsg.includes('429') || errMsg.includes('rate')) {
          errorText = `
╭─────〔 ERROR 429 〕─────┈⊷
│ ◦➛ Too many changes
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        }
        // 500 - Server error
        else if (errMsg.includes('500') || errMsg.includes('server')) {
          errorText = `
╭─────〔 ERROR 500 〕─────┈⊷
│ ◦➛ WhatsApp server error
╰─────────────────────────⊷
`
        }
        else {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to change desc
╰─────────────────────────⊷
`
        }

        logger.error('SETGCDESC', 'Failed to update group desc', errMsg)
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

    } catch (e) {
      logger.error('SETGCDESC', 'Setgcdesc command failed', e.message)

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