const { execFile } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://agents-api.vara.network/graphql';
const TRUST_LAYER_PID = '0x52f786c921a4176297ec33ce30e1e62b436e5b32fa9d04a5a5f82ad221a4242a';
const TRUST_MISSIONS_PID = '0xc9f57b8479cefd2acccd0513512e1c7f94bf74ae181836191d491135ab2ddd4e';
const TRUST_MARKETPLACE_PID = '0xc4df108fb3089b03810720cd074beaa23e9352ce7042f47ed13935f6f80e93e6';
const TRUST_LAYER_IDL = 'D:\\vara2\\agent_args\\agent_trust_layer.idl';
const TRUST_MISSIONS_IDL = 'D:\\vara2\\agent_args\\trust_missions.idl';
const TRUST_MARKETPLACE_IDL = 'D:\\vara2\\agent_args\\trust_marketplace.idl';
const TRUST_LAYER_OWNER = '0xa223c6a7e56cd7cfc6d62ea60d3d17dfee700e62658018ddcadc7ebd5976b62d';
const SENTINEL_OPERATOR = '0x44e35db8ad4cf866fcd43ed79cc90929ecb982992cc7f023a54b33a9e8c10e02';
const WALLET_DIR = 'C:\\Users\\XuanCanh\\.vara-wallet';

const CONFIG = {
  account: 'zenith-orchestrator-wallet',
  stateFile: path.join(__dirname, '.cross-app-activity-state.json'),
  argsFile: path.join(__dirname, '.cross-app-call.json'),
  role: 'zenith-orchestrator',
  handle: 'zenith-orch-app',
  metadataUri: 'https://raw.githubusercontent.com/avatrungasd/zenith-orchestrator/main/skills.md',
  tags: ['coordination', 'routing', 'services'],
};

async function readState() {
  try {
    return JSON.parse(await fs.readFile(CONFIG.stateFile, 'utf8'));
  } catch {
    return { sequence: 0, recentActions: {} };
  }
}

