#[test_only]
module xylkit::address_driver_tests {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin::{Self};
    use xylkit::address_driver::{Self};
    use xylkit::drips::{Self, DripsConfig};
    use xylkit::splits::{Self, SplitsReceiver};

    // Test coin type for testing
    struct TestCoin {}

    // Setup function to create test accounts and initialize modules
    fun setup(): (signer, signer, signer) {
        // Create test accounts
        let account1 = account::create_account_for_test(@0x1);
        let account2 = account::create_account_for_test(@0x2);
        let account3 = account::create_account_for_test(@0x3);
        let module_account = account::create_account_for_test(@xylkit);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&account1);
        timestamp::update_global_time_for_test(10000000000); // Set a non-zero timestamp
        
        // Initialize the AddressDriverAdmin
        address_driver::init_module(&module_account);
        
        (account1, account2, account3)
    }

    #[test]
    fun test_initialize() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Verify the AddressDriver was created
        assert!(address_driver::has_driver(account1_addr), 0);
        
        // Verify the account ID was generated correctly
        let account_id = address_driver::get_account_id(account1_addr);
        assert!(account_id == account1_addr, 0); // In our implementation, account_id is the same as the address
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_DRIVER_ALREADY_EXISTS)]
    fun test_initialize_already_exists() {
        // Create test accounts
        let (account1, _, _) = setup();
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Try to initialize again, should fail
        address_driver::initialize(&account1);
    }

    #[test]
    fun test_get_account_id() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Get the account ID
        let account_id = address_driver::get_account_id(account1_addr);
        
        // Verify the account ID is correct
        assert!(account_id == account1_addr, 0); // In our implementation, account_id is the same as the address
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_DRIVER_NOT_FOUND)]
    fun test_get_account_id_no_driver() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Try to get the account ID without initializing, should fail
        address_driver::get_account_id(account1_addr);
    }

    #[test]
    fun test_has_driver() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the AddressDriver for account1
        address_driver::initialize(&account1);
        
        // Verify account1 has a driver
        assert!(address_driver::has_driver(account1_addr), 0);
        
        // Verify account2 does not have a driver
        assert!(!address_driver::has_driver(account2_addr), 0);
    }

    #[test]
    fun test_verify_authorization() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Get the account ID
        let account_id = address_driver::get_account_id(account1_addr);
        
        // Verify authorization
        address_driver::verify_authorization(&account1, account_id);
        // If we reach here, the test passed
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_UNAUTHORIZED)]
    fun test_verify_authorization_invalid() {
        // Create test accounts
        let (account1, account2, _) = setup();
        
        // Initialize the AddressDriver for account1
        address_driver::initialize(&account1);
        
        // Get the account ID for account1
        let account_id = address_driver::get_account_id(signer::address_of(&account1));
        
        // Try to verify authorization for account2 with account1's ID, should fail
        address_driver::verify_authorization(&account2, account_id);
    }

    #[test]
    fun test_set_splits() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the AddressDriver for all accounts
        address_driver::initialize(&account1);
        address_driver::initialize(&account2);
        address_driver::initialize(&account3);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver1 = splits::new_receiver(account2_addr, 300000); // 30%
        let receiver2 = splits::new_receiver(account3_addr, 200000); // 20%
        
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        
        // Set the splits
        address_driver::set_splits(&account1, receivers);
        
        // Verify the splits were set
        let stored_receivers = splits::get_receivers(account1_addr);
        assert!(vector::length(&stored_receivers) == 2, 0);
        
        let stored_receiver1 = vector::borrow(&stored_receivers, 0);
        assert!(stored_receiver1.receiver == account2_addr, 0);
        assert!(stored_receiver1.weight == 300000, 0);
        
        let stored_receiver2 = vector::borrow(&stored_receivers, 1);
        assert!(stored_receiver2.receiver == account3_addr, 0);
        assert!(stored_receiver2.weight == 200000, 0);
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_DRIVER_NOT_FOUND)]
    fun test_set_splits_no_driver() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver1 = splits::new_receiver(account2_addr, 300000); // 30%
        let receiver2 = splits::new_receiver(account3_addr, 200000); // 20%
        
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        
        // Try to set splits without initializing, should fail
        address_driver::set_splits(&account1, receivers);
    }

    #[test]
    fun test_set_streams() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the AddressDriver for all accounts
        address_driver::initialize(&account1);
        address_driver::initialize(&account2);
        
        // Create a streams configuration
        let receivers = vector::empty<DripsConfig>();
        
        let receiver = drips::new_drips_config(account2_addr, 100, 0, 0); // 100 per second
        
        vector::push_back(&mut receivers, receiver);
        
        // Set the streams
        // Note: In a real test, we would need to handle the coin operations
        // For this test, we'll just verify the function call doesn't fail
        address_driver::set_streams<TestCoin>(&account1, vector::empty(), 0, receivers, account1_addr);
        
        // If we reach here, the test passed
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_DRIVER_NOT_FOUND)]
    fun test_set_streams_no_driver() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Create a streams configuration
        let receivers = vector::empty<DripsConfig>();
        
        let receiver = drips::new_drips_config(account2_addr, 100, 0, 0); // 100 per second
        
        vector::push_back(&mut receivers, receiver);
        
        // Try to set streams without initializing, should fail
        address_driver::set_streams<TestCoin>(&account1, vector::empty(), 0, receivers, account1_addr);
    }

    #[test]
    fun test_collect() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // In a real test, we would add funds to be collected
        // For this test, we'll just verify the function call doesn't fail
        // Note: This will return 0 since there are no funds to collect
        let collected = address_driver::collect<TestCoin>(&account1, account1_addr);
        
        // Verify no funds were collected
        assert!(collected == 0, 0);
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_DRIVER_NOT_FOUND)]
    fun test_collect_no_driver() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Try to collect without initializing, should fail
        address_driver::collect<TestCoin>(&account1, account1_addr);
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_INVALID_AMOUNT)]
    fun test_give_zero_amount() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Try to give zero amount, should fail
        address_driver::give<TestCoin>(&account1, account2_addr, 0);
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_INVALID_RECEIVER)]
    fun test_give_to_self() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Try to give to self, should fail
        address_driver::give<TestCoin>(&account1, account1_addr, 100);
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_DRIVER_NOT_FOUND)]
    fun test_give_no_driver() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Try to give without initializing, should fail
        address_driver::give<TestCoin>(&account1, account2_addr, 100);
    }

    #[test]
    fun test_is_account_id_registered() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Get the account ID
        let account_id = address_driver::get_account_id(account1_addr);
        
        // Verify the account ID is registered
        assert!(address_driver::is_account_id_registered(account_id), 0);
        
        // Verify a random account ID is not registered
        assert!(!address_driver::is_account_id_registered(@0x123), 0);
    }

    #[test]
    fun test_get_next_account_id() {
        // Create test accounts
        let (_, _, _) = setup();
        
        // Get the next account ID
        let next_id = address_driver::get_next_account_id();
        
        // Verify the next account ID is greater than 0
        assert!(next_id > 0, 0);
    }

    #[test]
    fun test_get_address_by_account_id() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the AddressDriver
        address_driver::initialize(&account1);
        
        // Get the account ID
        let account_id = address_driver::get_account_id(account1_addr);
        
        // Get the address by account ID
        let addr = address_driver::get_address_by_account_id(account_id);
        
        // Verify the address is correct
        assert!(addr == account1_addr, 0);
    }

    #[test]
    #[expected_failure(abort_code = address_driver::E_ADDRESS_NOT_REGISTERED)]
    fun test_get_address_by_account_id_not_registered() {
        // Create test accounts
        let (_, _, _) = setup();
        
        // Try to get the address for an unregistered account ID, should fail
        address_driver::get_address_by_account_id(@0x123);
    }
}