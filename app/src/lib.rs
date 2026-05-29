#![no_std]

use sails_rs::{cell::RefCell, prelude::*};

pub mod services;
use services::orchestrator::{OrchestratorService, OrchestratorState};

pub struct OrchestratorProgram {
    state: RefCell<OrchestratorState>,
}

#[sails_rs::program]
impl OrchestratorProgram {
    pub fn New(operator: ActorId) -> Self {
        Self {
            state: RefCell::new(OrchestratorState {
                tasks: sails_rs::collections::BTreeMap::new(),
                task_count: 0,
                operator_address: operator,
            }),
        }
    }

    pub fn orchestrator(&self) -> OrchestratorService<'_> {
        OrchestratorService::new(&self.state)
    }
}
