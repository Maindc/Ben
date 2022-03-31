// Avoxel284
// Stupid Discord bot that plays Talking Ben sounds

const discord = require("discord.js");
const fs = require("fs");
const { Client, Intents } = require("discord.js");
const discordVoice = require("@discordjs/voice");
const config = require("./config.json");

const client = new Client({
	partials: ["CHANNEL"],
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});
const sounds = [];

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

client.login(config.TOKEN);

/**
 * The good stuff
 * @param {discord.VoiceChannel} voiceChannel
 */
async function runBen(voiceChannel) {
	if (voiceChannel == null || voiceChannel.guild.me.voice.channel) return;
	const connection = discordVoice.joinVoiceChannel({
		channelId: voiceChannel.id,
		guildId: voiceChannel.guild.id,
		adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		selfDeaf: false,
	});
	const player = discordVoice.createAudioPlayer({
		behaviors: {
			noSubscriber: discordVoice.NoSubscriberBehavior.Play,
		},
	});

	connection.subscribe(player);
	if (config.RESPOND_ON_MEMBER_VOICE_STATE) {
		const speakingMap = connection.receiver.speaking;
		speakingMap.on("start", (userId) => {
			player.stop(true);
		});
		speakingMap.on("end", (userId) => {
			player.play(
				discordVoice.createAudioResource(sounds[getRandomInt(0, sounds.length)]),
				voiceChannel.id,
				voiceChannel.guild.id
			);
		});
	} else {
		player.play(
			discordVoice.createAudioResource(sounds[getRandomInt(0, sounds.length)]),
			voiceChannel.id,
			voiceChannel.guild.id
		);

		player.on("stateChange", (oldState, newState) => {
			if (
				newState.status === discordVoice.AudioPlayerStatus.Idle &&
				oldState.status !== discordVoice.AudioPlayerStatus.Idle
			) {
				setTimeout(() => {
					player.play(
						discordVoice.createAudioResource(sounds[getRandomInt(0, sounds.length)]),
						voiceChannel.id,
						voiceChannel.guild.id
					);
				}, getRandomInt(1, 4) * 1000);
			}
		});
	}
}

client.on("voiceStateUpdate", (oldState, newState) => {
	if (newState.member.user.bot) return;
	if (config.JOIN_AUTOMATICALLY && oldState.channel == null && newState.channel != null) {
		runBen(newState.channel);
	}
});

client.on("ready", (bot) => {
	console.log(`Logged in as ${bot.user.username}`);

	fs.readdir("./sounds", (err, files) => {
		if (err) return console.error(err);
		files.forEach((file) => {
			sounds.push("./sounds/" + file);
		});
	});
});

client.on("messageCreate", async (msg) => {
	if (msg.content.toLowerCase() == "!startben") {
		const voiceChannel = msg?.member?.voice?.channel;
		if (!voiceChannel) return msg.reply("You aren't in a VC!");
		runBen(voiceChannel);
	}
});
