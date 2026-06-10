/**
 * AstraX - plugins/commands/all/menu.js
 * Display bot menu with image from DB
 * Shows all commands grouped by category
 */

import { getAllCategories } from '../../../system/loader.js'

export default {
  name: 'menu',
  alias: ['help', 'commands', 'list'],
  desc: 'Display bot command menu',
  category: 'General',
  usage: '.menu',
  permission: 'all',

  async execute(sock, m, args, { db, fonts, logger, contextInfo, from, prefix, isOwner }) {
    try {
      const [botname, owner, mode, noPrefix] = await Promise.all([
        db.get('botname'),
        db.get('owner'),
        db.get('mode'),
        db.get('noPrefix')
      ])

      // ─── GET BOT IMAGE FROM DB ─────────────────────────────
      let botImage = await db.get('botimage')
      if (!botImage) {
        botImage = 'https://i.ibb.co/QvGY7dqB/file-00000000e1107243ad54749c06fe2d80.png'
      }

      // ─── GET ALL CATEGORIES & COMMANDS ────────────────────
      const categories = getAllCategories()
      const totalCmds = categories.reduce((sum, cat) => sum + cat.commands.length, 0)

      // ─── BUILD MENU TEXT ──────────────────────────────────
      let menuText = `
╭─────〔 ${botname} MENU 〕─────┈⊷
│ ◦➛ Owner: +${owner || 'Not Set'}
│ ◦➛ Mode: ${mode?.toUpperCase() || 'PUBLIC'}
│ ◦➛ Prefix: ${prefix}
│ ◦➛ NoPrefix: ${noPrefix === 'only'? 'ONLY' : noPrefix === 'both'? 'BOTH' : 'OFF'}
│ ◦➛ Total Cmds: ${totalCmds}
╰─────────────────────────⊷
`

      // ─── ADD CATEGORIES ───────────────────────────────────
      for (const category of categories) {
        if (category.commands.length === 0) continue
        
        // Skip owner category for non-owners
        if (category.name === 'owner' &&!isOwner) continue

        menuText += `\n╭─────〔 ${category.name.toUpperCase()} 〕─────┈⊷\n`
        
        for (const cmd of category.commands) {
          menuText += `│ ◦➛ ${prefix}${cmd.name}\n`
        }
        
        menuText += `╰─────────────────────────⊷`
      }

      menuText += `\n\n╭─────〔 INFO 〕─────┈⊷
│ ◦➛ Type ${prefix}help <cmd> for details
│ ◦➛ Example: ${prefix}help menu
╰─────────────────────────⊷`

      // ─── SEND MENU WITH IMAGE ─────────────────────────────
      await sock.sendMessage(from, {
        image: { url: botImage },
        caption: menuText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('MENU', `Menu sent to ${m.key.participant || from}`)

    } catch (e) {
      logger.error('MENU', 'Failed to send menu', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to load menu: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}