fn main() {
    sails_idl_gen::generate_idl_to_file::<zenith_orchestrator::OrchestratorProgram>(
        "target/zenith-orchestrator-091.idl",
    )
    .unwrap();
}
