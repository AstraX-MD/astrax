/**
 * AstraX - plugins/commands/owner/mode.js
 * Set bot mode: public | private | groups | dm
 * Shows current mode only. Use help for details
 */

export default {
  name: 'mode',
  alias: ['setmode', 'botmode'],
  desc: 'View or change bot mode',
  category: 'owner',
  usage: '.mode [public/private/groups/dm/help]',
  permission: 'owner',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      const currentMode = await db.get('mode')
      const prefix = await db.get('prefix')
      const botname = await db.get('botname')
      const input = args[0]?.toLowerCase()
      const helpMode = args[1]?.toLowerCase()

      // ─── HELP COMMAND:.mode help dm ─────────────────────
      if (input === 'help' && helpMode) {
        const validModes = ['public', 'private', 'groups', 'dm']

        if (!validModes.includes(helpMode)) {
          return await sock.sendMessage(from, {
            text: `❌ Invalid mode\n\nValid modes: public, private, groups, dm\n\nExample: ${prefix}mode help public`,
            contextInfo
          }, { quoted: m })
        }

        const helpText = `
╭─────〔 ${helpMode.toUpperCase()} MODE 〕─────┈⊷
${getModeBehavior(helpMode)}
╰─────────────────────────⊷

To set this mode: ${prefix}mode ${helpMode}
`
        return await sock.sendMessage(from, {
          text: helpText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── IF NO ARGS: SHOW CURRENT MODE ONLY ──────────────
      if (!input) {
        const modeInfo = `
╭─────〔 ${botname} MODE 〕─────┈⊷
│ 𐂂 Current Mode: ${currentMode.toUpperCase()}
╰─────────────────────────⊷

╭─────〔 CHANGE MODE 〕─────┈⊷
│ 𐂂 ${prefix}mode public
│ 𐂂 ${prefix}mode private
│ 𐂂 ${prefix}mode groups
│ 𐂂 ${prefix}mode dm
╰─────────────────────────⊷

╭─────〔 GET HELP 〕─────┈⊷
│ 𐂂 ${prefix}mode help public
│ 𐂂 ${prefix}mode help private
│ 𐂂 ${prefix}mode help groups
│ 𐂂 ${prefix}mode help dm
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: modeInfo.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── VALIDATE MODE ───────────────────────────────────
      const validModes = ['public', 'private', 'groups', 'dm']

      if (!validModes.includes(input)) {
        return await sock.sendMessage(from, {
          text: `❌ Invalid mode\n\nValid modes: public, private, groups, dm\n\nExample: ${prefix}mode public\n\nFor help: ${prefix}mode help ${input}`,
          contextInfo
        }, { quoted: m })
      }

      // ─── CHECK IF ALREADY SET ────────────────────────────
      if (currentMode === input) {
        return await sock.sendMessage(from, {
          text: `ℹ️ Mode is already set to ${input.toUpperCase()}`,
          contextInfo
        }, { quoted: m })
      }

      // ─── SET NEW MODE ────────────────────────────────────
      await db.set('mode', input)

      const successText = `
╭─────〔 MODE CHANGED 〕─────┈⊷
│ 𐂂 Previous: ${currentMode.toUpperCase()}
│ 𐂂 Current: ${input.toUpperCase()}
╰─────────────────────────⊷

Mode updated successfully ✅
`
      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('MODE', `Mode changed from ${currentMode} to ${input} by ${m.key.participant || from}`)

    } catch (e) {
      logger.error('MODE', 'Failed to set mode', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to change mode: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}

// ─── HELPER: GET MODE BEHAVIOR DESCRIPTION ─────────────────
function getModeBehavior(mode) {
  const behaviors = {
    public: `│ 𐂂 Responds to: Everyone\n│ 𐂂 Works in: Groups + DM\n│ 𐂂 Best for: Public bots`,
    private: `│ 𐂂 Responds to: Owner only\n│ 𐂂 Works in: All chats\n│ 𐂂 Best for: Testing/Dev`,
    groups: `│ 𐂂 Responds to: Everyone\n│ 𐂂 Works in: Groups only\n│ 𐂂 Best for: Group bots`,
    dm: `│ 𐂂 Responds to: Everyone\n│ 𐂂 Works in: DM only\n│ 𐂂 Best for: Personal assistant`
  }
  return behaviors[mode] || `│ 𐂂 Custom mode active`
}