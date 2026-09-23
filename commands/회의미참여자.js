const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('회의미참여자')
    .setDescription('스테이지 채널에 들어오지 않은 역할 멤버를 멘션합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option
        .setName('채널')
        .setDescription('확인할 음성 스테이지 채널')
        .addChannelTypes(ChannelType.GuildStageVoice)
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('역할')
        .setDescription('확인할 역할')
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('채널');
    const role = interaction.options.getRole('역할');

    await interaction.guild.members.fetch();

    const channelMemberIds = new Set(channel.members.keys());
    const absentMembers = role.members.filter(
      member => !member.user.bot && !channelMemberIds.has(member.id)
    );
    const mentions = absentMembers.map(member => member.toString());

    if (mentions.length === 0) {
      await interaction.editReply(
        `${role} 역할 중 ${channel}에 들어오지 않은 사람이 없습니다.`
      );
      return;
    }

    await interaction.editReply(
      `${channel} 미참여자 ${mentions.length}명입니다. 아래 멘션을 확인하세요.`
    );

    for (let index = 0; index < mentions.length; index += 40) {
      await interaction.followUp({
        content: mentions.slice(index, index + 40).join(' '),
        allowedMentions: { users: absentMembers.map(member => member.id) },
      });
    }
  },
};
