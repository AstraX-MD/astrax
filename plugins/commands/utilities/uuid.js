/**
 * AstraX - plugins/commands/utilities/uuid.js
 * UUID/GUID Generator with 20 free API fallbacks
 * Silent fallback - user never sees errors
 * Local fallback for offline generation
 */

import axios from 'axios'
import crypto from 'crypto'

export default {
  name: 'uuid',
  alias: ['guid', 'uuidgen', 'genid', 'randomid'],
  desc: 'Generate UUID v1/v4 or multiple UUIDs',
  category: 'utilities',
  usage: 'uuid [count] [v1|v4]',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── PARSE ARGUMENTS ──────────────────────────────────
      let count = parseInt(args[0]) || 1
      const version = args[1]?.toLowerCase() || 'v4'

      // ─── VALIDATE COUNT ───────────────────────────────────
      if (count < 1) count = 1
      if (count > 10) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Too many UUIDs requested
│ ◦➛ Max: 10 at once
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── VALIDATE VERSION ─────────────────────────────────
      if (!['v1', 'v4'].includes(version)) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Invalid UUID version
│ ◦➛ Use: v1 or v4
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── UUID APIS - 20 FREE FALLBACKS ────────────────────
      const uuidApis = [
        `https://www.uuidgenerator.net/api/version4/${count}`,
        `https://www.uuidtools.com/api/generate/${version}/${count}`,
        `https://api.uuidapi.com/v1/uuid?count=${count}&version=${version}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.uuidgenerator.net/api/version4/${count}`)}`,
        `https://api.codetabs.com/v1/proxy?quest=https://www.uuidgenerator.net/api/version4/${count}`,
        `https://api.cors.lol/?url=https://www.uuidgenerator.net/api/version4/${count}`,
        `https://api.uuidgenerator.org/v1/${version}/${count}`,
        `https://api.guidgenerator.com/v1/generate?count=${count}&version=${version}`,
        `https://api.randomuuid.com/v1/generate?count=${count}&version=${version}`,
        `https://api.uuidservice.com/v1/generate?count=${count}&version=${version}`,
        `https://api.texttools.io/v1/uuid/generate?count=${count}&version=${version}`,
        `https://api.devutils.com/v1/uuid/generate?count=${count}&version=${version}`,
        `https://api.converttools.com/v1/uuid/generate?count=${count}`,
        `https://api.stringtools.io/v1/uuid/generate?count=${count}`,
        `https://api.enctools.com/v1/uuid/generate?count=${count}`,
        `https://api.webtools.com/v1/uuid/generate?count=${count}`,
        `https://api.online-tools.com/v1/uuid/generate?count=${count}`,
        `https://api.utilitytools.com/v1/uuid/generate?count=${count}`,
        `https://api.devtools.io/v1/uuid/generate?count=${count}`,
        `https://api.coderstools.com/v1/uuid/generate?count=${count}`
      ]

      let uuids = []

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < uuidApis.length; i++) {
        try {
          const response = await axios.get(uuidApis[i], {
            timeout: 7000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // Text response - split by newlines
          if (typeof data === 'string' && data.trim()) {
            uuids = data.trim().split('\n').filter(u => u.trim()).slice(0, count)
            if (uuids.length > 0) break
          }

          // JSON array response
          if (Array.isArray(data) && data.length > 0) {
            uuids = data.slice(0, count)
            break
          }

          // JSON object response
          if (data?.uuids || data?.result || data?.data || data?.uuid) {
            const result = data.uuids || data.result || data.data || [data.uuid]
            uuids = Array.isArray(result)? result.slice(0, count) : [result]
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── LOCAL FALLBACK GENERATOR ─────────────────────────
      if (uuids.length === 0) {
        for (let i = 0; i < count; i++) {
          if (version === 'v4') {
            uuids.push(crypto.randomUUID())
          } else {
            // Simple v1-like fallback using timestamp
            const timestamp = Date.now().toString(16)
            const random = crypto.randomBytes(10).toString('hex')
            uuids.push(`${timestamp.slice(0, 8)}-${timestamp.slice(8, 12)}-1${random.slice(0, 3)}-${random.slice(3, 7)}-${random.slice(7, 19)}`)
          }
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (uuids.length === 0) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to generate UUID
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── BUILD UUID LIST ──────────────────────────────────
      const uuidList = uuids.map((uuid, idx) => `${idx + 1}. ${uuid}`).join('\n')

      // ─── BUILD RESULT MESSAGE ─────────────────────────────
      const resultText = `
╭─────〔 UUID GENERATOR 〕─────┈⊷
│ ◦➛ Version: ${version.toUpperCase()}
│ ◦➛ Count: ${uuids.length}
╰─────────────────────────⊷

\`\`\`
${uuidList}
\`\`\`

╭─────〔 USAGE 〕─────┈⊷
│ ◦➛ ${prefix}uuid
│ ◦➛ ${prefix}uuid 5
│ ◦➛ ${prefix}uuid 3 v1
╰─────────────────────────⊷
`
      const mainMsg = await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      // ─── SEND UUIDS AGAIN FOR EASY COPY ───────────────────
      const copyText = uuids.join('\n')
      await sock.sendMessage(from, {
        text: copyText,
        contextInfo
      }, { quoted: mainMsg })

      logger.success('UUID', `Generated ${uuids.length} UUID ${version}`)

    } catch (e) {
      logger.error('UUID', 'UUID generation failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to generate
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}