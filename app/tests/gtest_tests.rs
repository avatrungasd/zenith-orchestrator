use gstd::ActorId;
use sails_rs::gtest::System;
use zenith_orchestrator::OrchestratorProgram;

#[test]
fn test_orchestrator_flow() {
    let idl = sails_idl_gen::program::generate_idl::<zenith_orchestrator::OrchestratorProgram>();
    panic!("GENERATED_IDL_START\n{}\nGENERATED_IDL_END", idl);
}
