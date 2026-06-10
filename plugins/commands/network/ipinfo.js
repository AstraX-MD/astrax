/**
 * AstraX - plugins/commands/network/ipinfo.js
 * IP Geolocation & Info with 20 free API fallbacks
 * Silent fallback - user never sees errors
 */

import axios from 'axios'

export default {
  name: 'ipinfo',
  alias: ['ip', 'iplookup', 'geoip', 'ipaddr'],
  desc: 'Get detailed information about any IP address',
  category: 'network',
  usage: 'ipinfo <ip>',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── VALIDATE INPUT ───────────────────────────────────
      let ip = args[0]?.trim()

      if (!ip) {
        const errorText = `
╭─────〔 IP INFO 〕─────┈⊷
│ ◦➛ Usage: ${prefix}ipinfo <ip>
│ ◦➛ Example: ${prefix}ipinfo 8.8.8.8
│ ◦➛ Example: ${prefix}ipinfo 1.1.1.1
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── CLEAN IP/DOMAIN ──────────────────────────────────
      ip = ip.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0]

      // ─── IP INFO APIS - 20 FREE FALLBACKS ─────────────────
      const ipApis = [
        `https://ipapi.co/${ip}/json/`,
        `https://ipinfo.io/${ip}/json`,
        `https://api.ipgeolocation.io/ipgeo?apiKey=demo&ip=${ip}`,
        `https://api.ipstack.com/${ip}?access_key=demo`,
        `https://api.iplocation.net/?ip=${ip}`,
        `https://api.ipdata.co/${ip}?api-key=test`,
        `https://api.bigdatacloud.net/data/ip-geolocation?ip=${ip}`,
        `https://api.db-ip.com/v2/free/${ip}`,
        `https://api.2ip.io/${ip}?token=demo`,
        `https://api.ipify.org?format=json&ip=${ip}`,
        `https://api.myip.com/${ip}`,
        `https://api.hackertarget.com/geoip/?q=${ip}`,
        `https://api.geodatatool.com/v1/ip/${ip}`,
        `https://api.viewdns.info/ipinfo/?ip=${ip}&apikey=demo&output=json`,
        `https://api.greynoise.io/v3/community/${ip}`,
        `https://api.threatminer.org/v2/host.php?q=${ip}&rt=1`,
        `https://api.robtex.com/ip/${ip}`,
        `https://api.censys.io/v1/view/ipv4/${ip}`,
        `https://api.shodan.io/shodan/host/${ip}?key=demo`,
        `https://api.binaryedge.io/v2/query/ip/${ip}`
      ]

      let ipData = null

      // ─── TRY ALL APIS SILENTLY ────────────────────────────
      for (let i = 0; i < ipApis.length; i++) {
        try {
          const response = await axios.get(ipApis[i], {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          const data = response.data

          // Parse different API formats
          if (data && (data.ip || data.query || data.ipAddress)) {
            ipData = {
              ip: data.ip || data.query || data.ipAddress || ip,
              city: data.city || data.city_name || 'N/A',
              region: data.region || data.region_name || data.state_prov || 'N/A',
              country: data.country || data.country_name || data.countryCode || 'N/A',
              countryCode: data.country_code || data.countryCode || data.country_iso_code || 'N/A',
              postal: data.postal || data.zip || data.zip_code || 'N/A',
              timezone: data.timezone || data.time_zone || 'N/A',
              isp: data.isp || data.org || data.organization || data.asn?.organization || 'N/A',
              asn: data.asn || data.as || data.asn_number || 'N/A',
              lat: data.latitude || data.lat || 'N/A',
              lon: data.longitude || data.lon || data.lng || 'N/A',
              hostname: data.hostname || data.reverse || 'N/A'
            }
            break
          }

          // Shodan format
          if (data?.ip_str) {
            ipData = {
              ip: data.ip_str,
              city: data.city || 'N/A',
              region: data.region_code || 'N/A',
              country: data.country_name || 'N/A',
              countryCode: data.country_code || 'N/A',
              postal: 'N/A',
              timezone: 'N/A',
              isp: data.isp || data.org || 'N/A',
              asn: data.asn || 'N/A',
              lat: data.latitude || 'N/A',
              lon: data.longitude || 'N/A',
              hostname: data.hostnames?.[0] || 'N/A'
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
│ ◦➛ Hostname: ${ipData.hostname}
╰─────────────────────────⊷

╭─────〔 LOCATION 〕─────┈⊷
│ ◦➛ Country: ${ipData.country} (${ipData.countryCode})
│ ◦➛ Region: ${ipData.region}
│ ◦➛ City: ${ipData.city}
│ ◦➛ Postal: ${ipData.postal}
│ ◦➛ Timezone: ${ipData.timezone}
╰─────────────────────────⊷

╭─────〔 NETWORK 〕─────┈⊷
│ ◦➛ ISP: ${ipData.isp}
│ ◦➛ ASN: ${ipData.asn}
│ ◦➛ Lat/Lon: ${ipData.lat}, ${ipData.lon}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: resultText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('IPINFO', `IP lookup: ${ipData.ip} - ${ipData.country}`)

    } catch (e) {
      logger.error('IPINFO', 'IP lookup failed', e.message)

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