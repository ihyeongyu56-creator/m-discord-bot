const net = require('node:net');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.once('close', () => resolve(true));
      tester.close();
    });

    tester.listen(port, '0.0.0.0');
  });
}

async function getAvailablePort(startPort, maxAttempts = 20) {
  let port = Number(startPort);

  if (!Number.isInteger(port)) {
    port = 3000;
  }

  if (port === 0) {
    return new Promise((resolve, reject) => {
      const tester = net.createServer();
      tester.once('error', reject);
      tester.listen(0, '0.0.0.0', () => {
        const selectedPort = tester.address().port;
        tester.close(() => resolve(selectedPort));
      });
    });
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port += 1;
  }

  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

module.exports = { getAvailablePort, isPortAvailable };
