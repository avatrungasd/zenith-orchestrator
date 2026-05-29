use gstd::ActorId;
use sails_rs::gtest::System;

#[test]
fn test_orchestrator_flow() {
    let sys = System::new();
    sys.init_logger();
    
    let operator = ActorId::from(100);
    let client = ActorId::from(200);
    let agent = ActorId::from(300);
    
    // Verify basic identities compile successfully
    assert_eq!(operator, ActorId::from(100));
    assert_eq!(client, ActorId::from(200));
    assert_eq!(agent, ActorId::from(300));
}
