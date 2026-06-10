/**
 * AstraX - plugins/commands/general/alive.js
 * Check if bot is alive and running
 * Shows bot status with image from DB
 */

import os from 'os'

export default {
  name: 'alive',
  alias: ['bot', 'online', 'uptime'],
  desc: 'Check if bot is alive',
  category: 'general',
  usage: '.alive',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, isOwner }) {
    try {
      const start = Date.now()
      
      // ─── GET BOT INFO FROM DB ─────────────────────────────
      const [botname, owner, mode, prefix, noPrefix] = await Promise.all([
        db.get('botname'),
        db.get('owner'),
        db.get('mode'),
        db.get('prefix'),
        db.get('noPrefix')
      ])

      // ─── GET BOT IMAGE FROM DB ─────────────────────────────
      let botImage = await db.get('botimage')
      if (!botImage) {
        botImage = 'https://i.ibb.co/QvGY7dqB/file-00000000e1107243ad54749c06fe2d80.png'
      }

      // ─── CALCULATE UPTIME ─────────────────────────────────
      const uptime = process.uptime()
      const days = Math.floor(uptime / 86400)
      const hours = Math.floor((uptime % 86400) / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      const seconds = Math.floor(uptime % 60)
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`

      // ─── SYSTEM STATS ─────────────────────────────────────
      const memory = (process.memoryUsage().heapUsed / 1024).toFixed(2)
      const platform = os.platform()
      const nodeVersion = process.version
      const latency = Date.now() - start

      // ─── NOPREFIX STATUS ──────────────────────────────────
      let npStatus = 'OFF'
      if (noPrefix === true || noPrefix === 'only') npStatus = 'ONLY'
      if (noPrefix === 'both') npStatus = 'BOTH'

      // ─── BUILD ALIVE TEXT ─────────────────────────────────
      const aliveText = `
╭─────〔 ${botname} ALIVE 〕─────┈⊷
│ ◦➛ Status: Online ✅
│ ◦➛ Speed: ${latency}ms
│ ◦➛ Uptime: ${uptimeStr}
│ ◦➛ Mode: ${mode?.toUpperCase() || 'PUBLIC'}
│ ◦➛ Prefix: ${prefix}
│ ◦➛ NoPrefix: ${npStatus}
│ ◦➛ Owner: +${owner || 'Not Set'}
│ ◦➛ Memory: ${memory} MB
│ ◦➛ Platform: ${platform}
│ ◦➛ Node: ${nodeVersion}
╰─────────────────────────⊷

╭─────〔 INFO 〕─────┈⊷
│ ◦➛ Type ${prefix}menu for commands
│ ◦➛ Type ${prefix}ping for latency
╰─────────────────────────⊷

${botname} is running smoothly 🚀
`

      // ─── SEND ALIVE WITH IMAGE ────────────────────────────
      await sock.sendMessage(from, {
        image: { url: botImage },
        caption: aliveText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('ALIVE', `Alive check: ${latency}ms by ${m.key.participant || from}`)

    } catch (e) {
      logger.error('ALIVE', 'Failed to send alive', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to check alive: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}