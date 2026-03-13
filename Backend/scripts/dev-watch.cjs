const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const cwd = path.resolve(__dirname, '..');
const nodeExec = process.execPath;
const tscEntrypoint = path.join(
  cwd,
  'node_modules',
  'typescript',
  'bin',
  'tsc'
);
const distDir = path.join(cwd, 'dist');

const children = new Set();
let serverProcess = null;
let watcher = null;
let restartTimer = null;
let restartingServer = false;

const spawnChild = (command, args, label) => {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });

  children.add(child);
  child.on('exit', () => {
    children.delete(child);
  });

  child.on('error', (error) => {
    console.error(`[dev:${label}] failed to start`, error);
  });

  return child;
};

const stopChild = (child) => {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
};

const startServer = () => {
  serverProcess = spawnChild(nodeExec, ['dist/server.js'], 'server');

  serverProcess.on('exit', () => {
    if (serverProcess && serverProcess.exitCode !== null) {
      serverProcess = null;
    }
  });
};

const restartServer = () => {
  if (restartingServer) {
    return;
  }

  restartingServer = true;
  console.log('[dev] Restarting backend server...');

  const bootServer = () => {
    startServer();
    restartingServer = false;
  };

  if (!serverProcess || serverProcess.exitCode !== null || serverProcess.killed) {
    bootServer();
    return;
  }

  serverProcess.once('exit', bootServer);
  stopChild(serverProcess);
};

const scheduleRestart = () => {
  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;
    restartServer();
  }, 250);
};

const startDistWatcher = () => {
  watcher = fs.watch(
    distDir,
    { recursive: true },
    (_eventType, filename) => {
      if (!filename) {
        scheduleRestart();
        return;
      }

      if (/\.(js|json|mjs|cjs)$/.test(String(filename))) {
        scheduleRestart();
      }
    }
  );

  watcher.on('error', (error) => {
    console.error('[dev] Dist watcher failed', error);
  });
};

const stopAllChildren = () => {
  if (watcher) {
    watcher.close();
    watcher = null;
  }

  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  children.forEach((child) => stopChild(child));
};

const runInitialBuild = () =>
  new Promise((resolve, reject) => {
    const build = spawnChild(
      nodeExec,
      [tscEntrypoint, '--pretty', 'false'],
      'build'
    );

    build.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Initial TypeScript build failed with exit code ${code ?? 'unknown'}`));
    });
  });

const startWatchers = () => {
  console.log('[dev] Starting TypeScript compiler watch...');
  spawnChild(
    nodeExec,
    [tscEntrypoint, '--watch', '--preserveWatchOutput'],
    'tsc'
  );

  console.log('[dev] Starting backend server...');
  startServer();
  console.log('[dev] Watching compiled files for restarts...');
  startDistWatcher();
};

const shutdown = (code = 0) => {
  stopAllChildren();
  setTimeout(() => process.exit(code), 150);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', stopAllChildren);

runInitialBuild()
  .then(startWatchers)
  .catch((error) => {
    console.error('[dev] Unable to start development server.');
    console.error(error instanceof Error ? error.message : error);
    shutdown(1);
  });
