const S_TO_MS = 1000
const M_TO_S = 60
const H_TO_M = 60
const D_TO_M = 24
const units = {
    days:  D_TO_M * H_TO_M * M_TO_S * S_TO_MS,
    day:  D_TO_M * H_TO_M * M_TO_S * S_TO_MS,
    d:  D_TO_M * H_TO_M * M_TO_S * S_TO_MS,
    minutes: M_TO_S * S_TO_MS,
    minute: M_TO_S * S_TO_MS,
    mins: M_TO_S * S_TO_MS,
    min: M_TO_S * S_TO_MS,
    m: M_TO_S * S_TO_MS,
    hours: H_TO_M * M_TO_S * S_TO_MS,
    hour: H_TO_M * M_TO_S * S_TO_MS,
    hrs: H_TO_M * M_TO_S * S_TO_MS,
    h: H_TO_M * M_TO_S * S_TO_MS,
    seconds: S_TO_MS,
    second: S_TO_MS,
    secs: S_TO_MS,
    sec: S_TO_MS,
    s: S_TO_MS,
    milliseconds: 1,
    millisecond: 1,
    millis: 1,
    milli: 1,
    ms: 1,
}
const units_keys = Object.keys(units).sort((a,b) => b.length - a.length).join("|")
const time_delta_re = new RegExp(`([0-9]+)\\s*(${units_keys})`)

const default_value = 5 * M_TO_S * S_TO_MS

export function timedelta(value, on_error_value = default_value) {
    let m = value.match(time_delta_re)
    if(!m) {
        console.log(`Unable to parse timedelta: '${value}', returning ${on_error_value} ms`)
        return on_error_value
    }
    let v = parseInt(m[1]) * units[m[2]]
    return v
}

function timedelta_testing() {
    for(const s of ["1s", "1 s", "1 m" ,"1 h", "1 ms", "1 hour", "30 seconds",
                    "30 sec", "30 s", "5 minutes", "5m", "1d"]) {
        console.log(`${s.padStart(13, ' ')} => ${timedelta(s)/1000}`)
    }
}

