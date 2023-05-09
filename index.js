const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, Partials, ChannelType, PermissionsBitField, MessageComponentInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, ThreadAutoArchiveDuration} = require('discord.js');
const { token, reactionIdeasThreadID, privateReactionIdeasChannelID } = require('./config.json');
const { report } = require('node:process');
const flags = require('./flags');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages], partials: [Partials.Channel, Partials.Message, Partials.User] });
const wait = require('node:timers/promises').setTimeout;

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log('\x1b[33m', `[WARNING] The command at ${filePath} is missing a require "data" and/or "execute" property.`, '\x1b[0m');
        }
    }
}


client.once(Events.ClientReady, c => {
    //console.log(colors.fg.green, colors.base.bright, colors.base.underscore, "Application launched", colors.base.reset);
    console.log(`\x1b[32m`, `\x1b[1m`, `\x1b[4m`, "Application launched", `\x1b[0m`)
    client.user.setActivity("Reaction Ideas & AFKs", { type: 3 });
}); 

client.login(token);

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName); // Yank command
    if (!command) { // Confirm command match
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    if (interaction.commandName === 'crash') { // Crash exception (Outside error catch to allow intended critical error)
        if (interaction.user.id === "773239152019898408" || interaction.user.id === "779930036635172874" || interaction.user.id === "262072084711211009"){
        console.log('Killing runtime service');
        interaction.reply({ content : 'Killing runtime service', ephemeral : true });
        wait(250);
        crashFunction(); // Do not define, forcing out of node via critical error
        } else {
            await interaction.reply({ content: "[❌] Invalid permissions.", ephemeral: true });
        }
    }

    try {
        if (interaction.commandName !== 'crash') { // Executing 
            await command.execute(interaction, client);
        }
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({content: 'There was an error while executing this command!', ephemeral: true});
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true});
        }
    }
});

async function parse_reactionvideoSuggestion(interaction){ // Modal Recieve
    const tomember = interaction.fields.getTextInputValue('memberInput');
    const description = interaction.fields.getTextInputValue('reactionIdeaInput'); 

    const byp_st1 = await flags.CONTAINS_BLACKLISTED(tomember);
    const byp_st2 = await flags.CONTAINS_BLACKLISTED(description);

    if (!tomember.toLowerCase().includes("preston") && !tomember.toLowerCase().includes("brianna") && !tomember.toLowerCase().includes("keeley")){
        await interaction.editReply('Sorry, but you must name who your idea is for.');
        return;
    }

    if (!byp_st1 === true && !byp_st2 === true){
        const channel = client.channels.cache.get(privateReactionIdeasChannelID);
        //const luser = interaction.member //interaction.options.getUser('user');

        //const fetchedUser = interaction.options.getUser('user');
        const embed = {
            title: "Suggestion for "+tomember,
            description: "",
            color: 0xf97506,
            fields: [
                {
                    name: "\u200b",
                    value: `${description}`,
                }
            ],
            thumbnail: {
                url: `https://media.discordapp.net/attachments/1077659482219348120/1105528254334521385/2021_TBNR_Fire_logo_50_1_50_25.png`,
            },
            footer: {
                text: `Submitted by ${interaction.member.user.tag} (${interaction.member.id})`,
                icon_url: interaction.member.user.avatarURL(),
            }
        }

        const approveButton = new ButtonBuilder()
            .setCustomId('approveidea')
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success)
            .setEmoji('<:5763checkmark:1105536184979046501>');

        const denyButton = new ButtonBuilder()
            .setCustomId('denyidea')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('<:x_:1105548627054702745>');

        const row = new ActionRowBuilder()
            .addComponents(approveButton, denyButton);

        channel.send({
            embeds: [embed],
            components: [row],
        });
        
    } else {
        await interaction.editReply('Sorry, but your submission cannot contain any blacklisted words or phrases')
    }
}

async function parse_ApplyMarkAsComplete(message, embed){ // Set le button
    //console.log(interaction);
    if (embed === null){ // For preserving approved user data
        embed = {
            title: interaction.message.embeds[0].title,
            description: "", 
            color: interaction.message.embeds[0].color,
            fields: interaction.message.embeds[0].fields,
            thumbnail: interaction.message.embeds[0].thumbnail,
            footer: {
                text: `Approved by ${interaction.member.user.tag} (${interaction.member.id})\n${interaction.message.embeds[0].footer.text}`,
                icon_url: interaction.member.user.avatarURL(),
            }
        }
    }

    const completeButton = new ButtonBuilder()
        .setCustomId('privatesuggestionmarkasdone')
        .setLabel('Mark as Complete') //<3
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:5763checkmark:1105536184979046501>');

    const row = new ActionRowBuilder()
        .addComponents(completeButton);

    await interaction.message.edit({
        embeds: [embed],
        components: [row],
    });
}

