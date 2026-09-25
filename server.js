require('dotenv').config();
const { Client, EmbedBuilder, GatewayIntentBits, PermissionFlagsBits, Events } = require('discord.js');
const { getAvailablePort } = require('./port');
const { buildHealthStatus } = require('./health');
const 통화인원확인 = require('./commands/통화인원확인.js');
const 통방미참여자 = require('./commands/통방미참여자.js');
const 전체디엠보내기 = require('./commands/전체디엠보내기.js');
const 역할디엠보내기 = require('./commands/역할디엠보내기.js');
const 외활상태확인 = require('./commands/외활상태확인.js');
const 회의미참여자 = require('./commands/회의미참여자.js');
const 도움말 = require('./commands/도움말.js');

const commandModules = [
  통화인원확인,
  통방미참여자,
  전체디엠보내기,
  역할디엠보내기,
  외활상태확인,
  회의미참여자,
  도움말,
];

const TOKEN = process.env.DISCORD_TOKEN;
const express = require('express');
const app = express();

const HEALTHCHECK_INTERVAL_MS = 60 * 1000;
const RECOVERY_THRESHOLD_MS = 5 * 60 * 1000;

async function startHealthServer() {
  const requestedPort = Number(process.env.PORT) || 3000;
  const port = await getAvailablePort(requestedPort);

  app.get('/', (req, res) => {
    res.send('Bot is running safely!');
  });

  app.get('/healthz', (req, res) => {
    const health = buildHealthStatus(client);
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  });

  app.listen(port, () => {
    if (port !== requestedPort) {
      console.warn(`Requested port ${requestedPort} is already in use. Using fallback port ${port} instead.`);
    }
    console.log(`Web server is listening on port ${port}`);
  });
}

startHealthServer().catch((error) => {
  console.error('Health server startup failed:', error);
  process.exit(1);
});
const EXTERNAL_ACTIVITY_DELAY = 90 * 60 * 1000;
const voiceSessions = new Map();
const externalActivityOpen = new Set();
const activeBulkCommands = new Set();
const bulkCommands = new Set(['all-dm-send', 'role-dm-send']);
const commandCooldownMs = 15000;
const userCommandCooldowns = new Map();

function enforceUserCooldown(interaction) {
  const key = `${interaction.user.id}:${interaction.commandName}`;
  const now = Date.now();
  const lastUsed = userCommandCooldowns.get(key);

  if (lastUsed && now - lastUsed < commandCooldownMs) {
    return false;
  }

  userCommandCooldowns.set(key, now);
  return true;
}

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

let lastHealthyAt = Date.now();

setInterval(() => {
  const health = buildHealthStatus(client);

  if (health.status === 'ok') {
    lastHealthyAt = Date.now();
    console.log(`[HEALTH] 정상 상태 | ready=${health.ready} uptime=${health.uptimeSeconds}s guilds=${health.guildCount} ping=${health.ping ?? 'n/a'}ms`);
    return;
  }

  console.warn(`[HEALTH] 비정상 상태 감지 | status=${health.status} ready=${health.ready} uptime=${health.uptimeSeconds}s guilds=${health.guildCount}`);

  if (Date.now() - lastHealthyAt > RECOVERY_THRESHOLD_MS) {
    console.error('[RECOVERY] 봇이 정상 상태를 유지하지 못해 자동 재시작을 수행합니다.');
    process.exit(1);
  }
}, HEALTHCHECK_INTERVAL_MS);

client.once(Events.ClientReady, () => {
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
  if (!interaction.isChatInputCommand() || interaction.user.bot) return;

  if (!enforceUserCooldown(interaction)) {
    try {
      await interaction.reply({
        content: '잠시 후 다시 시도해 주세요. 너무 빠르게 같은 명령을 반복하면 차단됩니다.',
        ephemeral: true,
      });
    } catch (error) {
      console.warn('명령 쿨다운 안내 실패:', error);
    }
    return;
  }

  try {
    await interaction.deferReply();

    const adminOnlyCommandNames = new Set([
      'all-dm-send',
      'role-dm-send',
      'voice-member-count',
      'voice-room-missing',
      'external-activity-status',
      'meeting-missing-members',
    ]);
    if (adminOnlyCommandNames.has(interaction.commandName) && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.editReply('관리자 권한이 있는 사용자만 사용할 수 있습니다.');
      return;
    }

    const commands = new Map();
    for (const command of commandModules) {
      commands.set(command.data.name, command);
      const localizedName = command.data.name_localizations?.ko;
      if (localizedName) {
        commands.set(localizedName, command);
      }
    }

    const command = commands.get(interaction.commandName);

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