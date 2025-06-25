# Octorok

Watches twitch streams and notifies discord

## Setup
*Warning: This is private bot, please ask permission before using*

**Discord Setup**
 
 - Check if the `/streams` command is available in your discord
 - Add a `streaming` text channel or use `/streams channel set channel_name` to set the notifications channel
 - Set the desired `update` interval using `/streams update set some_interval`.  Anything less than `1m`, or really a couple of minutes, is overkill. Default is `3m` but `5 minutes` is fine. Its ok, you are not missing anything important.  
- Notifications should start automatically.

## Usage
### Streamers
Control the specific streamers to get notification for.  This *should* ping @everyone when they are streaming. This does not interact with `keyword`.

Default: `empty`

```
/streams streamers get
/streams streamers add streamer_name
/streams streamers remove streamer_name
```
### Games
Determine which games to search for on twitch.tv. `games` and `keyword` work together to identify the games of interest

Default: 
 - `The Legend of Zelda: Breath of the Wild`
 - `The Legend of Zelda: Tears of the Kingdom`

```
/streams games get
/streams games add game_name
/streams games remove game_name
```
### Keyword
Determine which keywords to search for on twitch.tv channels. `games` and `keyword` work together to identify the games of interest.

Keywords are case-insensitive and match channel tags and if contained in the channel title.

Default: `empty`
```
/streams keyword get
/streams keyword add keyword
/streams keyword remove keyword
```

### Channel
Controls the discord channel name where the notifications should go. Case sensitive.

Default: `streaming`
```
/streams channel get
/streams channel set text_channel_name
```
### Update 
Controls the update interval for notifications.  Expects a format like number plus time-unit, e.g. `5 minutes` or `10 m`.  Setting this to below `1 minute` is likely to get rate-limited on the twitch.tv API.

Default: `3m`
```
/streams update get
/streams update set interval
```

### Control
Control the behavior of the bot
```
/streams control status
/streams control start
/streams control stop
/streams control restart
/streams control update
```

### Ignore
Controls streamers to ignore. 

Default: `empty`
```
/streams ignore get
/streams ignore add streamer_name
/streams ignore remove streamer_name
```


### Get URL Invite

~~This should generate the URL above in the Setup.~~ It is here for the author to remember how to do things. You can safely ignore this

- https://discord.com/developers/applications
- Click on Application in Interest (Octorok)
- Click on OAuth2
- In OAuth2 URL Generator
  - Select:
    - bot
    - applications.commands
  - In Bot Permissions:
    - Send Messages
    - Mention Everyone
    - Read Message History
    - Manage Messages (not sure we need this)
    - Embed Links (not sure we need this)
- Integration Type:
  - Guild Install
- Copy URL

## License
BSD 2-Clause License

