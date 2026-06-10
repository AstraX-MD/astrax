/**
 * AstraX - plugins/commands/tools/screenshot.js
 * Website Screenshot Generator with 20 free API fallbacks
 * Silent fallback - user never sees errors
 */

import axios from 'axios'

export default {
  name: 'screenshot',
  alias: ['ss', 'webshot', 'capture', 'snap'],
  desc: 'Take screenshot of any website',
  category: 'tools',
  usage: 'screenshot <url>',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── VALIDATE INPUT ───────────────────────────────────
      let url = args[0]?.trim()

      if (!url) {
        const errorText = `
╭─────〔 SCREENSHOT 〕─────┈⊷
│ ◦➛ Usage: ${prefix}ss <url>
│ ◦➛ Example: ${prefix}ss google.com
│ ◦➛ Example: ${prefix}ss https://github.com
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── ADD HTTPS IF MISSING ─────────────────────────────
      if (!url.startsWith('http://') &&!url.startsWith('https://')) {
        url = 'https://' + url
      }

      // ─── VALIDATE URL FORMAT ──────────────────────────────
      try {
        new URL(url)
      } catch (e) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Invalid URL format
│ ◦➛ Example: google.com
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── SCREENSHOT APIS - 20 FREE FALLBACKS ──────────────
      const screenshotApis = [
        `https://image.thum.io/get/width/1920/crop/1080/fullpage/${url}`,
        `https://api.screenshotmachine.com?key=demo&url=${encodeURIComponent(url)}&dimension=1920x1080`,
        `https://shot.screenshotapi.net/screenshot?token=demo&url=${encodeURIComponent(url)}&width=1920&height=1080`,
        `https://api.urlbox.io/v1/demo/png?url=${encodeURIComponent(url)}&width=1920&height=1080`,
        `https://api.apiflash.com/v1/urltoimage?access_key=demo&url=${encodeURIComponent(url)}`,
        `https://api.screenshotlayer.com/api/capture?access_key=demo&url=${encodeURIComponent(url)}`,
        `https://htmlcsstoimage.com/demo?url=${encodeURIComponent(url)}`,
        `https://api.page2images.com/restfullink?p2i_url=${encodeURIComponent(url)}&p2i_key=demo`,
        `https://api.site-shot.com/?url=${encodeURIComponent(url)}&width=1920&height=1080`,
        `https://api.webshrinker.com/v3/screenshot?url=${encodeURIComponent(url)}`,
        `https://mini.s-shot.ru/1920x1080/JPEG/1920/Z100/?${url}`,
        `https://api.screeenshotapi.io/screenshot?url=${encodeURIComponent(url)}`,
        `https://www.site-shot.com/screenshot/${url}`,
        `https://capture.fullpage.io/${url}`,
        `https://api.restpack.io/html2img?url=${encodeURIComponent(url)}`,
        `https://api.pagelr.com/capture?url=${encodeURIComponent(url)}`,
        `https://api.screenshotone.com/take?access_key=demo&url=${encodeURIComponent(url)}`,
        `https://api.snapito.com/web/shot?url=${encodeURIComponent(url)}`,
        `https://api.browshot.com/api/v1/screenshot/create?url=${encodeURIComponent(url)}`,
        `https://api.thumbalizr.com/?url=${encodeURIComponent(url)}&width=1920`
      ]

      let screenshotBuffer = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < screenshotApis.length; i++) {
        try {
          const response = await axios.get(screenshotApis[i], {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          if (response.status === 200 && response.data && response.data.length > 1000) {
            screenshotBuffer = response.data
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!screenshotBuffer) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to capture site
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── SEND SCREENSHOT ──────────────────────────────────
      await sock.sendMessage(from, {
        image: screenshotBuffer,
        caption: `╭─────〔 SCREENSHOT 〕─────┈⊷\n│ ◦➛ URL: ${url}\n│ ◦➛ Resolution: 1920x1080\n╰─────────────────────────⊷`,
        contextInfo
      }, { quoted: m })

      logger.success('SCREENSHOT', `Screenshot: ${url} for ${m.key.participant || from}`)

    } catch (e) {
      logger.error('SCREENSHOT', 'Screenshot failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to capture site
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}