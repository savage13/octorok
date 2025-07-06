
import { ChannelType, MessageType } from 'discord.js'
import { get_live_channels_by_game, get_live_channels_by_name, get_user_by_name } from './twitch.js'
import { timedelta } from './timedelta.js'
import { config } from './config.js'
import { log } from './log.js'

let client = undefined

function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

function memoize(fn, uid) {
    const cache = {}
    return async function() {
        const args = arguments
        const out = []
        const update = []
        const now = Math.floor(new Date().getTime()/1000)
        const timespan = 60 * 60 * 24 * 7;
        for(const arg of args) {
            if(arg in cache && cache[arg].expires > now) {
                out.push( cache[arg].data )
            } else {
                update.push(arg)
            }
        }
        if(update.length > 0) {
            let updates = await fn.apply(undefined, update)
            for(const arg of updates) {
                cache[uid(arg)] = { data: arg, expires: now + timespan }
                out.push(arg)
            }
        }
        return out
    }
}

async function update_online(gid) {
    log.log(gid, `Update stream listings ... ${new Date().toISOString()}`)
    const channel_name = config.get(gid, 'channel')
    let channel = client.channels.cache.find(
        (c) => {
            if(c.type != ChannelType.GuildText)
                return false
            if(gid != c.guildId)
                return false
            if(channel_name != c.name){
                return false
            }
            return true
        }
    )
    if(channel === undefined) {
        log.log(gid, `Cannot find channel: ${channel_name}`)
        return
    }

    log.log(gid, `   Guild: ${channel.guild.name} Channel: ${channel.name}`)
    const messages = await channel.messages.fetch({limit: 100})

    let url_old = {}
    // Removed multiple messages with the same url
    messages.each(m => {
        if(m.embeds.length <= 0)
            return
        const url = m.embeds[0].data.url
        if(!(url in url_old))
            url_old[url] = 0
        url_old[url] += 1
    })
    //log.log(gid, url_old)
    for(const [url, count] of Object.entries(url_old)) {
        if(count > 1) {
            log.log(gid, `   Multuple messages for ${url} ${count} ${channel.guild.name}`)
            const msgs = messages
                  .filter(m => m.embeds.length)
                  .filter(m => m.embeds[0].data.url == url)
            for(let i = 0; i < msgs.size-1; i++) {
                await msgs.at(i).delete()
            }
        }
    }

    url_old = new Set(Object.keys(url_old))

    let channels = []
    for(const game_name of config.get(channel.guildId, 'games')) {
        let chans = await get_live_channels_by_game(game_name)
        if(!chans)
            continue
        chans = chans.data || []
        channels.push( ... chans )
    }

    const keywords =  config.get(channel.guildId, 'keyword')
    channels = channels.filter(c => by_channel(c, keywords))

    const streamers = config.get(channel.guildId, 'streamers')
    if(streamers.length > 0) {
        for(const chunk of chunks(streamers, 100)) {
            let chan = await get_live_channels_by_name(chunk)
            if(chan) {
                chan = chan.data || []
                // All of this, just to get the profile_image_url
                let user_names = chan.map(c => c.user_login)
                if(user_names.length > 0) {
                    const users = await get_user_by_name(user_names)
                    if(users) {
                        for(const user of users.data) {
                            for(const c of chan) {
                                if(user.login == c.user_login) {
                                    c.thumbnail_url = user.profile_image_url
                                }
                            }
                        }
                    }
                }
                channels.push( ... chan)
            }
        }
    }

    channels.sort((a,b) => a.started_at.localeCompare(b.started_at))
    channels = unique_channels(channels)

    // Ignore channels
    const ignore = config.get(channel.guildId, 'ignore')
    channels = channels.filter(c => !(ignore.includes(c.user_login) ||
                                      ignore.includes(c.broadcaster_name) ||
                                      ignore.includes(c.display_name) ||
                                      ignore.includes(c.user_name)))

    let embeds = channels.map(channel_embed)

    let url = new Set(embeds.map(m => m.url))

    let remove = url_old.difference(url)
    let add = url.difference(url_old)
    let keep = url.intersection(url_old)

    // log.log(gid, '    ', '+', add, '-', remove, '=', keep)
    log.log(gid, `     add ${add.size} remove ${remove.size} keep ${keep.size}`)

    messages.each(m => {
        if(m.embeds.length == 0)
            return
        let url = m.embeds[0].data.url
        if(remove.has(url)) {
            m.delete().catch(console.error)
        }
    })

    const ping = config.get(channel.guildId, 'ping')
    for(const m of embeds) {
        let url = m.url
        let content = ""
        if(ping && ping != "") {
            for(const name of streamers) {
                if(url.toLowerCase() == `https://twitch.tv/${name.toLowerCase()}`) {
                    content = `${ping} ${name} is live!`
                    break
                }
            }
        }
        if(add.has(url)) {
            await channel.send({ embeds: [ m ], content }).catch(console.error)
        }
    }
}

