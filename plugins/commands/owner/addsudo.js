/**
 * AstraX - plugins/commands/owner/addsudo.js
 * Add sudo user with owner-level permissions
 * Usage: addsudo 255xxx or reply to message
 */

export default {
  name: 'addsudo',
  alias: ['setsudo'],
  desc: 'Add sudo user',
  category: 'owner',
  usage: 'addsudo 255xxx',
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
          text: `❌ Usage: ${prefix}addsudo 255xxx\nOr reply to a message`,
          contextInfo
        }, { quoted: m })
      }

      if (!targetNumber || targetNumber.length < 10) {
        return await sock.sendMessage(from, {
          text: `❌ Invalid number\n\nExample: ${prefix}addsudo 255712345678`,
          contextInfo
        }, { quoted: m })
      }

      const ownerNumber = await db.get('owner')

      // Check if target is owner
      if (targetNumber === ownerNumber) {
        return await sock.sendMessage(from, {
          text: `ℹ️ +${targetNumber} is already the owner`,
          contextInfo
        }, { quoted: m })
      }

      const sudoList = await db.get('sudoUsers')

      // Check if already sudo
      if (sudoList.includes(targetNumber)) {
        return await sock.sendMessage(from, {
          text: `ℹ️ +${targetNumber} is already a sudo user`,
          contextInfo
        }, { quoted: m })
      }

      // Add to sudo list
      await db.push('sudoUsers', targetNumber)

      const successText = `
╭─────〔 SUDO ADDED 〕─────┈⊷
│ 𐂂 Number: +${targetNumber}
│ 𐂂 Permission: Owner-Level
│ 𐂂 Access: All commands
╰─────────────────────────⊷

Sudo user added successfully ✅
`

      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('ADDSUDO', `Added +${targetNumber} to sudo by ${m.key.participant || from}`)

    } catch (e) {
      logger.error('ADDSUDO', 'Failed to add sudo', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to add sudo: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}