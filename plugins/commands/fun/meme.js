/**
 * AstraX - plugins/commands/fun/meme.js
 * Meme Command - Get random meme with funny captions
 * Category: fun
 */

export default {
  name: 'meme',
  alias: ['memes', 'memegen', 'randommeme'],
  desc: 'Get a random meme with funny caption',
  category: 'fun',
  usage: 'meme',
  permission: 'all',

  async execute(sock, m, args, { db, logger, contextInfo, from, isGroup, sender }) {
    try {
      // ─── 100 MEME CAPTIONS ────────────────────────────────
      const memeCaptions = [
        'When you realize its Monday tomorrow 😭',
        'Me explaining why I need 8 hours of sleep 💤',
        'That face when WiFi disconnects 📶',
        'When someone says "we need to talk" 😰',
        'Me after saying "5 more minutes" 3 hours ago ⏰',
        'When you remember that embarrassing thing from 2012 😳',
        'My wallet after buying one coffee 💸',
        'When you see your crush online 🫣',
        'Me trying to be productive on Monday 💀',
        'When the teacher says "take out a paper" 📝',
        'My brain at 3AM: remember everything embarrassing 🤡',
        'When you finally understand the joke 5 minutes later 😅',
        'Me pretending I didnt see the message 👀',
        'When mom says "we have food at home" 🍽️',
        'My energy at 7AM vs 7PM 😴',
        'When you open the fridge for the 10th time 🥶',
        'Me after eating the whole pizza 🍕',
        'When someone asks if I am okay 😐',
        'My bank account vs my wishlist 💳',
        'When you step on a Lego barefoot 🦶',
        'Me trying to flirt 😬',
        'When you find money in old jeans 💰',
        'My diet starting tomorrow... again 🍔',
        'When you hear your name in a conversation 👂',
        'Me after one workout: I am basically an athlete 💪',
        'When the group chat is popping but you are busy 📱',
        'My plans vs my reality 😂',
        'When you accidentally like a 3 year old post 😱',
        'Me convincing myself I dont need sleep 😵',
        'When you see food and forget your diet 🍰',
        'My reaction to adult responsibilities 🫠',
        'When you realize you left the stove on 🏃',
        'Me at 2AM: I should become a singer 🎤',
        'When someone touches your food 🍗',
        'My face when the bill arrives 🧾',
        'When you pass your exam without studying 📚',
        'Me trying to act normal around my crush 😏',
        'When the WiFi password changes 🔒',
        'My motivation on Monday morning 😑',
        'When you send a text to wrong person 💀',
        'Me after watching one TikTok... 3 hours later 📱',
        'When you remember you have homework due 📖',
        'My poker face when lying 😐',
        'When you see your ex with someone new 😤',
        'Me trying to save money 💵',
        'When the elevator doors close on you 🚪',
        'My cooking skills: instant noodles chef 👨‍🍳',
        'When you hear ice cream truck music 🍦',
        'Me explaining memes to my parents 😂',
        'When you think you heard your name 🧏',
        'My brain during a test: *empty* 📝',
        'When you successfully avoid small talk 🫥',
        'Me after saying "I am fine" 😊',
        'When the food delivery says 2 minutes 🛵',
        'My life decisions at 3AM 🤔',
        'When you find the TV remote 📺',
        'Me trying to whisper but everyone hears 🤫',
        'When you remember something at random times 💡',
        'My reaction to drama 🍿',
        'When you get a haircut and regret it 💇',
        'Me pretending to understand math 🧮',
        'When you smell food from outside 👃',
        'My confidence after one compliment 😎',
        'When you wave at someone who wasnt waving at you 👋',
        'Me trying to adult 🧑',
        'When the microwave says food is ready 🍱',
        'My face when I see a spider 🕷️',
        'When you successfully parallel park 🚗',
        'Me after drinking coffee at 9PM ☕',
        'When you hear your favorite song 🎶',
        'My reaction to "we need to talk" texts 📱',
        'When you find your phone after losing it 📞',
        'Me trying to be mysterious 🕶️',
        'When you remember you left oven on 😰',
        'My energy after canceling plans 🛌',
        'When you see a dog and forget everything 🐕',
        'Me explaining why I am late again 😅',
        'When the pizza arrives 10 mins early 🍕',
        'My face when I get a compliment 🥰',
        'When you finally sit down after long day 🪑',
        'Me trying to take a good selfie 🤳',
        'When you hear gossip and act surprised 🫢',
        'My reaction to Mondays 📅',
        'When you find the perfect meme 😂',
        'Me after saying "one more episode" 📺',
        'When you realize its actually Friday 🎉',
        'My face when food is good 😋',
        'When you dodge a question smoothly 😏',
        'Me trying to be healthy for 5 minutes 🥗',
        'When you get away with a lie 😌',
        'My reaction to unexpected money 💸',
        'When you remember an embarrassing moment 🫣',
        'Me after cleaning my room for 5 minutes 🧹',
        'When you see your reflection and pose 🪞',
        'My face when someone says "free food" 🍔',
        'When you successfully avoid eye contact 👀',
        'Me trying to act cool 😎',
        'When the AC is finally fixed ❄️',
        'My reaction to good news 📢',
        'When you finish all your tasks ✅',
        'Me pretending I know whats going on 🤓',
        'When you get the last slice 🍕',
        'My face when I win an argument 🏆'
      ]

      // ─── RANDOM MEME APIS ─────────────────────────────────
      const memeAPIs = [
        'https://api.memegen.link/images/buzz/memes/memes_everywhere.jpg',
        'https://api.memegen.link/images/doge/such_meme/very_funny.jpg',
        'https://api.memegen.link/images/drake/no/yes.jpg',
        'https://api.memegen.link/images/expanding/im_not_sure/this_will_work.jpg',
        'https://api.memegen.link/images/patrick/we_should/take_bikini_bottom.jpg',
        'https://api.memegen.link/images/rollsafe/ignore_everyone/achieve_success.jpg',
        'https://api.memegen.link/images/success/nailed_it.jpg',
        'https://api.memegen.link/images/awkward/seal.jpg',
        'https://api.memegen.link/images/both/why_not_both.jpg',
        'https://api.memegen.link/images/keanu/thank_you.jpg'
      ]

      // ─── GET RANDOM CAPTION & IMAGE ───────────────────────
      const randomCaption = memeCaptions[Math.floor(Math.random() * memeCaptions.length)]
      const randomMemeUrl = memeAPIs[Math.floor(Math.random() * memeAPIs.length)]
      const userName = sender.split('@')[0]

      // ─── SEND RESULT ──────────────────────────────────────
      const resultText = `
╭─────〔 MEME 〕─────┈⊷
│ ◦➛ For: @${userName}
├─────────────────────────⊷
│ ◦➛ ${randomCaption}
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        image: { url: randomMemeUrl },
        caption: resultText.trim(),
        mentions: [sender],
        contextInfo
      }, { quoted: m })

      logger.success('MEME', `Sent meme to ${userName}`)

    } catch (e) {
      logger.error('MEME', 'Meme command failed', e.message)

      const errorText = `
╭─────〔 ERROR 〕─────┈⊷
│ ◦➛ Failed to get meme
╰─────────────────────────⊷
`
      await sock.sendMessage(from, {
        text: errorText.trim(),
        contextInfo
      }, { quoted: m })
    }
  }
}
