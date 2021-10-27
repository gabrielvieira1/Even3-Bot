const Discord = require("discord.js")
const fetch = require("node-fetch")
const keepAlive = require("./server")
const Database = require("@replit/database")
const { Client, Intents } = require('discord.js');

const db = new Database()
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});


const sadWords = ["triste", "bom dia", "infeliz", "solidão", "bom dia bot, por favor uma mensagem de motivação", "segunda", "segunda-feira", "sextou", "sexta"]

const starterEncouragements = [
  "REGOZIJA MULHER!",
  "Mantenha-se firme.",
  "Você é uma ótima pessoa / bot!",
  "TU É FODA!",
  "SEXTOUUUU!!!!"
]

const comands = [
  "$even3 - Mensagem motivacional",
  "$new - Adiciona nova mensagem",
  "$del - Deleta alguma mensagem ex:($del 1)",
  "$list - Lista todas as mensagens cadastras",
  "$responding - Responde se o bot está ativo"
]

db.get("encouragements").then(encouragements => {
  if (!encouragements || encouragements.length < 1) {
    db.set("encouragements", starterEncouragements)
  }
})

db.get("responding").then(value => {
  if (value == null) {
    db.set("responding", true)
  }
})

function updateEncouragements(encouragingMessage) {
  db.get("encouragements").then(encouragements => {
    encouragements.push([encouragingMessage])
    db.set("encouragements", encouragements)
  })
}

function deleteEncouragement(index) {
  db.get("encouragements").then(encouragements => {
    if (encouragements.length > index) {
      encouragements.splice(index, 1)
      db.set("encouragements", encouragements)
    }
  })
}

function getQuote() {
  return fetch("https://zenquotes.io/api/random")
    .then(res => {
      return res.json()
    })
    .then(data => {
      return data[0]["q"] + " -" + data[0]["a"]
    })
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
  if (msg.author.bot) return

  if (msg.content === "$even3") {
    msg.delete()
    getQuote().then(quote => msg.channel.send(quote))
  }

  db.get("responding").then(responding => {
    if (responding && sadWords.some(word => msg.content.includes(word))) {
      db.get("encouragements").then(encouragements => {
        const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
        msg.reply(encouragement)
      })
    }
  })

  if (msg.content.startsWith("$new")) {
    encouragingMessage = msg.content.split("$new ")[1]
    updateEncouragements(encouragingMessage)
    msg.delete()
    msg.channel.send("New encouraging message added.")
  }

  if (msg.content.startsWith("$del")) {
    index = parseInt(msg.content.split("$del ")[1])
    deleteEncouragement(index)
    msg.delete()
    msg.channel.send("Encouraging message deleted.")
  }

  if (msg.content.startsWith("$list")) {
    db.get("encouragements").then(encouragements => {
      msg.delete()
      msg.channel.send(encouragements)
    })
  }

  if (msg.content.startsWith("$help")) {
    db.get("encouragements").then(encouragements => {
      msg.delete()
      msg.channel.send(comands)
    })
  }

  if (msg.content.startsWith("$clear")) {
    db.get("encouragements").then(encouragements => {
      msg.delete()
      msg.channel.bulkDelete(2)
        .then(messages => console.log(`Bulk deleted ${messages.size} messages`))
        .catch(console.error);
    })
  }

  if (msg.content.startsWith("$responding")) {
    value = msg.content.split("$responding ")[1]

    if (value.toLowerCase() == "true") {
      db.set("responding", true)
      msg.channel.send("Responding is on.")
    } else {
      db.set("responding", false)
      msg.channel.send("Responding is off.")
    }
  }

  if (msg.content.startsWith('$react')) {
    msg.delete()
    msg.channel.send('Pegue seu cargo! \n\n 😄 para Produto \n 😎 para Marketing ').then(sent => {
      sent.react('😄')
      sent.react('😎')
    })
  }

})

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;
  if (!reaction.message.guild) return;

  const roleProduto = reaction.message.guild.roles.cache.find(role => role.name === "Produto")
  const roleMkt = reaction.message.guild.roles.cache.find(role => role.name === "Marketing")

  if (reaction.emoji.name === '😄') {
    await reaction.message.guild.members.cache.get(user.id).roles.add(roleProduto)
  }
  if (reaction.emoji.name === '😎') {
    await reaction.message.guild.members.cache.get(user.id).roles.add(roleMkt)
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;
  if (!reaction.message.guild) return;

  const roleProduto = reaction.message.guild.roles.cache.find(role => role.name === "Produto")
  const roleMkt = reaction.message.guild.roles.cache.find(role => role.name === "Marketing")

  if (reaction.emoji.name === '😄') {
    await reaction.message.guild.members.cache.get(user.id).roles.remove(roleProduto)
  }
  if (reaction.emoji.name === '😎') {
    await reaction.message.guild.members.cache.get(user.id).roles.remove(roleMkt)
  }
});




keepAlive()
client.login(process.env.TOKEN)