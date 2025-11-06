#[test_only]
module xylkit::drips_tests {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use xylkit::drips::{Self, DripsConfig};
    use xylkit::splits;
    use xylkit::address_driver;

    // Test coin type for testing
    struct TestCoin {}

    // Setup function to create test accounts and initialize modules
    fun setup(): (signer, signer) {
        // Create test accounts
        let account1 = account::create_account_for_test(@0x1);
        let account2 = account::create_account_for_test(@0x2);
        
        // Initialize timestamp for testing (required for time-based calculations)
        timestamp::set_time_has_started_for_testing(&account1);
        timestamp::update_global_time_for_test(10000000000); // Set a non-zero timestamp
        
        (account1, account2)
    }

    #[test]
    fun test_initialize() {
        // Create a test account
        let (account, _) = setup();
        let account_addr = signer::address_of(&account);
        
        // Initialize the DripsHub
        drips::initialize(&account);
        
        // Verify the DripsHub was created
        assert!(drips::exists_hub(account_addr), 0);
    }

    #[test]
    #[expected_failure(abort_code = drips::E_HUB_ALREADY_EXISTS)]
    fun test_initialize_already_exists() {
        // Create a test account
        let (account, _) = setup();
        
        // Initialize the DripsHub
        drips::initialize(&account);
        
        // Try to initialize again, should fail
        drips::initialize(&account);
    }

    #[test]
    fun test_get_balance_empty() {
        // Create a test account
        let (account, _) = setup();
        let account_addr = signer::address_of(&account);
        
        // Initialize the DripsHub
        drips::initialize(&account);
        
        // Check initial balance is zero
        assert!(drips::get_balance(account_addr) == 0, 0);
    }

    #[test]
    #[expected_failure(abort_code = drips::E_HUB_NOT_FOUND)]
    fun test_get_balance_no_hub() {
        // Create a test account
        let (account, _) = setup();
        let account_addr = signer::address_of(&account);
        
        // Try to get balance without initializing, should fail
        drips::get_balance(account_addr);
    }

    #[test]
    fun test_set_streams() {
        // Create test accounts
        let (account1, account2) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Create a stream configuration
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 3600, // 1 hour
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the streams
        drips::set_streams<TestCoin>(&account1, configs, 360000);
        
        // Verify the stream was set
        assert!(drips::is_streaming_to(account1_addr, account2_addr), 0);
    }

