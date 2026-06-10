/**
 * AstraX - plugins/commands/group management/promote.js
 * Group Promote Command - Tags, Reply, Number
 * No admin check from router - handles 403/401 errors directly
 * Category: group management
 */

export default {
  name: 'promote',
  alias: ['admin', 'up', 'makeadmin'],
  desc: 'Promote member to group admin',
  category: 'group management',
  usage: 'promote @tag | reply to message | promote 255xxx',
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
╭─────〔 PROMOTE 〕─────┈⊷
│ ◦➛ Usage: ${prefix}promote @user
│ ◦➛ Or reply to message
│ ◦➛ Or ${prefix}promote 255xxx
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

      // ─── FILTER ALREADY ADMINS ────────────────────────────
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
      const groupAdmins = groupMetadata.participants
      .filter(p => p.admin!== null)
      .map(p => p.id)

      const validTargets = targets.filter(t => {
        if (t === botNumber) return false
        if (groupAdmins.includes(t)) return false
        return true
      })

      if (validTargets.length === 0) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ User already admin
│ ◦➛ Or cannot promote bot
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── EXECUTE PROMOTE WITH ERROR HANDLING ──────────────
      let promoted = []
      let errors = {
        notAdmin: false,
        notInGroup: false,
        botNotAdmin: false,
        unknown: false
      }

      for (const target of validTargets) {
        try {
          await sock.groupParticipantsUpdate(from, [target], 'promote')
          promoted.push(target)
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

          logger.error('PROMOTE', `Failed to promote ${target}`, errMsg)
        }
      }

      // ─── HANDLE SPECIFIC ERRORS ───────────────────────────
      if (promoted.length === 0) {
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
      const promotedTags = promoted.map(p => `@${p.split('@')[0]}`).join(' ')
      const resultText = `
╭─────〔 PROMOTED 〕─────┈⊷
│ ◦➛ New Admins: ${promoted.length}
│ ◦➛ ${promotedTags}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        mentions: promoted,
        contextInfo
      }, { quoted: m })

      logger.success('PROMOTE', `Promoted ${promoted.length} members in ${from}`)

    } catch (e) {
      logger.error('PROMOTE', 'Promote command failed', e.message)

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