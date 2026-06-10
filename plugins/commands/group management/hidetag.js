/**
 * AstraX - plugins/commands/group management/hidetag.js
 * Hidden Tag Command - Tag all members without showing mentions
 * Supports: Text, Image, Video, Audio, Sticker, Document
 * Category: group management
 */

export default {
  name: 'hidetag',
  alias: ['htag', 'ht', 'tag'],
  desc: 'Tag all group members silently',
  category: 'group management',
  usage: 'hidetag <text> | reply to media with hidetag',
  permission: 'isOwner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── CHECK IF GROUP ───────────────────────────────────
      if (!isGroup) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Group command only
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── GET GROUP METADATA ───────────────────────────────
      let groupMetadata
      try {
        groupMetadata = await sock.groupMetadata(from)
      } catch (e) {
        const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Bot needs to be in group
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      const participants = groupMetadata.participants.map(p => p.id)
      const text = args.join(' ').trim()

      // ─── CHECK IF REPLY TO MEDIA ──────────────────────────
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      // Case 1: Reply to Image
      if (quoted?.imageMessage) {
        try {
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
          const stream = await downloadContentFromMessage(quoted.imageMessage, 'image')
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }

          await sock.sendMessage(from, {
            image: buffer,
            caption: text || quoted.imageMessage.caption || '',
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('HIDETAG', `Tagged ${participants.length} members with image`)
          return
        } catch (e) {
          logger.error('HIDETAG', 'Failed to send image', e.message)
        }
      }

      // Case 2: Reply to Video
      if (quoted?.videoMessage) {
        try {
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
          const stream = await downloadContentFromMessage(quoted.videoMessage, 'video')
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }

          await sock.sendMessage(from, {
            video: buffer,
            caption: text || quoted.videoMessage.caption || '',
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('HIDETAG', `Tagged ${participants.length} members with video`)
          return
        } catch (e) {
          logger.error('HIDETAG', 'Failed to send video', e.message)
        }
      }

      // Case 3: Reply to Audio
      if (quoted?.audioMessage) {
        try {
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
          const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio')
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }

          await sock.sendMessage(from, {
            audio: buffer,
            mimetype: quoted.audioMessage.mimetype,
            ptt: quoted.audioMessage.ptt || false,
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('HIDETAG', `Tagged ${participants.length} members with audio`)
          return
        } catch (e) {
          logger.error('HIDETAG', 'Failed to send audio', e.message)
        }
      }

      // Case 4: Reply to Sticker
      if (quoted?.stickerMessage) {
        try {
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
          const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker')
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }

          await sock.sendMessage(from, {
            sticker: buffer,
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('HIDETAG', `Tagged ${participants.length} members with sticker`)
          return
        } catch (e) {
          logger.error('HIDETAG', 'Failed to send sticker', e.message)
        }
      }

      // Case 5: Reply to Document
      if (quoted?.documentMessage) {
        try {
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
          const stream = await downloadContentFromMessage(quoted.documentMessage, 'document')
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }

          await sock.sendMessage(from, {
            document: buffer,
            mimetype: quoted.documentMessage.mimetype,
            fileName: quoted.documentMessage.fileName,
            caption: text || '',
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('HIDETAG', `Tagged ${participants.length} members with document`)
          return
        } catch (e) {
          logger.error('HIDETAG', 'Failed to send document', e.message)
        }
      }

      // Case 6: Reply to Text or Args only
      const messageText = text || 
                          quoted?.conversation ||
                          quoted?.extendedTextMessage?.text || ''

      if (!messageText) {
        const errorText = `
╭─────〔 HIDETAG 〕─────┈⊷
│ ◦➛ Usage: ${prefix}hidetag <text>
│ ◦➛ Or reply to media
│ ◦➛ Tags all members
╰─────────────────────────⊷
`
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

      // ─── SEND TEXT HIDETAG ────────────────────────────────
      try {
        await sock.sendMessage(from, {
          text: messageText,
          mentions: participants,
          contextInfo
        }, { quoted: m })

        logger.success('HIDETAG', `Tagged ${participants.length} members`)

      } catch (e) {
        const errMsg = e.message || e.toString()
        let errorText = ''

        // Bot not admin
        if (errMsg.includes('403') || errMsg.includes('forbidden')) {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Bot needs admin rights
╰─────────────────────────⊷
`
        }
        // User not admin
        else if (errMsg.includes('401') || errMsg.includes('not-authorized')) {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ You need admin rights
╰─────────────────────────⊷
`
        }
        else {
          errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to tag members
╰─────────────────────────⊷
`
        }

        logger.error('HIDETAG', 'Failed to hidetag', errMsg)
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

    } catch (e) {
      logger.error('HIDETAG', 'Hidetag command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to execute
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}