    #[test]
    #[expected_failure(abort_code = drips::E_INVALID_RECEIVER)]
    fun test_set_streams_invalid_receiver() {
        // Create test accounts
        let (account1, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Create a stream configuration with the sender as the receiver (invalid)
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account1_addr, // Same as sender, should fail
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 3600,
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the streams, should fail
        drips::set_streams<TestCoin>(&account1, configs, 360000);
    }

    #[test]
    #[expected_failure(abort_code = drips::E_INVALID_AMT_PER_SEC)]
    fun test_set_streams_invalid_amt_per_sec() {
        // Create test accounts
        let (account1, account2) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Create a stream configuration with zero amt_per_sec (invalid)
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 0, // Zero, should fail
            start_cycle: current_cycle,
            duration: 3600,
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the streams, should fail
        drips::set_streams<TestCoin>(&account1, configs, 360000);
    }

    #[test]
    #[expected_failure(abort_code = drips::E_INVALID_DURATION)]
    fun test_set_streams_invalid_duration() {
        // Create test accounts
        let (account1, account2) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Create a stream configuration with zero duration (invalid)
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 0, // Zero, should fail
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the streams, should fail
        drips::set_streams<TestCoin>(&account1, configs, 360000);
    }

    #[test]
    fun test_collect_streams() {
        // Create test accounts
        let (account1, account2) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the DripsHub for both accounts
        drips::initialize(&account1);
        drips::initialize(&account2);
        
        // Create a stream configuration from account1 to account2
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 3600, // 1 hour
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the streams
        drips::set_streams<TestCoin>(&account1, configs, 360000);
        
        // Advance time to simulate streaming
        timestamp::update_global_time_for_test(10000003600); // Advance by 1 hour
        
        // Collect streams for account2
        let collected = drips::collect<TestCoin>(&account2);
        
        // In a real implementation, we would verify the collected amount
        // For now, we just check that the function executed successfully
    }

    #[test]
    fun test_get_last_collected_cycle() {
        // Create test accounts
        let (account1, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Check initial last collected cycle is zero
        assert!(drips::get_last_collected_cycle(account1_addr) == 0, 0);
        
        // Collect streams to update the last collected cycle
        drips::collect<TestCoin>(&account1);
        
        // Check that the last collected cycle is now the current cycle
        assert!(drips::get_last_collected_cycle(account1_addr) == drips::current_cycle(), 0);
    }

    #[test]
    fun test_address_driver_initialize() {
        // Create a test account
        let (account, _) = setup();
        
        // Initialize the AddressDriver
        address_driver::initialize(&account);
        
        // Verify the DripsHub was created (AddressDriver initializes DripsHub)
        assert!(drips::exists_hub(signer::address_of(&account)), 0);
    }

    // Note: In a real implementation, we would add tests for top_up and withdraw
    // However, these require a proper implementation of coin operations
    // which would depend on the specific Aptos coin implementation
}
    #[tes
t]
    fun test_top_up_and_withdraw() {
        // Create test accounts
        let (account1, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Register the account for TestCoin
        coin::register<TestCoin>(&account1);
        
        // Create a mock coin and deposit it to the account
        let amount = 1000;
        let mock_coin = coin::mint<TestCoin>(amount, &account1);
        coin::deposit(account1_addr, mock_coin);
        
        // Top up the DripsHub
        drips::top_up<TestCoin>(&account1, amount);
        
        // Verify the balance was updated
        assert!(drips::get_balance(account1_addr) == amount, 0);
        
        // Withdraw half of the funds
        let withdraw_amount = amount / 2;
        drips::withdraw<TestCoin>(&account1, withdraw_amount);
        
        // Verify the balance was updated
        assert!(drips::get_balance(account1_addr) == amount - withdraw_amount, 0);
    }

    #[test]
    fun test_multiple_streams() {
        // Create test accounts
        let (account1, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Create multiple stream configurations
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        // Add three different receivers
        let config1 = DripsConfig {
            receiver: @0x2,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 3600, // 1 hour
        };
        
        let config2 = DripsConfig {
            receiver: @0x3,
            amt_per_sec: 200,
            start_cycle: current_cycle,
            duration: 7200, // 2 hours
        };
        
        let config3 = DripsConfig {
            receiver: @0x4,
            amt_per_sec: 300,
            start_cycle: current_cycle,
            duration: 10800, // 3 hours
        };
        
        vector::push_back(&mut configs, config1);
        vector::push_back(&mut configs, config2);
        vector::push_back(&mut configs, config3);
        
        // Calculate the total amount needed
        let total_amount = 100 * 3600 + 200 * 7200 + 300 * 10800;
        
        // Set the streams
        drips::set_streams<TestCoin>(&account1, configs, (total_amount as u128));
        
        // Verify the streams were set
        assert!(drips::is_streaming_to(account1_addr, @0x2), 0);
        assert!(drips::is_streaming_to(account1_addr, @0x3), 0);
        assert!(drips::is_streaming_to(account1_addr, @0x4), 0);
        
        // Get the streams and verify the count
        let stored_configs = drips::get_streams(account1_addr);
        assert!(vector::length(&stored_configs) == 3, 0);
    }

    #[test]
    fun test_update_streams() {
        // Create test accounts
        let (account1, account2) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Create initial stream configuration
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 3600, // 1 hour
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the initial streams
        drips::set_streams<TestCoin>(&account1, configs, 360000);
        
        // Verify the stream was set
        assert!(drips::is_streaming_to(account1_addr, account2_addr), 0);
        
        // Create updated stream configuration
        let updated_configs = vector::empty<DripsConfig>();
        
        let updated_config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 200, // Doubled the rate
            start_cycle: current_cycle,
            duration: 3600, // Same duration
        };
        
        vector::push_back(&mut updated_configs, updated_config);
        
        // Update the streams
        drips::set_streams<TestCoin>(&account1, updated_configs, 720000);
        
        // Verify the stream was updated
        let stored_configs = drips::get_streams(account1_addr);
        assert!(vector::length(&stored_configs) == 1, 0);
        
        let stored_config = vector::borrow(&stored_configs, 0);
        assert!(stored_config.amt_per_sec == 200, 0); // Verify the rate was updated
    }

    #[test]
    fun test_receive_streams_with_max_cycles() {
        // Create test accounts
        let (account1, account2) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the DripsHub for both accounts
        drips::initialize(&account1);
        drips::initialize(&account2);
        
        // Create a stream configuration from account1 to account2
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 86400 * 10, // 10 days
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the streams
        drips::set_streams<TestCoin>(&account1, configs, 86400000);
        
        // Advance time by 5 days
        timestamp::update_global_time_for_test(10000000000 + 86400 * 5);
        
        // Receive streams with max_cycles = 2
        let received = drips::receive_streams<TestCoin>(account2_addr, 2);
        
        // Verify that only 2 days worth of streams were received
        assert!(received == 100 * 86400 * 2, 0);
        
        // Check that the last collected cycle was updated
        let last_cycle = drips::get_last_collected_cycle(account2_addr);
        assert!(last_cycle == current_cycle + 2, 0);
        
        // Receive the rest of the streams
        let received2 = drips::receive_streams<TestCoin>(account2_addr, 0);
        
        // Verify that the remaining 3 days worth of streams were received
        assert!(received2 == 100 * 86400 * 3, 0);
    }

    #[test]
    #[expected_failure(abort_code = drips::E_MAX_CYCLES_EXCEEDED)]
    fun test_receive_streams_max_cycles_exceeded() {
        // Create test accounts
        let (account1, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Initialize the DripsHub
        drips::initialize(&account1);
        
        // Try to receive streams with max_cycles > MAX_CYCLES_RECEIVABLE
        drips::receive_streams<TestCoin>(account1_addr, drips::MAX_CYCLES_RECEIVABLE() + 1);
    }

    #[test]
    fun test_collect_for_account() {
        // Create test accounts
        let (account1, account2) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Initialize the DripsHub for both accounts
        drips::initialize(&account1);
        drips::initialize(&account2);
        
        // Create a stream configuration from account1 to account2
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 3600, // 1 hour
        };
        
        vector::push_back(&mut configs, config);
        
        // Set the streams
        drips::set_streams<TestCoin>(&account1, configs, 360000);
        
        // Advance time to simulate streaming
        timestamp::update_global_time_for_test(10000003600); // Advance by 1 hour
        
        // Collect funds for account2
        let collected = drips::collect_for_account<TestCoin>(account2_addr);
        
        // Verify the collected amount
        assert!(collected == 100 * 3600, 0);
    }

    #[test]
    fun test_integration_with_splits() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Initialize modules for all accounts
        drips::initialize(&account1);
        drips::initialize(&account2);
        drips::initialize(&account3);
        splits::initialize(&account1);
        splits::initialize(&account2);
        splits::initialize(&account3);
        
        // Create a stream from account1 to account2
        let configs = vector::empty<DripsConfig>();
        let current_cycle = drips::current_cycle();
        
        let config = DripsConfig {
            receiver: account2_addr,
            amt_per_sec: 100,
            start_cycle: current_cycle,
            duration: 3600, // 1 hour
        };
        
        vector::push_back(&mut configs, config);
        drips::set_streams<TestCoin>(&account1, configs, 360000);
        
        // Configure splits for account2 to share with account3
        let receivers = vector::empty<SplitsReceiver>();
        let receiver = splits::new_receiver(account3_addr, 500000); // 50%
        vector::push_back(&mut receivers, receiver);
        splits::set_splits(&account2, receivers);
        
        // Advance time to simulate streaming
        timestamp::update_global_time_for_test(10000003600); // Advance by 1 hour
        
        // Collect funds for account2, which should automatically add to splittable
        let collected = drips::collect<TestCoin>(&account2);
        assert!(collected == 100 * 3600, 0);
        
        // Check that the funds were added to splittable
        assert!(splits::splittable<TestCoin>(account2_addr) == 100 * 3600, 0);
        
        // Split the funds
        let (split_amount, collected_amount) = splits::split<TestCoin>(account2_addr, splits::get_receivers(account2_addr));
        
        // Verify the split
        assert!(split_amount == 100 * 3600, 0);
        assert!(collected_amount == 100 * 3600 / 2, 0); // 50% kept by account2
        
        // Check that account3 received their share
        assert!(splits::collectable<TestCoin>(account3_addr) == 100 * 3600 / 2, 0); // 50% for account3
    }