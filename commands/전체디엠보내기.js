const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCompletionEmbed, createProgressEmbed, sendDirectMessages } = require('./디엠전송.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('전체디엠보내기')
    .setDescription('봇을 제외한 전체 멤버에게 DM을 보냅니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName('내용')
        .setDescription('보낼 메시지 내용')
        .setRequired(true)
    ),

  async execute(interaction) {
    const content = interaction.options.getString('내용');
    await interaction.guild.members.fetch();

    const members = interaction.guild.members.cache.filter(member => !member.user.bot);
    const result = await sendDirectMessages(
      members,
      content,
      interaction.guild.name,
      progress => interaction.editReply({
        embeds: [createProgressEmbed('📤 DM 전송 중...', progress)],
      })
    );

    await interaction.editReply({ embeds: [createCompletionEmbed('✅ DM 전송 완료', result)] });
  },
};
