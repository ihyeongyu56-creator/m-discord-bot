const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { getAvailablePort } = require('./port');

test('returns an ephemeral port when zero is requested', async () => {
  const port = await getAvailablePort(0);
  assert.ok(Number.isInteger(port));
  assert.ok(port > 0);
});

test('skips ports already in use', async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const occupiedPort = server.address().port;

  const nextPort = await getAvailablePort(occupiedPort);

  assert.notEqual(nextPort, occupiedPort);
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});
