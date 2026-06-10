/**
 * AstraX - plugins/commands/owner/owner.js
 * Owner VCard Generator
 * Sends owner contact as VCard
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
      // ─── GET OWNER NUMBER FROM DB ──────────────────
      const ownerNumber = await db.get('owner')
      
      if (!ownerNumber) {
        return await sock.sendMessage(from, {
          text: '❌ Owner not configured',
          contextInfo
        }, { quoted: m })
      }

      // ─── GET OWNER NAME FROM DB ────────────────────
      const ownerName = await db.get('ownerName')
      const botname = await db.get('botname')
      const prefix = await db.get('prefix')

      // ─── CREATE VCARD ──────────────────────────────
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:${botname};
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD`

      // ─── SEND CONTACT WITH VCARD ───────────────────
      await sock.sendMessage(from, {
        contacts: {
          displayName: ownerName,
          contacts: [{ vcard }]
        },
        contextInfo
      })

      // ─── SEND INFO TEXT - ASTRAX BOX STYLE ─────────
      const infoText = `
> ╭─────〔 OWNER CONTACT 〕─────┈⊷
> │ 𐂂 Name: ${ownerName}
> │ 𐂂 Number: +${ownerNumber}
> │ 𐂂 Bot: ${botname}
> ╰─────────────────────────⊷

> Tap the contact above to save
> Type ${prefix}menu for commands
`

      await sock.sendMessage(from, {
        text: infoText.trim(),
        contextInfo
      }, { quoted: m })

      logger.success('OWNER', `VCard sent to ${m.key.participant || from}`)

    } catch (e) {
      logger.error('OWNER', 'Failed to send VCard', e.message)
      
      await sock.sendMessage(from, {
        text: `❌ Error\nFailed to generate VCard: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}