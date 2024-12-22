const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Return NFTs balance in your wallet.'),
    async execute(interaction) {
        return interaction.reply("Processing...");
    }
}