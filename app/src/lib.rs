#![no_std]
use sails_rs::prelude::*;

pub mod services;
use services::orchestrator::OrchestratorService;

pub struct OrchestratorProgram;

#[sails_rs::program]
impl OrchestratorProgram {
    pub fn init(operator: ActorId) -> Self {
        OrchestratorService::init(operator);
        Self
    }

    pub fn orchestrator(&self) -> OrchestratorService {
        OrchestratorService::new()
    }
}
