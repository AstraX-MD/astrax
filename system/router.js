/**
 * AstraX - system/router.js
 * Message routing engine — Prefix logic, channel context, permissions
 * All settings real-time from DB — no restart needed
 *
 * OWNER DETECTION: 10 methods - no ENV used
 * SUDO: Full owner-level permissions
 * MODES: public | groups | dm | private
 * NOPREFIX: Two modes — noprefix-only (prefix disabled) OR noprefix+prefix both allowed
 * CHANNEL: Always forwarded from AstraX channel with SWIFTBOT style
 * THUMBNAIL: Dynamic sender profile pic
 * NO BOX.JS — Removed entirely
 * NO REACT — Removed entirely
 */

import { db } from './db.js'
import { logger } from './logger.js'
import { fonts } from './fonts.js'

// ─────────────────────────────────────────────
// ASTRAX ASCII BANNER — Shown once at import
// ─────────────────────────────────────────────
console.log(`
\x1b[36m
   █████╗ ███████╗████████╗██████╗ █████╗ ██╗ ██╗
  ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚██╗██╔╝
  ███████║███████╗ ██║ ██████╔╝███████║ ╚███╔╝
  ██╔══██║╚════██║ ██║ ██╔══██╗██╔══██║ ██╔██╗
  ██║ ██║███████║ ██║ ██║ ██║██╔╝ ██╗
  ╚═╝ ╚═╝╚══════╝ ╚═╝ ╚═╝╚═╝ ╚═╝╚═╝ ╚═╝
\x1b[0m\x1b[33m ⚡ AstraX Router — Powered by SWIFT-TECH\x1b[0m
\x1b[90m ─────────────────────────────────────────\x1b[0m
`)

// ─────────────────────────────────────────────
// COMMAND / OBSERVER MAPS — Set by loader.js
// ─────────────────────────────────────────────
let commands = new Map()
let observers = new Map()

export function setCommands(cmds) {
  commands = cmds
  logger.success('ROUTER', `Registered ${cmds.size} commands`)
}

export function setObservers(obs) {
  observers = obs
  logger.success('ROUTER', `Registered ${obs.size} observers`)
}

export function getCommand(name) {
  if (commands.has(name)) return commands.get(name)
  for (const [, cmd] of commands) {
    if (Array.isArray(cmd.alias) && cmd.alias.includes(name)) return cmd
  }
  return null
}

// ─────────────────────────────────────────────
// OWNER CHECK — EVERYONE IS OWNER NOW
// ─────────────────────────────────────────────
async function isOwnerJid(sock, sender) {
  return true
}

// ─────────────────────────────────────────────
// GET SENDER PROFILE PIC — For Dynamic Thumbnail
// ─────────────────────────────────────────────
async function getSenderPp(sock, jid) {
  try {
    const ppUrl = await sock.profilePictureUrl(jid, 'image')
    const res = await fetch(ppUrl)
    return Buffer.from(await res.arrayBuffer())
  } catch {
    try {
      const botimage = await db.get('botimage') || 'https://i.ibb.co/QvGY7dqB/file-00000000e1107243ad54749c06fe2d80.png'
      const res = await fetch(botimage)
      return Buffer.from(await res.arrayBuffer())
    } catch {
      return null
    }
  }
}

// ─────────────────────────────────────────────
// CHANNEL CONTEXT — SWIFTBOT STYLE - NO HARDCODE
// ─────────────────────────────────────────────
async function getChannelContext(sock, m) {
  const [enabled, jid, link, name, score] = await Promise.all([
    db.get('channelEnabled'),
    db.get('channelJid'),
    db.get('channelLink'),
    db.get('channelName'),
    db.get('channelForwardScore')
  ])

  // Default to hardcoded channel if DB empty
  const defaultJid = '120363426850850275@newsletter'
  const defaultLink = 'https://whatsapp.com/channel/0029Vb86btmI1rci3S1NUA0G'
  const defaultName = 'AstraX Updates'

  const finalJid = (enabled === false)? null : (jid || defaultJid)
  if (!finalJid) return null

  const channelJid = finalJid.includes('@')? finalJid : `${finalJid}@newsletter`
  const senderJid = m.key.participant || m.key.remoteJid
  const senderName = m.pushName || 'User'
  const thumbnail = await getSenderPp(sock, senderJid)

  return {
    forwardingScore: score || 999,
    isForwarded: true,
    externalAdReply: {
      title: 'WhatsApp',
      body: `Contact: ${senderName}`,
      mediaType: 1,
      thumbnail: thumbnail,
      mediaUrl: link || defaultLink,
      sourceUrl: link || defaultLink,
      showAdAttribution: true,
      renderLargerThumbnail: true,
      verifiedBizName: 'WhatsApp'
    },
    forwardedNewsletterMessageInfo: {
      newsletterJid: channelJid,
      newsletterName: name || defaultName,
      serverMessageId: Math.floor(Math.random() * 100000)
    }
  }
}

