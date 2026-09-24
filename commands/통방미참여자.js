const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('통방미참여자')
        .setDescription('특정 역할을 가졌으나 음성 채널에 참여하지 않은 사람을 확인합니다.')
        .addRoleOption(option =>
            option
                .setName('역할')
                .setDescription('확인할 역할을 선택하세요.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const role = interaction.options.getRole('역할');
        const guild = interaction.guild;

        // 역할 멤버 전체를 캐시에 동기화한 뒤 역할 기준으로 필터링합니다.
        await guild.members.fetch();
        const roleMembers = role.members;

        // 현재 어떤 음성 채널이든 들어가 있는 사람들 ID 목록 추출
        const invoiceIds = new Set();
        guild.channels.cache
            .filter(ch => ch.isVoiceBased && ch.isVoiceBased())
            .forEach(ch => {
                ch.members.forEach(m => invoiceIds.add(m.id));
            });

        // 역할을 가지고 있지만, 음성 채널 목록에 없는 사람만 필터링
        const notInVoice = roleMembers.filter(m => !invoiceIds.has(m.id));

        // 결과 출력 메시지 (Embed 형태)
        const embed = {
            color: 0xed4245,
            title: `📢 통화방 미참여자 목록 (${notInVoice.size}명)`,
            description: `${role} 역할을 가졌으나 음성 채널에 없는 사람들의 명단입니다.\n\n` +
                         (notInVoice.size > 0 
                             ? notInVoice.map(m => m.toString()).join(', ') 
                             : '해당 역할을 가진 모든 사람이 통화방에 있습니다! 🎉')
        };

        await interaction.editReply({ embeds: [embed] });
    },
};