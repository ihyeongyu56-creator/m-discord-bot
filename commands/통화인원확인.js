const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice-member-count')
    .setNameLocalization('ko', '통화인원확인')
    .setDescription('서버 전체 음성 채널의 총 인원(봇 제외)을 확인합니다.')
    .setDescriptionLocalization('ko', '서버 전체 음성 채널의 총 인원(봇 제외)을 확인합니다.'),

  async execute(interaction) {
    const guild = interaction.guild;

    const voiceChannels = guild.channels.cache.filter(
      ch => ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice
    );

    let totalCount = 0;
    const channelLines = [];

    for (const channel of voiceChannels.values()) {
      const humanMembers = channel.members.filter(m => !m.user.bot);
      if (humanMembers.size > 0) {
        channelLines.push(`• ${channel.name} — ${humanMembers.size}명`);
        totalCount += humanMembers.size;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔊 서버 전체 통화방 인원')
      .setDescription(
        channelLines.length > 0
          ? channelLines.join('\n')
          : '현재 서버 내 통화방에 아무도 없습니다.'
      )
      .addFields({ name: '총 인원', value: `${totalCount}명`, inline: true })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
