const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    throw new Error('No token information provided');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command ${command.data.name}`);
    }
    else {
        console.error(`The command ${filePath} does not have a data and execute method as expected`);
    }
}

client.once(Events.ClientReady, c => {
    console.log(`Client Ready - Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No match command for ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was a problem executing this command',
                ephemeral: true,
            });
        }
        else {
            interaction.reply({
                content: 'There was an error while executing this command',
                ephemeral: true,
            });
        }
    }
});

client.login(token);
