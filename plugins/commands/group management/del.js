/**
 * AstraX - plugins/commands/group management/del.js
 * Delete Message Command - Delete any message by replying
 * Works for: Text, Image, Video, Sticker, Document, Audio
 * Category: group management
 */

export default {
  name: 'del',
  alias: ['delete', 'd', 'unsend'],
  desc: 'Delete any message by replying to it',
  category: 'group management',
  usage: 'del | reply to message',
  permission: 'isOwner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── CHECK IF REPLY EXISTS ────────────────────────────
      const quoted = m.message?.extendedTextMessage?.contextInfo
      if (!quoted || !quoted.stanzaId) {
        const errorText = `
╭─────〔 DEL 〕─────┈⊷
│ ◦➛ Reply to a message
│ ◦➛ Usage: ${prefix}del
│ ◦➛ Deletes replied msg
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      const key = {
        remoteJid: from,
        fromMe: quoted.participant === sock.user.id,
        id: quoted.stanzaId,
        participant: quoted.participant
      }

      // ─── EXECUTE DELETE ───────────────────────────────────
      try {
        await sock.sendMessage(from, { delete: key })

        // Success - no message sent, just delete silently
        logger.success('DEL', `Deleted message from ${quoted.participant} in ${from}`)

      } catch (e) {
        const errMsg = e.message || e.toString()
        let errorText = ''

        // Bot not admin in group
        if (errMsg.includes('403') || errMsg.includes('forbidden')) {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Bot needs admin rights
╰─────────────────────────⊷
`
        }
        // User not admin
        else if (errMsg.includes('401') || errMsg.includes('not-authorized')) {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ You need admin rights
╰─────────────────────────⊷
`
        }
        // Message too old
        else if (errMsg.includes('not-found') || errMsg.includes('gone')) {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Message too old
│ ◦➛ Can't delete now
╰─────────────────────────⊷
`
        }
        // Server error
        else if (errMsg.includes('500') || errMsg.includes('server')) {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ WhatsApp server error
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        }
        else {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to delete msg
╰─────────────────────────⊷
`
        }

        logger.error('DEL', 'Failed to delete message', errMsg)
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

    } catch (e) {
      logger.error('DEL', 'Del command failed', e.message)

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