use sails_rs::{
    gstd::msg,
    prelude::*,
    collections::BTreeMap,
    cell::RefCell,
};

#[sails_rs::sails_type]
#[derive(Clone, PartialEq, Eq)]
pub enum TaskStatus {
    Pending,
    Assigned,
    Completed,
}

#[sails_rs::sails_type]
#[derive(Clone)]
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

pub struct OrchestratorService<'a> {
    state: &'a RefCell<OrchestratorState>,
}

impl<'a> OrchestratorService<'a> {
    pub fn new(state: &'a RefCell<OrchestratorState>) -> Self {
        Self { state }
    }
}

#[sails_rs::service]
impl<'a> OrchestratorService<'a> {
    // Methods
    #[export]
    pub fn create_task(&mut self, description: String) -> u64 {
        let mut state = self.state.borrow_mut();
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
        let mut state = self.state.borrow_mut();
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
        let mut state = self.state.borrow_mut();
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
        let state = self.state.borrow();
        state.tasks.values()
            .filter(|t| t.status == TaskStatus::Pending)
            .cloned()
            .collect()
    }

    #[export]
    pub fn get_task(&self, task_id: u64) -> Option<TaskOrder> {
        let state = self.state.borrow();
        state.tasks.get(&task_id).cloned()
    }
}