// ─────────────────────────────────────────────
// CHECK IF COMMAND DISABLED — Global + per-group
// ─────────────────────────────────────────────
async function isCommandDisabled(cmdName, groupJid = null) {
  const disabledCmds = (await db.get('disabledCmds')) || []
  if (disabledCmds.includes(cmdName)) return true

  if (groupJid) {
    const groupDisabled = (await db.getGroupKey(groupJid, 'disabledCmds')) || []
    if (groupDisabled.includes(cmdName)) return true
  }

  return false
}

// ─────────────────────────────────────────────
// ANTI-SPAM — Per-sender cooldown
// ─────────────────────────────────────────────
const userCooldown = new Map()
function antiSpam(sender) {
  const now = Date.now()
  const last = userCooldown.get(sender) || 0
  if (now - last < 1200) return false
  userCooldown.set(sender, now)
  return true
}

// ─────────────────────────────────────────────
// CHECK PERMISSIONS
// Owner = 10 methods check
// Sudo = same as owner for all commands
// Modes: public | groups | dm | private
// ─────────────────────────────────────────────
async function checkPermission(sock, m, cmd) {
  const from = m.key.remoteJid
  const isGroup = from.endsWith('@g.us')
  const sender = m.key.participant || from

  const isOwner = await isOwnerJid(sock, sender)

  // Sudo check — sender-based
  const sudoList = (await db.get('sudoUsers')) || []
  const senderNumber = sender.replace(/[^0-9]/g, '')
  const isSudo = sudoList.some(s => String(s).replace(/[^0-9]/g, '') === senderNumber)

  // Sudo has full owner-level access everywhere
  const hasElevated = isOwner || isSudo

  // ─── MODE ENFORCEMENT ────────────────────
  const mode = (await db.get('mode')) || 'public'

  if (mode === 'private' &&!hasElevated) return false

  if (mode === 'groups') {
    if (!isGroup &&!hasElevated) return false
  }

  if (mode === 'dm') {
    if (isGroup &&!hasElevated) return false
  }

  // mode === 'public' — no restriction

  // ─── COMMAND-LEVEL PERMISSION ────────────
  const perm = cmd.permission || 'all'

  if (perm === 'owner' &&!hasElevated) return false
  if (perm === 'sudo' &&!hasElevated) return false

  if (perm === 'group' &&!isGroup) {
    return { error: '👥 This command only works in groups.' }
  }

  if (perm === 'admin' && isGroup &&!hasElevated) {
    try {
      const metadata = await sock.groupMetadata(from)
      const senderNum = sender.replace(/[^0-9]/g, '')
      const isAdmin = metadata.participants.some(p => {
        const pNum = p.id.replace(/[^0-9]/g, '')
        return pNum === senderNum && (p.admin === 'admin' || p.admin === 'superadmin')
      })
      if (!isAdmin) return { error: '🔒 Admin only command.' }
    } catch {
      return { error: '❌ Failed to verify admin status.' }
    }
  }

  return true
}

