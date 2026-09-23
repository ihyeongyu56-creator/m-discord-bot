require('dotenv').config();
const { Client, EmbedBuilder, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const 통화인원확인 = require('./commands/통화인원확인.js');
const 통방미참여자 = require('./commands/통방미참여자.js');
const 전체디엠보내기 = require('./commands/전체디엠보내기.js');
const 역할디엠보내기 = require('./commands/역할디엠보내기.js');
const 외활상태확인 = require('./commands/외활상태확인.js');
const 통방미참여자멘션 = require('./commands/통방미참여자멘션.js');

const TOKEN = process.env.DISCORD_TOKEN;
// Render의 포트 체크 에러를 방지하기 위한 간단한 웹 서버 코드
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running safely!');
});

app.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});
const EXTERNAL_ACTIVITY_DELAY = 90 * 60 * 1000;
const voiceSessions = new Map();
const externalActivityOpen = new Set();
const activeBulkCommands = new Set();
const bulkCommands = new Set(['전체디엠보내기', '역할디엠보내기']);

function startVoiceSession(state) {
  if (!state.channelId || !state.member || state.member.user.bot || voiceSessions.has(state.id)) return;

  externalActivityOpen.delete(state.id);

  const timer = setTimeout(async () => {
    voiceSessions.delete(state.id);

    try {
      const currentState = state.guild.voiceStates.cache.get(state.id);
      if (!currentState?.channelId) return;

      externalActivityOpen.add(state.id);
      await state.member.send({
        content: `${state.member} 외부활동이 열립니다`,
        embeds: [
          new EmbedBuilder()
            .setColor(0x3498db)
            .setDescription(`${state.guild.name} 서버에서 보낸 메시지입니다.`),
        ],
      });
      console.log(`${state.member.user.tag}에게 외부활동 안내 DM을 보냈습니다.`);
    } catch (error) {
      console.error(`${state.member.user.tag}에게 DM을 보내지 못했습니다.`, error);
    }
  }, EXTERNAL_ACTIVITY_DELAY);

  voiceSessions.set(state.id, timer);
}

function stopVoiceSession(userId) {
  const timer = voiceSessions.get(userId);
  if (timer) {
    clearTimeout(timer);
    voiceSessions.delete(userId);
  }
  externalActivityOpen.delete(userId);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
client.externalActivityOpen = externalActivityOpen;

client.once('ready', () => {
  client.user.setPresence({
    activities: [{ name: '천안봇 실행중', type: 0 }],
    status: 'online',
  });
  console.log(`천안봇 실행중 | ${client.user.tag} 로그인 완료`);

  for (const guild of client.guilds.cache.values()) {
    for (const state of guild.voiceStates.cache.values()) {
      startVoiceSession(state);
    }
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  if (!oldState.channelId && newState.channelId) {
    startVoiceSession(newState);
  } else if (oldState.channelId && !newState.channelId) {
    stopVoiceSession(newState.id);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await interaction.deferReply();

    const commands = {
      통화인원확인,
      통화방미참여자: 통방미참여자,
      전체디엠보내기,
      역할디엠보내기,
      외활상태확인,
      통방미참여자멘션,
    };
    const command = commands[interaction.commandName];

    if (!command) {
      await interaction.editReply('등록되지 않은 명령어입니다.');
      return;
    }

    if (
      bulkCommands.has(interaction.commandName)
      && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.editReply('이 명령어를 사용할 권한이 없습니다.');
      return;
    }

    const commandKey = `${interaction.guildId}:${interaction.commandName}`;
    if (bulkCommands.has(interaction.commandName) && activeBulkCommands.has(commandKey)) {
      await interaction.editReply('같은 서버에서 이미 DM 전송이 진행 중입니다.');
      return;
    }

    if (bulkCommands.has(interaction.commandName)) activeBulkCommands.add(commandKey);

    try {
      await command.execute(interaction);
    } finally {
      activeBulkCommands.delete(commandKey);
    }
  } catch (error) {
    console.error(`명령어 실행 실패: ${interaction.commandName}`, error);

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('명령어 실행 중 오류가 발생했습니다. 봇 콘솔 로그를 확인하세요.');
      } else {
        await interaction.reply('명령어 실행 중 오류가 발생했습니다.');
      }
    } catch (replyError) {
      console.error('오류 안내 메시지도 전송하지 못했습니다.', replyError);
    }
  }
});

client.on('error', console.error);
client.login(TOKEN).catch(error => {
  console.error('Discord 로그인 실패:', error);
});