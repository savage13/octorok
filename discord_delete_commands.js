
import { REST, Routes } from 'discord.js'
import 'dotenv/config'

//import { ping } from './ping.js'
//import { streams } from './streams.js'

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

//const commands = []
//commands.push(ping.data.toJSON())
//commands.push(streams.data.toJSON())

const rest = new REST().setToken(token);

// https://discordjs.guide/slash-commands/deleting-commands.html#deleting-specific-commands
// for guild-based commands
let command_id = "1386688251695333376"
rest.delete(Routes.applicationGuildCommand(clientId, guildId, command_id))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);

