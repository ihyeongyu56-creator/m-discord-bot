const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCompletionEmbed, createProgressEmbed, sendDirectMessages } = require('./디엠전송.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('역할디엠보내기')
    .setDescription('특정 역할의 멤버에게 DM을 보냅니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(option =>
      option
        .setName('역할')
        .setDescription('DM을 보낼 역할')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('내용')
        .setDescription('보낼 메시지 내용')
        .setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('역할');
    const content = interaction.options.getString('내용');
    await interaction.guild.members.fetch();

    const members = role.members.filter(member => !member.user.bot);
    const result = await sendDirectMessages(
      members,
      content,
      interaction.guild.name,
      progress => interaction.editReply({
        embeds: [createProgressEmbed(`${role.name} DM 전송 중...`, progress)],
      })
    );

    await interaction.editReply({
      embeds: [createCompletionEmbed(`${role.name} DM 전송 완료`, result)],
    });
  },
};
