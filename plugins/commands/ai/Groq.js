/**
 * AstraX - plugins/commands/ai/groq.js
 * Groq AI Chat - Using AstraX-API
 * Category: ai
 */

export default {
  name: 'groq',
  alias: ['llama', 'llama3', 'mixtral'],
  desc: 'Chat with Groq AI via AstraX-API',
  category: 'ai',
  usage: 'groq <question>',
  permission: 'all',

  async execute(sock, m, args, { api, db, logger, contextInfo, from, sender, isGroup, prefix }) {
    // ─── CHECK INPUT ─────────────────────
    if (!args.length) {
      return await sock.sendMessage(from, {
        text: `╭─────〔 GROQ AI 〕─────┈⊷
│ ◦➛ Usage: ${prefix}groq <question>
│ ◦➛ Example: ${prefix}groq explain quantum physics
╰─────────────────────────⊷`,
        contextInfo
      }, { quoted: m })
    }

    const question = args.join(' ')
    
    // ─── GENERATE SESSION ID ─────────────────────
    const sessionId = api.getSession(sender)
    
    // ─── SEND TYPING ─────────────────────
    await sock.sendPresenceUpdate('composing', from)
    
    try {
      // ─── GET CUSTOM SYSTEM PROMPT FROM DB ─────────────────────
      const systemPrompt = await db.get('agentSystem') || 'You are Groq, a fast and helpful AI assistant powered by Llama models.'
      
      // ─── CALL ASTRAX-API GROQ ENDPOINT ─────────────────────
      const res = await api.ai.groq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ], sessionId)
      
      // ─── HANDLE API ERROR ─────────────────────
      if (!res.success) {
        logger.error('GROQ', `API failed: ${res.error}`)
        return await sock.sendMessage(from, {
          text: `❌ Groq Error: ${res.error || 'Failed to connect to AstraX-API'}`,
          contextInfo
        }, { quoted: m })
      }
      
      // ─── EXTRACT ANSWER - SUPPORT MULTIPLE RESPONSE FORMATS ─────────────────────
      const answer = res.data?.data?.text || res.data?.text || res.data?.message || 'No response available.'
      
      // ─── SEND RESPONSE ─────────────────────
      await sock.sendMessage(from, {
        text: answer,
        contextInfo
      }, { quoted: m })
      
      logger.success('GROQ', `Answered: ${question.slice(0, 30)}...`)
      
    } catch (e) {
      logger.error('GROQ', `Command crashed: ${e.message}`)
      await sock.sendMessage(from, {
        text: `❌ System Error: ${e.message}`,
        contextInfo
      }, { quoted: m })
    }
  }
}