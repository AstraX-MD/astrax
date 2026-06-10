/**
 * AstraX - plugins/commands/games/dice.js
 * Dice Game - Roll vs bot with pic mode + rolling animation
 * Category: games
 */

import sharp from 'sharp'
import fs from 'fs'
import axios from 'axios'
import { getGameUser, addWin, addLoss, addDraw, getGameSettings } from '../../utils/gameXP.js'

const ASSETS_DIR = 'plugins/commands/economy/assets'

async function downloadPFP(jid, sock) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 })
    return Buffer.from(res.data)
  } catch {
    return await sharp({
      create: {
        width: 120,
        height: 120,
        channels: 4,
        background: { r: 50, g: 50, b: 50, alpha: 1 }
      }
    }).png().toBuffer()
  }
}

async function renderDice({ playerRoll, botRoll, playerData, sock, rolling = false }) {
  try {
    const assets = (await import('../economy/assets.js')).default
    const bgData = assets[playerData.background] || assets['black']
    const glowColor = bgData?.glow || '#ffffff'

    const bgPath = `${ASSETS_DIR}/${playerData.background}.png`
    const bgExists = fs.existsSync(bgPath)
    const finalBgPath = bgExists? bgPath : `${ASSETS_DIR}/black.png`

    const pfpBuf = await downloadPFP(playerData.jid, sock)
    const pfpRounded = await sharp(pfpBuf)
     .resize(120, 120)
     .composite([{
        input: Buffer.from(`<svg><circle cx="60" cy="60" r="60"/></svg>`),
        blend: 'dest-in'
      }])
     .png()
     .toBuffer()

    const displayPlayer = rolling? '?' : playerRoll
    const displayBot = rolling? '?' : botRoll

    const diceSVG = `
      <svg width="600" height="300">
        <rect x="0" y="0" width="600" height="300" fill="rgba(0,0,0,0.7)" rx="20"/>
        <text x="150" y="50" font-size="30" fill="white" text-anchor="middle" font-weight="bold">YOU</text>
        <text x="450" y="50" font-size="30" fill="white" text-anchor="middle" font-weight="bold">BOT</text>
        <text x="150" y="180" font-size="120" fill="#ff0000" text-anchor="middle" font-weight="bold">${displayPlayer}</text>
        <text x="450" y="180" font-size="120" fill="#0064ff" text-anchor="middle" font-weight="bold">${displayBot}</text>
        <text x="300" y="180" font-size="40" fill="white" text-anchor="middle" font-weight="bold">VS</text>
        ${rolling? '<text x="300" y="260" font-size="25" fill="yellow" text-anchor="middle" font-weight="bold">ROLLING...</text>' : ''}
      </svg>
    `

    const finalImage = await sharp(finalBgPath)
     .resize(1200, 630)
     .composite([
        { input: pfpRounded, top: 30, left: 30 },
        { input: Buffer.from(diceSVG), top: 200, left: 300 },
        { input: Buffer.from(`<svg><rect x="5" y="5" width="1190" height="620" fill="none" stroke="${glowColor}" stroke-width="8" rx="15"/></svg>`), top: 0, left: 0 }
      ])
     .png()
     .toBuffer()

    return finalImage
  } catch (e) {
    console.error('[DICE RENDER ERROR]', e.message)
    return null
  }
}

function renderTextRolling(phase) {
  const diceFrames = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
  const frame1 = diceFrames[phase % 6]
  const frame2 = diceFrames[(phase + 3) % 6]
  
  return `
╭─────〔 DICE ROLLING 〕─────┈⊷
│ ◦➛ You: ${frame1} | Bot: ${frame2}
│ ◦➛ Rolling...
╰─────────────────────────⊷
`
}

export default {
  name: 'dice',
  alias: ['roll', 'dicegame'],
  desc: 'Roll dice vs bot. Higher number wins',
  category: 'games',
  usage: 'dice',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, sender, isGroup, prefix }) {
    try {
      if (!isGroup) {
        return await sock.sendMessage(from, {
          text: 'This command only works in groups',
          contextInfo
        }, { quoted: m })
      }

      await sock.sendMessage(from, { react: { text: '🎲', key: m.key } })

      const settings = await getGameSettings(db, from)
      const playerData = await getGameUser(db, from, sender)

      const playerRoll = Math.floor(Math.random() * 6) + 1
      const botRoll = Math.floor(Math.random() * 6) + 1

      let result = ''
      let xpGain = 0
      let emoji = ''

      if (playerRoll > botRoll) {
        result = 'YOU WIN'
        xpGain = 50
        emoji = '🎉'
      } else if (playerRoll < botRoll) {
        result = 'YOU LOSE'
        xpGain = 10
        emoji = '😢'
      } else {
        result = 'DRAW'
        xpGain = 20
        emoji = '🤝'
      }

      if (settings.picMode) {
        const rollingBuffer = await renderDice({
          playerRoll,
          botRoll,
          playerData: { jid: sender, background: playerData.background },
          sock,
          rolling: true
        })

        if (rollingBuffer) {
          const sent = await sock.sendMessage(from, {
            image: rollingBuffer,
            caption: 'Rolling dice...'
          }, { quoted: m })

          await new Promise(r => setTimeout(r, 1500))

          const finalBuffer = await renderDice({
            playerRoll,
            botRoll,
            playerData: { jid: sender, background: playerData.background },
            sock,
            rolling: false
          })

          if (finalBuffer) {
            try {
              await sock.sendMessage(from, { delete: sent.key })
            } catch {}

            await sock.sendMessage(from, {
              image: finalBuffer,
              caption: `
╭─────〔 DICE RESULT 〕─────┈⊷
│ ◦➛ You: ${playerRoll} | Bot: ${botRoll}
│ ◦➛ ${result} ${emoji}
│ ◦➛ +${xpGain} XP
╰─────────────────────────⊷
`.trim()
            }, { quoted: m })
          }
        }
      } else {
        const sent = await sock.sendMessage(from, {
          text: renderTextRolling(0).trim(),
          contextInfo
        }, { quoted: m })

        for (let i = 1; i < 4; i++) {
          await new Promise(r => setTimeout(r, 500))
          try {
            await sock.sendMessage(from, {
              edit: sent.key,
              text: renderTextRolling(i).trim()
            })
          } catch {}
        }

        await new Promise(r => setTimeout(r, 500))

        const textResult = `
╭─────〔 DICE 〕─────┈⊷
│ ◦➛ You rolled: ${playerRoll}
│ ◦➛ Bot rolled: ${botRoll}
├─────────────────────────⊷
│ ◦➛ ${result} ${emoji}
│ ◦➛ +${xpGain} XP
╰─────────────────────────⊷
`
        try {
          await sock.sendMessage(from, {
            edit: sent.key,
            text: textResult.trim()
          })
        } catch {
          await sock.sendMessage(from, {
            text: textResult.trim(),
            contextInfo
          }, { quoted: m })
        }
      }

      if (playerRoll > botRoll) {
        await addWin(db, from, sender)
      } else if (playerRoll < botRoll) {
        await addLoss(db, from, sender)
      } else {
        await addDraw(db, from, sender)
      }

    } catch (e) {
      logger.error('DICE', 'Dice failed', e.message)
      await sock.sendMessage(from, {
        text: 'Failed to roll dice',
        contextInfo
      }, { quoted: m })
    }
  }
}