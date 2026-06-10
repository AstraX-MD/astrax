/**
 * AstraX - plugins/commands/games/gameset.js
 * Game Set - Equip owned background
 * Category: games
 */

import assets from '../economy/assets.js'
import { setBackground } from '../../utils/gameXP.js'

export default {
  name: 'gameset',
  alias: ['gset', 'bgset'],
  desc: 'Equip your game background',
  category: 'games',
  usage: 'gameset <background>',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, sender, isGroup, prefix }) {
    try {
      if (!isGroup) {
        return await sock.sendMessage(from, {
          text: 'This command only works in groups',
          contextInfo
        }, { quoted: m })
      }

      const bgName = args[0]?.toLowerCase()
      if (!bgName) {
        return await sock.sendMessage(from, {
          text: `Usage: ${prefix}gameset <background>\nExample: ${prefix}gameset matrix`,
          contextInfo
        }, { quoted: m })
      }

      const bg = Object.values(assets).find(b => b.id === bgName || b.name.toLowerCase() === bgName)
      if (!bg) {
        return await sock.sendMessage(from, {
          text: `Background not found. Use ${prefix}gameshop to see all`,
          contextInfo
        }, { quoted: m })
      }

      const result = await setBackground(db, from, sender, bg.id)

      if (!result.success) {
        await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
        return await sock.sendMessage(from, {
          text: result.error,
          contextInfo
        }, { quoted: m })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

      const successText = `
╭─────〔 BACKGROUND SET 〕─────┈⊷
│ ◦➛ Active: ${bg.name}
│ ◦➛ Tier: ${bg.tier.toUpperCase()}
│ ◦➛ Glow: ${bg.glow}
├─────────────────────────⊷
│ ◦➛ Your games will now use this
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo
      }, { quoted: m })

    } catch (e) {
      logger.error('GAMESET', 'Set failed', e.message)
      await sock.sendMessage(from, {
        text: 'Failed to set background',
        contextInfo
      }, { quoted: m })
    }
  }
}