/**
 * AstraX - plugins/commands/owner/owner.js
 * Owner VCard Generator
 * Sends owner contact as VCard only
 */

export default {
  name: 'owner',
  alias: ['creator', 'dev', 'vcard'],
  desc: 'Get owner contact as VCard',
  category: 'owner',
  usage: '.owner',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from }) {
    try {
      // ─── GET OWNER DATA FROM DB ─────────────────────────
      const [ownerNumber, ownerName, botname] = await Promise.all([
        db.get('owner'),
        db.get('ownerName'),
        db.get('botname')
      ])

      if (!ownerNumber) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Owner not configured
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      const actualName = ownerName || 'Owner'
      const actualBot = botname || 'Bot'

      // ─── CREATE VCARD ───────────────────────────────────
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${actualName}
ORG:${actualBot};
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD`

      // ─── SEND CONTACT WITH VCARD ────────────────────────
      await sock.sendMessage(from, {
        contacts: {
          displayName: actualName,
          contacts: [{ vcard }]
        },
        contextInfo
      }, { quoted: m })

      logger.success('OWNER', `VCard sent to ${m.key.participant || from}`)

    } catch (e) {
      logger.error('OWNER', 'Failed to send VCard', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to generate VCard
│ ◦➛ ${e.message}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}