const { SlashCommandBuilder } = require('discord.js');
const r = require('../db/games');

const command = new SlashCommandBuilder()
    .setName('health')
    .setDescription('Replies if the game is online')
    .addStringOption(option => option
        .setName('game')
        .setDescription('Game to check status')
        .setRequired(true));

const execute = async (interaction) => {
    const gameName = interaction.options.getString('game');

    if (!gameName) {
        await interaction.reply('No game name provided');
        return;
    }

    const guildId = interaction.guildId;

    await interaction.deferReply();

    const state = await r.getState(gameName, guildId);
    await interaction.editReply(`${gameName}'s state is ${state}`);
};

module.exports = {
    data: command,
    execute,
};
