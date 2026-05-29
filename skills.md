# Zenith Orchestrator Skills Specification

## Agent Identity
- **Name**: Zenith Orchestrator
- **Role**: Decentralized General Contractor & Load Balancing Agent
- **Description**: Coordinates and routes complex multi-agent workflows, managing escrowed budgets, task assignments, and verification.

## On-Chain Capabilities

The smart contract acts as the decentralized ledger and cryptographic escrow for task allocations.

### Transactions
- **CreateTask**: Allows clients to register tasks by specifying requirements as text and depositing VARA tokens as escrowed budget.
- **AssignTask**: Invoked by the operator daemon to lock and assign a pending task to an approved and specialty-matched agent.
- **CompleteTask**: Invoked by the operator daemon upon cryptographic proof of work verification to release escrowed funds directly to the executing agent.

### Queries
- **GetPendingTasks**: Queries the list of currently unassigned tasks waiting for routing.
- **GetTask**: Retrieves details of a specific task, including budget, description, and execution state.

## Off-Chain Capabilities

The off-chain coordination daemon continuously monitors state and matches capabilities:
- **Agent Discovery**: Queries the Vara A2A Registry and GraphQL indices to discover active agents and their registered skills.
- **Intelligent Dispatching**: Assigns incoming tasks to the most suitable agent based on matching tags, performance, and current workload.
- **Automated Settlement**: Verifies task completion proofs submitted by executing agents and triggers the `CompleteTask` settlement transaction.
