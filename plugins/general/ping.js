/**
 * AstraX - plugins/commands/general/ping.js
 * Check bot response speed and uptime
 * Shows latency and system info
 */

import os from 'os'

export default {
  name: 'ping',
  alias: ['p', 'speed', 'latency'],
  desc: 'Check bot response speed',
  category: 'general',
  usage: '.ping',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      const start = Date.now()
      
      // ─── GET SYSTEM INFO ─────────────────────────────
      const [botname, mode, prefix] = await Promise.all([
        db.get('botname'),
        db.get('mode'),
        db.get('prefix')
      ])

      const uptime = process.uptime()
      const days = Math.floor(uptime / 86400)
      const hours = Math.floor((uptime % 86400) / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      const seconds = Math.floor(uptime % 60)

      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`
      const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
      const platform = os.platform()
      const latency = Date.now() - start

      // ─── BUILD PING TEXT ─────────────────────────────
      const pingText = `
╭─────〔 ${botname} PING 〕─────┈⊷
│ ◦➛ Speed: ${latency}ms
│ ◦➛ Uptime: ${uptimeStr}
│ ◦➛ Mode: ${mode?.toUpperCase() || 'PUBLIC'}
│ ◦➛ Prefix: ${prefix}
│ ◦➛ Memory: ${memory} MB
│ ◦➛ Platform: ${platform}
╰─────────────────────────⊷

Bot is active and responsive ✅
`

      await sock.sendMessage(from, {
        text: pingText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('PING', `Ping: ${latency}ms by ${m.key.participant || from}`)

    } catch (e) {
      logger.error('PING', 'Failed to ping', e.message)

      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to ping: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}