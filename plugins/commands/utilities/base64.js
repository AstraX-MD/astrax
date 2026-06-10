/**
 * AstraX - plugins/commands/utilities/base64.js
 * Base64 Encode/Decode with 20 free API fallbacks
 * Silent fallback - user never sees errors
 * Supports reply to message
 */

import axios from 'axios'

export default {
  name: 'base64',
  alias: ['b64', 'base', 'encode', 'decode'],
  desc: 'Encode or decode Base64 text',
  category: 'utilities',
  usage: 'base64 <encode|decode> [text] or reply to message',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── GET TEXT FROM REPLY OR ARGS ──────────────────────
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || ''

      const action = args[0]?.toLowerCase()
      const argText = args.slice(1).join(' ').trim()
      const text = quotedText || argText

      if (!action ||!text) {
        const errorText = `
╭─────〔 BASE64 〕─────┈⊷
│ ◦➛ Usage: ${prefix}base64 <encode|decode> [text]
│ ◦➛ Or reply to a message
│ ◦➛ Example: ${prefix}base64 encode Hello
│ ◦➛ Example: ${prefix}base64 decode SGVsbG8=
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      if (!['encode', 'decode', 'enc', 'dec'].includes(action)) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Invalid action
│ ◦➛ Use: encode or decode
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

      const isEncode = ['encode', 'enc'].includes(action)

      // ─── BASE64 APIS - 20 FREE FALLBACKS ──────────────────
      const base64Apis = isEncode? [
        `https://api.hackertarget.com/base64encode/?q=${encodeURIComponent(text)}`,
        `https://api.base64api.com/v1/encode?text=${encodeURIComponent(text)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.hackertarget.com/base64encode/?q=${encodeURIComponent(text)}`)}`,
        `https://api.codetabs.com/v1/proxy?quest=https://api.hackertarget.com/base64encode/?q=${encodeURIComponent(text)}`,
        `https://api.cors.lol/?url=https://api.hackertarget.com/base64encode/?q=${encodeURIComponent(text)}`,
        `https://api.base64encode.org/v1/encode?text=${encodeURIComponent(text)}`,
        `https://api.encode64.com/v1/encode?data=${encodeURIComponent(text)}`,
        `https://api.base64tools.com/v1/encode?text=${encodeURIComponent(text)}`,
        `https://api.texttools.io/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.devutils.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.converttools.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.stringtools.io/v1/base64/encode?data=${encodeURIComponent(text)}`,
        `https://api.encodetools.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.webtools.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.online-tools.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.utilitytools.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.devtools.io/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.coderstools.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.progtools.com/v1/base64/encode?text=${encodeURIComponent(text)}`,
        `https://api.textutils.com/v1/base64/encode?text=${encodeURIComponent(text)}`
      ] : [
        `https://api.hackertarget.com/base64decode/?q=${encodeURIComponent(text)}`,
        `https://api.base64api.com/v1/decode?text=${encodeURIComponent(text)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.hackertarget.com/base64decode/?q=${encodeURIComponent(text)}`)}`,
        `https://api.codetabs.com/v1/proxy?quest=https://api.hackertarget.com/base64decode/?q=${encodeURIComponent(text)}`,
        `https://api.cors.lol/?url=https://api.hackertarget.com/base64decode/?q=${encodeURIComponent(text)}`,
        `https://api.base64decode.org/v1/decode?text=${encodeURIComponent(text)}`,
        `https://api.decode64.com/v1/decode?data=${encodeURIComponent(text)}`,
        `https://api.base64tools.com/v1/decode?text=${encodeURIComponent(text)}`,
        `https://api.texttools.io/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.devutils.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.converttools.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.stringtools.io/v1/base64/decode?data=${encodeURIComponent(text)}`,
        `https://api.decodetools.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.webtools.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.online-tools.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.utilitytools.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.devtools.io/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.coderstools.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.progtools.com/v1/base64/decode?text=${encodeURIComponent(text)}`,
        `https://api.textutils.com/v1/base64/decode?text=${encodeURIComponent(text)}`
      ]

      let result = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < base64Apis.length; i++) {
        try {
          const response = await axios.get(base64Apis[i], {
            timeout: 7000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // Text response
          if (typeof data === 'string' && data.trim()) {
            result = data.trim()
            break
          }

          // JSON response
          if (data?.result || data?.data || data?.output) {
            result = data.result || data.data || data.output
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── LOCAL FALLBACK ───────────────────────────────────
      if (!result) {
        try {
          result = isEncode
         ? Buffer.from(text, 'utf8').toString('base64')
            : Buffer.from(text, 'base64').toString('utf8')
        } catch (e) {
          // Silent fail
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!result) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to ${isEncode? 'encode' : 'decode'}
│ ◦➛ Check your input
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── TRUNCATE LONG RESULTS ────────────────────────────
      const displayResult = result.length > 1500? result.slice(0, 1500) + '...' : result

      // ─── BUILD RESULT MESSAGE - NO INPUT SHOWN ────────────
      const resultText = `
╭─────〔 BASE64 ${isEncode? 'ENCODE' : 'DECODE'} 〕─────┈⊷
│ ◦➛ Result:
╰─────────────────────────⊷

${displayResult}
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('BASE64', `Base64 ${isEncode? 'encode' : 'decode'} success`)

    } catch (e) {
      logger.error('BASE64', 'Base64 operation failed', e.message)

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