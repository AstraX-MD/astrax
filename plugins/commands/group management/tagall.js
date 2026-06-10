/**
 * AstraX - plugins/commands/group management/tagall.js
 * Tag All Command - Tag all members with visible mentions INSIDE BOX
 * Supports: Text, Image, Video, Audio, Sticker, Document
 * Category: group management
 */

export default {
  name: 'tagall',
  alias: ['everyone', 'all', 'mentionall'],
  desc: 'Tag all group members with visible mentions',
  category: 'group management',
  usage: 'tagall <text> | reply to media with tagall',
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

      // ─── BUILD MENTIONS INSIDE BOX ────────────────────────
      const mentionsList = participants.map(p => `│ ◦➛ @${p.split('@')[0]}`).join('\n')
      const headerText = `╭─────〔 TAG ALL 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata.subject}
│ ◦➛ Members: ${participants.length}
├─────────────────────────⊷
`
      const footerText = `╰─────────────────────────⊷`

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

          const captionText = text || quoted.imageMessage.caption || 'Tagging all members'
          const fullCaption = `${headerText}│ ◦➛ ${captionText}\n├─────────────────────────⊷\n${mentionsList}\n${footerText}`

          await sock.sendMessage(from, {
            image: buffer,
            caption: fullCaption.trim(),
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('TAGALL', `Tagged ${participants.length} members with image`)
          return
        } catch (e) {
          logger.error('TAGALL', 'Failed to send image', e.message)
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

          const captionText = text || quoted.videoMessage.caption || 'Tagging all members'
          const fullCaption = `${headerText}│ ◦➛ ${captionText}\n├─────────────────────────⊷\n${mentionsList}\n${footerText}`

          await sock.sendMessage(from, {
            video: buffer,
            caption: fullCaption.trim(),
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('TAGALL', `Tagged ${participants.length} members with video`)
          return
        } catch (e) {
          logger.error('TAGALL', 'Failed to send video', e.message)
        }
      }

      // Case 3: Reply to Audio - FIXED PTT
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
            mimetype: quoted.audioMessage.mimetype || 'audio/ogg; codecs=opus',
            ptt: quoted.audioMessage.ptt === true, // Fixed: proper boolean
            mentions: participants,
            contextInfo
          }, { quoted: m })

          const notifyText = `${headerText}│ ◦➛ Audio message for all\n├─────────────────────────⊷\n${mentionsList}\n${footerText}`
          await sock.sendMessage(from, {
            text: notifyText.trim(),
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('TAGALL', `Tagged ${participants.length} members with audio`)
          return
        } catch (e) {
          logger.error('TAGALL', 'Failed to send audio', e.message)
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

          const notifyText = `${headerText}│ ◦➛ Sticker for all\n├─────────────────────────⊷\n${mentionsList}\n${footerText}`
          await sock.sendMessage(from, {
            text: notifyText.trim(),
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('TAGALL', `Tagged ${participants.length} members with sticker`)
          return
        } catch (e) {
          logger.error('TAGALL', 'Failed to send sticker', e.message)
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

          const captionText = text || `Document: ${quoted.documentMessage.fileName}`
          const fullCaption = `${headerText}│ ◦➛ ${captionText}\n├─────────────────────────⊷\n${mentionsList}\n${footerText}`

          await sock.sendMessage(from, {
            document: buffer,
            mimetype: quoted.documentMessage.mimetype,
            fileName: quoted.documentMessage.fileName,
            caption: fullCaption.trim(),
            mentions: participants,
            contextInfo
          }, { quoted: m })

          logger.success('TAGALL', `Tagged ${participants.length} members with document`)
          return
        } catch (e) {
          logger.error('TAGALL', 'Failed to send document', e.message)
        }
      }

      // Case 6: Reply to Text or Args only
      const messageText = text || 
                          quoted?.conversation ||
                          quoted?.extendedTextMessage?.text || 
                          'Attention everyone!'

      // ─── SEND TEXT TAGALL - ALL INSIDE BOX ────────────────
      const fullMessage = `${headerText}│ ◦➛ ${messageText}\n├─────────────────────────⊷\n${mentionsList}\n${footerText}`

      try {
        await sock.sendMessage(from, {
          text: fullMessage.trim(),
          mentions: participants,
          contextInfo
        }, { quoted: m })

        logger.success('TAGALL', `Tagged ${participants.length} members`)

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

        logger.error('TAGALL', 'Failed to tagall', errMsg)
        return await sock.sendMessage(from, {
          text: errorText.trim(),
          contextInfo
        }, { quoted: m })
      }

    } catch (e) {
      logger.error('TAGALL', 'Tagall command failed', e.message)

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