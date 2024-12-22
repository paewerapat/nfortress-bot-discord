const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Return your connected wallet address.')
        .addStringOption(option => 
            option.setName('wallet-address')
            .setDescription("Connect your wallet to verify your identity.")
        ),
    async execute(interaction) {
        return interaction.reply("Processing...");
    }
}