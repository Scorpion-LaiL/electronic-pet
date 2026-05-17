const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const projectDir = process.cwd();
const entryFile = path.join(projectDir, 'dist-electron', 'main.js');
const devUrl = 'http://127.0.0.1:5173/';
const electronBinary = path.join(
  projectDir,
  'node_modules',
  'electron',
  'dist',
  'Electron.app',
  'Contents',
  'MacOS',
  'Electron'
);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isDevServerReady() {
  return new Promise((resolve) => {
    const request = http.get(devUrl, (response) => {
      response.resume();
      resolve(response.statusCode !== undefined && response.statusCode < 500);
    });

    request.on('error', () => {
      resolve(false);
    });

    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForReady() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const entryReady = fs.existsSync(entryFile);
    const serverReady = await isDevServerReady();

    if (entryReady && serverReady) {
      return;
    }

    await sleep(500);
  }

  throw new Error('Timed out while waiting for Vite or Electron build output.');
}

async function main() {
  await waitForReady();

  if (!fs.existsSync(electronBinary)) {
    throw new Error('Electron runtime is missing. Please run npm rebuild electron first.');
  }

  const child = spawn(
    electronBinary,
    ['.'],
    {
      cwd: projectDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173'
      }
    }
  );

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error('[electron:start]', error instanceof Error ? error.message : error);
  process.exit(1);
});
