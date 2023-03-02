const { SlashCommandBuilder } = require('discord.js');
const r = require('../db/games');

const command = new SlashCommandBuilder()
    .setName('games')
    .setDescription('list games this server can administer');

const execute = async (interaction) => {
    await interaction.deferReply();
    const gameList = await r.listGames(interaction.guildId);

    const replyMessage = `You have access to the following games:\n${gameList.join('\n')}`;

    await interaction.editReply(replyMessage);
};

module.exports = {
    data: command,
    execute,
};
