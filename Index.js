const mineflayer = require('mineflayer')
const axios = require('axios')

const bot = mineflayer.createBot({
  host: 'Craftzin_.aternos.me',
  port: 37834,
  username: 'GPTBot' // Nome visível no jogo
})

const OPENAI_KEY = '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'

let dono = null

bot.on('chat', async (username, message) => {
  if (username === bot.username) return
  if (!dono) dono = username

  if (message === 'segue') {
    const target = bot.players[dono]?.entity
    if (!target) return bot.chat("Não te vejo!")
    bot.chat("Te seguindo!")
    bot.on('physicTick', () => {
      if (target) bot.lookAt(target.position.offset(0, 1.6, 0))
      bot.setControlState('forward', true)
    })
  }

  else if (message === 'para') {
    bot.chat("Parando.")
    bot.removeAllListeners('physicTick')
    bot.clearControlStates()
  }

  else if (message.startsWith('gpt ')) {
    bot.chat("Pensando...")
    const resposta = await consultaGPT(message.slice(4))
    bot.chat(resposta.slice(0, 100)) // corta para caber no chat do Minecraft
  }
})

async function consultaGPT(texto) {
  try {
    const res = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Você é um companheiro dentro do Minecraft, útil e amigável." },
        { role: "user", content: texto }
      ],
      temperature: 0.8
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`
      }
    })
    return res.data.choices[0].message.content
  } catch (e) {
    console.error(e.response?.data || e.message)
    return "Erro ao falar com o ChatGPT!"
  }
}
