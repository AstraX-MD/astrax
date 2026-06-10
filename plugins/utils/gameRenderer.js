/**
 * AstraX - plugins/utils/gameRenderer.js
 * Game Renderer - Generate game images with backgrounds using Sharp
 */

import sharp from 'sharp'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

const ASSETS_DIR = 'plugins/commands/economy/assets'

async function downloadPFP(jid, sock) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 })
    return Buffer.from(res.data)
  } catch {
    const defaultPath = path.join(ASSETS_DIR, 'default_avatar.png')
    if (fs.existsSync(defaultPath)) {
      return fs.readFileSync(defaultPath)
    }
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

async function roundImage(buffer) {
  return await sharp(buffer)
   .resize(120, 120)
   .composite([{
      input: Buffer.from(`<svg><circle cx="60" cy="60" r="60"/></svg>`),
      blend: 'dest-in'
    }])
   .png()
   .toBuffer()
}

async function getBackgroundBuffer(bgId) {
  const bgPath = path.join(ASSETS_DIR, `${bgId}.png`)
  const blackPath = path.join(ASSETS_DIR, 'black.png')
  
  if (fs.existsSync(bgPath)) {
    return fs.readFileSync(bgPath)
  } else if (fs.existsSync(blackPath)) {
    return fs.readFileSync(blackPath)
  } else {
    return await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    }).png().toBuffer()
  }
}

export async function renderTTT({ board, playerX, playerO, currentTurn, sock }) {
  try {
    const activePlayer = currentTurn === 'X' ? playerX : playerO
    const assets = (await import('../commands/economy/assets.js')).default
    const bgData = assets[activePlayer.background] || assets['black']
    const glowColor = bgData?.glow || '#ffffff'

    const bgBuffer = await getBackgroundBuffer(activePlayer.background)
    
    const pfpXBuf = await downloadPFP(playerX.jid, sock)
    const pfpOBuf = await downloadPFP(playerO.jid, sock)
    const pfpX = await roundImage(pfpXBuf)
    const pfpO = await roundImage(pfpOBuf)

    const boardSVG = `
      <svg width="400" height="400">
        <rect x="0" y="0" width="400" height="400" fill="rgba(0,0,0,0.7)" rx="20"/>
        ${board.map((cell, i) => {
          const x = (i % 3) * 130 + 15
          const y = Math.floor(i / 3) * 130 + 15
          if (cell === 'X') return `<text x="${x+35}" y="${y+90}" font-size="90" fill="#ff0000" font-weight="bold">X</text>`
          if (cell === 'O') return `<text x="${x+35}" y="${y+90}" font-size="90" fill="#0064ff" font-weight="bold">O</text>`
          return `<rect x="${x}" y="${y}" width="110" height="110" fill="rgba(255,255,255,0.1)" rx="10"/>`
        }).join('')}
      </svg>
    `

    const finalImage = await sharp(bgBuffer)
     .resize(1200, 630)
     .composite([
        { input: pfpX, top: 30, left: 30 },
        { input: pfpO, top: 30, left: 1050 },
        { input: Buffer.from(`<svg><text x="600" y="90" font-size="40" fill="white" text-anchor="middle" font-weight="bold">VS</text></svg>`), top: 0, left: 0 },
        { input: Buffer.from(boardSVG), top: 150, left: 400 },
        { input: Buffer.from(`<svg><text x="600" y="590" font-size="35" fill="${currentTurn === 'X'? '#ff0000' : '#0064ff'}" text-anchor="middle" font-weight="bold">Turn: ${currentTurn}</text></svg>`), top: 0, left: 0 },
        { input: Buffer.from(`<svg><rect x="5" y="5" width="1190" height="620" fill="none" stroke="${glowColor}" stroke-width="8" rx="15"/></svg>`), top: 0, left: 0 }
      ])
     .png()
     .toBuffer()

    return finalImage

  } catch (e) {
    console.error('[RENDERER ERROR]', e.message)
    return null
  }
}