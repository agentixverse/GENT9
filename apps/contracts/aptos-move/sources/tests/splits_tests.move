#[test_only]
module xylkit::splits_tests {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use xylkit::splits::{Self, SplitsReceiver};

    // Test coin type for testing
    struct TestCoin {}

    // Setup function to create test accounts and initialize modules
    fun setup(): (signer, signer, signer) {
        // Create test accounts
        let account1 = account::create_account_for_test(@0x1);
        let account2 = account::create_account_for_test(@0x2);
        let account3 = account::create_account_for_test(@0x3);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&account1);
        timestamp::update_global_time_for_test(10000000000); // Set a non-zero timestamp
        
        (account1, account2, account3)
    }

    #[test]
    fun test_initialize() {
        // Create a test account
        let (account, _, _) = setup();
        let account_addr = signer::address_of(&account);
        
        // Initialize the SplitsStore
        splits::initialize(&account);
        
        // Verify the SplitsStore was created
        assert!(splits::exists_store(account_addr), 0);
    }

    #[test]
    #[expected_failure(abort_code = splits::E_UNAUTHORIZED)]
    fun test_initialize_already_exists() {
        // Create a test account
        let (account, _, _) = setup();
        
        // Initialize the SplitsStore
        splits::initialize(&account);
        
        // Try to initialize again, should fail
        splits::initialize(&account);
    }

    #[test]
    fun test_set_splits() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver = splits::new_receiver(account2_addr, 500000); // 50%
        
        vector::push_back(&mut receivers, receiver);
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Verify the splits were set
        let stored_receivers = splits::get_receivers(account1_addr);
        assert!(vector::length(&stored_receivers) == 1, 0);
        
        let stored_receiver = vector::borrow(&stored_receivers, 0);
        assert!(stored_receiver.receiver == account2_addr, 0);
        assert!(stored_receiver.weight == 500000, 0);
    }

    #[test]
    #[expected_failure(abort_code = splits::E_SPLITS_STORE_NOT_FOUND)]
    fun test_set_splits_no_store() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver = splits::new_receiver(account2_addr, 500000); // 50%
        
        vector::push_back(&mut receivers, receiver);
        
        // Try to set splits without initializing, should fail
        splits::set_splits(&account1, receivers);
    }

    #[test]
    #[expected_failure(abort_code = splits::E_INVALID_WEIGHT)]
    fun test_set_splits_invalid_weight() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create a splits configuration with zero weight (invalid)
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver = splits::new_receiver(account2_addr, 0); // Zero, should fail
        
        vector::push_back(&mut receivers, receiver);
        
        // Try to set splits with invalid weight, should fail
        splits::set_splits(&account1, receivers);
    }

    #[test]
    #[expected_failure(abort_code = splits::E_WEIGHT_SUM_TOO_HIGH)]
    fun test_set_splits_weight_sum_too_high() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create a splits configuration with weight sum > 1,000,000 (invalid)
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver = splits::new_receiver(account2_addr, 1000001); // > 100%, should fail
        
        vector::push_back(&mut receivers, receiver);
        
        // Try to set splits with invalid weight sum, should fail
        splits::set_splits(&account1, receivers);
    }

    #[test]
    #[expected_failure(abort_code = splits::E_SELF_RECEIVER_NOT_ALLOWED)]
    fun test_set_splits_self_receiver() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create a splits configuration with the sender as a receiver (invalid)
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver = splits::new_receiver(account1_addr, 500000); // Self as receiver, should fail
        
        vector::push_back(&mut receivers, receiver);
        
        // Try to set splits with self as receiver, should fail
        splits::set_splits(&account1, receivers);
    }

    #[test]
    #[expected_failure(abort_code = splits::E_RECEIVERS_NOT_SORTED)]
    fun test_set_splits_not_sorted() {
        // Create test accounts
        let (account1, _, _) = setup();
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create a splits configuration with unsorted receivers (invalid)
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver1 = splits::new_receiver(@0x3, 300000); // 30%
        let receiver2 = splits::new_receiver(@0x2, 200000); // 20%
        
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        
        // Try to set splits with unsorted receivers, should fail
        splits::set_splits(&account1, receivers);
    }

    #[test]
    fun test_set_splits_multiple_receivers() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create a splits configuration with multiple receivers
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver1 = splits::new_receiver(@0x2, 300000); // 30%
        let receiver2 = splits::new_receiver(@0x3, 200000); // 20%
        let receiver3 = splits::new_receiver(@0x4, 100000); // 10%
        
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        vector::push_back(&mut receivers, receiver3);
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Verify the splits were set
        let stored_receivers = splits::get_receivers(account1_addr);
        assert!(vector::length(&stored_receivers) == 3, 0);
        
        let stored_receiver1 = vector::borrow(&stored_receivers, 0);
        assert!(stored_receiver1.receiver == @0x2, 0);
        assert!(stored_receiver1.weight == 300000, 0);
        
        let stored_receiver2 = vector::borrow(&stored_receivers, 1);
        assert!(stored_receiver2.receiver == @0x3, 0);
        assert!(stored_receiver2.weight == 200000, 0);
        
        let stored_receiver3 = vector::borrow(&stored_receivers, 2);
        assert!(stored_receiver3.receiver == @0x4, 0);
        assert!(stored_receiver3.weight == 100000, 0);
    }

    #[test]
    fun test_add_splittable_and_split() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Create a splits configuration with multiple receivers
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver1 = splits::new_receiver(account2_addr, 300000); // 30%
        let receiver2 = splits::new_receiver(account3_addr, 200000); // 20%
        
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Add funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Check splittable amount
        assert!(splits::splittable<TestCoin>(account1_addr) == 1000000, 0);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount == 1000000, 0); // Total amount split
        assert!(collected_amount == 500000, 0); // 50% collected by account1 (100% - 30% - 20%)
        
        // Check that the splittable amount is now 0
        assert!(splits::splittable<TestCoin>(account1_addr) == 0, 0);
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 500000, 0); // 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 300000, 0); // 30% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 200000, 0); // 20% for account3
    }

    #[test]
    fun test_collect() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Add funds to be collected
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds (with no receivers, all funds go to the account itself)
        splits::split<TestCoin>(account1_addr, vector::empty<SplitsReceiver>());
        
        // Check that the collectable amount is correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 1000000, 0);
        
        // Collect the funds
        let collected = splits::collect<TestCoin>(&account1);
        
        // Verify the collected amount
        assert!(collected == 1000000, 0);
        
        // Check that the collectable amount is now 0
        assert!(splits::collectable<TestCoin>(account1_addr) == 0, 0);
    }

    #[test]
    fun test_collect_to() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Add funds to be collected
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds (with no receivers, all funds go to the account itself)
        splits::split<TestCoin>(account1_addr, vector::empty<SplitsReceiver>());
        
        // Check that the collectable amount is correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 1000000, 0);
        
        // Collect the funds and transfer them to account2
        let collected = splits::collect_to<TestCoin>(&account1, account2_addr);
        
        // Verify the collected amount
        assert!(collected == 1000000, 0);
        
        // Check that the collectable amount is now 0
        assert!(splits::collectable<TestCoin>(account1_addr) == 0, 0);
    }

    #[test]
    fun test_collect_empty() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Check that the collectable amount is 0
        assert!(splits::collectable<TestCoin>(account1_addr) == 0, 0);
        
        // Collect the funds (should return 0)
        let collected = splits::collect<TestCoin>(&account1);
        
        // Verify the collected amount is 0
        assert!(collected == 0, 0);
    }

    #[test]
    fun test_calculate_collected_amount() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for account1
        splits::initialize(&account1);
        
        // Test with no receivers (100% collected)
        let receivers = vector::empty<SplitsReceiver>();
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        let (_, collected_amount) = splits::split<TestCoin>(account1_addr, receivers);
        assert!(collected_amount == 1000000, 0); // 100% collected
        
        // Test with one receiver (70% collected)
        splits::initialize(&account2);
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 300000)); // 30%
        splits::set_splits(&account1, receivers);
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        let (_, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        assert!(collected_amount == 700000, 0); // 70% collected
        
        // Test with two receivers (50% collected)
        splits::initialize(&account3);
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 300000)); // 30%
        vector::push_back(&mut receivers, splits::new_receiver(account3_addr, 200000)); // 20%
        splits::set_splits(&account1, receivers);
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        let (_, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        assert!(collected_amount == 500000, 0); // 50% collected
    }

    #[test]
    fun test_distribute_to_receivers() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Create a splits configuration with multiple receivers
        let receivers = vector::empty<SplitsReceiver>();
        
        let receiver1 = splits::new_receiver(account2_addr, 600000); // 60%
        let receiver2 = splits::new_receiver(account3_addr, 400000); // 40%
        
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Add funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds
        splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 0, 0); // 0% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 600000, 0); // 60% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 400000, 0); // 40% for account3
        
        // Collect the funds for account2
        let collected2 = splits::collect<TestCoin>(&account2);
        assert!(collected2 == 600000, 0);
        
        // Collect the funds for account3
        let collected3 = splits::collect<TestCoin>(&account3);
        assert!(collected3 == 400000, 0);
    }
}