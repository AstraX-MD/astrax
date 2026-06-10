/**
 * AstraX - plugins/commands/games/gamesconfig.js
 * Games Config - Owner control for picture mode
 * Category: games
 */

export default {
  name: 'gamesconfig',
  alias: ['gameconfig', 'gameset'],
  desc: 'Configure games - Owner only',
  category: 'games',
  usage: 'gamesconfig pic on/off',
  permission: 'owner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup }) {
    try {
      if (!isGroup) {
        return await sock.sendMessage(from, {
          text: 'This command only works in groups',
          contextInfo
        }, { quoted: m })
      }

      const action = args[0]?.toLowerCase()
      const value = args[1]?.toLowerCase()

      if (action === 'pic' && (value === 'on' || value === 'off')) {
        const picMode = value === 'on'
        await db.set(`game_settings_${from}`, { picMode })

        await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

        const statusText = `
╭─────〔 GAMES CONFIG 〕─────┈⊷
│ ◦➛ Picture Mode: ${picMode? 'ON ✅' : 'OFF ❌'}
│ ◦➛ Group: ${m.pushName || 'Group'}
├─────────────────────────⊷
│ ◦➛ ${picMode? 'Games will now use pictures' : 'Games will use text only'}
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: statusText.trim(),
          contextInfo
        }, { quoted: m })
      }

      const settings = await db.get(`game_settings_${from}`) || { picMode: false }

      const configText = `
╭─────〔 GAMES CONFIG 〕─────┈⊷
│ ◦➛ Picture Mode: ${settings.picMode? 'ON ✅' : 'OFF ❌'}
├─────────────────────────⊷
│ ◦➛ Usage:.gamesconfig pic on/off
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: configText.trim(),
        contextInfo
      }, { quoted: m })

    } catch (e) {
      logger.error('GAMESCONFIG', 'Config failed', e.message)
      await sock.sendMessage(from, {
        text: 'Failed to update config',
        contextInfo
      }, { quoted: m })
    }
  }
}