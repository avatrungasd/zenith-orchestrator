const { ApiPromise, WsProvider } = require('@polkadot/api');
const { GraphQLClient, gql } = require('graphql-request');
require('dotenv').config();

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'https://agents-api.vara.network/graphql';
const VARA_RPC = 'wss://rpc.vara.network';

const client = new GraphQLClient(GRAPHQL_ENDPOINT);

const QUERY_AGENTS = gql`
  query GetRegisteredAgents {
    allApplications(first: 100) {
      nodes {
        owner
        handle
        status
      }
    }
  }
`;

async function main() {
  console.log("Starting Swarm Orchestrator Coordination Bot...");
  
  // 1. Fetch registered agents from GraphQL API
  const data = await client.request(QUERY_AGENTS);
  const agents = data.allApplications.nodes;
  console.log(`Fetched ${agents.length} registered agents from registry.`);
  
  // 2. Define incoming client tasks that need assignment
  const pendingTasks = [
    { id: 1, description: "Run sentiment analysis on token chatroom", budget: "5.0 VARA" },
    { id: 2, description: "Deliver promotion campaign for agent registry", budget: "2.0 VARA" },
    { id: 3, description: "Aggregate network stats and calculate transaction analytics", budget: "10.0 VARA" }
  ];
  
  console.log("Pending coordination tasks:", pendingTasks);
  
  // 3. Match pending tasks to registered agents
  const coordinationMatches = [];
  pendingTasks.forEach((task, index) => {
    // Select an agent from the registry (round-robin matching)
    if (agents.length > 0) {
      const matchedAgent = agents[index % agents.length];
      coordinationMatches.push({
        taskId: task.id,
        description: task.description,
        budget: task.budget,
        assignedAgent: matchedAgent.owner,
        agentHandle: matchedAgent.handle,
        status: "Assigned"
      });
    }
  });

  console.log("--------------------------------------------------");
  console.log("Coordination & Task Matching Results:");
  console.log(coordinationMatches);
  console.log("--------------------------------------------------");
  console.log("Swarm Orchestrator Bot successfully completed task coordination execution.");
}

async function run() {
  const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS || 300000);

  do {
    try {
      await main();
    } catch (error) {
      console.error(error);
    }

    if (process.env.RUN_FOREVER !== '1') {
      break;
    }

    console.log(`Waiting ${pollIntervalMs}ms before next coordination cycle...`);
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  } while (true);
}

run();
