/**
 * AstraX - plugins/commands/automation/autoviewstatus.js
 * Auto View Status Settings - Control panel
 * Category: automation
 */

async function getSettings(db) {
  return await db.get('autoViewStatus') || {
    enabled: false,
    mode: 'all',
    specialContacts: [],
    excludeContacts: [],
    cooldown: 5000,
    chance: 100
  }
}

export default {
  name: 'autoviewstatus',
  alias: ['avs', 'autostatus', 'viewstatus'],
  desc: 'Configure auto view status settings',
  category: 'automation',
  usage: 'autoviewstatus <option> <value>',
  permission: 'owner',

  async execute(sock, m, args, { db, logger, contextInfo, from, sender, prefix, isOwner }) {
    if (!isOwner) {
      return await sock.sendMessage(from, {
        text: '🚫 Owner only command',
        contextInfo
      }, { quoted: m })
    }

    const settings = await getSettings(db)
    const option = args[0]?.toLowerCase()
    const value = args.slice(1).join(' ')

    // ─── DEFAULT: SHOW ON/OFF ONLY ─────────────────────
    if (!option) {
      return await sock.sendMessage(from, {
        text: `╭─────〔 AUTO VIEW STATUS 〕─────┈⊷
│ ◦➛ Status: ${settings.enabled? '✅ ON' : '❌ OFF'}
╰─────────────────────────⊷

╭─────〔 USAGE 〕─────┈⊷
│ ◦➛ ${prefix}autoviewstatus on/off
│ ◦➛ ${prefix}autoviewstatus status
╰─────────────────────────⊷`,
        contextInfo
      }, { quoted: m })
    }

    switch (option) {
      case 'status':
        return await sock.sendMessage(from, {
          text: `╭─────〔 AUTO VIEW STATUS 〕─────┈⊷
│ ◦➛ Status: ${settings.enabled? '✅ ON' : '❌ OFF'}
│ ◦➛ Mode: ${settings.mode.toUpperCase()}
│ ◦➛ Chance: ${settings.chance}%
│ ◦➛ Cooldown: ${settings.cooldown}ms
│ ◦➛ Special: ${settings.specialContacts.length}
│ ◦➛ Excluded: ${settings.excludeContacts.length}
├─────────────────────────⊷
│ ◦➛ ${prefix}autoviewstatus on/off
│ ◦➛ ${prefix}autoviewstatus mode all/contacts/special/exclude
│ ◦➛ ${prefix}autoviewstatus chance 1-100
│ ◦➛ ${prefix}autoviewstatus cooldown <ms>
│ ◦➛ ${prefix}autoviewstatus addcontact @user
│ ◦➛ ${prefix}autoviewstatus exclude @user
│ ◦➛ ${prefix}autoviewstatus delcontact @user
│ ◦➛ ${prefix}autoviewstatus delexclude @user
╰─────────────────────────⊷`,
          contextInfo
        }, { quoted: m })

      case 'on':
      case 'enable':
        settings.enabled = true
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: '✅ Auto view status enabled',
          contextInfo
        }, { quoted: m })

      case 'off':
      case 'disable':
        settings.enabled = false
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: '❌ Auto view status disabled',
          contextInfo
        }, { quoted: m })

      case 'mode':
        const modes = ['all', 'contacts', 'special', 'exclude']
        if (!modes.includes(value)) {
          return await sock.sendMessage(from, {
            text: `❌ Invalid mode. Use: ${modes.join(', ')}`,
            contextInfo
          }, { quoted: m })
        }
        settings.mode = value
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: `✅ Mode set to: ${value.toUpperCase()}`,
          contextInfo
        }, { quoted: m })

      case 'chance':
        const chance = parseInt(value)
        if (isNaN(chance) || chance < 1 || chance > 100) {
          return await sock.sendMessage(from, {
            text: '❌ Chance must be 1-100',
            contextInfo
          }, { quoted: m })
        }
        settings.chance = chance
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: `✅ View chance set to: ${chance}%`,
          contextInfo
        }, { quoted: m })

      case 'cooldown':
        const cd = parseInt(value)
        if (isNaN(cd) || cd < 1000) {
          return await sock.sendMessage(from, {
            text: '❌ Cooldown must be >= 1000ms',
            contextInfo
          }, { quoted: m })
        }
        settings.cooldown = cd
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: `✅ Cooldown set to: ${cd}ms`,
          contextInfo
        }, { quoted: m })

      case 'addcontact':
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        const quoted = m.message.extendedTextMessage?.contextInfo?.participant
        const target = mentioned[0] || quoted || (value.includes('@')? value.replace('@', '') + '@s.whatsapp.net' : null)

        if (!target) return await sock.sendMessage(from, { text: '❌ Tag or reply to user', contextInfo }, { quoted: m })
        if (!settings.specialContacts.includes(target)) settings.specialContacts.push(target)
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: `✅ Added to special contacts: @${target.split('@')[0]}`,
          contextInfo,
          mentions: [target]
        }, { quoted: m })

      case 'exclude':
        const mentioned2 = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        const quoted2 = m.message.extendedTextMessage?.contextInfo?.participant
        const target2 = mentioned2[0] || quoted2 || (value.includes('@')? value.replace('@', '') + '@s.whatsapp.net' : null)

        if (!target2) return await sock.sendMessage(from, { text: '❌ Tag or reply to user', contextInfo }, { quoted: m })
        if (!settings.excludeContacts.includes(target2)) settings.excludeContacts.push(target2)
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: `✅ Added to exclude list: @${target2.split('@')[0]}`,
          contextInfo,
          mentions: [target2]
        }, { quoted: m })

      case 'delcontact':
        const mentioned3 = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        const target3 = mentioned3[0] || (value.includes('@')? value.replace('@', '') + '@s.whatsapp.net' : null)
        if (!target3) return await sock.sendMessage(from, { text: '❌ Tag user', contextInfo }, { quoted: m })
        settings.specialContacts = settings.specialContacts.filter(j => j!== target3)
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: `✅ Removed from special: @${target3.split('@')[0]}`,
          contextInfo,
          mentions: [target3]
        }, { quoted: m })

      case 'delexclude':
        const mentioned4 = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        const target4 = mentioned4[0] || (value.includes('@')? value.replace('@', '') + '@s.whatsapp.net' : null)
        if (!target4) return await sock.sendMessage(from, { text: '❌ Tag user', contextInfo }, { quoted: m })
        settings.excludeContacts = settings.excludeContacts.filter(j => j!== target4)
        await db.set('autoViewStatus', settings)
        return await sock.sendMessage(from, {
          text: `✅ Removed from exclude: @${target4.split('@')[0]}`,
          contextInfo,
          mentions: [target4]
        }, { quoted: m })

      default:
        return await sock.sendMessage(from, {
          text: '❌ Unknown option. Use: ' + prefix + 'autoviewstatus status',
          contextInfo
        }, { quoted: m })
    }
  }
}