function buildHealthStatus(client) {
  const memoryUsage = process.memoryUsage();
  const ready = Boolean(client?.isReady?.());
  const ping = client?.ws?.ping ?? null;

  const status = ready && ping !== null ? 'ok' : ready ? 'degraded' : 'starting';

  return {
    status,
    ready,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    guildCount: client?.guilds?.cache?.size ?? 0,
    userCount: client?.users?.cache?.size ?? 0,
    ping,
    memoryUsageMB: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
  };
}

function shouldTriggerRecovery({ health, lastHealthyAt, thresholdMs }) {
  if (!health || health.status === 'ok') {
    return false;
  }

  if (!lastHealthyAt) {
    return true;
  }

  return Date.now() - lastHealthyAt > thresholdMs;
}

module.exports = {
  buildHealthStatus,
  shouldTriggerRecovery,
};