async function parse_ApplyApprovedStateOnParent(interaction){
    const embed = {
        title: interaction.message.embeds[0].title,
        description: "", 
        color: interaction.message.embeds[0].color,
        fields: interaction.message.embeds[0].fields,
        thumbnail: interaction.message.embeds[0].thumbnail,
        footer: interaction.message.embeds[0].footer
    }
    const approveButton = new ButtonBuilder()
        .setCustomId('approveidea')
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success)
        .setEmoji('<:5763checkmark:1105536184979046501>')
        .setDisabled(true);

    const row = new ActionRowBuilder()
        .addComponents(approveButton);

    await interaction.message.edit({
        embeds: [embed],
        components: [row],
    });
}

async function parse_createThreadParentMessage(thread, interaction){
    const embed = {
        title: interaction.message.embeds[0].title,
        description: "", 
        color: interaction.message.embeds[0].color,
        fields: interaction.message.embeds[0].fields,
        thumbnail: interaction.message.embeds[0].thumbnail,
        footer: {
            text: `Approved by ${interaction.member.user.tag} (${interaction.member.id})\n${interaction.message.embeds[0].footer.text}`,
            icon_url: interaction.member.user.avatarURL(),
        }
    }

    const completeButton = new ButtonBuilder()
        .setCustomId('privatesuggestionmarkasdone')
        .setLabel('Mark as Complete') //<3
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:5763checkmark:1105536184979046501>');

    const row = new ActionRowBuilder()
        .addComponents(completeButton);

    await thread.send({
        embeds: [embed],
        components: [row],
    });

    await thread.members.add(interaction.member.user.id);
}

async function parse_SuggestionButtons(interaction){ // TBNR public accept/decline
    const isTBNR = await flags.INTERNAL_EMPLOYEE(interaction.member);
    if (isTBNR === true){
        if (interaction.customId === "approveidea") {
            const channel = client.channels.cache.get(privateReactionIdeasChannelID);
            channel.threads.create({
                name: `${interaction.member.user.tag} (${interaction.message.id})`
            })
            .then(async threadChannel => await parse_createThreadParentMessage(threadChannel, interaction))
            await parse_ApplyApprovedStateOnParent(interaction)
        } else {
            await interaction.message.delete(); // Add a confirmation procedure
        }
    }
}

async function parse_SuggestionCompletionButton(interaction){
    const embed = interaction.message.embeds[0]

    const confirm = new ButtonBuilder()
        .setCustomId('threadsuggestconfirm')
        .setLabel('Confirm?') //<3
        .setStyle(ButtonStyle.Danger)
        .setEmoji('<:5763checkmark:1105536184979046501>');

    const cancel = new ButtonBuilder()
        .setCustomId('threadsuggestcancel')
        .setLabel('Cancel') //<3
        .setStyle(ButtonStyle.Secondary)

    const row = new ActionRowBuilder()
        .addComponents(confirm, cancel);

    await interaction.message.edit({
        embeds: [embed],
        components: [row],
    });
}

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isModalSubmit()){
        if (interaction.customId === "videosuggestions"){
            await interaction.reply({content: 'Your submission has been sent!', ephemeral: true});
            await parse_reactionvideoSuggestion(interaction);
        }
    } else if (interaction.isButton()){
        await interaction.deferUpdate();
        if (interaction.customId === "approveidea" || interaction.customId === "denyidea"){ // Suggestion ID Button Handling
            await parse_SuggestionButtons(interaction);
        } else if (interaction.customId === "privatesuggestionmarkasdone"){ // Private "Mark as Done" button handling
            await parse_SuggestionCompletionButton(interaction);
        } else if (interaction.customId === "cancelmarkasdone"){
            const embed = {
                title: interaction.message.embeds[0].title,
                description: "",
                color: interaction.message.embeds[0].color,
                fields: interaction.message.embeds[0].fields,
                thumbnail: interaction.message.embeds[0].thumbnail,
                footer: interaction.message.embeds[0].footer
            }
            await parse_ApplyMarkAsComplete(interaction, embed);
        } else if (interaction.customId === "threadsuggestcancel"){
            const embed = interaction.message.embeds[0];
            const completeButton = new ButtonBuilder()
                .setCustomId('privatesuggestionmarkasdone')
                .setLabel('Mark as Complete') //<3
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:5763checkmark:1105536184979046501>');
    
            const row = new ActionRowBuilder()
                .addComponents(completeButton);
        
            interaction.message.edit({
                embeds: [embed],
                components: [row],
            });
        } else if (interaction.customId === "threadsuggestconfirm"){
            const thread = interaction.message.thread
            const channel = client.channels.cache.get(privateReactionIdeasChannelID);
            //thread.setArchived(true);
            channel.threads.fetch(interaction.channelId)
            .then(channel => channel.setArchived(true, `Marked as complete by ${interaction.member.user.tag}`));
        }

    }
});