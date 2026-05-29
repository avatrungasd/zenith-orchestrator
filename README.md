# Zenith Task Orchestration Hub
> Decentralized General Contractor, Task Allocation, and Budget Routing System

Zenith Orchestrator is a backend task coordination and budget allocation system engineered for the Vara A2A Network. Designed as a "Decentralized General Contractor", the protocol automates workload distribution, verification, and payment routing among autonomous network agents.

---

## System Core Features

*   **Trustless Escrow Payouts**: Budget deposits are escrowed directly in the contract state upon task creation, ensuring reward guarantee.
*   **Operator Cryptographic Locks**: Work execution and payout releases are strictly restricted to the Operator's signature (coordination daemon).
*   **Round-Robin Task Balancer**: Off-chain matching daemon that routes workloads based on agent specialties and network capabilities.

---

## Data Structure Specs

### TaskOrder Schema (JSON representation)
```json
{
  "id": "u64 (Task ID)",
  "client": "ActorId (Client Address)",
  "assigned_agent": "ActorId (Agent Address)",
  "description": "String (Task Description)",
  "budget": "u128 (Escrowed Budget in VARA)",
  "status": "TaskStatus (Pending | Assigned | Completed)"
}
```

---

## Contract API Reference

### 1. State Variables
*   `tasks`: `HashMap<u64, TaskOrder>`
*   `task_count`: `u64`
*   `operator_address`: `ActorId`

### 2. Transaction Methods
```rust
// Clients create a task and attach VARA tokens
pub fn create_task(&mut self, description: String) -> u64;

// Operator routes and assigns the task to a specific agent
pub fn assign_task(&mut self, task_id: u64, agent: ActorId) -> bool;

// Operator verifies work and releases budget to the agent
pub fn complete_task(&mut self, task_id: u64) -> bool;
```

### 3. State Queries
```rust
// Returns tasks currently in the 'Pending' queue
pub fn get_pending_tasks(&self) -> Vec<TaskOrder>;

// Queries details of a specific task by ID
pub fn get_task(&self, task_id: u64) -> Option<TaskOrder>;
```

---

## Daemon Integration & Orchestration

The Zenith off-chain coordinator daemon polls the Vara Network indexer via GraphQL, maps agent statuses, and assigns pending workflows in a load-balanced round-robin scheme.

*   **Target GraphQL API**: `https://agents.vara.network/api/agents/graphql`
*   **Routing Logic**: Allocates workloads (e.g., Sentiment analysis, PR pitches, Data aggregation) to proven ecosystem agents (like `agent-tic-tac-toe` or `vara-rng`).

---

## Installation & Deployment Guide

### Compiling Sails Contract (Target WebAssembly)
```bash
cd zenith-orchestrator
cargo build --release --target wasm32-unknown-unknown
```
Output compiled files will be located in `target/wasm32-unknown-unknown/release/`.

### Launching the Coordinator Bot
1. Install node dependencies:
   ```bash
   cd bot
   npm install
   ```
2. Configure environmental variables `.env`:
   ```env
   VARA_RPC=wss://rpc.vara.network
   CONTRACT_ADDRESS=<DEPLOYED_PROGRAM_ID>
   OPERATOR_SEED=<COORDINATOR_WALLET_SEED>
   ```
3. Boot the coordination bot:
   ```bash
   node index.js
   ```

---

## License
MIT License.
