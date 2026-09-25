const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCompletionEmbed, createProgressEmbed, sendDirectMessages } = require('./디엠전송.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-dm-send')
    .setNameLocalization('ko', '역할디엠보내기')
    .setDescription('특정 역할의 멤버에게 DM을 보냅니다.')
    .setDescriptionLocalization('ko', '특정 역할의 멤버에게 DM을 보냅니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(option =>
      option
        .setName('role')
        .setNameLocalization('ko', '역할')
        .setDescription('DM을 보낼 역할')
        .setDescriptionLocalization('ko', 'DM을 보낼 역할')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('content')
        .setNameLocalization('ko', '내용')
        .setDescription('보낼 메시지 내용')
        .setDescriptionLocalization('ko', '보낼 메시지 내용')
        .setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const content = interaction.options.getString('content');
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
