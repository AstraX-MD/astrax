/**
 * AstraX - plugins/commands/games/football.js
 * Football - Penalty shootout vs bot
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

async function renderFootball({ playerChoice, botSave, goal, playerData, sock, rolling = false }) {
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

    const goalPositions = {
      'left': { x: 200, y: 300 },
      'center': { x: 400, y: 300 },
      'right': { x: 600, y: 300 }
    }

    const playerPos = goalPositions[playerChoice] || { x: 400, y: 300 }
    const botPos = goalPositions[botSave] || { x: 400, y: 300 }

    const footballSVG = `
      <svg width="800" height="500">
        <rect x="0" y="0" width="800" height="500" fill="rgba(0,0,0,0.7)" rx="20"/>
        <rect x="100" y="100" width="600" height="300" fill="none" stroke="white" stroke-width="5"/>
        <rect x="300" y="100" width="200" height="100" fill="none" stroke="white" stroke-width="5"/>
        <text x="400" y="50" font-size="30" fill="white" text-anchor="middle" font-weight="bold">PENALTY SHOOTOUT</text>
        <circle cx="${playerPos.x}" cy="${playerPos.y}" r="25" fill="#ff0000"/>
        <text x="${playerPos.x}" y="${playerPos.y + 10}" font-size="30" fill="white" text-anchor="middle">⚽</text>
        <rect x="${botPos.x - 30}" y="${botPos.y - 40}" width="60" height="80" fill="#0064ff" rx="10"/>
        <text x="${botPos.x}" y="${botPos.y + 5}" font-size="20" fill="white" text-anchor="middle">🧤</text>
        ${rolling? '<text x="400" y="450" font-size="25" fill="yellow" text-anchor="middle" font-weight="bold">SHOOTING...</text>' : ''}
        ${!rolling && goal? '<text x="400" y="450" font-size="35" fill="#00ff00" text-anchor="middle" font-weight="bold">GOAL!</text>' : ''}
        ${!rolling && !goal? '<text x="400" y="450" font-size="35" fill="#ff0000" text-anchor="middle" font-weight="bold">SAVED!</text>' : ''}
      </svg>
    `

    const finalImage = await sharp(finalBgPath)
     .resize(1200, 630)
     .composite([
        { input: pfpRounded, top: 30, left: 30 },
        { input: Buffer.from(footballSVG), top: 80, left: 200 },
        { input: Buffer.from(`<svg><rect x="5" y="5" width="1190" height="620" fill="none" stroke="${glowColor}" stroke-width="8" rx="15"/></svg>`), top: 0, left: 0 }
      ])
     .png()
     .toBuffer()

    return finalImage
  } catch (e) {
    console.error('[FOOTBALL RENDER ERROR]', e.message)
    return null
  }
}

function renderTextShooting(phase, choice) {
  const frames = ['⚽', '⚽💨', '⚽💨💨']
  const frame = frames[phase % 3]
  
  return `
╭─────〔 PENALTY 〕─────┈⊷
│ ◦➛ Shooting ${choice.toUpperCase()}
│ ◦➛ ${frame}
╰─────────────────────────⊷
`
}

export default {
  name: 'football',
  alias: ['penalty', 'shoot', 'soccer'],
  desc: 'Penalty shootout vs bot. Choose left/center/right',
  category: 'games',
  usage: 'football left|center|right',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, sender, isGroup, prefix }) {
    try {
      if (!isGroup) {
        return await sock.sendMessage(from, {
          text: 'This command only works in groups',
          contextInfo
        }, { quoted: m })
      }

      const choice = args[0]?.toLowerCase()
      const validChoices = ['left', 'center', 'right', 'l', 'c', 'r']

      if (!choice || !validChoices.includes(choice)) {
        return await sock.sendMessage(from, {
          text: `╭─────〔 FOOTBALL 〕─────┈⊷
│ ◦➛ Usage: ${prefix}football <direction>
│ ◦➛ Options: left | center | right
├─────────────────────────⊷
│ ◦➛ Example: ${prefix}football left
╰─────────────────────────⊷`,
          contextInfo
        }, { quoted: m })
      }

      const playerChoice = choice === 'l'? 'left' : choice === 'c'? 'center' : choice === 'r'? 'right' : choice

      await sock.sendMessage(from, { react: { text: '⚽', key: m.key } })

      const settings = await getGameSettings(db, from)
      const playerData = await getGameUser(db, from, sender)

      const botSave = ['left', 'center', 'right'][Math.floor(Math.random() * 3)]
      const goal = playerChoice !== botSave

      let result = ''
      let xpGain = 0
      let emoji = ''

      if (goal) {
        result = 'GOAL!'
        xpGain = 50
        emoji = '🎉'
      } else {
        result = 'SAVED!'
        xpGain = 10
        emoji = '🧤'
      }

      if (settings.picMode) {
        const rollingBuffer = await renderFootball({
          playerChoice,
          botSave,
          goal,
          playerData: { jid: sender, background: playerData.background },
          sock,
          rolling: true
        })

        if (rollingBuffer) {
          const sent = await sock.sendMessage(from, {
            image: rollingBuffer,
            caption: 'Shooting...'
          }, { quoted: m })

          await new Promise(r => setTimeout(r, 1500))

          const finalBuffer = await renderFootball({
            playerChoice,
            botSave,
            goal,
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
╭─────〔 PENALTY RESULT 〕─────┈⊷
│ ◦➛ You shot: ${playerChoice.toUpperCase()}
│ ◦➛ Bot saved: ${botSave.toUpperCase()}
│ ◦➛ ${result} ${emoji}
│ ◦➛ +${xpGain} XP
╰─────────────────────────⊷
`.trim()
            }, { quoted: m })
          }
        }
      } else {
        const sent = await sock.sendMessage(from, {
          text: renderTextShooting(0, playerChoice).trim(),
          contextInfo
        }, { quoted: m })

        for (let i = 1; i < 3; i++) {
          await new Promise(r => setTimeout(r, 600))
          try {
            await sock.sendMessage(from, {
              edit: sent.key,
              text: renderTextShooting(i, playerChoice).trim()
            })
          } catch {}
        }

        await new Promise(r => setTimeout(r, 600))

        const textResult = `
╭─────〔 PENALTY 〕─────┈⊷
│ ◦➛ You shot: ${playerChoice.toUpperCase()}
│ ◦➛ Bot saved: ${botSave.toUpperCase()}
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

      if (goal) {
        await addWin(db, from, sender)
      } else {
        await addLoss(db, from, sender)
      }

    } catch (e) {
      logger.error('FOOTBALL', 'Football failed', e.message)
      await sock.sendMessage(from, {
        text: 'Failed to shoot penalty',
        contextInfo
      }, { quoted: m })
    }
  }
}