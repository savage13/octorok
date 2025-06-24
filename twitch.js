
import * as fs from 'fs'
import 'dotenv/config'

const HELIX = 'https://api.twitch.tv/helix'

const speedrun_tags = [
    "speedrun",
    "hundo", "100%", "100percent",
    "any%", "rta",
    "bingo", "bingus"
].map(v => v.toLowerCase())

const Headers = {
    Authorization: `Bearer ${process.env.ACCESSTOKEN}`,
    'Client-Id': process.env.CLIENTID,
}

async function try_fetch(url, headers) {
    const res = await fetch(url, { headers })
    if(!res.ok) {
        console.error(`${res.status}: ${res.statusText} ${res.url}`)
        return undefined
    }
    return res.json()
}

async function get_game(name, headers = Headers) {
    const BASE = `${HELIX}/games`
    const pars = new URLSearchParams({name})
    const url = `${BASE}?${pars.toString()}`
    return try_fetch(url, headers)
}

async function get_game_id(game_name, headers = Headers) {
    let games = await get_game(game_name, headers)
    if(!games || !(games.data) || games.data.length < 1) {
        return undefined
    }
    return games.data[0]
}

export async function get_live_channels_by_name(user_id, headers = Headers) {
    const BASE = `${HELIX}/streams`
    if(!(Array.isArray(user_id))) {
        user_id = Array(user_id)
    }
    user_id = user_id.map(uid => ['user_id', uid])
    const pars = new URLSearchParams(user_id)
    const url = `${BASE}?${pars.toString()}`
    return try_fetch(url, headers)
}

export async function get_live_channels_by_game(game_name, headers = Headers) {
    const BASE = `${HELIX}/search/channels`
    let game = await get_game_id(game_name, headers)
    if(!game) {
        return undefined
    }
    const pars = new URLSearchParams({
        query: game.name,
        game_id: game.id,
        first: 100,
        live_only: true
    })
    const url = `${BASE}?${pars.toString()}`
    return try_fetch(url, headers)
}

function by_time(channel) {
    return channel.started_at.length > 0
}

function has_channel_id(id, channels) {
    for(const chan of channels) {
        if(chan.id == id)
            return true
    }
    return false
}

async function example() {
    const botw = 'The Legend of Zelda: Breath of the Wild'
    const totk = 'The Legend of Zelda: Tears of the Kingdom'
    let channels
    try {
        channels = await get_live_channels_by_game(totk, headers)
    } catch(err) {
        if(err.status) {
            console.log('Status', err.status)
        } else {
            console.log(err)
        }
        process.exit(0)
    }
    channels = channels.data || []
    channels = channels.filter(by_time).filter(by_channel)

    for(const channel of channels) {
        console.log(channel.display_name)
    }

    const old_channels = JSON.parse(fs.readFileSync('twitch_botw.json', 'utf8'))

    fs.writeFileSync('twitch_botw.json', JSON.stringify(channels, null, 2),
                     { encoding: 'utf8' }
                    )

    const added = []
    const removed = []
    for(const channel of channels) {
        if(!(has_channel_id(channel.id, old_channels))) {
            added.push(channel)
        }
    }
    for(const channel of old_channels) {
        if(!(has_channel_id(channel.id, channels))) {
            removed.push(channel)
        }
    }
    console.log('Added', added.map(v => v.display_name))
    console.log('Removed', removed.map(v=> v.display_name))
}

