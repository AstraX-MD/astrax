/**
 * AstraX - plugins/commands/group_management/kick.js
 * Group Kick Command - Tags, Reply, Number
 * No admin check from router - handles 403/404 errors directly
 * Category: group management
 */

export default {
  name: 'kick',
  alias: ['remove', 'ban', 'boot'],
  desc: 'Remove member from group',
  category: 'group management',
  usage: 'kick @tag | reply to message | kick 255xxx',
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

      // ─── GET TARGETS - TAGS + REPLY + NUMBER ──────────────
      let targets = []

      // 1. From mentions/tags
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentioned.length > 0) {
        targets.push(...mentioned)
      }

      // 2. From reply
      const quoted = m.message?.extendedTextMessage?.contextInfo?.participant
      if (quoted) {
        targets.push(quoted)
      }

      // 3. From phone number in args
      if (args[0] && /^[\d+]+$/.test(args[0])) {
        let number = args[0].replace(/[^0-9]/g, '')
        if (!number.includes('@')) {
          number = number + '@s.whatsapp.net'
        }
        targets.push(number)
      }

      // Remove duplicates
      targets = [...new Set(targets)]

      // ─── VALIDATE TARGETS ─────────────────────────────────
      if (targets.length === 0) {
        const errorText = `
╭─────〔 KICK 〕─────┈⊷
│ ◦➛ Usage: ${prefix}kick @user
│ ◦➛ Or reply to message
│ ◦➛ Or ${prefix}kick 255xxx
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── FILTER SELF ──────────────────────────────────────
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
      const validTargets = targets.filter(t => t!== botNumber && t!== sender)

      if (validTargets.length === 0) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Cannot kick yourself or bot
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

      for (const target of validTargets) {
        try {
          await sock.groupParticipantsUpdate(from, [target], 'remove')
          kicked.push(target)
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (e) {
          const errMsg = e.message || e.toString()

          // 403 - Bot not admin or sender not admin
          if (errMsg.includes('403') || errMsg.includes('forbidden')) {
            errors.botNotAdmin = true
          }
          // 404 - User not in group
          else if (errMsg.includes('404') || errMsg.includes('not-found')) {
            errors.notInGroup = true
          }
          // 401 - Not admin
          else if (errMsg.includes('401') || errMsg.includes('not-authorized')) {
            errors.notAdmin = true
          }
          else {
            errors.unknown = true
          }

          logger.error('KICK', `Failed to kick ${target}`, errMsg)
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
        } else if (errors.notInGroup) {
          errorText = `
╭─────〔 ERROR 404 〕─────┈⊷
│ ◦➛ User not in group
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
      const kickedTags = kicked.map(k => `@${k.split('@')[0]}`).join(' ')
      const resultText = `
╭─────〔 KICKED 〕─────┈⊷
│ ◦➛ Removed: ${kicked.length}
│ ◦➛ ${kickedTags}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: kicked,
        contextInfo
      }, { quoted: m })

      logger.success('KICK', `Kicked ${kicked.length} members from ${from}`)

    } catch (e) {
      logger.error('KICK', 'Kick command failed', e.message)

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