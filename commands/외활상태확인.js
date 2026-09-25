const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('external-activity-status')
    .setNameLocalization('ko', '외활상태확인')
    .setDescription('현재 통화방 멤버들의 외활 상태를 확인합니다.')
    .setDescriptionLocalization('ko', '현재 통화방 멤버들의 외활 상태를 확인합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(option =>
      option
        .setName('role')
        .setNameLocalization('ko', '역할')
        .setDescription('상태를 확인할 역할')
        .setDescriptionLocalization('ko', '상태를 확인할 역할')
        .setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const openMembers = interaction.client.externalActivityOpen;
    const lines = [];

    await interaction.guild.members.fetch();

    for (const member of role.members.values()) {
      if (member.user.bot) continue;

      const status = openMembers.has(member.id) ? '열림' : '닫힘';
      lines.push(`${member} : ${status}`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${role.name} 외활 상태`)
      .setDescription(lines.length > 0 ? lines.join('\n') : '현재 통화방에 사람이 없습니다.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
