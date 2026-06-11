/**
 * AstraX - plugins/observers/autolikestatus.js
 * Auto Like Status - Auto react to WhatsApp statuses with emojis
 * Category: observer
 */

async function getAutoLikeSettings(db) {
  return await db.get('autoLikeStatus') || {
    enabled: false,
    mode: 'all', // all | contacts | special | exclude
    specialContacts: [],
    excludeContacts: [],
    emojis: ['❤️', '👍', '🔥', '😂', '😮', '😢', '🙏', '💯'],
    random: true,
    specificEmoji: null,
    cooldown: 3000,
    chance: 100
  }
}

const likeCooldown = new Map()

function canLike(jid) {
  const now = Date.now()
  const last = likeCooldown.get(jid) || 0
  return now - last > 2000
}

function setLikeCooldown(jid, cooldown) {
  likeCooldown.set(jid, Date.now() + cooldown)
}

function shouldLikeByChance(chance) {
  return Math.random() * 100 < chance
}

function getRandomEmoji(emojis) {
  return emojis[Math.floor(Math.random() * emojis.length)]
}

export default {
  name: 'autolikestatus',
  event: 'messages.upsert',
  enabled: true,
  desc: 'Auto like WhatsApp statuses with emoji reactions',

  async execute(sock, m, { db, logger }) {
    try {
      if (!m.messages ||!m.messages[0]) return
      const msg = m.messages[0]

      // Only status messages
      if (msg.key.remoteJid!== 'status@broadcast') return
      if (msg.key.fromMe) return

      const from = msg.key.participant
      if (!from) return

      const settings = await getAutoLikeSettings(db)
      if (!settings.enabled) return

      if (!canLike(from)) return
      if (!shouldLikeByChance(settings.chance)) return

      let shouldLike = false

      switch (settings.mode) {
        case 'all':
          shouldLike = true
          break
        case 'contacts':
          const contacts = await sock.onWhatsApp(from.split('@')[0])
          shouldLike = contacts.length > 0 && contacts[0].exists
          break
        case 'special':
          shouldLike = settings.specialContacts.includes(from)
          break
        case 'exclude':
          shouldLike =!settings.excludeContacts.includes(from)
          break
        default:
          shouldLike = true
      }

      if (!shouldLike) return

      let emoji = settings.specificEmoji
      if (!emoji || settings.random) {
        emoji = getRandomEmoji(settings.emojis.length > 0? settings.emojis : ['❤️'])
      }

      await sock.sendMessage('status@broadcast', {
        react: {
          text: emoji,
          key: msg.key
        }
      })

      setLikeCooldown(from, settings.cooldown)
      logger.info('AUTOLIKE', `Liked status from ${from.split('@')[0]} with ${emoji}`)

    } catch (e) {
      logger.error('AUTOLIKE', 'Failed to like status', e.message)
    }
  }
}