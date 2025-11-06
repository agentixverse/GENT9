module xylkit::address_driver {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::table::{Self, Table};
    use aptos_framework::timestamp;
    use xylkit::drips::{Self, DripsConfig};
    use xylkit::splits::{Self, SplitsReceiver};
    use xylkit::error_handling;

    /// Error codes - using standardized error codes from error_handling module
    const CATEGORY: u8 = error_handling::CATEGORY_ADDRESS_DRIVER;
    
    // Redefining local error codes for backward compatibility
    const E_UNAUTHORIZED: u64 = error_handling::E_ADDRESS_UNAUTHORIZED;
    const E_INVALID_AMOUNT: u64 = error_handling::E_ADDRESS_INVALID_AMOUNT;
    const E_INVALID_RECEIVER: u64 = error_handling::E_ADDRESS_INVALID_RECEIVER;
    const E_DRIVER_ALREADY_EXISTS: u64 = error_handling::E_ADDRESS_DRIVER_ALREADY_EXISTS;
    const E_DRIVER_NOT_FOUND: u64 = error_handling::E_ADDRESS_DRIVER_NOT_FOUND;
    const E_ACCOUNT_ID_ALREADY_REGISTERED: u64 = error_handling::E_ADDRESS_ACCOUNT_ID_ALREADY_REGISTERED;
    const E_ADDRESS_NOT_REGISTERED: u64 = error_handling::E_ADDRESS_NOT_REGISTERED;

    /// AddressDriver maps addresses to account IDs
    struct AddressDriver has key {
        account_id: address,
        // Event handles
        created_events: EventHandle<AddressDriverCreatedEvent>,
        funds_collected_events: EventHandle<FundsCollectedEvent>,
        funds_given_events: EventHandle<FundsGivenEvent>,
        streams_configured_events: EventHandle<StreamsConfiguredEvent>,
        splits_configured_events: EventHandle<SplitsConfiguredEvent>,
    }

    /// AddressDriverAdmin stores global state for the AddressDriver module
    struct AddressDriverAdmin has key {
        // Maps account_id to owner address
        account_id_to_address: Table<address, address>,
        // Counter for generating unique account IDs
        next_account_id: u64,
    }

    /// Events
    #[event]
    struct AddressDriverCreatedEvent has drop, store {
        owner: address,
        account_id: address,
    }

    #[event]
    struct FundsCollectedEvent has drop, store {
        collector: address,
        receiver: address,
        amount: u128,
    }

    #[event]
    struct FundsGivenEvent has drop, store {
        sender: address,
        receiver: address,
        amount: u128,
    }
    
    #[event]
    struct StreamsConfiguredEvent has drop, store {
        sender: address,
        account_id: address,
        receivers_count: u64,
        balance_delta: u128,
        timestamp: u64,
    }
    
    #[event]
    struct SplitsConfiguredEvent has drop, store {
        sender: address,
        account_id: address,
        receivers_count: u64,
        timestamp: u64,
    }

    /// Initialize the AddressDriverAdmin resource
    /// This should be called once by the module deployer
    #[test_only]
    public fun init_module(sender: &signer) {
        let sender_addr = signer::address_of(sender);
        
        // Ensure this is called by the module account
        error_handling::validate_authorization(
            sender_addr == @xylkit,
            CATEGORY,
            E_UNAUTHORIZED
        );
        
        // Create the AddressDriverAdmin resource
        let admin = AddressDriverAdmin {
            account_id_to_address: table::new<address, address>(),
            next_account_id: 1, // Start from 1
        };
        
        move_to(sender, admin);
    }

    /// Generate a unique account ID for a new AddressDriver
    /// This function creates a deterministic but unique account ID based on the address
    fun generate_account_id(addr: address): address acquires AddressDriverAdmin {
        // Ensure the AddressDriverAdmin exists
        error_handling::validate_resource_exists<AddressDriverAdmin>(
            exists<AddressDriverAdmin>(@xylkit),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        let admin = borrow_global_mut<AddressDriverAdmin>(@xylkit);
        
        // Create a unique account ID by combining the module address with a counter
        let account_id_bytes = addr;
        
        // Ensure this account ID is not already registered
        error_handling::assert_with_error(
            !table::contains(&admin.account_id_to_address, account_id_bytes),
            CATEGORY,
            E_ACCOUNT_ID_ALREADY_REGISTERED
        );
        
        // Register the account ID
        table::add(&mut admin.account_id_to_address, account_id_bytes, addr);
        
        // Increment the counter
        admin.next_account_id = admin.next_account_id + 1;
        
        account_id_bytes
    }

    /// Initialize a new AddressDriver for the sender
    public fun initialize(sender: &signer) {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the sender doesn't already have an AddressDriver
        error_handling::validate_resource_not_exists<AddressDriver>(
            exists<AddressDriver>(sender_addr),
            CATEGORY,
            E_DRIVER_ALREADY_EXISTS
        );
        
        // Generate a unique account ID for this address
        let account_id = generate_account_id(sender_addr);
        
        // Create the AddressDriver resource with event handles
        let address_driver = AddressDriver {
            account_id,
            created_events: event::new_event_handle<AddressDriverCreatedEvent>(sender),
            funds_collected_events: event::new_event_handle<FundsCollectedEvent>(sender),
            funds_given_events: event::new_event_handle<FundsGivenEvent>(sender),
            streams_configured_events: event::new_event_handle<StreamsConfiguredEvent>(sender),
            splits_configured_events: event::new_event_handle<SplitsConfiguredEvent>(sender),
        };
        
        move_to(sender, address_driver);
        
        // Initialize the DripsHub for this address
        drips::initialize(sender);
        
        // Initialize the SplitsStore for this address
        splits::initialize(sender);
        
        // Emit event using both methods for compatibility
        // 1. Using the global event::emit function (new style with #[event] attribute)
        event::emit(AddressDriverCreatedEvent {
            owner: sender_addr,
            account_id,
        });
        
        // 2. Using the event handle (traditional style)
        let driver_ref = borrow_global_mut<AddressDriver>(sender_addr);
        event::emit_event(&mut driver_ref.created_events, AddressDriverCreatedEvent {
            owner: sender_addr,
            account_id,
        });
    }

    /// Collect funds to an address
    /// This function collects funds from both drips and splits and transfers them to the specified address
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - transfer_to: The address to transfer the collected funds to
    /// Returns: The total amount of funds collected
    public fun collect<CoinType>(sender: &signer, transfer_to: address): u128 acquires AddressDriver {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the sender has a driver
        error_handling::validate_resource_exists<AddressDriver>(
            exists<AddressDriver>(sender_addr),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        // Get the sender's account ID
        let account_id = get_account_id(sender_addr);
        
        // Collect funds from drips
        let drips_amount = drips::collect<CoinType>(sender);
        
        // Collect funds from splits and transfer them directly to the specified address
        let splits_amount = if (sender_addr == transfer_to) {
            // If transferring to self, use the regular collect function
            splits::collect<CoinType>(sender)
        } else {
            // If transferring to another address, use the collect_to function
            splits::collect_to<CoinType>(sender, transfer_to)
        };
        
        let total_amount = drips_amount + splits_amount;
        
        // If the transfer_to address is different from the sender, we need to transfer the drips funds
        if (sender_addr != transfer_to && drips_amount > 0) {
            // Convert from u128 to u64 for coin operations
            let amount_u64 = (drips_amount as u64);
            
            // Register the recipient for the coin type if not already registered
            if (!coin::is_account_registered<CoinType>(transfer_to)) {
                // We can't register the recipient's account directly if they're not the sender
                // In a real implementation, we might want to handle this differently
                // For now, we'll just check if they're already registered
                assert!(coin::is_account_registered<CoinType>(transfer_to), E_INVALID_RECEIVER);
            };
            
            // Withdraw the coins from the sender's account
            let coins = coin::withdraw<CoinType>(sender, amount_u64);
            
            // Deposit the coins to the recipient's account
            coin::deposit<CoinType>(transfer_to, coins);
        };
        
        // Create the event data
        let event_data = FundsCollectedEvent {
            collector: sender_addr,
            receiver: transfer_to,
            amount: total_amount,
        };
        
        // Emit event using both methods for compatibility
        // 1. Using the global event::emit function (new style with #[event] attribute)
        event::emit(event_data);
        
        // 2. Using the event handle (traditional style)
        let driver_ref = borrow_global_mut<AddressDriver>(sender_addr);
        event::emit_event(&mut driver_ref.funds_collected_events, event_data);
        
        total_amount
    }

    /// Give funds to another account
    /// This function transfers funds directly from the sender to another account
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - receiver: The address of the receiver
    /// - amount: The amount of funds to transfer
    public fun give<CoinType>(sender: &signer, receiver: address, amount: u128) acquires AddressDriver {
        let sender_addr = signer::address_of(sender);
        
        // Validate inputs
        error_handling::assert_with_error(amount > 0, CATEGORY, E_INVALID_AMOUNT);
        error_handling::assert_with_error(receiver != sender_addr, CATEGORY, E_INVALID_RECEIVER);
        
        // Ensure the sender has a driver
        error_handling::validate_resource_exists<AddressDriver>(
            exists<AddressDriver>(sender_addr),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        // Get the sender's account ID
        let sender_account_id = get_account_id(sender_addr);
        
        // Check if the receiver has a driver
        let receiver_account_id = if (has_driver(receiver)) {
            get_account_id(receiver)
        } else {
            // If the receiver doesn't have a driver, use their address as the account ID
            receiver
        };
        
        // Convert from u128 to u64 for coin operations
        let amount_u64 = (amount as u64);
        
        // Ensure the sender has enough balance
        assert!(coin::balance<CoinType>(sender_addr) >= amount_u64, E_INVALID_AMOUNT);
        
        // Register the receiver for the coin type if not already registered
        if (!coin::is_account_registered<CoinType>(receiver)) {
            // We can't register the recipient's account directly if they're not the sender
            // In a real implementation, we might want to handle this differently
            // For now, we'll just check if they're already registered
            assert!(coin::is_account_registered<CoinType>(receiver), E_INVALID_RECEIVER);
        };
        
        // Withdraw the coins from the sender's account
        let coins = coin::withdraw<CoinType>(sender, amount_u64);
        
        // Deposit the coins to the receiver's account
        coin::deposit<CoinType>(receiver, coins);
        
        // If the receiver has a driver, add the funds to their splittable balance
        if (has_driver(receiver)) {
            // Add the funds to the receiver's splittable balance
            splits::add_splittable<CoinType>(receiver_account_id, amount);
        };
        
        // Create the event data
        let event_data = FundsGivenEvent {
            sender: sender_addr,
            receiver: receiver,
            amount: amount,
        };
        
        // Emit event using both methods for compatibility
        // 1. Using the global event::emit function (new style with #[event] attribute)
        event::emit(event_data);
        
        // 2. Using the event handle (traditional style)
        let driver_ref = borrow_global_mut<AddressDriver>(sender_addr);
        event::emit_event(&mut driver_ref.funds_given_events, event_data);
    }

    /// Configure streams for an address
    /// This function updates the stream configurations for the sender
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - curr_receivers: The current stream configurations
    /// - balance_delta: The change in balance required for the new configuration
    /// - new_receivers: The new stream configurations
    /// - transfer_to: The address to transfer any excess funds to
    /// Returns: The actual balance delta applied
    public fun set_streams<CoinType>(
        sender: &signer,
        curr_receivers: vector<DripsConfig>,
        balance_delta: u128,
        new_receivers: vector<DripsConfig>,
        transfer_to: address
    ): u128 acquires AddressDriver {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the sender has a driver
        error_handling::validate_resource_exists<AddressDriver>(
            exists<AddressDriver>(sender_addr),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        // Get the sender's account ID
        let account_id = get_account_id(sender_addr);
        
        // Verify authorization
        verify_authorization(sender, account_id);
        
        // If the balance delta is positive, we need to add funds
        if (balance_delta > 0) {
            // Convert from u128 to u64 for coin operations
            let amount_u64 = (balance_delta as u64);
            
            // Ensure the sender has enough balance
            assert!(coin::balance<CoinType>(sender_addr) >= amount_u64, E_INVALID_AMOUNT);
            
            // Withdraw the coins from the sender's account
            let coins = coin::withdraw<CoinType>(sender, amount_u64);
            
            // Deposit the coins to the module account (simplified)
            // In a real implementation, we would store the coins in a module account
            coin::destroy_zero(coins);
        };
        
        // Update streams configuration
        drips::set_streams<CoinType>(sender, new_receivers, (balance_delta as u128));
        
        // If the balance delta is negative, we need to return funds
        if (balance_delta < 0 && transfer_to != @0x0) {
            // Convert from u128 to u64 for coin operations
            let amount_u64 = ((-balance_delta) as u64);
            
            // Register the recipient for the coin type if not already registered
            if (!coin::is_account_registered<CoinType>(transfer_to)) {
                // We can't register the recipient's account directly if they're not the sender
                // In a real implementation, we might want to handle this differently
                // For now, we'll just check if they're already registered
                assert!(coin::is_account_registered<CoinType>(transfer_to), E_INVALID_RECEIVER);
            };
            
            // Create the coins and deposit them to the recipient's account
            // In a real implementation, we would withdraw from the module account
            let coins = coin::withdraw<CoinType>(@xylkit, amount_u64);
            coin::deposit<CoinType>(transfer_to, coins);
        };
        
        // Create the event data
        let event_data = StreamsConfiguredEvent {
            sender: sender_addr,
            account_id,
            receivers_count: vector::length(&new_receivers),
            balance_delta,
            timestamp: timestamp::now_seconds(),
        };
        
        // Emit event using both methods for compatibility
        // 1. Using the global event::emit function (new style with #[event] attribute)
        event::emit(event_data);
        
        // 2. Using the event handle (traditional style)
        let driver_ref = borrow_global_mut<AddressDriver>(sender_addr);
        event::emit_event(&mut driver_ref.streams_configured_events, event_data);
        
        balance_delta
    }

    /// Configure splits for an address
    /// This function updates the splits configuration for the sender
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - receivers: A vector of SplitsReceiver specifying the split receivers
    public fun set_splits(sender: &signer, receivers: vector<SplitsReceiver>) acquires AddressDriver {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the sender has a driver
        error_handling::validate_resource_exists<AddressDriver>(
            exists<AddressDriver>(sender_addr),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        // Get the sender's account ID
        let account_id = get_account_id(sender_addr);
        
        // Verify authorization
        verify_authorization(sender, account_id);
        
        // Validate the receivers
        // This is done in the splits module, but we could add additional validation here if needed
        
        // Update splits configuration
        splits::set_splits(sender, receivers);
        
        // Create the event data
        let event_data = SplitsConfiguredEvent {
            sender: sender_addr,
            account_id,
            receivers_count: vector::length(&receivers),
            timestamp: timestamp::now_seconds(),
        };
        
        // Emit event using both methods for compatibility
        // 1. Using the global event::emit function (new style with #[event] attribute)
        event::emit(event_data);
        
        // 2. Using the event handle (traditional style)
        let driver_ref = borrow_global_mut<AddressDriver>(sender_addr);
        event::emit_event(&mut driver_ref.splits_configured_events, event_data);
    }

    /// Get the account ID for an address
    /// This function returns the account ID associated with an address
    public fun get_account_id(addr: address): address acquires AddressDriver {
        error_handling::validate_resource_exists<AddressDriver>(
            exists<AddressDriver>(addr),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        let driver = borrow_global<AddressDriver>(addr);
        driver.account_id
    }

    /// Check if an address has a driver
    /// This function returns true if the address has an AddressDriver
    public fun has_driver(addr: address): bool {
        exists<AddressDriver>(addr)
    }

    /// Get the address for an account ID
    /// This function returns the address associated with an account ID
    public fun get_address_by_account_id(account_id: address): address acquires AddressDriverAdmin {
        error_handling::validate_resource_exists<AddressDriverAdmin>(
            exists<AddressDriverAdmin>(@xylkit),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        let admin = borrow_global<AddressDriverAdmin>(@xylkit);
        error_handling::assert_with_error(
            table::contains(&admin.account_id_to_address, account_id),
            CATEGORY,
            E_ADDRESS_NOT_REGISTERED
        );
        
        *table::borrow(&admin.account_id_to_address, account_id)
    }

    /// Verify authorization for an operation
    /// This function checks if the sender is authorized to perform operations for a specific account ID
    public fun verify_authorization(sender: &signer, account_id: address) acquires AddressDriver {
        let sender_addr = signer::address_of(sender);
        
        // Ensure the sender has a driver
        error_handling::validate_resource_exists<AddressDriver>(
            exists<AddressDriver>(sender_addr),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        // Get the sender's account ID
        let driver = borrow_global<AddressDriver>(sender_addr);
        
        // Ensure the sender's account ID matches the requested account ID
        error_handling::validate_authorization(
            driver.account_id == account_id,
            CATEGORY,
            E_UNAUTHORIZED
        );
    }

    /// Get the next available account ID
    /// This function returns the next account ID that will be assigned
    public fun get_next_account_id(): u64 acquires AddressDriverAdmin {
        error_handling::validate_resource_exists<AddressDriverAdmin>(
            exists<AddressDriverAdmin>(@xylkit),
            CATEGORY,
            E_DRIVER_NOT_FOUND
        );
        
        let admin = borrow_global<AddressDriverAdmin>(@xylkit);
        admin.next_account_id
    }

    /// Check if an account ID is registered
    /// This function returns true if the account ID is registered
    public fun is_account_id_registered(account_id: address): bool acquires AddressDriverAdmin {
        if (!exists<AddressDriverAdmin>(@xylkit)) {
            return false
        };
        
        let admin = borrow_global<AddressDriverAdmin>(@xylkit);
        table::contains(&admin.account_id_to_address, account_id)
    }
}