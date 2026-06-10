/**
 * AstraX - plugins/commands/group management/kickall.js
 * Group Kick All Command - Remove all non-admin members
 * No admin check from router - handles 403/404 errors directly
 * No confirmation - instant execution
 * Category: group management
 */

export default {
  name: 'kickall',
  alias: ['removeall', 'banall', 'end'],
  desc: 'Remove all non-admin members from group',
  category: 'group management',
  usage: 'kickall',
  permission: 'isOwner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
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
│ ◦➛ Bot needs to be in group
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── GET NON-ADMIN PARTICIPANTS ───────────────────────
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
      const groupAdmins = groupMetadata.participants
      .filter(p => p.admin!== null)
      .map(p => p.id)

      const targets = groupMetadata.participants
      .filter(p => p.admin === null && p.id!== botNumber && p.id!== sender)
      .map(p => p.id)

      // ─── VALIDATE TARGETS ─────────────────────────────────
      if (targets.length === 0) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ No members to kick
│ ◦➛ Only admins remain
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── EXECUTE KICK WITH ERROR HANDLING ─────────────────
      let kicked = []
      let errors = {
        notAdmin: false,
        notInGroup: false,
        botNotAdmin: false,
        unknown: false
      }

      await sock.sendMessage(from, {
        text: `╭─────〔 PROCESSING 〕─────┈⊷\n│ ◦➛ Kicking ${targets.length} members...\n╰─────────────────────────⊷`,
        contextInfo
      }, { quoted: m })

      for (const target of targets) {
        try {
          await sock.groupParticipantsUpdate(from, [target], 'remove')
          kicked.push(target)
          await new Promise(resolve => setTimeout(resolve, 800))
        } catch (e) {
          const errMsg = e.message || e.toString()

          // 403 - Bot not admin or sender not admin
          if (errMsg.includes('403') || errMsg.includes('forbidden')) {
            errors.botNotAdmin = true
            break
          }
          // 404 - User not in group
          else if (errMsg.includes('404') || errMsg.includes('not-found')) {
            errors.notInGroup = true
          }
          // 401 - Not admin
          else if (errMsg.includes('401') || errMsg.includes('not-authorized')) {
            errors.notAdmin = true
            break
          }
          else {
            errors.unknown = true
          }

          logger.error('KICKALL', `Failed to kick ${target}`, errMsg)
        }
      }

      // ─── HANDLE SPECIFIC ERRORS ───────────────────────────
      if (kicked.length === 0) {
        let errorText = ''

        if (errors.botNotAdmin) {
          errorText = `
╭─────〔 ERROR 403 〕─────┈⊷
│ ◦➛ Bot needs admin rights
╰─────────────────────────⊷
`
        } else if (errors.notAdmin) {
          errorText = `
╭─────〔 ERROR 401 〕─────┈⊷
│ ◦➛ You need admin rights
╰─────────────────────────⊷
`
        } else {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to execute
╰─────────────────────────⊷
`
        }

        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── BUILD RESULT MESSAGE ─────────────────────────────
      const resultText = `
╭─────〔 KICKALL DONE 〕─────┈⊷
│ ◦➛ Removed: ${kicked.length}/${targets.length}
│ ◦➛ Remaining: ${groupMetadata.participants.length - kicked.length}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('KICKALL', `Kicked ${kicked.length} members from ${from}`)

    } catch (e) {
      logger.error('KICKALL', 'Kickall command failed', e.message)

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