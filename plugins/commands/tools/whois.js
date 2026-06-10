/**
 * AstraX - plugins/commands/tools/whois.js
 * Domain WHOIS Lookup with 20 free API fallbacks
 * Silent fallback - user never sees errors
 */

import axios from 'axios'

export default {
  name: 'whois',
  alias: ['domain', 'domaininfo', 'lookup'],
  desc: 'Get WHOIS information for any domain',
  category: 'tools',
  usage: 'whois <domain>',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── VALIDATE INPUT ───────────────────────────────────
      let domain = args[0]?.trim().toLowerCase()

      if (!domain) {
        const errorText = `
╭─────〔 WHOIS LOOKUP 〕─────┈⊷
│ ◦➛ Usage: ${prefix}whois <domain>
│ ◦➛ Example: ${prefix}whois google.com
│ ◦➛ Example: ${prefix}whois github.com
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── CLEAN DOMAIN ─────────────────────────────────────
      domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

      // ─── WHOIS APIS - 20 FREE FALLBACKS ───────────────────
      const whoisApis = [
        `https://api.whois.vu/?q=${domain}`,
        `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=demo&domainName=${domain}&outputFormat=JSON`,
        `https://api.api-ninjas.com/v1/whois?domain=${domain}`,
        `https://whoisjson.com/api/v1/whois?domain=${domain}`,
        `https://rdap.org/domain/${domain}`,
        `https://api.domainsdb.info/v1/domains/search?domain=${domain}`,
        `https://api.ip2whois.com/v2?key=demo&domain=${domain}`,
        `https://api.whoapi.com/?apikey=demo&r=whois&domain=${domain}`,
        `https://jsonwhoisapi.com/api/v1/whois?identifier=${domain}`,
        `https://api.fullcontact.com/v3/person.enrich`,
        `https://api.viewdns.info/whois/?domain=${domain}&apikey=demo&output=json`,
        `https://api.hackerwatch.org/whois?target=${domain}`,
        `https://api.whoislookupapi.com/v1/whois?domain=${domain}`,
        `https://api.jsonwhois.com/v1/whois?domain=${domain}`,
        `https://whois.toolforge.org/whois/${domain}`,
        `https://api.greynoise.io/v3/riot/${domain}`,
        `https://api.threatminer.org/v2/domain.php?q=${domain}&rt=1`,
        `https://api.urlscan.io/v1/search/?q=domain:${domain}`,
        `https://api.securitytrails.com/v1/domain/${domain}`,
        `https://api.whoisds.com/v1/domain/${domain}`
      ]

      let whoisData = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < whoisApis.length; i++) {
        try {
          const response = await axios.get(whoisApis[i], {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // Parse different API formats
          if (data && (data.domain || data.domain_name || data.name)) {
            whoisData = {
              domain: data.domain || data.domain_name || data.name || domain,
              registrar: data.registrar || data.sponsoringRegistrar || data.registrar_name || 'N/A',
              created: data.created || data.created_date || data.creationDate || data.creation_date || 'N/A',
              updated: data.updated || data.updated_date || data.updatedDate || 'N/A',
              expires: data.expires || data.expiry_date || data.expirationDate || data.expiration_date || 'N/A',
              status: data.status || data.domain_status || 'N/A',
              nameServers: data.nameServers || data.nameservers || data.name_servers || data.nameserver || [],
              org: data.org || data.registrant || data.registrant_organization || 'N/A',
              country: data.country || data.registrant_country || 'N/A'
            }
            break
          }

          // RDAP format
          if (data?.ldhName) {
            const events = data.events || []
            const created = events.find(e => e.eventAction === 'registration')?.eventDate
            const expires = events.find(e => e.eventAction === 'expiration')?.eventDate

            whoisData = {
              domain: data.ldhName,
              registrar: data.entities?.[0]?.vcardArray?.[1]?.[1]?.[3] || 'N/A',
              created: created || 'N/A',
              updated: 'N/A',
              expires: expires || 'N/A',
              status: data.status?.[0] || 'N/A',
              nameServers: data.nameservers?.map(ns => ns.ldhName) || [],
              org: 'N/A',
              country: 'N/A'
            }
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!whoisData) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to lookup domain
│ ◦➛ Check domain name
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── FORMAT DATES ─────────────────────────────────────
      const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A'
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

      const nsList = Array.isArray(whoisData.nameServers)
       ? whoisData.nameServers.slice(0, 3).join('\n│ ◦➛ ')
        : 'N/A'

      // ─── BUILD RESULT MESSAGE ─────────────────────────────
      const resultText = `
╭─────〔 WHOIS INFO 〕─────┈⊷
│ ◦➛ Domain: ${whoisData.domain}
│ ◦➛ Registrar: ${whoisData.registrar}
│ ◦➛ Status: ${Array.isArray(whoisData.status)? whoisData.status[0] : whoisData.status}
╰─────────────────────────⊷

╭─────〔 DATES 〕─────┈⊷
│ ◦➛ Created: ${formatDate(whoisData.created)}
│ ◦➛ Updated: ${formatDate(whoisData.updated)}
│ ◦➛ Expires: ${formatDate(whoisData.expires)}
╰─────────────────────────⊷

╭─────〔 DETAILS 〕─────┈⊷
│ ◦➛ Organization: ${whoisData.org}
│ ◦➛ Country: ${whoisData.country}
│ ◦➛ NameServers:
│ ◦➛ ${nsList}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('WHOIS', `WHOIS lookup: ${whoisData.domain}`)

    } catch (e) {
      logger.error('WHOIS', 'WHOIS lookup failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to lookup domain
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}