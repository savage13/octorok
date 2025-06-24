
import { SlashCommandBuilder } from 'discord.js'
import { config } from './config.js'
import { update } from './update.js'

export const streams = {
    data: new SlashCommandBuilder()
        .setName("streams")
        .setDescription("Stream Notifier")
        .addSubcommandGroup(group =>
            group.setName('games')
                .setDescription('Get, add or remove games to be notified about')
                .addSubcommand(command =>
                    command.setName('get')
                        .setDescription('Get games to be nofified about')
                )
                .addSubcommand(command =>
                    command.setName('add')
                        .setDescription('Add game to notifications')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Game to add')
                        )
                )
                .addSubcommand(command =>
                    command.setName('remove')
                        .setDescription('Remove game from notifications')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Game to remove')
                        )
                )
        )
        .addSubcommandGroup(group =>
            group.setName('streamers')
                .setDescription('Get, add or remove streams to be notified about')
                .addSubcommand(command =>
                    command.setName('get')
                        .setDescription('Get streamers to be nofified about')
                )
                .addSubcommand(command =>
                    command.setName('add')
                        .setDescription('Add streamer to notifications')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Streamer to add')
                        )
                )
                .addSubcommand(command =>
                    command.setName('remove')
                        .setDescription('Remove streamer from notifications')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Streamer to remove')
                        )
                )
        )
        .addSubcommandGroup(group =>
            group.setName('ignore')
                .setDescription('Get, add or remove streams to ignore')
                .addSubcommand(command =>
                    command.setName('get')
                        .setDescription('Get streamers to ignore')
                )
                .addSubcommand(command =>
                    command.setName('add')
                        .setDescription('Add streamer to ignore')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Streamer to ignore')
                        )
                )
                .addSubcommand(command =>
                    command.setName('remove')
                        .setDescription('Remove streamer from ignore list')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Streamer to remove from ignore list')
                        )
                )
        )
        .addSubcommandGroup(group =>
            group.setName('keyword')
                .setDescription('Get, add or remove keywords to notify on')
                .addSubcommand(command =>
                    command.setName('get')
                        .setDescription('Get keyword to notify on')
                )
                .addSubcommand(command =>
                    command.setName('add')
                        .setDescription('Add keyword to to list')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Keyword to add')
                        )
                )
                .addSubcommand(command =>
                    command.setName('remove')
                        .setDescription('Remove keyword from list')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Keyword to remove')
                        )
                )
        )
        .addSubcommandGroup(group =>
            group.setName('channel')
                .setDescription('Get or set notification channel')
                .addSubcommand(command =>
                    command.setName('get')
                        .setDescription('Get notification channel')
                )
                .addSubcommand(command =>
                    command.setName('set')
                        .setDescription('Set notification channel')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Name of channel')
                        )
                )
        )
        .addSubcommandGroup(group =>
            group.setName('update')
                .setDescription('Get or set update interval, e.g. 1m, 30 sec, 5 minutes')
                .addSubcommand(command =>
                    command.setName('get')
                        .setDescription('Get update interval')
                )
                .addSubcommand(command =>
                    command.setName('set')
                        .setDescription('Set update interval')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Update interval')
                        )
                )
        )
        .addSubcommandGroup(group =>
            group.setName('control')
                .setDescription('Stop, Start, Restart, Update, or get Status on the notifications')
                .addSubcommand(command =>
                    command.setName('stop')
                        .setDescription('Stop the notifications')
                )
                .addSubcommand(command =>
                    command.setName('start')
                        .setDescription('Start the notifications')
                )
                .addSubcommand(command =>
                    command.setName('restart')
                        .setDescription('Restart the notifications')
                )
                .addSubcommand(command =>
                    command.setName('update')
                        .setDescription('Update the notifications, runs once')
                )
                .addSubcommand(command =>
                    command.setName('status')
                        .setDescription('Get the status of the notifications')
                )
        )

    ,
    execute: async (interaction) => {
        const gid = interaction.guildId
        const group = interaction.options.getSubcommandGroup()
        const cmd = interaction.options.getSubcommand()
        const name = interaction.options.getString('name')
        //console.log('streams ==>', group, cmd, name)
        let msg = "error on streamer command"
        if(group == "channel" || group == "update") {
            switch(cmd) {
            case "get":
                msg = config.get(gid, group); break;
            case "set":
                if(config.set(gid, group, name))
                    msg = `Set ${group} to '${name}'`
                else
                    msg = `Error setting ${group} to '${name}'`
            }
        } else if(group == "control") {
            switch(cmd) {
            case "start": msg = update.start(gid); break;
            case "stop": msg = update.stop(gid); break;
            case "restart": msg = update.restart(gid); break;
            case "status": msg = update.status(gid); break;
            case "update": msg = update.update(gid); break;
            }

        } else if(group) {
            switch(cmd) {
            case "get":
                msg = config.get(gid, group).join('\n');
                if(msg == "")
                    msg = "[]"
                break;
            case "add":
                if(config.add(gid, group, name))
                    msg = `Added ${name} to ${group}`
                else
                    msg = `Error adding ${name} to ${group}`
                break;
            case "remove":
                if(config.remove(gid, group, name))
                    msg = `Remove ${name} from ${group}`
                else
                    msg = `Error removing ${name} from ${group}`
                break;
            }
            console.log(group, config.get(gid, group), gid)
        }
        await interaction.reply(msg)
    }
}


//console.log(streams.data.toJSON())
