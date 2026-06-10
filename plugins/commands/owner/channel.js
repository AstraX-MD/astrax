/**
 * AstraX - plugins/commands/owner/channel.js
 * Toggle channel forwarded context: on | off | help
 * Shows current status only. Use help for details
 */

export default {
  name: 'channel',
  alias: ['ch', 'fwd', 'forwarded'],
  desc: 'View or toggle forwarded channel context',
  category: 'owner',
  usage: '.channel [on/off/help]',
  permission: 'owner',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      const currentStatus = (await db.get('channelEnabled'))!== false
      const prefix = await db.get('prefix')
      const botname = await db.get('botname')
      const input = args[0]?.toLowerCase()

      // ─── HELP COMMAND:.channel help ─────────────────────
      if (input === 'help') {
        const helpText = `
╭─────〔 CHANNEL FORWARD 〕─────┈⊷
│ 𐂂 ON Mode:
│ 𐂂 • Verified BizName (WhatsApp)
│ 𐂂 • View Channel button
│ 𐂂 • Sender profile thumbnail
│ 𐂂 • Forwarded many times
│ 𐂂 
│ 𐂂 OFF Mode:
│ 𐂂 • Normal messages
│ 𐂂 • No channel context
│ 𐂂 • No thumbnail
│ 𐂂 • No buttons
╰─────────────────────────⊷

To enable: ${prefix}channel on
To disable: ${prefix}channel off
`
        return await sock.sendMessage(from, {
          text: helpText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── IF NO ARGS: SHOW CURRENT STATUS ONLY ────────────
      if (!input) {
        const statusInfo = `
╭─────〔 ${botname} CHANNEL 〕─────┈⊷
│ 𐂂 Current Status: ${currentStatus? 'ON' : 'OFF'}
│ 𐂂 Messages: ${currentStatus? 'With forwarded context' : 'Normal only'}
╰─────────────────────────⊷

╭─────〔 TOGGLE STATUS 〕─────┈⊷
│ 𐂂 ${prefix}channel on
│ 𐂂 ${prefix}channel off
╰─────────────────────────⊷

╭─────〔 GET HELP 〕─────┈⊷
│ 𐂂 ${prefix}channel help
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: statusInfo.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── VALIDATE INPUT ──────────────────────────────────
      const validInputs = ['on', 'off']

      if (!validInputs.includes(input)) {
        return await sock.sendMessage(from, {
          text: `❌ Invalid option\n\nValid options: on, off\n\nExample: ${prefix}channel on\n\nFor help: ${prefix}channel help`,
          contextInfo
        }, { quoted: m })
      }

      // ─── CHECK IF ALREADY SET ────────────────────────────
      const newStatus = input === 'on'
      if (currentStatus === newStatus) {
        return await sock.sendMessage(from, {
          text: `ℹ️ Channel forward is already ${input.toUpperCase()}`,
          contextInfo
        }, { quoted: m })
      }

      // ─── SET NEW STATUS ──────────────────────────────────
      await db.set('channelEnabled', newStatus)

      const successText = `
╭─────〔 CHANNEL CHANGED 〕─────┈⊷
│ 𐂂 Previous: ${currentStatus? 'ON' : 'OFF'}
│ 𐂂 Current: ${input.toUpperCase()}
╰─────────────────────────⊷

Channel forward ${input === 'on'? 'enabled' : 'disabled'} ✅
`
      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo: newStatus? contextInfo : null
      }, { quoted: m })

      logger.success('CHANNEL', `Channel forward changed from ${currentStatus} to ${input} by ${m.key.participant || from}`)

    } catch (e) {
      logger.error('CHANNEL', 'Failed to toggle channel', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to change channel: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}