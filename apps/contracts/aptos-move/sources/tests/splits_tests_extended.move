#[test_only]
module xylkit::splits_tests_extended {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use xylkit::splits::{Self, SplitsReceiver};

    // Test coin type for testing
    struct TestCoin {}
    struct AnotherTestCoin {}

    // Setup function to create test accounts and initialize modules
    fun setup(): (signer, signer, signer, signer) {
        // Create test accounts
        let account1 = account::create_account_for_test(@0x1);
        let account2 = account::create_account_for_test(@0x2);
        let account3 = account::create_account_for_test(@0x3);
        let account4 = account::create_account_for_test(@0x4);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&account1);
        timestamp::update_global_time_for_test(10000000000); // Set a non-zero timestamp
        
        (account1, account2, account3, account4)
    }

    #[test]
    fun test_update_splits_configuration() {
        // Create test accounts
        let (account1, account2, account3, account4) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        let account4_addr = signer::address_of(&account4);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create initial splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 300000)); // 30%
        vector::push_back(&mut receivers, splits::new_receiver(account3_addr, 200000)); // 20%
        
        // Set the initial splits
        splits::set_splits(&account1, receivers);
        
        // Verify the initial splits were set
        let stored_receivers = splits::get_receivers(account1_addr);
        assert!(vector::length(&stored_receivers) == 2, 0);
        
        // Create updated splits configuration
        let updated_receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut updated_receivers, splits::new_receiver(account2_addr, 250000)); // 25%
        vector::push_back(&mut updated_receivers, splits::new_receiver(account3_addr, 150000)); // 15%
        vector::push_back(&mut updated_receivers, splits::new_receiver(account4_addr, 100000)); // 10%
        
        // Update the splits
        splits::set_splits(&account1, updated_receivers);
        
        // Verify the updated splits were set
        let stored_receivers = splits::get_receivers(account1_addr);
        assert!(vector::length(&stored_receivers) == 3, 0);
        
        let stored_receiver1 = vector::borrow(&stored_receivers, 0);
        assert!(stored_receiver1.receiver == account2_addr, 0);
        assert!(stored_receiver1.weight == 250000, 0);
        
        let stored_receiver2 = vector::borrow(&stored_receivers, 1);
        assert!(stored_receiver2.receiver == account3_addr, 0);
        assert!(stored_receiver2.weight == 150000, 0);
        
        let stored_receiver3 = vector::borrow(&stored_receivers, 2);
        assert!(stored_receiver3.receiver == account4_addr, 0);
        assert!(stored_receiver3.weight == 100000, 0);
    }

    #[test]
    fun test_multiple_coin_types() {
        // Create test accounts
        let (account1, account2, account3, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 300000)); // 30%
        vector::push_back(&mut receivers, splits::new_receiver(account3_addr, 200000)); // 20%
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Add funds of different coin types to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        splits::add_splittable<AnotherTestCoin>(account1_addr, 2000000);
        
        // Check splittable amounts for different coin types
        assert!(splits::splittable<TestCoin>(account1_addr) == 1000000, 0);
        assert!(splits::splittable<AnotherTestCoin>(account1_addr) == 2000000, 0);
        
        // Split the funds for TestCoin
        let (split_amount1, collected_amount1) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount for TestCoin
        assert!(split_amount1 == 1000000, 0);
        assert!(collected_amount1 == 500000, 0); // 50% collected by account1
        
        // Split the funds for AnotherTestCoin
        let (split_amount2, collected_amount2) = splits::split<AnotherTestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount for AnotherTestCoin
        assert!(split_amount2 == 2000000, 0);
        assert!(collected_amount2 == 1000000, 0); // 50% collected by account1
        
        // Check that the collectable amounts are correct for TestCoin
        assert!(splits::collectable<TestCoin>(account1_addr) == 500000, 0); // 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 300000, 0); // 30% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 200000, 0); // 20% for account3
        
        // Check that the collectable amounts are correct for AnotherTestCoin
        assert!(splits::collectable<AnotherTestCoin>(account1_addr) == 1000000, 0); // 50% for account1
        assert!(splits::collectable<AnotherTestCoin>(account2_addr) == 600000, 0); // 30% for account2
        assert!(splits::collectable<AnotherTestCoin>(account3_addr) == 400000, 0); // 20% for account3
    }

    #[test]
    fun test_split_with_zero_amount() {
        // Create test accounts
        let (account1, account2, account3, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 300000)); // 30%
        vector::push_back(&mut receivers, splits::new_receiver(account3_addr, 200000)); // 20%
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Split with no funds added (should return 0, 0)
        let (split_amount, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount are both 0
        assert!(split_amount == 0, 0);
        assert!(collected_amount == 0, 0);
        
        // Check that the collectable amounts are all 0
        assert!(splits::collectable<TestCoin>(account1_addr) == 0, 0);
        assert!(splits::collectable<TestCoin>(account2_addr) == 0, 0);
        assert!(splits::collectable<TestCoin>(account3_addr) == 0, 0);
    }

    #[test]
    fun test_split_with_empty_receivers() {
        // Create test accounts
        let (account1, _, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Add funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split with empty receivers (all funds should go to the account itself)
        let (split_amount, collected_amount) = splits::split<TestCoin>(account1_addr, vector::empty<SplitsReceiver>());
        
        // Verify the split amount and collected amount
        assert!(split_amount == 1000000, 0);
        assert!(collected_amount == 1000000, 0); // 100% collected by account1
        
        // Check that the collectable amount is correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 1000000, 0);
    }

    #[test]
    fun test_split_with_max_receivers() {
        // Create test accounts
        let (account1, _, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Create a splits configuration with multiple receivers (not actually 200, just testing the concept)
        let receivers = vector::empty<SplitsReceiver>();
        
        // Add 10 receivers with 5% weight each (total 50%)
        let i = 10;
        while (i < 20) {
            vector::push_back(&mut receivers, splits::new_receiver(@0x10 + (i as address), 50000)); // 5% each
            i = i + 1;
        };
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Add funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount == 1000000, 0);
        assert!(collected_amount == 500000, 0); // 50% collected by account1
        
        // Check that the splittable amount is now 0
        assert!(splits::splittable<TestCoin>(account1_addr) == 0, 0);
    }

    #[test]
    fun test_add_splittable_multiple_times() {
        // Create test accounts
        let (account1, account2, account3, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 300000)); // 30%
        vector::push_back(&mut receivers, splits::new_receiver(account3_addr, 200000)); // 20%
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Add funds to be split in multiple calls
        splits::add_splittable<TestCoin>(account1_addr, 500000);
        splits::add_splittable<TestCoin>(account1_addr, 300000);
        splits::add_splittable<TestCoin>(account1_addr, 200000);
        
        // Check total splittable amount
        assert!(splits::splittable<TestCoin>(account1_addr) == 1000000, 0);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount == 1000000, 0);
        assert!(collected_amount == 500000, 0); // 50% collected by account1
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 500000, 0); // 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 300000, 0); // 30% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 200000, 0); // 20% for account3
    }

    #[test]
    fun test_split_after_configuration_change() {
        // Create test accounts
        let (account1, account2, account3, account4) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        let account4_addr = signer::address_of(&account4);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        splits::initialize(&account4);
        
        // Create initial splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 300000)); // 30%
        vector::push_back(&mut receivers, splits::new_receiver(account3_addr, 200000)); // 20%
        
        // Set the initial splits
        splits::set_splits(&account1, receivers);
        
        // Add funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds with initial configuration
        let (split_amount1, collected_amount1) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount1 == 1000000, 0);
        assert!(collected_amount1 == 500000, 0); // 50% collected by account1
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 500000, 0); // 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 300000, 0); // 30% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 200000, 0); // 20% for account3
        
        // Create updated splits configuration
        let updated_receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut updated_receivers, splits::new_receiver(account2_addr, 200000)); // 20%
        vector::push_back(&mut updated_receivers, splits::new_receiver(account4_addr, 300000)); // 30%
        
        // Update the splits
        splits::set_splits(&account1, updated_receivers);
        
        // Add more funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds with updated configuration
        let (split_amount2, collected_amount2) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount2 == 1000000, 0);
        assert!(collected_amount2 == 500000, 0); // 50% collected by account1
        
        // Check that the collectable amounts are updated correctly
        assert!(splits::collectable<TestCoin>(account1_addr) == 1000000, 0); // 50% + 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 500000, 0); // 30% + 20% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 200000, 0); // 20% for account3 (unchanged)
        assert!(splits::collectable<TestCoin>(account4_addr) == 300000, 0); // 30% for account4 (new)
    }

    #[test]
    fun test_collect_partial_amount() {
        // This test would require modifications to the splits module to support partial collection
        // Since the current implementation only allows collecting the full amount, we'll test the existing behavior
        
        // Create test accounts
        let (account1, _, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the SplitsStore
        splits::initialize(&account1);
        
        // Add funds to be split
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
    fun test_split_with_rounding() {
        // Create test accounts
        let (account1, account2, account3, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Create a splits configuration with weights that will cause rounding
        let receivers = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers, splits::new_receiver(account2_addr, 333333)); // ~33.3333%
        vector::push_back(&mut receivers, splits::new_receiver(account3_addr, 333333)); // ~33.3333%
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Add funds to be split (a prime number to test rounding)
        splits::add_splittable<TestCoin>(account1_addr, 1000003);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount
        assert!(split_amount == 1000003, 0);
        
        // Calculate expected amounts (with potential rounding)
        // account1: ~33.3334% (remainder)
        // account2: ~33.3333%
        // account3: ~33.3333%
        
        // Check that the collectable amounts are correct and the total adds up
        let collectable1 = splits::collectable<TestCoin>(account1_addr);
        let collectable2 = splits::collectable<TestCoin>(account2_addr);
        let collectable3 = splits::collectable<TestCoin>(account3_addr);
        
        // Verify the total adds up to the original amount
        assert!(collectable1 + collectable2 + collectable3 == 1000003, 0);
        
        // Verify the collected amount matches what's in account1's collectable balance
        assert!(collected_amount == collectable1, 0);
    }

    #[test]
    fun test_split_chain() {
        // Create test accounts
        let (account1, account2, account3, account4) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        let account4_addr = signer::address_of(&account4);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        splits::initialize(&account4);
        
        // Set up a chain of splits:
        // account1 splits to account2 (50%)
        // account2 splits to account3 (50%)
        // account3 splits to account4 (50%)
        
        // Configure account1's splits
        let receivers1 = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers1, splits::new_receiver(account2_addr, 500000)); // 50%
        splits::set_splits(&account1, receivers1);
        
        // Configure account2's splits
        let receivers2 = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers2, splits::new_receiver(account3_addr, 500000)); // 50%
        splits::set_splits(&account2, receivers2);
        
        // Configure account3's splits
        let receivers3 = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers3, splits::new_receiver(account4_addr, 500000)); // 50%
        splits::set_splits(&account3, receivers3);
        
        // Add funds to account1
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split funds at account1
        splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Check initial distribution
        assert!(splits::collectable<TestCoin>(account1_addr) == 500000, 0); // 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 500000, 0); // 50% for account2
        
        // Split funds at account2
        splits::add_splittable<TestCoin>(account2_addr, splits::collectable<TestCoin>(account2_addr));
        splits::split<TestCoin>(account2_addr, splits::get_receivers(account2_addr));
        
        // Check second level distribution
        assert!(splits::collectable<TestCoin>(account2_addr) == 250000, 0); // 50% of 50% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 250000, 0); // 50% of 50% for account3
        
        // Split funds at account3
        splits::add_splittable<TestCoin>(account3_addr, splits::collectable<TestCoin>(account3_addr));
        splits::split<TestCoin>(account3_addr, splits::get_receivers(account3_addr));
        
        // Check third level distribution
        assert!(splits::collectable<TestCoin>(account3_addr) == 125000, 0); // 50% of 50% of 50% for account3
        assert!(splits::collectable<TestCoin>(account4_addr) == 125000, 0); // 50% of 50% of 50% for account4
        
        // Final distribution should be:
        // account1: 500,000 (50%)
        // account2: 250,000 (25%)
        // account3: 125,000 (12.5%)
        // account4: 125,000 (12.5%)
        // Total: 1,000,000 (100%)
        
        let total = splits::collectable<TestCoin>(account1_addr) +
                   splits::collectable<TestCoin>(account2_addr) +
                   splits::collectable<TestCoin>(account3_addr) +
                   splits::collectable<TestCoin>(account4_addr);
                   
        assert!(total == 1000000, 0); // Verify total is preserved
    }
}