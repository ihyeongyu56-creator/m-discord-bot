const { EmbedBuilder } = require('discord.js');

function createServerNotice(guildName) {
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setDescription(`${guildName} 서버에서 보낸 메시지입니다.`);
}

function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  if (seconds < 60) return `${seconds}초`;

  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

function createProgressEmbed(title, progress) {
  const percent = progress.total > 0
    ? Math.floor((progress.processed / progress.total) * 100)
    : 100;
  const filled = Math.round(percent / 10);
  const progressBar = `${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`;
  const remaining = progress.processed > 0
    ? (progress.elapsedMs / progress.processed) * (progress.total - progress.processed)
    : 0;

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(title)
    .addFields(
      { name: '👥 대상 인원', value: `${progress.total}명`, inline: true },
      { name: '✅ 성공 인원', value: `${progress.sent}명`, inline: true },
      { name: '❌ 실패 인원', value: `${progress.failed}명`, inline: true },
      { name: '📊 진행률', value: `${progressBar} ${percent}%` },
      { name: '⏳ 예상 남은 시간', value: formatDuration(remaining) },
    );
}

function createCompletionEmbed(title, result) {
  const failureText = result.failures.length > 0
    ? result.failures
      .map(failure => `${failure.member} - ${failure.reason}`)
      .join('\n')
      .slice(0, 1024)
    : '없음';

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(title)
    .addFields(
      { name: '👥 대상 인원', value: `${result.total}명`, inline: true },
      { name: '✅ 성공 인원', value: `${result.sent}명`, inline: true },
      { name: '❌ 실패 인원', value: `${result.failed}명`, inline: true },
      { name: '⏱️ 소요 시간', value: formatDuration(result.elapsedMs) },
      { name: '❌ 실패 인원 및 사유', value: failureText },
    );
}

async function sendDirectMessages(members, content, guildName, onProgress) {
  const startedAt = Date.now();
  let sent = 0;
  const failures = [];
  const total = members.size;
  let processed = 0;

  for (const member of members.values()) {
    try {
      await member.send({ content, embeds: [createServerNotice(guildName)] });
      sent += 1;
    } catch (error) {
      failures.push({ member, reason: error.message });
      console.error(`${member.user.tag}에게 DM을 보내지 못했습니다.`, error.message);
    }

    processed += 1;
    if (processed % 5 === 0 || processed === total) {
      await onProgress?.({
        processed,
        total,
        sent,
        failed: failures.length,
        elapsedMs: Date.now() - startedAt,
      });
    }
  }

  return {
    total,
    sent,
    failed: failures.length,
    failures,
    elapsedMs: Date.now() - startedAt,
  };
}

function formatDeliveryResult(title, result) {
  const failureLines = result.failures.map(
    failure => `- ${failure.member.user.tag}: ${failure.reason}`
  );
  const failureText = failureLines.length > 0
    ? `\n실패한 사람:\n${failureLines.join('\n')}`
    : '\n실패한 사람: 없음';

  return `${title}\n총 ${result.total}명 중 ${result.sent}명 성공, ${result.failed}명 실패${failureText}`
    .slice(0, 1900);
}

module.exports = { createCompletionEmbed, createProgressEmbed, sendDirectMessages };
