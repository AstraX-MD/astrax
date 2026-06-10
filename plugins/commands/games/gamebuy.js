/**
 * AstraX - plugins/commands/games/gamebuy.js
 * Game Buy - Purchase backgrounds with XP
 * Category: games
 */

import assets from '../economy/assets.js'
import { buyBackground } from '../../utils/gameXP.js'

export default {
  name: 'gamebuy',
  alias: ['gbuy', 'bgbuy'],
  desc: 'Buy game background with XP',
  category: 'games',
  usage: 'gamebuy <background>',
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
          text: `Usage: ${prefix}gamebuy <background>\nExample: ${prefix}gamebuy matrix`,
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

      const result = await buyBackground(db, from, sender, bg.id)

      if (!result.success) {
        await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
        return await sock.sendMessage(from, {
          text: `Purchase failed: ${result.error}`,
          contextInfo
        }, { quoted: m })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

      const successText = `
╭─────〔 PURCHASE SUCCESS 〕─────┈⊷
│ ◦➛ Background: ${bg.name}
│ ◦➛ Cost: ${bg.price.toLocaleString()} XP
│ ◦➛ Remaining XP: ${result.newXP.toLocaleString()}
├─────────────────────────⊷
│ ◦➛ Equip: ${prefix}gameset ${bg.id}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: successText.trim(),
        contextInfo
      }, { quoted: m })

    } catch (e) {
      logger.error('GAMEBUY', 'Buy failed', e.message)
      await sock.sendMessage(from, {
        text: 'Failed to purchase background',
        contextInfo
      }, { quoted: m })
    }
  }
}