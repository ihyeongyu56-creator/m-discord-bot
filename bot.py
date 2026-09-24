import time

import discord
from discord import app_commands
from discord.ext import commands


# 지인이 자기 봇 토큰을 여기에 입력
TOKEN = "여기에_봇_토큰_입력"


intents = discord.Intents.default()
intents.members = True
intents.voice_states = True

bot = commands.Bot(command_prefix="!", intents=intents)


def server_embed(guild_name):
    return discord.Embed(
        description=f"{guild_name} 서버에서 보낸 메시지입니다.",
        color=discord.Color.blue(),
    )


def progress_embed(total, success, failed, current):
    percent = int(current / total * 100) if total else 100
    bar = "█" * (percent // 10) + "░" * (10 - percent // 10)

    embed = discord.Embed(
        title="📤 DM 전송 중...",
        color=discord.Color.green(),
    )
    embed.add_field(name="👥 대상 인원", value=f"{total}명", inline=True)
    embed.add_field(name="✅ 성공 인원", value=f"{success}명", inline=True)
    embed.add_field(name="❌ 실패 인원", value=f"{failed}명", inline=True)
    embed.add_field(name="📊 진행률", value=f"{bar} {percent}%")
    return embed


@bot.tree.command(
    name="전체디엠보내기",
    description="서버 전체 멤버에게 DM을 보냅니다.",
)
@app_commands.default_permissions(manage_guild=True)
@app_commands.describe(content="보낼 메시지 내용")
async def send_dm_to_everyone(interaction: discord.Interaction, content: str):
    await interaction.response.defer(ephemeral=True)

    guild = interaction.guild
    await guild.chunk(cache=True)

    members = [member for member in guild.members if not member.bot]
    total = len(members)
    success = 0
    failures = []
    started_at = time.time()

    for index, member in enumerate(members, start=1):
        try:
            await member.send(
                content=f"{member.mention}\n{content}",
                embed=server_embed(guild.name),
            )
            success += 1
        except Exception as error:
            failures.append(f"{member} - {str(error)[:100]}")

        if index % 5 == 0 or index == total:
            await interaction.edit_original_response(
                embed=progress_embed(total, success, len(failures), index)
            )

    result = discord.Embed(
        title="✅ 전체 DM 전송 완료",
        color=discord.Color.green(),
    )
    result.add_field(name="👥 대상 인원", value=f"{total}명", inline=True)
    result.add_field(name="✅ 성공 인원", value=f"{success}명", inline=True)
    result.add_field(name="❌ 실패 인원", value=f"{len(failures)}명", inline=True)
    result.add_field(
        name="⏱️ 소요 시간",
        value=f"{round(time.time() - started_at, 1)}초",
    )
    result.add_field(
        name="❌ 실패한 사람 및 사유",
        value="\n".join(failures)[:1024] if failures else "없음",
        inline=False,
    )

    await interaction.edit_original_response(embed=result)


@bot.tree.command(
    name="통방미참여자멘션",
    description="지정한 스테이지 채널에 들어오지 않은 역할 멤버를 멘션합니다.",
)
@app_commands.default_permissions(manage_guild=True)
@app_commands.describe(
    channel="확인할 음성 스테이지 채널",
    role="확인할 역할",
)
async def mention_absentees(
    interaction: discord.Interaction,
    channel: discord.StageChannel,
    role: discord.Role,
):
    await interaction.response.defer()

    guild = interaction.guild
    await guild.chunk(cache=True)

    channel_member_ids = {member.id for member in channel.members}
    absent_members = [
        member
        for member in role.members
        if not member.bot and member.id not in channel_member_ids
    ]

    if not absent_members:
        await interaction.edit_original_response(
            content=f"{role.mention} 역할 중 {channel.mention}에 들어오지 않은 사람이 없습니다."
        )
        return

    mentions = [member.mention for member in absent_members]
    await interaction.edit_original_response(
        content=(
            f"{channel.mention} 미참여자입니다.\n"
            f"{role.mention} 역할 중 {len(absent_members)}명"
        )
    )

    for index in range(0, len(mentions), 50):
        await interaction.followup.send(" ".join(mentions[index:index + 50]))


@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"천안봇 실행중 | {bot.user}")


bot.run(TOKEN)
