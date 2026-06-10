/**
 * AstraX - plugins/commands/group management/delgcdesc.js
 * Delete Group Description Command
 * Clean error messages - no error codes shown
 * Category: group management
 */

export default {
  name: 'delgcdesc',
  alias: ['deldesc', 'removedesc', 'cleardesc'],
  desc: 'Remove group description',
  category: 'group management',
  usage: 'delgcdesc',
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
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Bot needs to be in group
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      const currentDesc = groupMetadata.desc || ''

      // ─── CHECK IF DESC EXISTS ─────────────────────────────
      if (!currentDesc) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Group has no description
│ ◦➛ Nothing to delete
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── EXECUTE DELETE ───────────────────────────────────
      try {
        await sock.groupUpdateDescription(from, '')

        const truncatedOld = currentDesc.length > 50 ? currentDesc.substring(0, 50) + '...' : currentDesc

        const successText = `
╭─────〔 SUCCESS 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata.subject}
│ ◦➛ Old Desc: ${truncatedOld}
│ ◦➛ Status: Removed ✅
╰─────────────────────────⊷
`
        await sock.sendMessage(from, {
          text: successText.trim(),
          contextInfo
        }, { quoted: m })

        logger.success('DELGCDECS', `Removed group desc for ${groupMetadata.subject}`)

      } catch (e) {
        const errMsg = e.message || e.toString()
        let errorText = ''

        // Bot not admin
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
│ ◦➛ Failed to remove desc
╰─────────────────────────⊷
`
        }

        logger.error('DELGCDECS', 'Failed to remove group desc', errMsg)
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

    } catch (e) {
      logger.error('DELGCDECS', 'Delgcdesc command failed', e.message)

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