/**
 * AstraX - plugins/commands/network/ssl.js
 * SSL Certificate Checker with 20 free API fallbacks
 * Silent fallback - user never sees errors
 */

import axios from 'axios'

export default {
  name: 'ssl',
  alias: ['sslcheck', 'cert', 'certificate', 'https'],
  desc: 'Check SSL certificate info for any domain',
  category: 'network',
  usage: 'ssl <domain>',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── VALIDATE INPUT ───────────────────────────────────
      let domain = args[0]?.trim().toLowerCase()

      if (!domain) {
        const errorText = `
╭─────〔 SSL CHECKER 〕─────┈⊷
│ ◦➛ Usage: ${prefix}ssl <domain>
│ ◦➛ Example: ${prefix}ssl google.com
│ ◦➛ Example: ${prefix}ssl github.com
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── CLEAN DOMAIN ─────────────────────────────────────
      domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0]

      // ─── SSL APIS - 20 FREE FALLBACKS ─────────────────────
      const sslApis = [
        `https://api.ssllabs.com/api/v3/analyze?host=${domain}`,
        `https://api.sslmate.com/v1/certificates/${domain}`,
        `https://api.sslchecker.com/v1/check/${domain}`,
        `https://api.sslshopper.com/v1/check?domain=${domain}`,
        `https://api.geekflare.com/v1/ssl-check?url=${domain}`,
        `https://api.urlscan.io/v1/result/`,
        `https://crt.sh/?q=${domain}&output=json`,
        `https://api.censys.io/v1/view/certificates/${domain}`,
        `https://api.securitytrails.com/v1/domain/${domain}/ssl`,
        `https://api.viewdns.info/ssl/?domain=${domain}&apikey=demo&output=json`,
        `https://api.hackerwatch.org/ssl?target=${domain}`,
        `https://api.whoisxmlapi.com/sslapi?apiKey=demo&domainName=${domain}`,
        `https://api.sslyze.io/v1/scan?target=${domain}`,
        `https://api.robtex.com/ssl/${domain}`,
        `https://api.threatminer.org/v2/domain.php?q=${domain}&rt=3`,
        `https://api.binaryedge.io/v2/query/domains/subdomains/${domain}`,
        `https://api.fullhunt.io/v1/domain/${domain}/ssl`,
        `https://api.certspotter.com/v1/issuances?domain=${domain}`,
        `https://api.dnslytics.com/v1/certificates/${domain}`,
        `https://api.ssllabs.com/api/v3/getEndpointData?host=${domain}`
      ]

      let sslData = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < sslApis.length; i++) {
        try {
          const response = await axios.get(sslApis[i], {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // SSL Labs format
          if (data?.endpoints?.[0]) {
            const ep = data.endpoints[0]
            sslData = {
              domain: domain,
              valid: ep.grade!== 'T',
              issuer: ep.details?.cert?.issuerLabel || 'N/A',
              subject: ep.details?.cert?.subject || domain,
              validFrom: ep.details?.cert?.notBefore || null,
              validTo: ep.details?.cert?.notAfter || null,
              grade: ep.grade || 'N/A',
              protocol: ep.details?.protocols?.[0]?.name || 'N/A',
              keySize: ep.details?.cert?.keySize || 'N/A'
            }
            break
          }

          // Generic cert format
          if (data?.issuer || data?.issuer_name || data?.issuerName) {
            sslData = {
              domain: domain,
              valid: data.valid!== false,
              issuer: data.issuer || data.issuer_name || data.issuerName || 'N/A',
              subject: data.subject || data.subject_name || data.commonName || domain,
              validFrom: data.not_before || data.validFrom || data.start_date || null,
              validTo: data.not_after || data.validTo || data.expiry_date || null,
              grade: data.grade || data.rating || 'N/A',
              protocol: data.protocol || data.tls_version || 'N/A',
              keySize: data.key_size || data.keySize || 'N/A'
            }
            break
          }

          // crt.sh format - array
          if (Array.isArray(data) && data.length > 0) {
            const cert = data[0]
            sslData = {
              domain: domain,
              valid: true,
              issuer: cert.issuer_name || 'N/A',
              subject: cert.name_value || domain,
              validFrom: cert.not_before || null,
              validTo: cert.not_after || null,
              grade: 'N/A',
              protocol: 'N/A',
              keySize: 'N/A'
            }
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!sslData) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to check SSL
│ ◦➛ Domain may not use HTTPS
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── FORMAT DATES ─────────────────────────────────────
      const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A'
        try {
          return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        } catch {
          return dateStr
        }
      }

      // ─── CALCULATE DAYS LEFT ──────────────────────────────
      let daysLeft = 'N/A'
      if (sslData.validTo) {
        try {
          const expiry = new Date(sslData.validTo)
          const now = new Date()
          const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
          daysLeft = diff > 0? `${diff} days` : 'Expired'
        } catch {
          daysLeft = 'N/A'
        }
      }

      // ─── DETERMINE STATUS ─────────────────────────────────
      const isValid = sslData.valid && daysLeft!== 'Expired'
      const statusEmoji = isValid? '🟢' : '🔴'
      const statusText = isValid? 'Valid' : 'Invalid/Expired'

      // ─── BUILD RESULT MESSAGE ─────────────────────────────
      const resultText = `
╭─────〔 SSL CERT 〕─────┈⊷
│ ◦➛ Domain: ${sslData.domain}
│ ◦➛ Status: ${statusEmoji} ${statusText}
│ ◦➛ Grade: ${sslData.grade}
╰─────────────────────────⊷

╭─────〔 DETAILS 〕─────┈⊷
│ ◦➛ Issuer: ${sslData.issuer}
│ ◦➛ Protocol: ${sslData.protocol}
│ ◦➛ Key Size: ${sslData.keySize} bit
╰─────────────────────────⊷

╭─────〔 VALIDITY 〕─────┈⊷
│ ◦➛ Issued: ${formatDate(sslData.validFrom)}
│ ◦➛ Expires: ${formatDate(sslData.validTo)}
│ ◦➛ Days Left: ${daysLeft}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('SSL', `SSL check: ${domain} - ${statusText}`)

    } catch (e) {
      logger.error('SSL', 'SSL check failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to check SSL
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}