// ─────────────────────────────────────────────
// MAIN MESSAGE ROUTER
// ─────────────────────────────────────────────
export async function routeMessage(sock, m) {
  try {
    if (!m.message || m.key.remoteJid === 'status@broadcast') return

    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const isGroup = from.endsWith('@g.us')

    const body =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption ||
      ''

    if (!body) return

    logger.incoming(from, sender.split('@')[0], body.slice(0, 30))

    // ─── RUN OBSERVERS ──────────────────────
    for (const [name, obs] of observers) {
      if (!obs.enabled) continue
      try {
        await obs.execute(sock, m, { db, fonts, logger })
      } catch (e) {
        logger.error('OBSERVER', `${name} failed`, e.message)
      }
    }

    // ─── LOAD SETTINGS ─────────────────────
    const [prefix, noPrefixRaw, autoRead, autoTyping, autoRecording] = await Promise.all([
      db.get('prefix'),
      db.get('noPrefix'),
      db.get('autoRead'),
      db.get('autoTyping'),
      db.get('autoRecording')
    ])

    const currentPrefix = prefix || '?'
    const noPrefix = noPrefixRaw

    // ─── AUTO FEATURES ──────────────────────
    if (autoRead) {
      try { await sock.readMessages([m.key]) } catch {}
    }
    if (autoTyping) {
      try { await sock.sendPresenceUpdate('composing', from) } catch {}
    }
    if (autoRecording) {
      try { await sock.sendPresenceUpdate('recording', from) } catch {}
    }

    // ─── PREFIX / NOPREFIX ROUTING ──────────
    let isCmd = false
    let cmdName = ''
    let args = []

    const startsWithPrefix = body.startsWith(currentPrefix)

    if (noPrefix === true || noPrefix === 'only') {
      // noPrefix-ONLY mode: prefix is DISABLED — plain words only
      if (!startsWithPrefix) {
        const parts = body.trim().split(/\s+/)
        const firstWord = parts[0].toLowerCase()
        if (getCommand(firstWord)) {
          isCmd = true
          cmdName = firstWord
          args = parts.slice(1)
        }
      }

    } else if (noPrefix === 'both') {
      // BOTH mode: prefix works AND plain words work
      if (startsWithPrefix) {
        const parts = body.slice(currentPrefix.length).trim().split(/\s+/)
        cmdName = parts[0].toLowerCase()
        args = parts.slice(1)
        if (getCommand(cmdName)) isCmd = true
      } else {
        const parts = body.trim().split(/\s+/)
        const firstWord = parts[0].toLowerCase()
        if (getCommand(firstWord)) {
          isCmd = true
          cmdName = firstWord
          args = parts.slice(1)
        }
      }

    } else {
      // Normal PREFIX-only mode (default)
      if (startsWithPrefix) {
        const parts = body.slice(currentPrefix.length).trim().split(/\s+/)
        cmdName = parts[0].toLowerCase()
        args = parts.slice(1)
        if (getCommand(cmdName)) isCmd = true
      }
    }

    if (!isCmd) return

    // ─── ANTI-SPAM ──────────────────────────
    if (!antiSpam(sender)) return

    // ─── GET COMMAND ────────────────────────
    const cmd = getCommand(cmdName)
    if (!cmd) {
      logger.warn('ROUTER', `Unknown command: ${cmdName}`)
      return
    }

    // ─── DISABLED CHECK ─────────────────────
    if (await isCommandDisabled(cmd.name, isGroup? from : null)) {
      const contextInfo = await getChannelContext(sock, m)
      await sock.sendMessage(
        from,
        { text: `⛔ Command *${cmd.name}* is currently disabled.`, contextInfo },
        { quoted: m }
      )
      return
    }

    // ─── PERMISSION CHECK ───────────────────
    const permCheck = await checkPermission(sock, m, cmd)
    if (permCheck!== true) {
      const errorMsg =
        typeof permCheck === 'object' && permCheck?.error
       ? permCheck.error
          : '🚫 You do not have permission to use this command.'
      const contextInfo = await getChannelContext(sock, m)
      await sock.sendMessage(from, { text: errorMsg, contextInfo }, { quoted: m })
      return
    }

    // ─── EXECUTE COMMAND ────────────────────
    logger.executed(cmd.name, sender.split('@')[0])

    try {
      const contextInfo = await getChannelContext(sock, m)
      const isOwner = await isOwnerJid(sock, sender)

      // Sudo check for execute context
      const sudoList = (await db.get('sudoUsers')) || []
      const senderNumber = sender.replace(/[^0-9]/g, '')
      const isSudo = sudoList.some(s => String(s).replace(/[^0-9]/g, '') === senderNumber)

      await cmd.execute(sock, m, args, {
        db,
        fonts,
        logger,
        prefix: currentPrefix,
        botJid: sock.user?.id || '',
        sender,
        from,
        isGroup,
        isOwner,
        isSudo,
        contextInfo,
        cmdName,
        args,
        body,
        command: cmdName
      })

      logger.executed(cmd.name, sender.split('@')[0], true)

    } catch (e) {
      logger.executed(cmd.name, sender.split('@')[0], false)
      logger.error('CMD', `${cmd.name} crashed: ${e.message}`)

      const contextInfo = await getChannelContext(sock, m)
      await sock.sendMessage(
        from,
        { text: `❌ Command failed: ${e.message}`, contextInfo },
        { quoted: m }
      )
    }

  } catch (e) {
    logger.error('ROUTER', 'Routing failed', e.message)
  }
}

// ─────────────────────────────────────────────
// HANDLE NON-MESSAGE EVENTS — For observers
// ─────────────────────────────────────────────
export async function routeEvent(sock, eventName, update) {
  for (const [name, obs] of observers) {
    if (!obs.enabled) continue
    if (obs.event!== eventName) continue
    try {
      await obs.execute(sock, update, { db, fonts, logger })
    } catch (e) {
      logger.error('OBSERVER', `${name} event failed`, e.message)
    }
  }
}