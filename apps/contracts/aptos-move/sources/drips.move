module xylkit::drips {
    use std::signer;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};
    use xylkit::splits::{Self, SplitsReceiver};
    use xylkit::error_handling;

    /// Error codes - using standardized error codes from error_handling module
    const CATEGORY: u8 = error_handling::CATEGORY_DRIPS;
    
    // Redefining local error codes for backward compatibility
    const E_HUB_ALREADY_EXISTS: u64 = error_handling::E_DRIPS_HUB_ALREADY_EXISTS;
    const E_INSUFFICIENT_BALANCE: u64 = error_handling::E_DRIPS_INSUFFICIENT_BALANCE;
    const E_INVALID_AMOUNT: u64 = error_handling::E_DRIPS_INVALID_AMOUNT;
    const E_INVALID_RECEIVER: u64 = error_handling::E_DRIPS_INVALID_RECEIVER;
    const E_INVALID_AMT_PER_SEC: u64 = error_handling::E_DRIPS_INVALID_AMT_PER_SEC;
    const E_INVALID_DURATION: u64 = error_handling::E_DRIPS_INVALID_DURATION;
    const E_UNAUTHORIZED: u64 = error_handling::E_UNAUTHORIZED;
    const E_HUB_NOT_FOUND: u64 = error_handling::E_DRIPS_HUB_NOT_FOUND;
    const E_RECEIVERS_NOT_SORTED: u64 = error_handling::E_DRIPS_RECEIVERS_NOT_SORTED;
    const E_DUPLICATE_RECEIVER: u64 = error_handling::E_DRIPS_DUPLICATE_RECEIVER;
    const E_INVALID_BALANCE_DELTA: u64 = error_handling::E_DRIPS_INVALID_BALANCE_DELTA;
    const E_MAX_CYCLES_EXCEEDED: u64 = error_handling::E_DRIPS_MAX_CYCLES_EXCEEDED;

    /// Constants
    const SECONDS_PER_CYCLE: u64 = 86400; // 1 day in seconds
    const MAX_CYCLES_RECEIVABLE: u32 = 100; // Maximum number of cycles that can be received at once

    /// DripsConfig represents a single stream configuration
    /// - receiver: The address that will receive the streamed funds
    /// - amt_per_sec: The amount of funds to stream per second (as a fixed-point number)
    /// - start_cycle: The cycle from which the stream starts
    /// - duration: How long the stream will last in seconds
    struct DripsConfig has store, drop, copy {
        receiver: address,
        amt_per_sec: u128,
        start_cycle: u64,
        duration: u64,
    }

    /// DripsHub is the main resource that stores all drips configurations and balances
    /// - balances: A table mapping addresses to their balances
    /// - drips_configs: A vector of all active stream configurations
    /// - splits_receivers: A vector of all configured split receivers
    /// - last_collected_cycle: The last cycle when funds were collected
    struct DripsHub has key {
        balances: Table<address, u64>,
        drips_configs: vector<DripsConfig>,
        splits_receivers: vector<SplitsReceiver>,
        last_collected_cycle: Table<address, u64>,
    }

    /// StreamReceivable represents the amount receivable from a stream
    /// - sender: The address of the sender of the stream
    /// - amt_per_sec: The amount streamed per second
    /// - start_cycle: The cycle when the stream started
    /// - end_cycle: The cycle when the stream ends
    struct StreamReceivable has store, drop, copy {
        sender: address,
        amt_per_sec: u128,
        start_cycle: u64,
        end_cycle: u64,
    }

    /// Events
    /// Emitted when a new DripsHub is created
    struct DripsHubCreatedEvent has drop, store {
        owner: address,
        timestamp: u64,
    }

    /// Emitted when a stream is configured
    struct StreamConfiguredEvent has drop, store {
        sender: address,
        receiver: address,
        amt_per_sec: u128,
        start_cycle: u64,
        duration: u64,
        timestamp: u64,
    }

    /// Emitted when funds are collected
    struct FundsCollectedEvent has drop, store {
        receiver: address,
        amount: u64,
        timestamp: u64,
    }

    /// Emitted when funds are deposited
    struct FundsDepositedEvent has drop, store {
        account: address,
        amount: u64,
        timestamp: u64,
    }

    /// Emitted when funds are withdrawn
    struct FundsWithdrawnEvent has drop, store {
        account: address,
        amount: u64,
        timestamp: u64,
    }

    /// Emitted when a stream is updated
    struct StreamUpdatedEvent has drop, store {
        sender: address,
        old_configs_count: u64,
        new_configs_count: u64,
        timestamp: u64,
    }

    /// Emitted when a stream ends
    struct StreamEndedEvent has drop, store {
        sender: address,
        receiver: address,
        end_cycle: u64,
        timestamp: u64,
    }

    /// Emitted when the last collected cycle is updated
    struct LastCollectedCycleUpdatedEvent has drop, store {
        account: address,
        old_cycle: u64,
        new_cycle: u64,
        timestamp: u64,
    }

    /// Initialize a new DripsHub for the sender
    /// This function creates a new DripsHub resource and stores it in the sender's account
    /// It can only be called once per account
    public fun initialize(sender: &signer) {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the DripsHub doesn't already exist for this account
        error_handling::validate_resource_not_exists<DripsHub>(
            exists<DripsHub>(sender_addr), 
            CATEGORY, 
            E_HUB_ALREADY_EXISTS
        );

        // Create a new DripsHub with empty balances, configs, and receivers
        let drips_hub = DripsHub {
            balances: table::new(),
            drips_configs: vector::empty(),
            splits_receivers: vector::empty(),
            last_collected_cycle: table::new(),
        };

        // Move the DripsHub resource to the sender's account
        move_to(sender, drips_hub);

        // Emit event for DripsHub creation
        event::emit(DripsHubCreatedEvent {
            owner: sender_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Add funds to a user's balance
    /// This function withdraws coins from the sender's account and adds them to their DripsHub balance
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - amount: The amount of coins to add to the balance
    public fun top_up<CoinType>(sender: &signer, amount: u64) acquires DripsHub {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the DripsHub exists for this account
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(sender_addr),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        
        // Ensure the amount is valid
        error_handling::validate_amount(amount, CATEGORY, E_INVALID_AMOUNT);

        // Withdraw coins from the sender's account
        let coin = coin::withdraw<CoinType>(sender, amount);
        
        // Get a mutable reference to the DripsHub
        let drips_hub = borrow_global_mut<DripsHub>(sender_addr);

        // Update the balance in the DripsHub
        let current_balance = if (table::contains(&drips_hub.balances, sender_addr)) {
            *table::borrow(&drips_hub.balances, sender_addr)
        } else {
            0
        };

        let new_balance = current_balance + amount;
        table::upsert(&mut drips_hub.balances, sender_addr, new_balance);

        // In a real implementation, we would store the coins in a module account
        // For now, we'll just destroy the coins as a placeholder
        coin::destroy_zero(coin);
        
        // Emit event for funds deposit
        event::emit(FundsDepositedEvent {
            account: sender_addr,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Withdraw funds from a user's balance
    /// This function removes funds from the user's DripsHub balance and transfers them to their account
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - amount: The amount of coins to withdraw
    public fun withdraw<CoinType>(sender: &signer, amount: u64) acquires DripsHub {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the DripsHub exists for this account
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(sender_addr),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        
        let drips_hub = borrow_global_mut<DripsHub>(sender_addr);
        
        // Ensure the account has a balance entry
        error_handling::assert_with_error(
            table::contains(&drips_hub.balances, sender_addr),
            CATEGORY,
            E_INSUFFICIENT_BALANCE
        );
        
        // Ensure the account has sufficient balance
        let current_balance = *table::borrow(&drips_hub.balances, sender_addr);
        error_handling::assert_with_error(
            current_balance >= amount,
            CATEGORY,
            E_INSUFFICIENT_BALANCE
        );
        
        // Update the balance in the DripsHub
        let new_balance = current_balance - amount;
        table::upsert(&mut drips_hub.balances, sender_addr, new_balance);
        
        // In a real implementation, we would create and transfer coins to the sender
        // For now, we'll just create and destroy a zero coin as a placeholder
        let coin = coin::zero<CoinType>();
        coin::destroy_zero(coin);
        
        // Emit event for funds withdrawal
        event::emit(FundsWithdrawnEvent {
            account: sender_addr,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Get the current cycle based on the current timestamp
    public fun current_cycle(): u64 {
        timestamp::now_seconds() / SECONDS_PER_CYCLE
    }

    /// Validate a vector of DripsConfig
    /// This function checks that:
    /// - All receivers have a positive amt_per_sec
    /// - All receivers have a positive duration
    /// - No receiver is the sender
    /// - Receivers are sorted by address
    /// - There are no duplicate receivers
    fun validate_configs(sender_addr: address, configs: &vector<DripsConfig>) {
        let i = 0;
        let len = vector::length(configs);
        
        // If the vector is empty, there's nothing to validate
        if (len == 0) {
            return
        };
        
        // Check the first config
        let config = vector::borrow(configs, 0);
        error_handling::assert_with_error(config.amt_per_sec > 0, CATEGORY, E_INVALID_AMT_PER_SEC);
        error_handling::assert_with_error(config.duration > 0, CATEGORY, E_INVALID_DURATION);
        error_handling::assert_with_error(config.receiver != sender_addr, CATEGORY, E_INVALID_RECEIVER);
        
        // Check the rest of the configs
        i = 1;
        while (i < len) {
            let prev_config = vector::borrow(configs, i - 1);
            let curr_config = vector::borrow(configs, i);
            
            // Validate the current config
            error_handling::assert_with_error(curr_config.amt_per_sec > 0, CATEGORY, E_INVALID_AMT_PER_SEC);
            error_handling::assert_with_error(curr_config.duration > 0, CATEGORY, E_INVALID_DURATION);
            error_handling::assert_with_error(curr_config.receiver != sender_addr, CATEGORY, E_INVALID_RECEIVER);
            
            // Check that receivers are sorted and there are no duplicates
            error_handling::assert_with_error(prev_config.receiver < curr_config.receiver, CATEGORY, E_RECEIVERS_NOT_SORTED);
            
            i = i + 1;
        };
    }

    /// Calculate the total amount that will be streamed by a set of configs
    fun calculate_total_streamed(configs: &vector<DripsConfig>): u128 {
        let total: u128 = 0;
        let i = 0;
        let len = vector::length(configs);
        
        while (i < len) {
            let config = vector::borrow(configs, i);
            let stream_amount = config.amt_per_sec * (config.duration as u128);
            total = total + stream_amount;
            i = i + 1;
        };
        
        total
    }

    /// Configure streaming receivers
    /// This function updates the stream configurations for the sender
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - receivers: A vector of DripsConfig specifying the stream receivers
    /// - balance_delta: The change in balance required for the new configuration
    public fun set_streams<CoinType>(
        sender: &signer, 
        receivers: vector<DripsConfig>,
        balance_delta: u128
    ) acquires DripsHub {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the DripsHub exists for this account
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(sender_addr),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        
        // Validate the receivers
        validate_configs(sender_addr, &receivers);
        
        // Get the current cycle
        let current_cycle_val = current_cycle();
        
        // Set the start cycle for all configs to the current cycle if not specified
        let i = 0;
        let len = vector::length(&receivers);
        let mut_receivers = &mut receivers;
        
        while (i < len) {
            let config = vector::borrow_mut(mut_receivers, i);
            if (config.start_cycle == 0) {
                config.start_cycle = current_cycle_val;
            };
            i = i + 1;
        };
        
        // Calculate the total amount that will be streamed
        let total_streamed = calculate_total_streamed(&receivers);
        
        // Ensure the balance delta is sufficient
        if (balance_delta > 0) {
            error_handling::assert_with_error(
                (balance_delta as u128) >= total_streamed,
                CATEGORY,
                E_INVALID_BALANCE_DELTA
            );
        };
        
        // Get a mutable reference to the DripsHub
        let drips_hub = borrow_global_mut<DripsHub>(sender_addr);
        
        // Get the old configs count for the event
        let old_configs_count = vector::length(&drips_hub.drips_configs);
        
        // Update the drips_configs
        drips_hub.drips_configs = receivers;
        
        // Emit stream updated event
        event::emit(StreamUpdatedEvent {
            sender: sender_addr,
            old_configs_count,
            new_configs_count: len,
            timestamp: timestamp::now_seconds(),
        });
        
        // Emit events for each stream
        i = 0;
        while (i < len) {
            let config = vector::borrow(&receivers, i);
            event::emit(StreamConfiguredEvent {
                sender: sender_addr,
                receiver: config.receiver,
                amt_per_sec: config.amt_per_sec,
                start_cycle: config.start_cycle,
                duration: config.duration,
                timestamp: timestamp::now_seconds(),
            });
            i = i + 1;
        };
    }

    /// Calculate the amount that has been streamed to a receiver
    /// This function calculates the amount streamed from a specific configuration
    /// Parameters:
    /// - config: The DripsConfig to calculate from
    /// - current_cycle_val: The current cycle
    /// - max_cycle: The maximum cycle to calculate up to
    /// Returns: The amount streamed
    fun calculate_streamed_amount(
        config: &DripsConfig,
        current_cycle_val: u64,
        max_cycle: u64
    ): u128 {
        // If the stream hasn't started yet, return 0
        if (current_cycle_val < config.start_cycle) {
            return 0
        };
        
        // Calculate the end cycle of the stream
        let stream_cycles = config.duration / SECONDS_PER_CYCLE;
        if (config.duration % SECONDS_PER_CYCLE > 0) {
            stream_cycles = stream_cycles + 1;
        };
        let end_cycle = config.start_cycle + stream_cycles;
        
        // Cap the calculation at max_cycle
        let calc_end_cycle = if (end_cycle > max_cycle) { max_cycle } else { end_cycle };
        
        // If the stream has ended before the current cycle, return 0
        if (calc_end_cycle <= current_cycle_val) {
            // Calculate the total amount streamed
            let total_seconds = config.duration;
            return config.amt_per_sec * (total_seconds as u128)
        };
        
        // Calculate how many cycles have passed since the stream started
        let cycles_passed = current_cycle_val - config.start_cycle;
        
        // Calculate the amount streamed so far
        let seconds_passed = cycles_passed * SECONDS_PER_CYCLE;
        if (seconds_passed > config.duration) {
            seconds_passed = config.duration;
        };
        
        config.amt_per_sec * (seconds_passed as u128)
    }

    /// Find all streams directed to a specific receiver
    /// This function scans all DripsHubs to find streams directed to the receiver
    /// Parameters:
    /// - receiver: The address of the receiver
    /// - max_cycles: The maximum number of cycles to collect for
    /// Returns: A vector of StreamReceivable
    fun find_receivable_streams(
        receiver: address,
        max_cycles: u32
    ): vector<StreamReceivable> acquires DripsHub {
        let receivable_streams = vector::empty<StreamReceivable>();
        let current_cycle_val = current_cycle();
        
        // In a real implementation, we would iterate through all accounts with DripsHubs
        // For now, we'll just check if the receiver has a DripsHub and use that
        if (exists<DripsHub>(receiver)) {
            let drips_hub = borrow_global<DripsHub>(receiver);
            let configs = &drips_hub.drips_configs;
            let i = 0;
            let len = vector::length(configs);
            
            while (i < len) {
                let config = vector::borrow(configs, i);
                if (config.receiver == receiver) {
                    // Calculate the end cycle of the stream
                    let stream_cycles = config.duration / SECONDS_PER_CYCLE;
                    if (config.duration % SECONDS_PER_CYCLE > 0) {
                        stream_cycles = stream_cycles + 1;
                    };
                    let end_cycle = config.start_cycle + stream_cycles;
                    
                    // Create a StreamReceivable
                    let stream_receivable = StreamReceivable {
                        sender: receiver, // In this case, the sender is the same as the receiver
                        amt_per_sec: config.amt_per_sec,
                        start_cycle: config.start_cycle,
                        end_cycle,
                    };
                    
                    vector::push_back(&mut receivable_streams, stream_receivable);
                    
                    // Check if the stream has ended and emit an event if it has
                    if (end_cycle <= current_cycle_val) {
                        event::emit(StreamEndedEvent {
                            sender: receiver,
                            receiver: config.receiver,
                            end_cycle,
                            timestamp: timestamp::now_seconds(),
                        });
                    };
                };
                i = i + 1;
            };
        };
        
        receivable_streams
    }

    /// Collect streamed funds
    /// This function calculates and collects funds that have been streamed to the account
    /// Parameters:
    /// - account_id: The address of the account to collect funds for
    /// - max_cycles: The maximum number of cycles to collect for
    public fun receive_streams<CoinType>(account_id: address, max_cycles: u32): u128 acquires DripsHub {
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(account_id),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        error_handling::assert_with_error(
            max_cycles <= MAX_CYCLES_RECEIVABLE,
            CATEGORY,
            E_MAX_CYCLES_EXCEEDED
        );
        
        // Get the current cycle
        let current_cycle_val = current_cycle();
        
        // Get the last collected cycle for this account
        let drips_hub = borrow_global_mut<DripsHub>(account_id);
        let last_cycle = if (table::contains(&drips_hub.last_collected_cycle, account_id)) {
            *table::borrow(&drips_hub.last_collected_cycle, account_id)
        } else {
            0
        };
        
        // Calculate the maximum cycle to collect up to
        let max_cycle = if (max_cycles == 0) {
            current_cycle_val
        } else {
            last_cycle + (max_cycles as u64)
        };
        
        if (max_cycle > current_cycle_val) {
            max_cycle = current_cycle_val;
        };
        
        // Find all streams directed to this account
        let receivable_streams = find_receivable_streams(account_id, max_cycles);
        
        // Calculate the total receivable amount
        let receivable_amount: u128 = 0;
        let i = 0;
        let len = vector::length(&receivable_streams);
        
        while (i < len) {
            let stream = vector::borrow(&receivable_streams, i);
            
            // Calculate the amount receivable from this stream
            let stream_amount = calculate_streamed_amount(
                &DripsConfig {
                    receiver: account_id,
                    amt_per_sec: stream.amt_per_sec,
                    start_cycle: stream.start_cycle,
                    duration: (stream.end_cycle - stream.start_cycle) * SECONDS_PER_CYCLE,
                },
                current_cycle_val,
                max_cycle
            );
            
            receivable_amount = receivable_amount + stream_amount;
            i = i + 1;
        };
        
        // Emit event for last collected cycle update
        event::emit(LastCollectedCycleUpdatedEvent {
            account: account_id,
            old_cycle: last_cycle,
            new_cycle: max_cycle,
            timestamp: timestamp::now_seconds(),
        });
        
        // Update the last collected cycle
        table::upsert(&mut drips_hub.last_collected_cycle, account_id, max_cycle);
        
        // Update the account's balance
        let current_balance = if (table::contains(&drips_hub.balances, account_id)) {
            *table::borrow(&drips_hub.balances, account_id)
        } else {
            0
        };
        
        let new_balance = current_balance + (receivable_amount as u64);
        table::upsert(&mut drips_hub.balances, account_id, new_balance);
        
        // Emit event for funds collection
        event::emit(FundsCollectedEvent {
            receiver: account_id,
            amount: (receivable_amount as u64),
            timestamp: timestamp::now_seconds(),
        });
        
        receivable_amount
    }

    /// Collect funds
    /// This function collects all available funds for the sender
    /// Parameters:
    /// - sender: The signer of the transaction
    public fun collect<CoinType>(sender: &signer): u128 acquires DripsHub {
        let sender_addr = signer::address_of(sender);
        
        // Calculate and collect streamed funds
        let streamed_amount = receive_streams<CoinType>(sender_addr, 0);
        
        // Add the collected funds to the splittable balance in the Splits module
        if (streamed_amount > 0 && splits::exists_store(sender_addr)) {
            splits::add_splittable<CoinType>(sender_addr, streamed_amount);
        };
        
        streamed_amount
    }
    
    /// Collect funds for a specific account
    /// This function is used by drivers to collect funds for accounts they manage
    /// Parameters:
    /// - account_id: The address of the account to collect funds for
    public fun collect_for_account<CoinType>(account_id: address): u128 acquires DripsHub {
        // Calculate and collect streamed funds
        let streamed_amount = receive_streams<CoinType>(account_id, 0);
        
        // Add the collected funds to the splittable balance in the Splits module
        if (streamed_amount > 0 && splits::exists_store(account_id)) {
            splits::add_splittable<CoinType>(account_id, streamed_amount);
        };
        
        streamed_amount
    }

    /// Check if a DripsHub exists for an account
    public fun exists_hub(account: address): bool {
        exists<DripsHub>(account)
    }

    /// Get the balance for an account
    public fun get_balance(account: address): u64 acquires DripsHub {
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(account),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        
        let drips_hub = borrow_global<DripsHub>(account);
        
        if (table::contains(&drips_hub.balances, account)) {
            *table::borrow(&drips_hub.balances, account)
        } else {
            0
        }
    }

    /// Get the stream configurations for an account
    public fun get_streams(account: address): vector<DripsConfig> acquires DripsHub {
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(account),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        
        let drips_hub = borrow_global<DripsHub>(account);
        drips_hub.drips_configs
    }

    /// Check if an account is streaming to a specific receiver
    public fun is_streaming_to(account: address, receiver: address): bool acquires DripsHub {
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(account),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        
        let drips_hub = borrow_global<DripsHub>(account);
        let configs = &drips_hub.drips_configs;
        
        let i = 0;
        let len = vector::length(configs);
        
        while (i < len) {
            let config = vector::borrow(configs, i);
            if (config.receiver == receiver) {
                return true
            };
            i = i + 1;
        };
        
        false
    }

    /// Get the last collected cycle for an account
    public fun get_last_collected_cycle(account: address): u64 acquires DripsHub {
        error_handling::validate_resource_exists<DripsHub>(
            exists<DripsHub>(account),
            CATEGORY,
            E_HUB_NOT_FOUND
        );
        
        let drips_hub = borrow_global<DripsHub>(account);
        
        if (table::contains(&drips_hub.last_collected_cycle, account)) {
            *table::borrow(&drips_hub.last_collected_cycle, account)
        } else {
            0
        }
    }
}