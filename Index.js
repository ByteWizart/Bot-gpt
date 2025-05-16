require('dotenv').config()
const mineflayer = require('mineflayer')
const axios = require('axios')

const bot = mineflayer.createBot({
  host: 'Craftzin_.aternos.me', // IP do seu servidor
  port: 37834,       // Porta
  username: 'GPTBot' // Nome do bot
})

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
    const pergunta = message.slice(4)
    bot.chat("Pensando...")
    const resposta = await chatGPT(pergunta)
    bot.chat(resposta.slice(0, 100))
  }
})

async function chatGPT(texto) {
  try {
    const res = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: [
        { role: "system", content: "Você é um companheiro dentro do Minecraft, útil e amigável." },
        { role: "user", content: texto }
      ],
      temperature: 0.8
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })

    return res.data.choices[0].message.content
  } catch (e) {
    console.error(e)
    return "Erro ao falar com o ChatGPT!"
  }
}
