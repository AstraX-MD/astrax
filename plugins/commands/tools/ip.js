/**
 * AstraX - plugins/commands/tools/ip.js
 * IP Lookup with 20 free API fallbacks
 * Silent fallback - user never sees errors
 */

import axios from 'axios'

export default {
  name: 'ip',
  alias: ['ipinfo', 'iplookup', 'ipaddr', 'geoip'],
  desc: 'Get detailed information about IP address',
  category: 'tools',
  usage: 'ip <ip_address>',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── VALIDATE INPUT ───────────────────────────────────
      const ip = args[0]?.trim()

      if (!ip) {
        const errorText = `
╭─────〔 IP LOOKUP 〕─────┈⊷
│ ◦➛ Usage: ${prefix}ip <ip>
│ ◦➛ Example: ${prefix}ip 8.8.8.8
│ ◦➛ Your IP: ${prefix}ip me
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── GET USER IP IF 'me' ──────────────────────────────
      let targetIp = ip.toLowerCase() === 'me'? '' : ip

      // ─── IP INFO APIS - 20 FREE FALLBACKS ─────────────────
      const ipApis = [
        `https://ipapi.co/${targetIp}/json/`,
        `https://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
        `https://ipwho.is/${targetIp}`,
        `https://freeipapi.com/api/json/${targetIp}`,
        `https://ipinfo.io/${targetIp}/json`,
        `https://api.ipgeolocation.io/ipgeo?ip=${targetIp}`,
        `https://api.iplocation.net/?ip=${targetIp}`,
        `https://api.ip.sb/geoip/${targetIp}`,
        `https://ipdata.co/${targetIp}?api-key=test`,
        `https://api.ipregistry.co/${targetIp}?key=tryout`,
        `https://get.geojs.io/v1/ip/geo/${targetIp}.json`,
        `https://ip.guide/${targetIp}`,
        `https://reallyfreegeoip.org/json/${targetIp}`,
        `https://api.db-ip.com/v2/free/${targetIp}`,
        `https://ipapi.com/ip_api.php?ip=${targetIp}`,
        `https://api.hackertarget.com/geoip/?q=${targetIp}`,
        `https://api.findip.net/${targetIp}/?token=free`,
        `https://api.bigdatacloud.net/data/ip-geolocation?ip=${targetIp}&localityLanguage=en`,
        `https://ip.apimon.de/${targetIp}`,
        `https://ip.awk.sh/${targetIp}`
      ]

      let ipData = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < ipApis.length; i++) {
        try {
          const response = await axios.get(ipApis[i], {
            timeout: 7000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // Normalize different API responses
          if (data && (data.ip || data.query || data.ipAddress)) {
            ipData = {
              ip: data.ip || data.query || data.ipAddress || targetIp,
              country: data.country || data.country_name || data.countryName || 'Unknown',
              countryCode: data.country_code || data.countryCode || data.country || 'N/A',
              region: data.region || data.region_name || data.regionName || 'Unknown',
              city: data.city || 'Unknown',
              zip: data.zip || data.postal || 'N/A',
              lat: data.latitude || data.lat || 0,
              lon: data.longitude || data.lon || 0,
              timezone: data.timezone || data.time_zone || 'Unknown',
              isp: data.isp || data.org || data.asn?.organisation || data.company?.name || 'Unknown',
              org: data.org || data.organization || data.asn?.name || 'Unknown',
              as: data.as || data.asn || 'N/A'
            }
            break
          }
        } catch (e) {
          continue
        }
      }

      // ─── IF ALL FAILED ────────────────────────────────────
      if (!ipData) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to lookup IP
│ ◦➛ Check IP address
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── BUILD RESULT MESSAGE ─────────────────────────────
      const resultText = `
╭─────〔 IP INFO 〕─────┈⊷
│ ◦➛ IP: ${ipData.ip}
│ ◦➛ Country: ${ipData.country} ${ipData.countryCode!== 'N/A'? `(${ipData.countryCode})` : ''}
│ ◦➛ Region: ${ipData.region}
│ ◦➛ City: ${ipData.city}
│ ◦➛ ZIP: ${ipData.zip}
╰─────────────────────────⊷

╭─────〔 LOCATION 〕─────┈⊷
│ ◦➛ Latitude: ${ipData.lat}
│ ◦➛ Longitude: ${ipData.lon}
│ ◦➛ Timezone: ${ipData.timezone}
╰─────────────────────────⊷

╭─────〔 NETWORK 〕─────┈⊷
│ ◦➛ ISP: ${ipData.isp}
│ ◦➛ Org: ${ipData.org}
│ ◦➛ ASN: ${ipData.as}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('IP', `IP lookup: ${ipData.ip} for ${m.key.participant || from}`)

    } catch (e) {
      logger.error('IP', 'IP lookup failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to lookup IP
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}