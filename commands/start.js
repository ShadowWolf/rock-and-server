const { SlashCommandBuilder } = require('discord.js');
const r = require('../db/games');

const command = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start the server for a game')
    .addStringOption(option => option
        .setName('game')
        .setDescription('Game to start')
        .setRequired(true));

const execute = async (interaction) => {
    const gameName = interaction.options.getString('game');

    if (!gameName) {
        await interaction.reply('No game name provided');
        return;
    }

    const guildId = interaction.guildId;

    await interaction.deferReply();

    const response = await r.manageGame(gameName, 'start', guildId);

    await interaction.editReply(response);
};

module.exports = {
    data: command,
    execute,
};