function channel_embed(channel) {
    // display_name || user_name
    // broadcaster_login || user_login
    // started_at
    // thumbnail_url
    // game_name
    // title
    // tags

    if(!(channel.display_name))
        channel.display_name = channel.user_name
    if(!(channel.broadcaster_login))
        channel.broadcaster_login = channel.user_login

    let color = 0x9FFFC8
    if(channel.game_name.includes("Breath of the Wild"))
        color = 0xB9E5FF
    if(channel.game_name.includes("Tears of the Kingdom"))
        color = 0xFBCEFF

    let start = new Date(channel.started_at).getTime()/1000
    const embed = {
        color: color,
        author: {
            name: `${channel.display_name} is live on Twitch!`,
            icon_url: channel.thumbnail_url,
        },
        thumbnail: {
		        url: channel.thumbnail_url,
	      },
        title: `${channel.display_name} is live: https://www.twitch.tv/${channel.broadcaster_login}`,
        url: `https://twitch.tv/${channel.broadcaster_login}`,
        description: channel.title,
        timestamp: new Date().toISOString(),
        fields: [
            { name: '', value: channel.tags.join(", ") },
            { name: "", value: `<t:${start}:f>`, },
        ],
        footer: {
            text: `Playing ${channel.game_name}`,
            icon_url: channel.thumbnail_url,
        }
    }
    return embed
}

function by_tags(channel, keywords) {
    const ctags = channel.tags.map(v => v.toLowerCase())
    //console.log(channel.broadcaster_login, speedrun_tags, ctags)
    for(const tag of keywords) {
        for(const ctag of ctags) {
            if(tag == ctag) {
                return true
            }
        }
    }
    return false
}
function by_title(channel, keywords) {
    let title = channel.title.toLowerCase()
    for(const tag of keywords) {
        if(title.includes(tag)){
            return true
        }
    }
    return false
}
function by_channel(channel, keywords) {
    return by_tags(channel, keywords) || by_title(channel, keywords)
}


function unique_channels(channels) {
    let tmp = {}
    for(const c of channels) {
        const id = c.user_login || c.broadcaster_login
        if(tmp[id])
            continue
        tmp[id] = c
    }
    return Object.values(tmp)
}

let update_id = {}

function restart_updates(gid) {
    let msg = stop_updates(gid) + ", ";
    msg += start_updates(gid)
    return msg
}
function start_updates(gid) {
    if(status(gid))
        return 'Updates already started'
    update_online(gid)
    update_id[gid] = setInterval(() => { update_online(gid) }, timedelta(config.get(gid, 'update')))
    return 'Notifications started'
}
function stop_updates(gid) {
    if(!status(gid))
        return 'Notificiation already stopped'
    clearInterval(update_id[gid])
    update_id[gid] = undefined
    return `Notifications stopped`
}
function status_updates(gid) {
    if(status(gid))
        return 'Notifications running'
    return 'Notifications not running'
}
function status(gid) {
    return update_id[gid] !== undefined
}

function set_client(client_value) {
    client = client_value
}

export const update = {
    update: (gid) => { update_online(gid); return "Reqested update to notitications" } ,
    restart: restart_updates,
    start: start_updates,
    stop: stop_updates,
    status: status_updates,
    set_client: set_client,
}
