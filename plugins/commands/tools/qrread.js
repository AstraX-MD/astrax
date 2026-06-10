/**
 * AstraX - plugins/commands/tools/qread.js
 * QR Code Reader/Decoder
 * Reads QR from image with multiple API fallbacks
 */

import axios from 'axios'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  name: 'qread',
  alias: ['readqr', 'scanqr', 'decodeqr', 'qrscan'],
  desc: 'Read/Decode QR code from image',
  category: 'tools',
  usage: 'qread [reply to image]',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── CHECK FOR IMAGE ──────────────────────────────────
      const quoted = m.quoted ? m.quoted : m
      const mime = quoted.mimetype || quoted.msg?.mimetype || ''

      if (!/image/.test(mime)) {
        const errorText = `
╭─────〔 QR READER 〕─────┈⊷
│ ◦➛ Reply to QR image
│ ◦➛ Usage: ${prefix}qread [reply]
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── DOWNLOAD IMAGE ───────────────────────────────────
      const media = await downloadMediaMessage(
        quoted,
        'buffer',
        {},
        { logger }
      )

      if (!media) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to download image
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── QR DECODE APIS - SILENT FALLBACKS ────────────────
      const base64Image = media.toString('base64')

      const decodeApis = [
        {
          url: 'https://api.qrserver.com/v1/read-qr-code/',
          method: 'post',
          data: { file: `data:image/jpeg;base64,${base64Image}` }
        },
        {
          url: 'https://api.api-ninjas.com/v1/qrcode?file=',
          method: 'post',
          data: base64Image,
          headers: { 'Content-Type': 'image/jpeg' }
        },
        {
          url: 'https://zxing.org/w/decode',
          method: 'post',
          data: { u: `data:image/jpeg;base64,${base64Image}` }
        }
      ]

      let decodedText = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (const api of decodeApis) {
        try {
          const response = await axios({
            method: api.method,
            url: api.url,
            data: api.data,
            headers: api.headers || {},
            timeout: 10000
          })

          // Parse different API responses
          if (response.data?.[0]?.symbol?.[0]?.data) {
            decodedText = response.data[0].symbol[0].data
            break
          }
          if (response.data?.text) {
            decodedText = response.data.text
            break
          }
          if (response.data?.data) {
            decodedText = response.data.data
            break
          }
          if (typeof response.data === 'string' && response.data.length > 0) {
            decodedText = response.data
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!decodedText || decodedText.trim() === '') {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ No QR code found
│ ◦➛ Make sure image is clear
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── SEND DECODED TEXT ────────────────────────────────
      const resultText = `
╭─────〔 QR DECODED 〕─────┈⊷
│ ◦➛ Content:
╰─────────────────────────⊷

${decodedText}
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('QREAD', `QR decoded for ${m.key.participant || from}`)

    } catch (e) {
      logger.error('QREAD', 'QR decode failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to read QR
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}