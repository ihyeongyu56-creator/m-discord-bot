require('dotenv').config();
const { REST, Routes } = require('discord.js');
const command = require('./commands/통화인원확인.js');
const command2 = require('./commands/통방미참여자.js');
const command3 = require('./commands/전체디엠보내기.js');
const command4 = require('./commands/역할디엠보내기.js');
const command5 = require('./commands/외활상태확인.js');
const command6 = require('./commands/회의미참여자.js');
const command7 = require('./commands/도움말.js');
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  throw new Error('DISCORD_TOKEN과 CLIENT_ID가 .env에 설정되어 있어야 합니다.');
}

const rest = new REST().setToken(TOKEN);
const commandPayload = [
  command.data.toJSON(),
  command2.data.toJSON(),
  command3.data.toJSON(),
  command4.data.toJSON(),
  command5.data.toJSON(),
  command6.data.toJSON(),
  command7.data.toJSON(),
];
const route = GUILD_ID
  ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
  : Routes.applicationCommands(CLIENT_ID);

(async () => {
  try {
    await rest.put(route, { body: commandPayload });
    console.log(GUILD_ID ? `서버 ${GUILD_ID}에 명령어 등록 완료` : '전역 명령어 등록 완료');
  } catch (error) {
    console.error('명령어 등록 실패:', error);
  }
})();
