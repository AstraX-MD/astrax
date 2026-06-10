/**
 * AstraX - plugins/commands/owner/enablecmd.js
 * Enable command globally or per-group
 * Usage:.enablecmd menu |.enablecmd menu group
 */

export default {
  name: 'enablecmd',
  alias: ['ecmd', 'oncmd'],
  desc: 'Enable command globally or in group',
  category: 'owner',
  usage: '.enablecmd <name> [group]',
  permission: 'owner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup }) {
    try {
      const prefix = await db.get('prefix')
      const botname = await db.get('botname')
      const cmdName = args[0]?.toLowerCase()
      const scope = args[1]?.toLowerCase()

      // ─── IF NO ARGS: SHOW DISABLED LIST ────────────────────
      if (!cmdName) {
        const globalDisabled = (await db.get('disabledCmds')) || []
        let groupDisabled = []

        if (isGroup) {
          groupDisabled = (await db.getGroupKey(from, 'disabledCmds')) || []
        }

        const listText = `
╭─────〔 ${botname} ENABLE 〕─────┈⊷
│ ◦➛ Global Disabled: ${globalDisabled.length? globalDisabled.join(', ') : 'None'}
│ ◦➛ Group Disabled: ${groupDisabled.length? groupDisabled.join(', ') : 'None'}
╰─────────────────────────⊷

╭─────〔 USAGE 〕─────┈⊷
│ ◦➛ ${prefix}enablecmd menu
│ ◦➛ ${prefix}enablecmd menu group
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: listText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── CHECK IF GROUP SCOPE IN DM ───────────────────────
      if (scope === 'group' &&!isGroup) {
        return await sock.sendMessage(from, {
          text: `❌ Group scope only works in groups\n\nExample: ${prefix}enablecmd ${cmdName} group`,
          contextInfo
        }, { quoted: m })
      }

      // ─── ENABLE GLOBALLY ──────────────────────────────────
      if (!scope || scope!== 'group') {
        const disabledCmds = (await db.get('disabledCmds')) || []

        if (!disabledCmds.includes(cmdName)) {
          return await sock.sendMessage(from, {
            text: `ℹ️ Command *${cmdName}* is already enabled globally`,
            contextInfo
          }, { quoted: m })
        }

        const updated = disabledCmds.filter(c => c!== cmdName)
        await db.set('disabledCmds', updated)

        const successText = `
╭─────〔 COMMAND ENABLED 〕─────┈⊷
│ ◦➛ Command: ${cmdName}
│ ◦➛ Scope: Global
│ ◦➛ Status: Enabled
╰─────────────────────────⊷

Command enabled globally ✅
`
        await sock.sendMessage(from, {
          text: successText.trim(),
          contextInfo
        }, { quoted: m })

        logger.success('ENABLECMD', `Enabled ${cmdName} globally by ${m.key.participant || from}`)

      // ─── ENABLE IN GROUP ──────────────────────────────────
      } else {
        const groupDisabled = (await db.getGroupKey(from, 'disabledCmds')) || []

        if (!groupDisabled.includes(cmdName)) {
          return await sock.sendMessage(from, {
            text: `ℹ️ Command *${cmdName}* is already enabled in this group`,
            contextInfo
          }, { quoted: m })
        }

        const updated = groupDisabled.filter(c => c!== cmdName)
        await db.setGroupKey(from, 'disabledCmds', updated)

        const successText = `
╭─────〔 COMMAND ENABLED 〕─────┈⊷
│ ◦➛ Command: ${cmdName}
│ ◦➛ Scope: This Group
│ ◦➛ Status: Enabled
╰─────────────────────────⊷

Command enabled in group ✅
`
        await sock.sendMessage(from, {
          text: successText.trim(),
          contextInfo
        }, { quoted: m })

        logger.success('ENABLECMD', `Enabled ${cmdName} in group ${from} by ${m.key.participant || from}`)
      }

    } catch (e) {
      logger.error('ENABLECMD', 'Failed to enable command', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to enable command: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}