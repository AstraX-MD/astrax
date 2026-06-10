/**
 * AstraX - plugins/commands/owner/disablecmd.js
 * Disable command globally or per-group
 * Usage:.disablecmd menu |.disablecmd menu group
 */

export default {
  name: 'disablecmd',
  alias: ['dcmd', 'offcmd'],
  desc: 'Disable command globally or in group',
  category: 'owner',
  usage: '.disablecmd <name> [group]',
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
╭─────〔 ${botname} DISABLED 〕─────┈⊷
│ ◦➛ Global: ${globalDisabled.length? globalDisabled.join(', ') : 'None'}
│ ◦➛ Group: ${groupDisabled.length? groupDisabled.join(', ') : 'None'}
╰─────────────────────────⊷

╭─────〔 USAGE 〕─────┈⊷
│ ◦➛ ${prefix}disablecmd menu
│ ◦➛ ${prefix}disablecmd menu group
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
          text: `❌ Group scope only works in groups\n\nExample: ${prefix}disablecmd ${cmdName} group`,
          contextInfo
        }, { quoted: m })
      }

      // ─── DISABLE GLOBALLY ─────────────────────────────────
      if (!scope || scope!== 'group') {
        const disabledCmds = (await db.get('disabledCmds')) || []

        if (disabledCmds.includes(cmdName)) {
          return await sock.sendMessage(from, {
            text: `ℹ️ Command *${cmdName}* is already disabled globally`,
            contextInfo
          }, { quoted: m })
        }

        await db.push('disabledCmds', cmdName)

        const successText = `
╭─────〔 COMMAND DISABLED 〕─────┈⊷
│ ◦➛ Command: ${cmdName}
│ ◦➛ Scope: Global
│ ◦➛ Status: Disabled
╰─────────────────────────⊷

Command disabled globally ✅
`
        await sock.sendMessage(from, {
          text: successText.trim(),
          contextInfo
        }, { quoted: m })

        logger.success('DISABLECMD', `Disabled ${cmdName} globally by ${m.key.participant || from}`)

      // ─── DISABLE IN GROUP ─────────────────────────────────
      } else {
        const groupDisabled = (await db.getGroupKey(from, 'disabledCmds')) || []

        if (groupDisabled.includes(cmdName)) {
          return await sock.sendMessage(from, {
            text: `ℹ️ Command *${cmdName}* is already disabled in this group`,
            contextInfo
          }, { quoted: m })
        }

        groupDisabled.push(cmdName)
        await db.setGroupKey(from, 'disabledCmds', groupDisabled)

        const successText = `
╭─────〔 COMMAND DISABLED 〕─────┈⊷
│ ◦➛ Command: ${cmdName}
│ ◦➛ Scope: This Group
│ ◦➛ Status: Disabled
╰─────────────────────────⊷

Command disabled in group ✅
`
        await sock.sendMessage(from, {
          text: successText.trim(),
          contextInfo
        }, { quoted: m })

        logger.success('DISABLECMD', `Disabled ${cmdName} in group ${from} by ${m.key.participant || from}`)
      }

    } catch (e) {
      logger.error('DISABLECMD', 'Failed to disable command', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to disable command: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}