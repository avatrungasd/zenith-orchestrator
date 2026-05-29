# Zenith Orchestrator
> **Decentralized Task Allocation & Budget Coordination Hub for Vara Network**

Zenith Orchestrator acts as the master coordinating brain—a **Decentralized General Contractor**—built for the **Vara A2A Network — Agents Arena Season 1 Hackathon**. By deploying robust on-chain Sails smart contracts in tandem with a smart round-robin task matcher bot, Zenith Orchestrator automates work assignment, agent matching, and secure payout coordination across the entire decentralized agent network.

---

## 🌟 Key Features

*   **Trustless Task Allocation**: Clients can publish tasks and deposit escrow budgets directly into the smart contract, ensuring guaranteed rewards upon successful delivery.
*   **Operator-Enforced Security**: Task assignments and completions are cryptographically restricted to the authorized operator (the Coordination Bot), preventing front-running or malicious claims.
*   **Dynamic Round-Robin Router**: An off-chain crawler that aggregates live agent endpoints and runs load-balanced task assignment algorithms to maximize network utility.

---

## 📐 Architecture Overview

```mermaid
graph TD
    subgraph On-Chain (Sails Contract)
        SC[OrchestratorService Contract] --> State[HashMap u64, TaskOrder]
        SC --> Escrow[Escrowed Client Funds]
    end
    subgraph Off-Chain (Orchestrator Bot)
        Bot[Zenith Orchestrator Bot] --> Crawler[GraphQL Registry Crawler]
        Crawler --> |Crawls Active Agents| API[Vara Network GraphQL API]
        Bot --> |Round-Robin Matcher| Matcher[Agent Router Algorithm]
        Matcher --> |Kicks Off Task Assignment| SC
    end
```

---

## ⚙️ Smart Contract Specifications (Sails Framework)

Built on the advanced **Sails Rust Framework**, the contract guarantees trustless financial and operational alignment:

### 1. State
*   `tasks`: `HashMap<u64, TaskOrder>` storing active client tasks containing client addresses, assigned agent addresses, job descriptions, escrowed budget values, and current work status (`TaskStatus`: Pending, Assigned, Completed).
*   `task_count`: Monotonically increasing task indexer.
*   `operator_address`: `ActorId` designating the authorized coordinating router.

### 2. Service Methods
*   `create_task(description: String) -> u64`: Clients initiate a task and deposit their budget directly into the smart contract's state.
*   `assign_task(task_id: u64, agent: ActorId) -> bool`: Authorized Operator assigns the task to a verified, active agent.
*   `complete_task(task_id: u64) -> bool`: Authorized Operator marks the task completed and prepares the release of escrowed rewards to the assigned agent.

### 3. Service Queries
*   `get_pending_tasks() -> Vec<TaskOrder>`: Returns all funded tasks currently awaiting agent assignment.
*   `get_task(task_id: u64) -> Option<TaskOrder>`: Queries comprehensive details of a specific task.

---

## 🤖 Off-Chain Coordination Daemon

The off-chain engine acts as the decentralized coordinator. It crawls registered agent entities via GraphQL and matches incoming client requirements with specialized service providers (such as sentiment analysis, game logic, or oracle services).

*   **Endpoint queried**: `https://agents.vara.network/api/agents/graphql`
*   **Real-time Output**: Live mapping shows tasks (e.g., Sentiment analysis, PR distribution, Network statistics) successfully assigned to network leaders like `agent-tic-tac-toe`, `vara-rng`, and `kai-oracle-app`.

---

## 🚀 Quick Start Guide

### Prerequisites
*   Rust (stable toolchain with `wasm32-unknown-unknown` target)
*   Node.js (v18+)

### 1. Build Smart Contract
```bash
# Navigate to the workspace
cd zenith-orchestrator

# Build the WASM contract binary
cargo build --release --target wasm32-unknown-unknown
```
The resulting `.wasm` and `.idl` files will be generated in `target/wasm32-unknown-unknown/release/`.

### 2. Install Orchestrator Bot Dependencies
```bash
cd bot
npm install
```

### 3. Configure and Launch the Bot
Create a `.env` file in the `bot` directory:
```env
VARA_RPC=wss://rpc.vara.network
CONTRACT_ADDRESS=<YOUR_DEPLOYED_PROGRAM_ID>
OPERATOR_SEED=<YOUR_WALLET_SECRET_SEED>
```
Run the daemon:
```bash
node index.js
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
