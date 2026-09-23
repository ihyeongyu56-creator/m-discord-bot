require('dotenv').config();
const { REST, Routes } = require('discord.js');
const command = require('./commands/통화인원확인.js');
const command2 = require('./commands/통방미참여자.js');
const command3 = require('./commands/전체디엠보내기.js');
const command4 = require('./commands/역할디엠보내기.js');
const command5 = require('./commands/외활상태확인.js');
const command6 = require('./commands/통방미참여자멘션.js');
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [command.data.toJSON(), command2.data.toJSON(), command3.data.toJSON(), command4.data.toJSON(), command5.data.toJSON(), command6.data.toJSON()] }
    );
    console.log('명령어 등록 완료');
  } catch (error) {
    console.error(error);
  }
})();
