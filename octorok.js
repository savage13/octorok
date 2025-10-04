
import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'

import { Client, Events, GatewayIntentBits } from 'discord.js'
import { Collection, MessageFlags, ChannelType, MessageType } from 'discord.js'

import { set_twitch_token, get_twitch_access_token } from './twitch.js'
import { set_mock_server } from './twitch.js'
import { get_user_by_name } from './twitch.js'
import { streams } from './streams.js'
import { config } from './config.js'
import { update } from './update.js'
import { log } from './log.js'

import { SlashCommandBuilder } from 'discord.js'

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

const client = new Client({ intents: [ GatewayIntentBits.Guilds ] })

const DEBUG = process.env.DEBUG || false

update.set_client(client)
log.set_client(client)
set_twitch_token(process.env.ACCESSTOKEN, process.env.CLIENTID)

client.commands = new Collection()
client.commands.set(streams.data.name, streams)

client.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()) {
        return
    }
    const command = interaction.client.commands.get(interaction.commandName);
    if(!command) {
        console.log(`No command matching ${interaction.commandName}`)
        return
    }
    try {
        await command.execute(interaction)
    } catch(error) {
        console.log(error)
        if(interaction.replied || interaction.deferred) {
			      await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral
            })
        } else {
			      await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral
            });
        }
    }
})

client.on(Events.GuildCreate, async (guild) => {
    console.log("Joined a new guild: " + guild.name);
    config.read(guild.id)
    update.start(guild.id)

})
client.on(Events.GuildDelete, async (guild) => {
    console.log("Left a guild: " + guild.name);
})

const DAYS_IN_MS = 24 * 60 * 60 * 1000

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`)
    readyClient.guilds.cache.each(guild => {
        log.log(guild.id, `Guild: ${guild.name} ID: ${guild.id}`);
        setTimeout(() => {
            config.read(guild.id)
            update.start(guild.id)
        }, 3 * 1000);
    })
    setInterval(async () => {await update_twitch_access_token()}, DAYS_IN_MS)
})

async function update_twitch_access_token() {
    const expires = new Date(process.env.TOKENEXPIRATION)
    const now = new Date()
    const t = new Date(now.getTime() + 2 * DAYS_IN_MS)
    if(t < expires)
        return
    console.log("Updating access token ...")
    let res = await get_twitch_access_token(process.env.CLIENTID,
                                            process.env.CLIENTSECRET);
    if(!res) {
        console.error("Unable to get new twitch access token")
        return
    }

    let new_expires = new Date(now.getTime() + res.expires_in * 1000)
    let token_expiration = new_expires.toISOString()

    set_env_value("ACCESSTOKEN", res.access_token)
    set_env_value("TOKENEXPIRATION", token_expiration)

    process.env.ACCESSTOKEN = res.access_token
    process.env.TOKENEXPIRATION = token_expiration

    set_twitch_token(process.env.ACCESSTOKEN, process.env.CLIENTID)
    console.log("Updating access token: Done")
}

function set_env_value(key, value) {
    const filename = "./.env"
    const ENV_VARS = fs.readFileSync(filename, "utf8").split("\n")
    const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
        const re = new RegExp(`(?<!#\\s*)${key}(?==)`);
        return line.match(re)
    }));
    const key_value = `${key}=${value}`
    if(target !== -1) {
        ENV_VARS.splice(target, 1, key_value)
    } else {
        ENV_VARS.push(key_value)
    }
    fs.writeFileSync(filename, ENV_VARS.join("\n"))
}

async function fake_twitch() {
    const res = await fetch('http://localhost:8080/units/clients')
    const out = await res.json()
    const data = out.data[0]
    // Build Mock Data
    process.env.CLIENTID = data.ID
    process.env.CLIENTSECRET = data.Secret
    process.env.TOKENEXPIRATION = new Date().toISOString()
    process.env.ACCESSTOKEN = "empty"
    set_twitch_token(process.ACCESSTOKEN, process.env.CLIENTID)

    
    await update_twitch_access_token()
    setInterval(async () => { await update_twitch_access_token() }, 4000);

    setInterval(async () => {
        const users = await get_user_by_name(['username'])
        console.log('Users', users.data.length)
    }, 1000);

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    await sleep(1000 * 20)
}

if(DEBUG) {
    set_mock_server()
    await fake_twitch()
    console.log("Bye")
    process.exit(0)
} else {
    client.login(token)
}

