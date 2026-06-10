/**
 * AstraX - plugins/commands/tools/translate.js
 * Universal Translator with google-translate-api-x + 20 API fallbacks
 * Supports all languages + reply message + short code
 */

import translate from 'google-translate-api-x'
import axios from 'axios'

export default {
  name: 'translate',
  alias: ['tr', 'tl', 'trans', 't'],
  desc: 'Translate text to any language',
  category: 'tools',
  usage: 'tr <lang> <text> | reply message',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── GET TEXT TO TRANSLATE ────────────────────────────
      let textToTranslate = ''
      let targetLang = args[0]?.toLowerCase()
      const quoted = m.quoted

      // Check if replying to message
      if (quoted && quoted.body &&!args[1]) {
        // Usage:.tr sw [reply]
        textToTranslate = quoted.body
      } else if (quoted && args[1]) {
        // Usage:.tr sw water [reply] - args override reply
        textToTranslate = args.slice(1).join(' ')
      } else {
        // Usage:.tr sw water
        textToTranslate = args.slice(1).join(' ')
      }

      // ─── VALIDATE INPUT ───────────────────────────────────
      if (!targetLang ||!textToTranslate) {
        const errorText = `
╭─────〔 TRANSLATOR 〕─────┈⊷
│ ◦➛ Usage: ${prefix}tr <lang> <text>
│ ◦➛ Reply: ${prefix}tr <lang> [reply]
│ ◦➛ Example: ${prefix}tr sw hello
│ ◦➛ Example: ${prefix}tr en habari
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── CLEAN LANG CODE ──────────────────────────────────
      targetLang = targetLang.replace(/[^a-z]/g, '').slice(0, 5)

      if (targetLang.length < 2) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Invalid language code
│ ◦➛ Use: en, sw, fr, es, etc
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      let translatedText = null

      // ─── TRY GOOGLE-TRANSLATE-API-X FIRST ─────────────────
      try {
        const result = await translate(textToTranslate, { to: targetLang })
        if (result?.text) {
          translatedText = result.text
        }
      } catch (e) {
        // Silent fail, try fallbacks
      }

      // ─── 20 FREE API FALLBACKS IF GOOGLE FAILS ────────────
      if (!translatedText) {
        const translateApis = [
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`,
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${targetLang}`,
          `https://api.lingva.ml/api/v1/auto/${targetLang}/${encodeURIComponent(textToTranslate)}`,
          `https://simplytranslate.org/api/translate?engine=google&from=auto&to=${targetLang}&text=${encodeURIComponent(textToTranslate)}`,
          `https://libretranslate.de/translate`,
          `https://translate.argosopentech.com/translate`,
          `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`,
          `https://translate.terraprint.co/translate`,
          `https://de.libretranslate.com/translate`,
          `https://translate.fedilab.app/translate`,
          `https://api-free.deepl.com/v2/translate`,
          `https://api.reverso.net/translate/v1/translation`,
          `https://api.pawan.krd/translate?to=${targetLang}&text=${encodeURIComponent(textToTranslate)}`,
          `https://translate.api.skitzen.com/?text=${encodeURIComponent(textToTranslate)}&to=${targetLang}`,
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(textToTranslate)}`,
          `https://api.itranslate.com/translate`,
          `https://api.nlpcloud.io/v1/translation`,
          `https://api.textgears.com/translate`,
          `https://api.yandex.com/translate`,
          `https://api.aiforthai.in.th/translate`
        ]

        for (let i = 0; i < translateApis.length; i++) {
          try {
            let response

            // POST APIs
            if (translateApis[i].includes('libretranslate') || translateApis[i].includes('argosopentech')) {
              response = await axios.post(translateApis[i], {
                q: textToTranslate,
                source: 'auto',
                target: targetLang,
                format: 'text'
              }, {
                timeout: 7000,
                headers: { 'Content-Type': 'application/json' }
              })

              if (response.data?.translatedText) {
                translatedText = response.data.translatedText
                break
              }
            } else {
              // GET APIs
              response = await axios.get(translateApis[i], {
                timeout: 7000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              })

              const data = response.data

              // Google format: [[["translated","original"]]]
              if (Array.isArray(data) && data[0]?.[0]?.[0]) {
                translatedText = data[0][0][0]
                break
              }

              // MyMemory format
              if (data?.responseData?.translatedText) {
                translatedText = data.responseData.translatedText
                break
              }

              // Lingva format
              if (data?.translation) {
                translatedText = data.translation
                break
              }

              // Generic format
              if (data?.translated || data?.text || data?.result) {
                translatedText = data.translated || data.text || data.result
                break
              }
            }
          } catch (e) {
            continue
          }
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!translatedText || translatedText.trim() === '') {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Translation failed
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── SEND ONLY TRANSLATED TEXT - NO EXTRAS ────────────
      await sock.sendMessage(from, {
        text: translatedText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('TRANSLATE', `Translated to ${targetLang} for ${m.key.participant || from}`)

    } catch (e) {
      logger.error('TRANSLATE', 'Translation failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Translation failed
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}