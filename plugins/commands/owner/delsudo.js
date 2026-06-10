/**
 * AstraX - plugins/commands/owner/delsudo.js
 * Remove sudo user
 * Usage: delsudo 255xxx or reply to message
 */

export default {
  name: 'delsudo',
  alias: ['removesudo', 'rmsudo'],
  desc: 'Remove sudo user',
  category: 'owner',
  usage: 'delsudo 255xxx',
  permission: 'owner',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      const prefix = await db.get('prefix')

      // React to show command received
      await sock.sendMessage(from, {
        react: { text: '👍', key: m.key }
      })

      let targetNumber = ''

      // Check if replying to message
      if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        targetNumber = m.message.extendedTextMessage.contextInfo.participant.replace(/[^0-9]/g, '')
      } else if (args[0]) {
        // Get from args
        targetNumber = args[0].replace(/[^0-9]/g, '')
      } else {
        return await sock.sendMessage(from, {
          text: `❌ Usage: ${prefix}delsudo 255xxx\nOr reply to a message`,
          contextInfo
        }, { quoted: m })
      }

      if (!targetNumber || targetNumber.length < 10) {
        return await sock.sendMessage(from, {
          text: `❌ Invalid number\n\nExample: ${prefix}delsudo 255712345678`,
          contextInfo
        }, { quoted: m })
      }

      const ownerNumber = await db.get('owner')

      // Check if target is owner
      if (targetNumber === ownerNumber) {
        return await sock.sendMessage(from, {
          text: `❌ Cannot remove owner from sudo`,
          contextInfo
        }, { quoted: m })
      }

      const sudoList = await db.get('sudoUsers')

      // Check if not in sudo list
      if (!sudoList.includes(targetNumber)) {
        return await sock.sendMessage(from, {
          text: `ℹ️ +${targetNumber} is not a sudo user`,
          contextInfo
        }, { quoted: m })
      }

      // Remove from sudo list
      await db.pull('sudoUsers', targetNumber)

      const successText = `
╭─────〔 SUDO REMOVED 〕─────┈⊷
│ 𐂂 Number: +${targetNumber}
│ 𐂂 Permission: Revoked
│ 𐂂 Access: Normal user
╰─────────────────────────⊷

Sudo user removed successfully ✅
`

      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('DELSUDO', `Removed +${targetNumber} from sudo by ${m.key.participant || from}`)

    } catch (e) {
      logger.error('DELSUDO', 'Failed to remove sudo', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to remove sudo: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}