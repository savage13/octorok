
import * as fs from 'fs';
import { log } from './log.js'

let CONFIG = {}

function config_filename(gid) {
    return `savagebot_gid_${gid}.json`
}

const default_config = {
    games: [
        "The Legend of Zelda: Breath of the Wild",
        "The Legend of Zelda: Tears of the Kingdom"
    ],
    streamers: [  ],
    update: "5m",
    channel: "streaming",
    ignore: [],
    keyword: [],
    ping: "",
    log: "syslog",
}

function config_read(gid) {
    const filename = config_filename(gid)
    if(!(fs.existsSync(filename))) {
        log.log(gid, "generate new file", filename)
        CONFIG[gid] = structuredClone(default_config)
        CONFIG[gid].gid = gid
        config_write(gid)
    }
    log.log(gid, "config_read", filename)
    CONFIG[gid] = JSON.parse(fs.readFileSync(config_filename(gid),'utf8'))
    if(!('gid' in CONFIG[gid])) {
        CONFIG[gid].gid = gid
        config_write(gid)
    }
    if(!('ignore' in CONFIG[gid])) {
        CONFIG[gid].ignore = []
    }
    if(!('keyword' in CONFIG[gid])) {
        CONFIG[gid].keyword = []
    }
    if(!('log' in CONFIG[gid])) {
        CONFIG[gid].log = "syslog"
    }
    if(!('ping' in CONFIG[gid])) {
        CONFIG[gid].ping = ""
    }
}

function config_write(gid) {
    let data = JSON.stringify(CONFIG[gid], null, 2)
    fs.writeFileSync(config_filename(gid), data)
}

function config_add(gid, kind, name) {
    if(!(gid in CONFIG))
       return false
    if(!(kind in CONFIG[gid]))
        return false
    let n = CONFIG[gid][kind].length
    CONFIG[gid][kind].push(name)
    CONFIG[gid][kind] = [... new Set(CONFIG[gid][kind])]
    let m = CONFIG[gid][kind].length
    let ok = m == n + 1
    if(ok)
        config_write(gid)
    return ok
}
function config_remove(gid, kind, name) {
    if(!(gid in CONFIG))
       return false
    if(!(kind in CONFIG[gid]))
        return false
    let n = CONFIG[gid][kind].length
    CONFIG[gid][kind] = CONFIG[gid][kind].filter(v => v != name)
    let m = CONFIG[gid][kind].length
    const ok = m == n - 1
    if(ok)
        config_write(gid)
    return m == n - 1;
}
function config_set(gid, name, value) {
    if(!(gid in CONFIG))
       return false
    if(!(name in CONFIG[gid]))
        return false
    CONFIG[gid][name] = value
    config_write(gid)
    return true
}

function config_get(gid, name) {
    if(!(gid in CONFIG))
        return false
    return CONFIG[gid][name]
}
function config_get_all(name) {
    let out = []
    for(const [gid, conf] of Object.entries(CONFIG)) {
        let c = { gid }
        c[name] = conf[name]
        out.push(c)
    }
    return out
}

export const config = {
    read: config_read,
    write: config_write,
    add: config_add,
    remove: config_remove,
    set: config_set,
    get: config_get,
}
