/**
 * AstraX - plugins/commands/utilities/password.js
 * Password Generator with 20 free API fallbacks
 * Silent fallback - user never sees errors
 * Local fallback for offline generation
 * Sends password twice for easy copy
 */

import axios from 'axios'
import crypto from 'crypto'

export default {
  name: 'password',
  alias: ['pass', 'passwd', 'genpass', 'passgen'],
  desc: 'Generate secure random password',
  category: 'utilities',
  usage: 'password [length] [options]',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── PARSE ARGUMENTS ──────────────────────────────────
      let length = parseInt(args[0]) || 12
      const options = args.slice(1).join(' ').toLowerCase()

      // ─── VALIDATE LENGTH ──────────────────────────────────
      if (length < 4) length = 4
      if (length > 64) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Password too long
│ ◦➛ Max: 64 characters
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── PARSE OPTIONS ────────────────────────────────────
      const useSymbols =!options.includes('nosym') &&!options.includes('nosymbol')
      const useNumbers =!options.includes('nonum') &&!options.includes('nonumber')
      const useUpper =!options.includes('nolower') &&!options.includes('noupper')

      // ─── PASSWORD APIS - 20 FREE FALLBACKS ────────────────
      const passwordApis = [
        `https://api.passwordgenerator.org/v1/generate?length=${length}&symbols=${useSymbols}&numbers=${useNumbers}&uppercase=${useUpper}`,
        `https://api.passgen.io/v1/generate?length=${length}&symbols=${useSymbols}&digits=${useNumbers}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.passwordgenerator.org/v1/generate?length=${length}`)}`,
        `https://api.codetabs.com/v1/proxy?quest=https://api.passwordgenerator.org/v1/generate?length=${length}`,
        `https://api.cors.lol/?url=https://api.passwordgenerator.org/v1/generate?length=${length}`,
        `https://api.passgenerator.com/v1/create?length=${length}&symbols=${useSymbols}`,
        `https://api.securepass.com/v1/generate?length=${length}&special=${useSymbols}`,
        `https://api.strongpass.org/v1/generate?length=${length}&symbols=${useSymbols}`,
        `https://api.passtools.com/v1/generate?length=${length}&symbols=${useSymbols}`,
        `https://api.texttools.io/v1/password/generate?length=${length}`,
        `https://api.devutils.com/v1/password/generate?length=${length}`,
        `https://api.converttools.com/v1/password/generate?length=${length}`,
        `https://api.stringtools.io/v1/password/generate?length=${length}`,
        `https://api.enctools.com/v1/password/generate?length=${length}`,
        `https://api.webtools.com/v1/password/generate?length=${length}`,
        `https://api.online-tools.com/v1/password/generate?length=${length}`,
        `https://api.utilitytools.com/v1/password/generate?length=${length}`,
        `https://api.devtools.io/v1/password/generate?length=${length}`,
        `https://api.coderstools.com/v1/password/generate?length=${length}`,
        `https://api.progtools.com/v1/password/generate?length=${length}`
      ]

      let password = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < passwordApis.length; i++) {
        try {
          const response = await axios.get(passwordApis[i], {
            timeout: 7000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // Text response
          if (typeof data === 'string' && data.trim() && data.length >= 4) {
            password = data.trim()
            break
          }

          // JSON response
          if (data?.password || data?.result || data?.data || data?.pass) {
            password = data.password || data.result || data.data || data.pass
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── LOCAL FALLBACK GENERATOR ─────────────────────────
      if (!password) {
        const chars = {
          lower: 'abcdefghijklmnopqrstuvwxyz',
          upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          numbers: '0123456789',
          symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        }

        let charset = chars.lower
        if (useUpper) charset += chars.upper
        if (useNumbers) charset += chars.numbers
        if (useSymbols) charset += chars.symbols

        const bytes = crypto.randomBytes(length)
        password = Array.from(bytes, byte => charset[byte % charset.length]).join('')
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!password || password.length < 4) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to generate password
│ ◦➛ Try again later
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── CALCULATE STRENGTH ───────────────────────────────
      let strength = 'Weak'
      let strengthEmoji = '🔴'

      if (password.length >= 16 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        strength = 'Very Strong'
        strengthEmoji = '🟢'
      } else if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
        strength = 'Strong'
        strengthEmoji = '🟡'
      } else if (password.length >= 8) {
        strength = 'Medium'
        strengthEmoji = '🟠'
      }

      // ─── BUILD RESULT MESSAGE ─────────────────────────────
      const resultText = `
╭─────〔 PASSWORD 〕─────┈⊷
│ ◦➛ Length: ${password.length}
│ ◦➛ Strength: ${strengthEmoji} ${strength}
│ ◦➛ Uppercase: ${useUpper? '✓' : '✗'}
│ ◦➛ Numbers: ${useNumbers? '✓' : '✗'}
│ ◦➛ Symbols: ${useSymbols? '✓' : '✗'}
╰─────────────────────────⊷

\`\`\`
${password}
\`\`\`

╭─────〔 USAGE 〕─────┈⊷
│ ◦➛ ${prefix}password 16
│ ◦➛ ${prefix}password 12 nosym
│ ◦➛ ${prefix}password 20 nonum
╰─────────────────────────⊷
`
      const mainMsg = await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      // ─── SEND PASSWORD AGAIN FOR EASY COPY ────────────────
      await sock.sendMessage(from, {
        text: password,
        contextInfo
      }, { quoted: mainMsg })

      logger.success('PASSWORD', `Password generated: ${length} chars - ${strength}`)

    } catch (e) {
      logger.error('PASSWORD', 'Password generation failed', e.message)

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