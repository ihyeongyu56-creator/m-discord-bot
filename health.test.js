const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHealthStatus, shouldTriggerRecovery } = require('./health');

test('buildHealthStatus returns ok if bot is ready', () => {
  const client = {
    isReady: () => true,
    guilds: { cache: { size: 12 } },
    users: { cache: { size: 458 } },
    ws: { ping: 42 },
  };

  const status = buildHealthStatus(client);

  assert.equal(status.status, 'ok');
  assert.equal(status.guildCount, 12);
  assert.equal(status.userCount, 458);
  assert.equal(status.ping, 42);
});

test('shouldTriggerRecovery triggers when bot stays unhealthy too long', () => {
  const now = Date.now();
  const health = { status: 'starting', ready: false };

  assert.equal(shouldTriggerRecovery({ health, lastHealthyAt: now - 10 * 60 * 1000, thresholdMs: 5 * 60 * 1000 }), true);
  assert.equal(shouldTriggerRecovery({ health: { status: 'ok', ready: true }, lastHealthyAt: now, thresholdMs: 5 * 60 * 1000 }), false);
});
