const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const commandList = [
  { name: '통화인원확인', description: '현재 통화방 멤버 수와 상태를 확인합니다.', adminOnly: false },
  { name: '통방미참여자', description: '통화방에 참여하지 않은 멤버를 확인합니다.', adminOnly: false },
  { name: '전체디엠보내기', description: '서버 전체 멤버에게 DM 발송. 관리자 전용.', adminOnly: true },
  { name: '역할디엠보내기', description: '특정 역할 멤버에게 DM 발송. 관리자 전용.', adminOnly: true },
  { name: '외활상태확인', description: '역할별 외부활동 상태를 확인합니다. 관리자 전용.', adminOnly: true },
  { name: '회의미참여자', description: '회의 채널에 빠진 멤버를 확인합니다. 관리자 전용.', adminOnly: true },
  { name: '도움말', description: '이 도움말을 다시 보여줍니다.', adminOnly: false },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setNameLocalization('ko', '도움말')
    .setDescription('사용 가능한 봇 명령어를 확인합니다.')
    .setDescriptionLocalization('ko', '사용 가능한 봇 명령어를 확인합니다.'),

  async execute(interaction) {
    const fields = commandList.map(command => ({
      name: `/${command.name}${command.adminOnly ? ' 🔒' : ''}`,
      value: command.description,
      inline: false,
    }));

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤖 천안봇 도움말')
      .setDescription('아래 명령어로 서버 관리와 통화 상태를 확인할 수 있습니다.')
      .addFields(fields)
      .addFields({
        name: '사용 팁',
        value: '관리자 전용 명령어는 서버 관리 권한이 있어야 실행할 수 있습니다.\n예: `/전체디엠보내기 내용:안녕하세요`',
        inline: false,
      })
      .setFooter({ text: '천안봇 | 빠른 서버 운영 도우미' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