async function writeState(state) {
  await fs.writeFile(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

async function graphql(query) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const payload = await response.json();
  if (payload.errors) throw new Error(JSON.stringify(payload.errors));
  return payload.data;
}

function num(value) {
  return Number(value || 0);
}

async function loadLiveContext() {
  const data = await graphql(`
    {
      allApplications(first: 100) {
        nodes { id handle owner status track tags description registeredAt skillsUrl idlUrl }
      }
      allAppMetrics(first: 100) {
        nodes { applicationId mentionCount messagesSent postsActive integrationsIn integrationsOut uniquePartners updatedAt }
      }
    }
  `);

  const metrics = new Map(data.allAppMetrics.nodes.map((metric) => [metric.applicationId, metric]));
  const apps = data.allApplications.nodes
    .filter((app) => app.status === 'Submitted' && app.handle !== CONFIG.handle)
    .map((app) => ({ ...app, metric: metrics.get(app.id) || {} }));
  return { apps };
}

function chooseTarget(apps, state, current) {
  const actionCooldownMs = Number(process.env.CROSS_APP_TARGET_COOLDOWN_MS || 24 * 60 * 60 * 1000);
  const candidates = apps
    .map((app) => {
      const metric = app.metric || {};
      const integrationNeed = 10 - Math.min(10, num(metric.integrationsIn) + num(metric.uniquePartners));
      const freshness = Math.max(0, num(app.registeredAt) || 0) / 1_000_000_000_000;
      const relevance = `${app.track || ''} ${(app.tags || []).join(' ')} ${app.description || ''}`.toLowerCase().includes('mission') ? 3 : 0;
      return { app, score: integrationNeed + relevance + freshness };
    })
    .filter(({ app }) => current - (state.recentActions?.[`target:${app.id}`] || 0) >= actionCooldownMs)
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.app || apps[0];
}

async function callProgram({ pid, method, args, idl, value }) {
  await fs.writeFile(CONFIG.argsFile, JSON.stringify(args, null, 2));
  const commandArgs = ['--network', 'mainnet', '--account', CONFIG.account, 'call', pid, method, '--args-file', CONFIG.argsFile, '--idl', idl, '--gas-limit', '5000000000'];
  if (value) commandArgs.push('--value', value);
  const { stdout, stderr } = await execFileAsync('cmd.exe', ['/c', 'vara-wallet.cmd', ...commandArgs], {
    env: { ...process.env, VARA_WALLET_DIR: WALLET_DIR },
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });
  if (stderr) console.error(stderr.trim());
  return stdout.trim();
}

async function ensureMarketplaceProvider(state) {
  if (state.marketplaceRegistered) return;
  const result = await callProgram({
    pid: TRUST_MARKETPLACE_PID,
    method: 'TrustMarketplace/RegisterProvider',
    idl: TRUST_MARKETPLACE_IDL,
    args: [CONFIG.handle, CONFIG.metadataUri, CONFIG.tags, '50000000000', TRUST_LAYER_PID],
  });
  state.marketplaceRegistered = true;
  state.lastMarketplaceRegisterResult = result;
  await writeState(state);
  console.log('Zenith registered on Trust Marketplace:', result);
}

function chooseAction(target, sequence, current) {
  const metric = target.metric || {};
  if (num(metric.integrationsIn) < 2 || num(metric.uniquePartners) < 2) {
    return {
      kind: 'trust-mission',
      call: {
        pid: TRUST_MISSIONS_PID,
        method: 'TrustMissions/CreateMission',
        idl: TRUST_MISSIONS_IDL,
        args: [
          `Coordinate integration path for ${target.handle}`,
          `trust-suite://zenith/live-mission/${target.handle}/${sequence}/${current}`,
          '50000000000',
          Number(process.env.CROSS_APP_DEADLINE_BLOCK || 33450000),
          ['coordination', 'integration', target.track || 'services'],
        ],
      },
    };
  }

  if (num(metric.messagesSent) < 3 || num(metric.mentionCount) < 3) {
    return {
      kind: 'trust-marketplace-hire',
      call: {
        pid: TRUST_MARKETPLACE_PID,
        method: 'TrustMarketplace/CreateHireIntent',
        idl: TRUST_MARKETPLACE_IDL,
        args: [TRUST_LAYER_OWNER, `trust-suite://zenith/hire-routing-support/${target.handle}/${sequence}/${current}`, '50000000000', Number(process.env.CROSS_APP_DEADLINE_BLOCK || 33450000)],
      },
    };
  }

  return {
    kind: 'trust-layer-escrow',
    call: {
      pid: TRUST_LAYER_PID,
      method: 'AgentTrustLayer/CreateEscrow',
      idl: TRUST_LAYER_IDL,
      value: process.env.CROSS_APP_ESCROW_VALUE || '0.05',
      args: [TRUST_LAYER_OWNER, SENTINEL_OPERATOR, `mainnet:${CONFIG.role}:live:${target.handle}:coordination-escrow:${sequence}:${current}`, Number(process.env.CROSS_APP_DEADLINE_BLOCK || 33450000)],
    },
  };
}

async function runCrossAppActivity() {
  if (process.env.ENABLE_CROSS_APP_ACTIVITY === '0') return;
  const state = await readState();
  state.recentActions ||= {};
  await ensureMarketplaceProvider(state);

  const current = Date.now();
  const intervalMs = Number(process.env.CROSS_APP_INTERVAL_MS || 6 * 60 * 60 * 1000);
  if (state.lastCrossAppAt && current - state.lastCrossAppAt < intervalMs) return;

  const { apps } = await loadLiveContext();
  const target = chooseTarget(apps, state, current);
  if (!target) return;

  const sequence = Number(state.sequence || 0) + 1;
  const decision = chooseAction(target, sequence, current);
  let finalDecision = decision;
  let result;
  try {
    result = await callProgram(decision.call);
  } catch (error) {
    if (decision.kind !== 'trust-marketplace-hire') {
      finalDecision = {
        kind: 'trust-marketplace-hire',
        call: {
          pid: TRUST_MARKETPLACE_PID,
          method: 'TrustMarketplace/CreateHireIntent',
          idl: TRUST_MARKETPLACE_IDL,
          args: [TRUST_LAYER_OWNER, `trust-suite://zenith/fallback-hire/${target.handle}/${sequence}/${current}`, '50000000000', Number(process.env.CROSS_APP_DEADLINE_BLOCK || 33450000)],
        },
      };
      result = await callProgram(finalDecision.call);
      state.lastCrossAppFallbackFrom = decision.kind;
    } else {
      throw error;
    }
  }

  state.sequence = sequence;
  state.lastCrossAppAt = current;
  state.lastCrossAppKind = finalDecision.kind;
  state.lastCrossAppTarget = { id: target.id, handle: target.handle, track: target.track };
  state.lastCrossAppResult = result;
  state.recentActions[`target:${target.id}`] = current;
  state.recentActions[`${finalDecision.kind}:${target.id}`] = current;
  await writeState(state);
  console.log(`Zenith live decision ${finalDecision.kind} for ${target.handle}:`, result);
}

module.exports = { runCrossAppActivity };
