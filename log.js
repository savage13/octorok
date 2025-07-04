
import { ChannelType, MessageType } from 'discord.js'
import { debounce } from './debounce.js'
import { config } from './config.js'

let client = undefined
let messages = {}

const MAX_MINUTES = 60.0

function log_clear(gid) {
    messages[gid] = []
}

async function log_write(gid) {
    if(messages[gid].length <= 0)
        return
    if(!client)
        return log_clear(gid);
    let channel_name = config.get(gid, 'log')
    if(!channel_name || channel_name == "") {
        return log_clear(gid)
    }
    let channel = client.channels.cache.find((c) => {
        if(c.guildId != gid)
            return false
        if(c.type != ChannelType.GuildText)
            return false
        if(c.name != channel_name)
            return false
        return true
    })
    if(channel === undefined) {
        //console.log(`Cannot find channel: ${channel_name}`)
        return log_clear(gid)
    }

    // Find messages to delete; > MAX_MINUTES
    let now = new Date().getTime()
    let old_messages = await channel.messages.fetch({limit: 100});
    old_messages = old_messages.filter(m => {
        const dt_min = (now - m.createdTimestamp)/(1000 * 60)
        return (client.user.id == m.author.id) && (dt_min > MAX_MINUTES);
    })
    if(old_messages.size > 0) {
        await channel.bulkDelete(old_messages).catch(console.error);
    }

    const content = messages[gid].join("\n")
    if(!content || content == "") {
        return log_clear(gid)
    }
    await channel.send({ content }).catch(console.error)
    return log_clear(gid)
}

const log_write_call = debounce(log_write, 1000)

function log_message(gid, msg) {
    if(!(gid in messages)) {
        log_clear(gid)
    }
    let t0 = new Date()
    let t = Math.floor(t0.getTime()/ 1000)
    t = `<t:${t}:f>`
    messages[gid].push(`${t} :: \`${msg}\``)
    log_write_call(gid)
    console.log(`${t0.toISOString()} :: ${msg}`)
}

function set_client(client_value) {
    client = client_value
}

export const log = {
    log: log_message,
    set_client
}
