
import { REST, Routes } from 'discord.js'
import 'dotenv/config'

//import { ping } from './ping.js'
import { streams } from './streams.js'

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

const commands = []
//commands.push(ping.data.toJSON())
commands.push(streams.data.toJSON())

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands`)

        const data = await rest.put(
            Routes.applicationCommands(clientId), //, guildId),
            { body: commands }
        )
        console.log(`Successfully reloaded ${data.length} application (/) commands`)
        let out = await rest.get(
            Routes.applicationCommands(clientId), //, guildId),
        )
        console.log("Guild Commands", out)
    } catch(error) {
        console.log(error)
    }
})();

