/**
 * AstraX - plugins/commands/group management/join.js
 * Group Join Command - Bot joins via invite link
 * Supports: Args, Reply message with link
 * Works in DM and Group - handles errors directly
 * Category: group management
 */

export default {
  name: 'join',
  alias: ['invite', 'enter'],
  desc: 'Make bot join a group via invite link',
  category: 'group management',
  usage: 'join <group_link> | reply to message with link',
  permission: 'isOwner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── GET LINK FROM ARGS OR REPLY ──────────────────────
      let linkInput = args[0]

      // 1. Check reply message for link
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!linkInput && quoted) {
        const quotedText = quoted.conversation ||
                          quoted.extendedTextMessage?.text ||
                          quoted.imageMessage?.caption ||
                          quoted.videoMessage?.caption || ''

        // Extract WhatsApp group link from quoted text
        const linkMatch = quotedText.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{20,})/)
        if (linkMatch) {
          linkInput = linkMatch[0]
        }
      }

      // ─── VALIDATE LINK ────────────────────────────────────
      if (!linkInput) {
        const errorText = `
╭─────〔 JOIN 〕─────┈⊷
│ ◦➛ Usage: ${prefix}join <link>
│ ◦➛ Or reply to msg with link
│ ◦➛ Example: ${prefix}join https://chat.whatsapp.com/ABC
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── EXTRACT INVITE CODE ──────────────────────────────
      let inviteCode = linkInput

      // Handle full URL
      if (inviteCode.includes('chat.whatsapp.com/')) {
        inviteCode = inviteCode.split('chat.whatsapp.com/')[1]
      }

      // Remove any extra params
      inviteCode = inviteCode.split('?')[0].split('/')[0].trim()

      // Validate code format
      if (!inviteCode || inviteCode.length < 20) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Invalid group link
│ ◦➛ Check link format
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── EXECUTE JOIN ─────────────────────────────────────
      let groupId
      try {
        groupId = await sock.groupAcceptInvite(inviteCode)
      } catch (e) {
        const errMsg = e.message || e.toString()
        let errorText = ''

        // 404 - Invalid/expired link
        if (errMsg.includes('404') || errMsg.includes('not-found')) {
          errorText = `
╭─────〔 ERROR 404 〕─────┈⊷
│ ◦➛ Invalid or expired link
╰─────────────────────────⊷
`
        }
        // 403 - Already in group or banned
        else if (errMsg.includes('403') || errMsg.includes('forbidden')) {
          errorText = `
╭─────〔 ERROR 403 〕─────┈⊷
│ ◦➛ Already in group
│ ◦➛ Or bot is banned
╰─────────────────────────⊷
`
        }
        // 401 - Not authorized / Admin approval required
        else if (errMsg.includes('401') || errMsg.includes('not-authorized') || errMsg.includes('admin-approval')) {
          errorText = `
╭─────〔 ERROR 401 〕─────┈⊷
│ ◦➛ Admin approval required
│ ◦➛ Bot requested to join
╰─────────────────────────⊷
`
        }
        // 409 - Group full
        else if (errMsg.includes('409') || errMsg.includes('conflict')) {
          errorText = `
╭─────〔 ERROR 409 〕─────┈⊷
│ ◦➛ Group is full
╰─────────────────────────⊷
`
        }
        // 410 - Group gone/deleted
        else if (errMsg.includes('410') || errMsg.includes('gone')) {
          errorText = `
╭─────〔 ERROR 410 〕─────┈⊷
│ ◦➛ Group no longer exists
╰─────────────────────────⊷
`
        }
        // 429 - Rate limited
        else if (errMsg.includes('429') || errMsg.includes('rate')) {
          errorText = `
╭─────〔 ERROR 429 〕─────┈⊷
│ ◦➛ Too many requests
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        }
        // 500 - Server error
        else if (errMsg.includes('500') || errMsg.includes('server')) {
          errorText = `
╭─────〔 ERROR 500 〕─────┈⊷
│ ◦➛ WhatsApp server error
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        }
        else {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to join group
╰─────────────────────────⊷
`
        }

        logger.error('JOIN', 'Failed to join group', errMsg)
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── GET JOINED GROUP INFO ────────────────────────────
      let groupMetadata
      try {
        groupMetadata = await sock.groupMetadata(groupId)
      } catch (e) {
        logger.error('JOIN', 'Failed to get group metadata', e.message)
      }

      // ─── BUILD SUCCESS MESSAGE ────────────────────────────
      const successText = `
╭─────〔 JOINED 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata?.subject || 'Unknown'}
│ ◦➛ Members: ${groupMetadata?.participants?.length || '?'}
│ ◦➛ Status: Success ✅
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('JOIN', `Bot joined group ${groupMetadata?.subject || groupId}`)

    } catch (e) {
      logger.error('JOIN', 'Join command failed', e.message)

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