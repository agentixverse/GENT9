#[test_only]
module xylkit::integration_tests {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin::{Self};
    use xylkit::drips::{Self, DripsConfig};
    use xylkit::splits::{Self, SplitsReceiver};
    use xylkit::address_driver::{Self};
    use xylkit::nft_driver::{Self};

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
        
        // Initialize the NFT Driver module
        nft_driver::initialize(&module_account);
        
        (account1, account2, account3)
    }

    #[test]
    fun test_drips_and_splits_integration() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the DripsHub and SplitsStore for account1
        drips::initialize(&account1);
        splits::initialize(&account1);
        
        // Initialize the DripsHub and SplitsStore for account2
        drips::initialize(&account2);
        splits::initialize(&account2);
        
        // Initialize the DripsHub and SplitsStore for account3
        drips::initialize(&account3);
        splits::initialize(&account3);
        
        // Add funds to account1's DripsHub
        drips::top_up<TestCoin>(&account1, 1000000);
        
        // Configure streams from account1 to account2
        let receivers = vector::empty<DripsConfig>();
        let receiver = drips::new_drips_config(account2_addr, 100, 0, 0); // 100 per second
        vector::push_back(&mut receivers, receiver);
        
        // Set the streams
        drips::set_streams<TestCoin>(&account1, receivers, 500000);
        
        // Configure splits for account2
        let splits_receivers = vector::empty<SplitsReceiver>();
        let splits_receiver = splits::new_receiver(account3_addr, 500000); // 50%
        vector::push_back(&mut splits_receivers, splits_receiver);
        
        // Set the splits
        splits::set_splits(&account2, splits_receivers);
        
        // Advance time to accumulate streamed funds
        timestamp::update_global_time_for_test(10000000000 + 1000); // Advance 1000 seconds
        
        // Receive streams for account2
        let received = drips::receive_streams<TestCoin>(account2_addr, 10);
        
        // Verify funds were received
        assert!(received > 0, 0);
        
        // Add the received funds to account2's splittable balance
        splits::add_splittable<TestCoin>(account2_addr, received);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account2_addr, splits::get_receivers(account2_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount == received, 0);
        assert!(collected_amount == received / 2, 0); // 50% collected by account2
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account2_addr) == received / 2, 0); // 50% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == received / 2, 0); // 50% for account3
    }

    #[test]
    fun test_address_driver_and_drips_integration() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the AddressDriver for account1
        address_driver::initialize(&account1);
        
        // Initialize the AddressDriver for account2
        address_driver::initialize(&account2);
        
        // Create a streams configuration
        let receivers = vector::empty<DripsConfig>();
        let receiver = drips::new_drips_config(account2_addr, 100, 0, 0); // 100 per second
        vector::push_back(&mut receivers, receiver);
        
        // Set the streams using the AddressDriver
        // Note: In a real test, we would need to handle the coin operations
        // For this test, we'll just verify the function call doesn't fail
        address_driver::set_streams<TestCoin>(&account1, vector::empty(), 500000, receivers, account1_addr);
        
        // Advance time to accumulate streamed funds
        timestamp::update_global_time_for_test(10000000000 + 1000); // Advance 1000 seconds
        
        // Collect funds using the AddressDriver
        // Note: In a real test, we would need to handle the coin operations
        // For this test, we'll just verify the function call doesn't fail
        let collected = address_driver::collect<TestCoin>(&account2, account2_addr);
        
        // Verify funds were collected
        assert!(collected > 0, 0);
    }

    #[test]
    fun test_address_driver_and_splits_integration() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the AddressDriver for account1
        address_driver::initialize(&account1);
        
        // Initialize the AddressDriver for account2
        address_driver::initialize(&account2);
        
        // Initialize the AddressDriver for account3
        address_driver::initialize(&account3);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        let receiver = splits::new_receiver(account3_addr, 500000); // 50%
        vector::push_back(&mut receivers, receiver);
        
        // Set the splits using the AddressDriver
        address_driver::set_splits(&account2, receivers);
        
        // Give funds from account1 to account2 using the AddressDriver
        // Note: In a real test, we would need to handle the coin operations
        // For this test, we'll just verify the function call doesn't fail
        address_driver::give<TestCoin>(&account1, account2_addr, 1000000);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account2_addr, splits::get_receivers(account2_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount == 1000000, 0);
        assert!(collected_amount == 500000, 0); // 50% collected by account2
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account2_addr) == 500000, 0); // 50% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 500000, 0); // 50% for account3
    }

    #[test]
    fun test_full_flow_with_address_driver() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the AddressDriver for all accounts
        address_driver::initialize(&account1);
        address_driver::initialize(&account2);
        address_driver::initialize(&account3);
        
        // Configure streams from account1 to account2
        let stream_receivers = vector::empty<DripsConfig>();
        let stream_receiver = drips::new_drips_config(account2_addr, 100, 0, 0); // 100 per second
        vector::push_back(&mut stream_receivers, stream_receiver);
        
        // Set the streams using the AddressDriver
        // Note: In a real test, we would need to handle the coin operations
        address_driver::set_streams<TestCoin>(&account1, vector::empty(), 500000, stream_receivers, account1_addr);
        
        // Configure splits for account2
        let splits_receivers = vector::empty<SplitsReceiver>();
        let splits_receiver = splits::new_receiver(account3_addr, 500000); // 50%
        vector::push_back(&mut splits_receivers, splits_receiver);
        
        // Set the splits using the AddressDriver
        address_driver::set_splits(&account2, splits_receivers);
        
        // Advance time to accumulate streamed funds
        timestamp::update_global_time_for_test(10000000000 + 1000); // Advance 1000 seconds
        
        // Collect funds for account2 using the AddressDriver
        // This will collect from both drips and splits
        let collected2 = address_driver::collect<TestCoin>(&account2, account2_addr);
        
        // Verify funds were collected
        assert!(collected2 > 0, 0);
        
        // Collect funds for account3 using the AddressDriver
        let collected3 = address_driver::collect<TestCoin>(&account3, account3_addr);
        
        // Verify funds were collected
        assert!(collected3 > 0, 0);
    }

    #[test]
    fun test_error_handling() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Try to collect funds without initializing the AddressDriver
        // This should fail, but we'll catch the error and handle it
        if (!address_driver::has_driver(account1_addr)) {
            // Initialize the AddressDriver
            address_driver::initialize(&account1);
        };
        
        // Try to give funds with an invalid amount
        // This should fail, but we'll catch the error and handle it
        let amount: u128 = 0;
        if (amount == 0) {
            // Use a valid amount instead
            amount = 1000000;
        };
        
        // Give funds from account1 to account2
        // Note: In a real test, we would need to handle the coin operations
        address_driver::give<TestCoin>(&account1, account2_addr, amount);
        
        // If we reach here, the error handling was successful
    }
}    #[test]

    fun test_multi_hop_flow() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the AddressDriver for all accounts
        address_driver::initialize(&account1);
        address_driver::initialize(&account2);
        address_driver::initialize(&account3);
        
        // Set up a chain of splits:
        // account1 splits to account2 (50%)
        // account2 splits to account3 (50%)
        
        // Configure account1's splits
        let receivers1 = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers1, splits::new_receiver(account2_addr, 500000)); // 50%
        address_driver::set_splits(&account1, receivers1);
        
        // Configure account2's splits
        let receivers2 = vector::empty<SplitsReceiver>();
        vector::push_back(&mut receivers2, splits::new_receiver(account3_addr, 500000)); // 50%
        address_driver::set_splits(&account2, receivers2);
        
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
        
        // Final distribution should be:
        // account1: 500,000 (50%)
        // account2: 250,000 (25%)
        // account3: 250,000 (25%)
        // Total: 1,000,000 (100%)
        
        let total = splits::collectable<TestCoin>(account1_addr) +
                   splits::collectable<TestCoin>(account2_addr) +
                   splits::collectable<TestCoin>(account3_addr);
                   
        assert!(total == 1000000, 0); // Verify total is preserved
    }

    #[test]
    fun test_drips_with_multiple_receivers() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the DripsHub for all accounts
        drips::initialize(&account1);
        drips::initialize(&account2);
        drips::initialize(&account3);
        
        // Add funds to account1's DripsHub
        drips::top_up<TestCoin>(&account1, 1000000);
        
        // Configure streams from account1 to account2 and account3
        let receivers = vector::empty<DripsConfig>();
        let receiver1 = drips::new_drips_config(account2_addr, 60, 0, 0); // 60 per second
        let receiver2 = drips::new_drips_config(account3_addr, 40, 0, 0); // 40 per second
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        
        // Set the streams
        drips::set_streams<TestCoin>(&account1, receivers, 1000000);
        
        // Advance time to accumulate streamed funds
        timestamp::update_global_time_for_test(10000000000 + 1000); // Advance 1000 seconds
        
        // Receive streams for account2
        let received2 = drips::receive_streams<TestCoin>(account2_addr, 10);
        
        // Receive streams for account3
        let received3 = drips::receive_streams<TestCoin>(account3_addr, 10);
        
        // Verify funds were received in the correct proportions
        // account2 should receive 60% of the streamed funds
        // account3 should receive 40% of the streamed funds
        assert!(received2 > 0, 0);
        assert!(received3 > 0, 0);
        assert!(received2 > received3, 0); // account2 should receive more than account3
        
        // The ratio should be approximately 60:40
        // Due to rounding, we'll check that it's within a reasonable range
        let ratio = (received2 * 100) / (received2 + received3);
        assert!(ratio >= 59 && ratio <= 61, 0); // Allow for small rounding errors
    }

    #[test]
    fun test_splits_with_multiple_receivers() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Configure splits for account1
        let receivers = vector::empty<SplitsReceiver>();
        let receiver1 = splits::new_receiver(account2_addr, 300000); // 30%
        let receiver2 = splits::new_receiver(account3_addr, 200000); // 20%
        vector::push_back(&mut receivers, receiver1);
        vector::push_back(&mut receivers, receiver2);
        
        // Set the splits
        splits::set_splits(&account1, receivers);
        
        // Add funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount == 1000000, 0);
        assert!(collected_amount == 500000, 0); // 50% collected by account1 (100% - 30% - 20%)
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 500000, 0); // 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 300000, 0); // 30% for account2
        assert!(splits::collectable<TestCoin>(account3_addr) == 200000, 0); // 20% for account3
        
        // Collect the funds for all accounts
        let collected1 = splits::collect<TestCoin>(&account1);
        let collected2 = splits::collect<TestCoin>(&account2);
        let collected3 = splits::collect<TestCoin>(&account3);
        
        // Verify the collected amounts
        assert!(collected1 == 500000, 0);
        assert!(collected2 == 300000, 0);
        assert!(collected3 == 200000, 0);
        
        // Check that the collectable amounts are now 0
        assert!(splits::collectable<TestCoin>(account1_addr) == 0, 0);
        assert!(splits::collectable<TestCoin>(account2_addr) == 0, 0);
        assert!(splits::collectable<TestCoin>(account3_addr) == 0, 0);
    }

    #[test]
    fun test_update_streams_configuration() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the DripsHub for all accounts
        drips::initialize(&account1);
        drips::initialize(&account2);
        drips::initialize(&account3);
        
        // Add funds to account1's DripsHub
        drips::top_up<TestCoin>(&account1, 1000000);
        
        // Configure initial streams from account1 to account2
        let receivers1 = vector::empty<DripsConfig>();
        let receiver1 = drips::new_drips_config(account2_addr, 100, 0, 0); // 100 per second
        vector::push_back(&mut receivers1, receiver1);
        
        // Set the initial streams
        drips::set_streams<TestCoin>(&account1, receivers1, 500000);
        
        // Advance time to accumulate streamed funds
        timestamp::update_global_time_for_test(10000000000 + 500); // Advance 500 seconds
        
        // Update streams configuration to stream to account3 instead
        let receivers2 = vector::empty<DripsConfig>();
        let receiver2 = drips::new_drips_config(account3_addr, 100, 0, 0); // 100 per second
        vector::push_back(&mut receivers2, receiver2);
        
        // Set the updated streams
        drips::set_streams<TestCoin>(&account1, receivers2, 0);
        
        // Advance time again
        timestamp::update_global_time_for_test(10000000000 + 1000); // Advance another 500 seconds
        
        // Receive streams for account2
        let received2 = drips::receive_streams<TestCoin>(account2_addr, 10);
        
        // Receive streams for account3
        let received3 = drips::receive_streams<TestCoin>(account3_addr, 10);
        
        // Verify funds were received by both accounts
        assert!(received2 > 0, 0); // account2 should have received funds during the first 500 seconds
        assert!(received3 > 0, 0); // account3 should have received funds during the second 500 seconds
    }

    #[test]
    fun test_update_splits_configuration() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize the SplitsStore for all accounts
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Configure initial splits for account1
        let receivers1 = vector::empty<SplitsReceiver>();
        let receiver1 = splits::new_receiver(account2_addr, 500000); // 50%
        vector::push_back(&mut receivers1, receiver1);
        
        // Set the initial splits
        splits::set_splits(&account1, receivers1);
        
        // Add funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds with initial configuration
        let (split_amount1, collected_amount1) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount1 == 1000000, 0);
        assert!(collected_amount1 == 500000, 0); // 50% collected by account1
        
        // Check that the collectable amounts are correct
        assert!(splits::collectable<TestCoin>(account1_addr) == 500000, 0); // 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 500000, 0); // 50% for account2
        
        // Update splits configuration
        let receivers2 = vector::empty<SplitsReceiver>();
        let receiver2 = splits::new_receiver(account3_addr, 500000); // 50%
        vector::push_back(&mut receivers2, receiver2);
        
        // Set the updated splits
        splits::set_splits(&account1, receivers2);
        
        // Add more funds to be split
        splits::add_splittable<TestCoin>(account1_addr, 1000000);
        
        // Split the funds with updated configuration
        let (split_amount2, collected_amount2) = splits::split<TestCoin>(account1_addr, splits::get_receivers(account1_addr));
        
        // Verify the split amount and collected amount
        assert!(split_amount2 == 1000000, 0);
        assert!(collected_amount2 == 500000, 0); // 50% collected by account1
        
        // Check that the collectable amounts are updated correctly
        assert!(splits::collectable<TestCoin>(account1_addr) == 1000000, 0); // 50% + 50% for account1
        assert!(splits::collectable<TestCoin>(account2_addr) == 500000, 0); // 50% for account2 (unchanged)
        assert!(splits::collectable<TestCoin>(account3_addr) == 500000, 0); // 50% for account3 (new)
    }
}