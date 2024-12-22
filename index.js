const { Client, 
    GatewayIntentBits, 
    Partials, 
    TextInputBuilder, 
    ModalBuilder, 
    Collection, 
    TextInputStyle, 
    ActionRowBuilder, 
    ModalSubmitFields, 
    Events,
    ButtonBuilder, ButtonStyle, EmbedBuilder
} = require('discord.js');
const { ethers } = require('ethers');
require('dotenv').config();
const TOKEN = process.env.BOT_TOKEN;
const fs = require('node:fs');
const path = require('node:path');
const { memberRole, connectURL } = require('./config.json')
const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth')
const  { doc, getDoc, getFirestore, setDoc, deleteField } = require("firebase/firestore");
const { initializeApp } = require('firebase/app')
const firebaseConfig = require('./database/config');
const { getBalanceOf721 } = require('./function/readContract');
let walletAddr;
let userId;

const email = process.env.FIREBASE_EMAIL;
const password = process.env.FIREBASE_PASSWORD;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();


// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
})

// New members
client.on('guildMemberAdd', async member => {
    // 
})

// Recieve interaction
client.on('interactionCreate', async interaction => {
    console.log("interaction ---> ", interaction)
    userId = interaction.user.id;
    const docRef = doc(db, `discord`, userId);

    // Command connect
    if (interaction.commandName === "connect") {
        // if command has a value
        if(interaction.options.data[0]?.value) {
            walletAddr = interaction.options.data[0].value;
            console.log("interaction.options => ", interaction.options);
            // check wallet format corrent
            if(!ethers.utils.isAddress(walletAddr)) return await interaction.reply({ content: 'Wallet address invalid!', ephemeral: true });

            const getRole = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('get-role')
                    .setLabel('Get member')
                    .setStyle(ButtonStyle.Primary),
            );

            const embedVerify = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Click here to connect your wallet first.')
                .setURL(`${connectURL}?wallet=${walletAddr}&id=${userId}`)
                .setDescription('This is a read-only connection. Do not share your private keys. We will never ask for your seed phrase. We will nerver DM you.');

            signInWithEmailAndPassword(auth, email, password).then( async (userCredential) => {
                try {
                    const accountSnap = await getDoc(docRef);
                    if(accountSnap.exists()) {
                        const accountData = accountSnap.data();
                        if(accountData.walletAddr == walletAddr) {
                            return interaction.followUp({
                                content: `You already connect wallet with ${walletAddr}. Now you can /connect to show your wallet.`,
                                ephemeral: true
                            })
                        } else {
                            await setDoc(docRef, {
                                walletAddr: walletAddr,
                                signature: deleteField()
                            })
                            // delete role
                            const role = interaction.guild.roles.cache.get(memberRole)
                            await interaction.member.roles.remove(role).then(member => {
                                interaction.followUp({
                                    content: `The ${role} role was removed to you ${member}! Please reconnect your new wallet.`,
                                    ephemeral: true
                                })
                            })
                            // reply link to connect wallet
                            return await interaction.followUp({
                                content: `First click link to connect your wallet then click the button below link to get role.`,
                                ephemeral: true,
                                embeds: [embedVerify],
                                components: [getRole]
                            });
                        }
                    } else {
                        return await interaction.followUp({
                            content: `First click link to connect your wallet then click the button below link to get role.`,
                            ephemeral: true,
                            embeds: [embedVerify],
                            components: [getRole]
                        });
                    }
                } catch (error) {
                    console.error("Error signin ---> ", error)
                }
            })
        // else command is empty
        } else {
            signInWithEmailAndPassword(auth, email, password).then( async (userCredential) => {
                try {
                    const accountSnap = await getDoc(docRef);
                    if(accountSnap.exists()) {
                        const accountData = accountSnap.data();
                        const accountId = accountSnap.id;
                        if(interaction.member.roles.cache.some(role => role.name === "Member")) { 
                            return interaction.followUp({
                                content: `You are now our member and connected wallet is ${accountData.walletAddr}`,
                                ephemeral: true
                            })
                        } else {
                            if (accountId == userId && accountData.walletAddr == walletAddr) {
                                const getRole = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('get-role')
                                        .setLabel('Get member')
                                        .setStyle(ButtonStyle.Primary),
                                );
                                return interaction.followUp({
                                    content: `You are not yet a member role. Please press the button to check and get the member role.`,
                                    ephemeral: true,
                                    components: [getRole]
                                })
                            } else {
                                return interaction.followUp({
                                    content: `You need to connect wallet first etc. /connect [wallet-address]`,
                                    ephemeral: true
                                })
                            }
                        }
                    } else {
                        return await interaction.followUp({
                            content: `You need to connect wallet first etc. /connect [wallet-address]`,
                            ephemeral: true
                        })
                    }
                } catch (err) {
                    return console.error("[/connect] Error signIn ---> ", err)
                }
            })
        }
    }

    // Command balance
    if (interaction.commandName === "balance") {
        signInWithEmailAndPassword(auth, email, password).then( async (userCredential) => {
            try {
                const accountSnap = await getDoc(docRef)
                if(accountSnap.exists()) {
                    const signature = accountSnap.data().signature;
                    console.log("signature ---> ", signature)
                    const getBalance721 = await getBalanceOf721(signature);
                    console.log("getBalance721 ---> ", getBalance721);
                    return await interaction.followUp({
                        content: `You have a total of ${getBalance721} nft.`,
                        ephemeral: true
                    })
                } else {
                    return await interaction.followUp({
                        content: `You need to connect wallet first etc. /connect [wallet-address]`,
                        ephemeral: true
                    })
                }
            } catch (err) {
                return console.error("[/balance] Error signIn ---> ", err)
            }
        })
    }

    // Button Get Role
    if(interaction.isButton() && interaction.customId === 'get-role') {
        signInWithEmailAndPassword(auth, email, password)
        .then( async (userCredential) => {
            try {
                // console.log("walletAddr ===> ", walletAddr)
                const nftSnap = await getDoc(docRef)
                if(nftSnap.exists()) {
                    const accountData = nftSnap.data();
                    const accountId = nftSnap.id;
                    // console.log("walletData.id ---> ", walletData)
                    // console.log("userId ---> ", userId)
                    if(accountId == userId) {
                        const checkBalance = await getBalanceOf721(accountData.signature);
                        if(checkBalance == 0 || checkBalance == null) return interaction.followUp({
                            content: `Authentication failed. Please connect wallet with other account`,
                            ephemeral: true
                        })
                        // console.log("role adding...")
                        // if user already has role
                        const role = interaction.guild.roles.cache.get(memberRole);
                        if(interaction.member.roles.cache.some(role => role.name === "Member")) { 
                            return interaction.followUp({ 
                                content: `You already have ${role} role.`,
                                ephemeral: true
                        })} else {
                            await interaction.member.roles.add(role).then(member => {
                                return interaction.followUp({
                                    content: `The ${role} role was added to you ${member}!`,
                                    ephemeral: true
                                })
                            }).catch(err => {
                                return interaction.followUp({
                                    content: `Something went wrong. The ${role} role was not added.`,
                                    ephemeral: true
                                })
                            })
                        }
                    } else {
                        return interaction.followUp({
                            content: 'Invalid wallet verification. Please check your wallet address or discord account.',
                            ephemeral: true
                        })
                    }
                } else {
                    return interaction.followUp({
                        content: 'Please connect wallet first!',
                        ephemeral: true
                    })
                }
            } catch (err) {
                return console.error("[Button get-role]Error signIn ---> ", err)
            }
            signOut(auth).then(() => {
                return console.log("Sign-out firebase successful")
            }).catch((err) => {
                return console.error("err signOut ---> ", err)
            })
        })
    }

})

// Access your commands in other files
client.commands = new Collection();

// Loading command, events files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Log in to Discord with your client's token
client.login(TOKEN);