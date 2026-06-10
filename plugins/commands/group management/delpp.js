/**
 * AstraX - plugins/commands/group management/delgcpp.js
 * Delete Group Profile Picture Command
 * Clean error messages - no error codes shown
 * Category: group management
 */

export default {
  name: 'delgcpp',
  alias: ['delgcpic', 'removegcpp', 'deletepic'],
  desc: 'Remove group profile picture',
  category: 'group management',
  usage: 'delgcpp',
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

      // ─── CHECK IF PP EXISTS ───────────────────────────────
      try {
        await sock.profilePictureUrl(from, 'image')
      } catch (e) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Group has no profile pic
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
        await sock.removeProfilePicture(from)

        const successText = `
╭─────〔 SUCCESS 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata.subject}
│ ◦➛ Profile picture removed
│ ◦➛ Status: Deleted ✅
╰─────────────────────────⊷
`
        await sock.sendMessage(from, {
          text: successText.trim(),
          contextInfo
        }, { quoted: m })

        logger.success('DELGCCP', `Removed group pic for ${groupMetadata.subject}`)

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
│ ◦➛ Failed to remove pic
╰─────────────────────────⊷
`
        }

        logger.error('DELGCCP', 'Failed to remove group pic', errMsg)
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

    } catch (e) {
      logger.error('DELGCCP', 'Delgcpp command failed', e.message)

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