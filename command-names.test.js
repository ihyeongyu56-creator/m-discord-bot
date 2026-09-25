const test = require('node:test');
const assert = require('node:assert/strict');

const commandFiles = [
  './commands/통화인원확인.js',
  './commands/통방미참여자.js',
  './commands/전체디엠보내기.js',
  './commands/역할디엠보내기.js',
  './commands/외활상태확인.js',
  './commands/회의미참여자.js',
  './commands/도움말.js',
];

test('all slash command names must use Discord-safe ASCII names', () => {
  for (const file of commandFiles) {
    const command = require(file);
    assert.match(command.data.name, /^[a-z0-9_-]+$/i, `${file} has an invalid Discord command name: ${command.data.name}`);
  }
});

const koreanCommandNames = {
  'voice-member-count': '통화인원확인',
  'voice-room-missing': '통방미참여자',
  'all-dm-send': '전체디엠보내기',
  'role-dm-send': '역할디엠보내기',
  'external-activity-status': '외활상태확인',
  'meeting-missing-members': '회의미참여자',
  'help': '도움말',
};

const fs = require('node:fs');

test('all slash commands should include Korean localized names', () => {
  for (const [asciiName, koreanName] of Object.entries(koreanCommandNames)) {
    const command = commandFiles
      .map(file => require(file))
      .find(item => item.data.name === asciiName);

    assert.ok(command, `missing command registration for ${asciiName}`);
    assert.equal(command.data.name_localizations?.ko, koreanName, `${asciiName} is missing the Korean locale name`);
  }
});

test('deploy script should register commands for a specific guild when GUILD_ID is configured', () => {
  const script = fs.readFileSync('./deploy-commands.js', 'utf8');
  assert.match(script, /GUILD_ID/, 'deploy script must read GUILD_ID');
  assert.match(script, /applicationGuildCommands|applicationCommands/, 'deploy script must target a Discord command route');
});
