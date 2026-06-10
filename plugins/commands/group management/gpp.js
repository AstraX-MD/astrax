/**
 * AstraX - plugins/commands/group management/gpp.js
 * Get Profile Pictures - Fetch all members profile pictures
 * Stop command support + Emoji sentences + DM summary
 * Category: group management
 */

// ─── GLOBAL STOP STATE ────────────────────────────────────
const gppStopMap = new Map()

export default {
  name: 'gpp',
  alias: ['getpp', 'getpic', 'grouppp', 'getprofile', 'stopgpp'],
  desc: 'Get all group members profile pictures | Use stopgpp to stop',
  category: 'group management',
  usage: 'gpp | stopgpp',
  permission: 'isOwner',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── GET PREFIX FROM DB ───────────────────────────────
      const prefix = await db.get('prefix') || '.'

      // ─── HANDLE STOP COMMAND ──────────────────────────────
      const command = m.body?.split(' ')[0]?.toLowerCase() || ''
      if (command === `${prefix}stopgpp` || command === 'stopgpp') {
        if (!isGroup) {
          return await sock.sendMessage(from, {
            text: `╭─────〔 ERROR 〕─────┈⊷\n│ ◦➛ Group command only\n╰─────────────────────────⊷`,
            contextInfo
          }, { quoted: m })
        }

        if (gppStopMap.has(from)) {
          gppStopMap.set(from, true)
          return await sock.sendMessage(from, {
            text: `╭─────〔 GPP 〕─────┈⊷\n│ ◦➛ Stopping process...\n│ ◦➛ Summary will be sent\n╰─────────────────────────⊷`,
            contextInfo
          }, { quoted: m })
        } else {
          return await sock.sendMessage(from, {
            text: `╭─────〔 GPP 〕─────┈⊷\n│ ◦➛ No active process\n╰─────────────────────────⊷`,
            contextInfo
          }, { quoted: m })
        }
      }

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

      // ─── CHECK IF ALREADY RUNNING ─────────────────────────
      if (gppStopMap.has(from)) {
        return await sock.sendMessage(from, {
          text: `╭─────〔 ERROR 〕─────┈⊷\n│ ◦➛ Already running\n│ ◦➛ Use ${prefix}stopgpp to stop\n╰─────────────────────────⊷`,
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

      const participants = groupMetadata.participants
      const totalMembers = participants.length

      // ─── 100 RANDOM 3-5 WORD SENTENCES WITH EMOJIS ────────
      const randomCaptions = [
        'Pure legend energy 🔥', 'Iconic profile vibes ✨', 'Stunning profile picture 😍', 'Epic member status ⚡', 'Radiant aura detected 🌟',
        'Majestic presence here 👑', 'Brilliant profile shot 💎', 'Vibrant soul energy 🌈', 'Glorious member vibes 🏆', 'Premium profile quality 💯',
        'Classic profile style 🎭', 'Elite member spotted 🎯', 'Prime profile energy 🚀', 'Royal presence shown 👑', 'Grand profile picture 🎨',
        'Noble member vibes 🛡️', 'Bold profile statement 💪', 'Sharp look today 🔪', 'Smooth profile aesthetic 😎', 'Fresh profile update 🍃',
        'Cool profile picture ❄️', 'Hot profile energy 🔥', 'Sleek profile vibes ✨', 'Clean profile aesthetic 🧼', 'Pure profile beauty 💖',
        'Wild member energy 🐺', 'Calm profile vibes 🧘', 'Loud profile presence 📢', 'Quiet strength shown 🤫', 'Proud member here 🏅',
        'Brave soul energy 🦁', 'Wise profile picture 🦉', 'Swift member vibes ⚡', 'Strong presence detected 💪', 'Solid profile energy 🗿',
        'Light shines bright 💡', 'Dark mode aesthetic 🌙', 'Bright profile energy ☀️', 'Golden hour vibes 🌅', 'Silver lining shown 🌤️',
        'Diamond profile quality 💎', 'Platinum member status 🏆', 'Crystal clear picture 🔮', 'Shadow mode active 🌑', 'Flame energy burning 🔥',
        'Storm profile brewing ⛈️', 'Thunder strikes here ⚡', 'Blaze mode on 🔥', 'Frost profile cool ❄️', 'Spirit energy pure 👻',
        'Alpha member vibes 🐺', 'Boss profile energy 💼', 'King status confirmed 👑', 'Queen energy shown 👸', 'Star profile shining ⭐',
        'Hero member vibes 🦸', 'Champion profile here 🏆', 'Winner energy detected 🥇', 'Top tier quality 🎖️', 'High class aesthetic 💎',
        'Peak profile performance 📈', 'God tier energy ⚡', 'Ultra rare vibe 🌟', 'Secret sauce shown 🤫', 'Main character energy 🎬',
        'Profile goes hard 🔥', 'Certified member vibes ✅', 'Verified profile status ✔️', 'Premium member here 💎', 'VIP energy detected 🎫',
        'Locked in focus 🔒', 'Built different energy 💪', 'No cap detected 🧢', 'Facts only here 💯', 'Real one spotted 💯',
        'Stay winning always 🏆', 'Keep it real 💯', 'Too clean shot ✨', 'Super fresh look 🍃', 'Next level profile 🚀',
        'Absolutely iconic shot 🎭', 'Simply the best 🥇', 'Pure excellence shown 💎', 'Quality over everything 💯', 'Top notch quality 🔝',
        'Straight fire energy 🔥', 'Ice cold vibes 🧊', 'Red hot profile 🔴', 'Blue sky energy 🔵', 'Green flag confirmed 🟢',
        'Picture perfect shot 📸', 'Flawless profile energy ✨', 'Zero flaws detected 💯', 'Chef kiss quality 👨‍🍳', 'Masterpiece profile here 🎨',
        'Art in motion 🎨', 'Beauty personified here 💖', 'Grace in frame 🦢', 'Elegance shown here 👗', 'Style on point 💅',
        'Drip too hard 💧', 'Sauce overflow detected 🌶️', 'Swag level max 😎', 'Aura points maxed ✨', 'Charisma overloaded here 🌟'
      ]

      // ─── START MESSAGE ────────────────────────────────────
      gppStopMap.set(from, false)
      const startText = `
╭─────〔 GPP 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata.subject}
│ ◦➛ Members: ${totalMembers}
│ ◦➛ Status: Fetching...
│ ◦➛ Stop: ${prefix}stopgpp
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: startText.trim(),
        contextInfo
      }, { quoted: m })

      // ─── PROCESS PROFILE PICS ─────────────────────────────
      let successCount = 0
      let failedCount = 0
      const failedUsers = []
      const startTime = Date.now()

      for (let i = 0; i < participants.length; i++) {
        // Check stop signal
        if (gppStopMap.get(from) === true) {
          gppStopMap.delete(from)
          break
        }

        const user = participants[i]
        const jid = user.id
        const number = jid.split('@')[0]

        try {
          // Get profile pic URL
          const ppUrl = await sock.profilePictureUrl(jid, 'image')

          if (ppUrl) {
            // Random 3-5 word sentence with emoji
            const randomSentence = randomCaptions[Math.floor(Math.random() * randomCaptions.length)]

            const caption = `
╭─────〔 PROFILE 〕─────┈⊷
│ ◦➛ User: @${number}
│ ◦➛ ${randomSentence}
╰─────────────────────────⊷
`
            await sock.sendMessage(from, {
              image: { url: ppUrl },
              caption: caption.trim(),
              mentions: [jid],
              contextInfo
            })

            successCount++
          } else {
            failedCount++
            failedUsers.push(`@${number} - No profile pic`)
          }

        } catch (e) {
          failedCount++
          const reason = e.message?.includes('404')? 'No profile pic' :
                        e.message?.includes('401')? 'Private' : 'Failed'
          failedUsers.push(`@${number} - ${reason}`)
        }

        // Small delay to avoid rate limit
        if (i < participants.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }

      // ─── FINAL SUMMARY - UNTOUCHED FORMAT ─────────────────
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)
      const successRate = ((successCount / totalMembers) * 100).toFixed(1)
      const wasStopped = gppStopMap.get(from) === true

      let failedList = ''
      if (failedUsers.length > 0) {
        const displayFailed = failedUsers.slice(0, 10)
        failedList = `\n├─────────────────────────⊷\n│ ◦➛ Failed List:\n${displayFailed.map(u => `│ ◦➛ ${u}`).join('\n')}`
        if (failedUsers.length > 10) {
          failedList += `\n│ ◦➛...and ${failedUsers.length - 10} more`
        }
      }

      const summaryText = `
╭─────〔 SUMMARY 〕─────┈⊷
│ ◦➛ Group: ${groupMetadata.subject}
│ ◦➛ Total Members: ${totalMembers}
├─────────────────────────⊷
│ ◦➛ Success: ${successCount}
│ ◦➛ Failed: ${failedCount}
│ ◦➛ Success Rate: ${successRate}%
│ ◦➛ Duration: ${duration}s
│ ◦➛ Status: ${wasStopped? 'Stopped by user 🛑' : 'Completed ✅'}${failedList}
╰─────────────────────────⊷
`

      // Send to DM if stopped, else group
      const targetJid = wasStopped? sender : from
      await sock.sendMessage(targetJid, {
        text: summaryText.trim(),
        contextInfo
      }, { quoted: m })

      // Notify group if DM was used
      if (wasStopped) {
        await sock.sendMessage(from, {
          text: `╭─────〔 GPP 〕─────┈⊷\n│ ◦➛ Process stopped\n│ ◦➛ Summary sent to DM 📩\n╰─────────────────────────⊷`,
          contextInfo
        }, { quoted: m })
      }

      gppStopMap.delete(from)
      logger.success('GPP', `Completed: ${successCount} success, ${failedCount} failed`)

    } catch (e) {
      gppStopMap.delete(from)
      logger.error('GPP', 'GPP command failed', e.message)

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