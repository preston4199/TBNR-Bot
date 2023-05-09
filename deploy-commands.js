const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log('\x1b[33m', `[WARNING] The command at ${filePath} is missing a require "data" or "execute" property.`, '\x1b[0m');
        }
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        console.log(commands)
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('\x1b[32m', `Successfully reloaded ${data.length} application (/) commands.`, '\x1b[0m');
    } catch (error) {
        console.error(error);
    }
})();