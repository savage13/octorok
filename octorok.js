
import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'

import { Client, Events, GatewayIntentBits } from 'discord.js'
import { Collection, MessageFlags, ChannelType, MessageType } from 'discord.js'

import { streams } from './streams.js'
import { config } from './config.js'
import { update } from './update.js'
import { log } from './log.js'

import { SlashCommandBuilder } from 'discord.js'

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

const client = new Client({ intents: [ GatewayIntentBits.Guilds ] })

update.set_client(client)
log.set_client(client)

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

client.on(Event.GuildCreate, async (guild) => {
    console.log("Joined a new guild: " + guild.name);
    config.read(guild.id)
    update.start(guild.id)

})
client.on(Event.GuildDelete, async (guild) => {
    console.log("Left a guild: " + guild.name);
})

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`)
    readyClient.guilds.cache.each(guild => {

        log.log(guild.id, `Guild: ${guild.name} ID: ${guild.id}`);
        config.read(guild.id)
        update.start(guild.id)
    })
})

client.login(token)

