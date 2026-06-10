/**
 * AstraX - plugins/commands/utilities/hash.js
 * Hash Generator MD5/SHA1/SHA256 with 20 free API fallbacks
 * Silent fallback - user never sees errors
 * Supports reply to message
 */

import axios from 'axios'
import crypto from 'crypto'

export default {
  name: 'hash',
  alias: ['md5', 'sha1', 'sha256', 'checksum'],
  desc: 'Generate MD5, SHA1, or SHA256 hash',
  category: 'utilities',
  usage: 'hash <md5|sha1|sha256> [text] or reply to message',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── GET TEXT FROM REPLY OR ARGS ──────────────────────
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || ''

      const type = args[0]?.toLowerCase()
      const argText = args.slice(1).join(' ').trim()
      const text = quotedText || argText

      if (!type ||!text) {
        const errorText = `
╭─────〔 HASH GEN 〕─────┈⊷
│ ◦➛ Usage: ${prefix}hash <type> [text]
│ ◦➛ Or reply to a message
│ ◦➛ Types: md5, sha1, sha256
│ ◦➛ Example: ${prefix}hash md5 Hello
│ ◦➛ Example: ${prefix}hash sha256 test
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      if (!['md5', 'sha1', 'sha256'].includes(type)) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Invalid hash type
│ ◦➛ Use: md5, sha1, sha256
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── VALIDATE TEXT LENGTH ─────────────────────────────
      if (text.length > 2000) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Text too long
│ ◦➛ Max: 2000 characters
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── HASH APIS - 20 FREE FALLBACKS ────────────────────
      const hashApis = [
        `https://api.hashify.net/hash/${type}/hex?value=${encodeURIComponent(text)}`,
        `https://api.hashapi.com/v1/${type}?text=${encodeURIComponent(text)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.hashify.net/hash/${type}/hex?value=${encodeURIComponent(text)}`)}`,
        `https://api.codetabs.com/v1/proxy?quest=https://api.hashify.net/hash/${type}/hex?value=${encodeURIComponent(text)}`,
        `https://api.cors.lol/?url=https://api.hashify.net/hash/${type}/hex?value=${encodeURIComponent(text)}`,
        `https://api.hashgenerator.com/v1/${type}?text=${encodeURIComponent(text)}`,
        `https://api.cryptoapi.com/v1/hash/${type}?data=${encodeURIComponent(text)}`,
        `https://api.hashify.org/v1/${type}?text=${encodeURIComponent(text)}`,
        `https://api.hashtools.com/v1/${type}?text=${encodeURIComponent(text)}`,
        `https://api.texttools.io/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.devutils.com/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.converttools.com/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.stringtools.io/v1/hash/${type}?data=${encodeURIComponent(text)}`,
        `https://api.enctools.com/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.webtools.com/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.online-tools.com/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.utilitytools.com/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.devtools.io/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.coderstools.com/v1/hash/${type}?text=${encodeURIComponent(text)}`,
        `https://api.progtools.com/v1/hash/${type}?text=${encodeURIComponent(text)}`
      ]

      let result = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < hashApis.length; i++) {
        try {
          const response = await axios.get(hashApis[i], {
            timeout: 7000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // Text response
          if (typeof data === 'string' && data.trim()) {
            result = data.trim().toLowerCase()
            break
          }

          // JSON response
          if (data?.hash || data?.result || data?.data || data?.Digest) {
            result = (data.hash || data.result || data.data || data.Digest).toLowerCase()
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── LOCAL FALLBACK USING CRYPTO ──────────────────────
      if (!result) {
        try {
          result = crypto.createHash(type).update(text, 'utf8').digest('hex')
        } catch (e) {
          // Silent fail
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!result) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to generate hash
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── BUILD RESULT MESSAGE - NO INPUT SHOWN ────────────
      const resultText = `
╭─────〔 ${type.toUpperCase()} HASH 〕─────┈⊷
│ ◦➛ Algorithm: ${type.toUpperCase()}
╰─────────────────────────⊷

\`\`\`
${result}
\`\`\`
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('HASH', `${type.toUpperCase()} hash generated`)

    } catch (e) {
      logger.error('HASH', 'Hash generation failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to process
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}