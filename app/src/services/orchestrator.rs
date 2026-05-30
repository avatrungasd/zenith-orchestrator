use sails_rs::{
    gstd::msg,
    prelude::*,
    collections::BTreeMap,
};
use parity_scale_codec::{Decode, Encode};
use scale_info::TypeInfo;

#[derive(Clone, Decode, Encode, PartialEq, Eq, TypeInfo)]
pub enum TaskStatus {
    Pending,
    Assigned,
    Completed,
}

#[derive(Clone, Decode, Encode, TypeInfo)]
pub struct TaskOrder {
    pub id: u64,
    pub client: ActorId,
    pub assigned_agent: ActorId,
    pub description: String,
    pub budget: u128,
    pub status: TaskStatus,
}

pub struct OrchestratorState {
    pub tasks: BTreeMap<u64, TaskOrder>,
    pub task_count: u64,
    pub operator_address: ActorId,
}

static mut STATE: Option<OrchestratorState> = None;

pub struct OrchestratorService;

impl OrchestratorService {
    pub fn init(operator: ActorId) {
        unsafe {
            STATE = Some(OrchestratorState {
                tasks: BTreeMap::new(),
                task_count: 0,
                operator_address: operator,
            });
        }
    }

    pub fn new() -> Self {
        Self
    }
}

#[sails_rs::service]
impl OrchestratorService {
    // Methods
    #[export]
    pub fn create_task(&mut self, description: String) -> u64 {
        let state = unsafe { STATE.as_mut().expect("State not initialized") };
        let budget = msg::value();
        
        state.task_count += 1;
        let task_id = state.task_count;
        let task = TaskOrder {
            id: task_id,
            client: msg::source(),
            assigned_agent: ActorId::zero(),
            description,
            budget,
            status: TaskStatus::Pending,
        };
        state.tasks.insert(task_id, task);
        task_id
    }

    #[export]
    pub fn assign_task(&mut self, task_id: u64, agent: ActorId) -> bool {
        let state = unsafe { STATE.as_mut().expect("State not initialized") };
        assert_eq!(msg::source(), state.operator_address, "Only operator can assign tasks");
        
        if let Some(task) = state.tasks.get_mut(&task_id) {
            if task.status == TaskStatus::Pending {
                task.assigned_agent = agent;
                task.status = TaskStatus::Assigned;
                return true;
            }
        }
        false
    }

    #[export]
    pub fn complete_task(&mut self, task_id: u64) -> bool {
        let state = unsafe { STATE.as_mut().expect("State not initialized") };
        assert_eq!(msg::source(), state.operator_address, "Only operator can mark task as completed");
        
        if let Some(task) = state.tasks.get_mut(&task_id) {
            if task.status == TaskStatus::Assigned {
                task.status = TaskStatus::Completed;
                return true;
            }
        }
        false
    }

    // Queries
    #[export]
    pub fn get_pending_tasks(&self) -> Vec<TaskOrder> {
        let state = unsafe { STATE.as_ref().expect("State not initialized") };
        state.tasks.values()
            .filter(|t| t.status == TaskStatus::Pending)
            .cloned()
            .collect()
    }

    #[export]
    pub fn get_task(&self, task_id: u64) -> Option<TaskOrder> {
        let state = unsafe { STATE.as_ref().expect("State not initialized") };
        state.tasks.get(&task_id).cloned()
    }
}
