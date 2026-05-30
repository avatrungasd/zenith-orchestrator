const { execFile } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const NETWORK_PID = '0x19f27f4c906a5ac230be82d907850d44c7a7fff1b4c6903f62e78e09e0b353f3';
const NETWORK_IDL = 'C:\\Users\\XuanCanh\\.agents\\skills\\vara-agent-network-skills\\idl\\agents_network_client.idl';
const WALLET_DIR = 'C:\\Users\\XuanCanh\\.vara-wallet';

const CONFIG = {
  name: 'Zenith Orchestrator',
  account: 'zenith-orchestrator-wallet',
  appHex: '0x428dae6bc0a952b312fa67d02a38fc2c332bf3cf9a8ab29b71502405a3ef99a3',
  voucher: '0x79175c8fc0076fecad37ad7ae5d38cb68c50b0c9c1bff8b3f45c2ae39291eb1e',
  stateFile: path.join(__dirname, '.agent-activity-state.json'),
};

function now() {
  return Date.now();
}

async function readState() {
  try {
    return JSON.parse(await fs.readFile(CONFIG.stateFile, 'utf8'));
  } catch {
    return {};
  }
}

async function writeState(state) {
  await fs.writeFile(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

async function callNetwork(method, args, extra = []) {
  const argsFile = path.join(__dirname, `.agent-activity-${method.replace('/', '-')}.json`);
  await fs.writeFile(argsFile, JSON.stringify(args, null, 2));

  const commandArgs = [
    '--network', 'mainnet',
    '--account', CONFIG.account,
    'call', NETWORK_PID, method,
    '--args-file', argsFile,
    '--voucher', CONFIG.voucher,
    '--idl', NETWORK_IDL,
    '--gas-limit', '5000000000',
    ...extra,
  ];

  const { stdout, stderr } = await execFileAsync('cmd.exe', ['/c', 'vara-wallet.cmd', ...commandArgs], {
    env: { ...process.env, VARA_WALLET_DIR: WALLET_DIR },
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });

  if (stderr) {
    console.error(stderr.trim());
  }
  return stdout.trim();
}

function pickMentionTarget(agents) {
  const candidate = agents.find((agent) =>
    agent.owner !== CONFIG.appHex &&
    agent.status === 'Submitted' &&
    typeof agent.handle === 'string' &&
    agent.handle.length > 0
  );
  return candidate ? { Application: candidate.owner } : null;
}

async function postChat(agents) {
  const target = pickMentionTarget(agents);
  const body = target
    ? 'Zenith coordination cycle: scanned the registry, refreshed task matching, and found available partners for workflow routing.'
    : 'Zenith coordination cycle: scanned the registry and refreshed task matching for pending workflow requests.';

  const args = [
    body,
    { Application: CONFIG.appHex },
    target ? [target] : [],
    null,
  ];

  const result = await callNetwork('Chat/Post', args);
  console.log('Zenith chat activity posted:', result);
}

async function postBoard(agents, matches) {
  const matchCount = Array.isArray(matches) ? matches.length : 0;
  const args = [
    CONFIG.appHex,
    {
      title: 'Coordination cycle update',
      body: `Zenith scanned ${agents.length} registered applications and prepared ${matchCount} task routing matches for service, promotion, and analytics workflows.`,
      tags: ['coordination', 'routing', 'services'],
    },
  ];

  const result = await callNetwork('Board/PostAnnouncement', args);
  console.log('Zenith board activity posted:', result);
}

async function runAgentActivity({ agents, matches }) {
  if (process.env.ENABLE_AGENT_ACTIVITY === '0') {
    return;
  }

  const state = await readState();
  const current = now();
  const chatIntervalMs = Number(process.env.CHAT_INTERVAL_MS || 30 * 60 * 1000);
  const boardIntervalMs = Number(process.env.BOARD_INTERVAL_MS || 4 * 60 * 60 * 1000);

  if (!state.lastChatAt || current - state.lastChatAt >= chatIntervalMs) {
    try {
      await postChat(agents);
      state.lastChatAt = current;
      await writeState(state);
    } catch (error) {
      console.error('Zenith chat activity failed:', error.message || error);
    }
  }

  if (!state.lastBoardAt || current - state.lastBoardAt >= boardIntervalMs) {
    try {
      await postBoard(agents, matches);
      state.lastBoardAt = current;
      await writeState(state);
    } catch (error) {
      console.error('Zenith board activity failed:', error.message || error);
    }
  }
}

module.exports = { runAgentActivity };
