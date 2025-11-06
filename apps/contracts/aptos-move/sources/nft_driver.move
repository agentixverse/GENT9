module xylkit::nft_driver {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use aptos_framework::object::{Self, Object, ConstructorRef};
    use aptos_framework::table::{Self, Table};
    use aptos_framework::timestamp;
    use aptos_token_objects::token::{Self, Token, BurnRef, MutatorRef};
    use aptos_token_objects::collection;
    use xylkit::drips::{Self, DripsConfig};
    use xylkit::splits::{Self, SplitsReceiver};
    use xylkit::error_handling;

    /// Error codes - using standardized error codes from error_handling module
    const CATEGORY: u8 = error_handling::CATEGORY_NFT_DRIVER;
    
    // Redefining local error codes for backward compatibility
    const E_TOKEN_ALREADY_MINTED: u64 = error_handling::E_NFT_TOKEN_ALREADY_MINTED;
    const E_NOT_TOKEN_OWNER: u64 = error_handling::E_NFT_NOT_TOKEN_OWNER;
    const E_INVALID_TOKEN_ID: u64 = error_handling::E_NFT_INVALID_TOKEN_ID;
    const E_INVALID_AMOUNT: u64 = error_handling::E_NFT_INVALID_AMOUNT;
    const E_INVALID_RECEIVER: u64 = error_handling::E_NFT_INVALID_RECEIVER;
    const E_SALT_ALREADY_USED: u64 = error_handling::E_NFT_SALT_ALREADY_USED;
    const E_DRIVER_ALREADY_EXISTS: u64 = error_handling::E_NFT_DRIVER_ALREADY_EXISTS;
    const E_DRIVER_NOT_FOUND: u64 = error_handling::E_NFT_DRIVER_NOT_FOUND;
    const E_UNAUTHORIZED: u64 = error_handling::E_NFT_UNAUTHORIZED;
    const E_APPROVAL_ALREADY_EXISTS: u64 = error_handling::E_NFT_APPROVAL_ALREADY_EXISTS;
    const E_NO_APPROVAL_EXISTS: u64 = error_handling::E_NFT_NO_APPROVAL_EXISTS;
    const E_SELF_APPROVAL_NOT_NEEDED: u64 = error_handling::E_NFT_SELF_APPROVAL_NOT_NEEDED;
    const E_INVALID_METADATA_KEY: u64 = error_handling::E_NFT_INVALID_METADATA_KEY;
    const E_INVALID_METADATA_VALUE: u64 = error_handling::E_NFT_INVALID_METADATA_VALUE;
    const E_INVALID_URI: u64 = error_handling::E_NFT_INVALID_URI;
    const E_INVALID_DESCRIPTION: u64 = error_handling::E_NFT_INVALID_DESCRIPTION;
    const E_TOKEN_ALREADY_BURNED: u64 = error_handling::E_NFT_TOKEN_ALREADY_BURNED;
    const E_INSUFFICIENT_FUNDS: u64 = error_handling::E_NFT_INSUFFICIENT_FUNDS;
    const E_INVALID_BALANCE_DELTA: u64 = error_handling::E_NFT_INVALID_BALANCE_DELTA;
    const E_INVALID_TRANSFER_ADDRESS: u64 = error_handling::E_NFT_INVALID_TRANSFER_ADDRESS;

    /// Driver ID for the NFT Driver
    /// This is used to identify the driver when interacting with the Drips module
    const DRIVER_ID: u32 = 2; // Address driver is 1, NFT driver is 2

    /// Collection name and description for NFT Driver tokens
    const COLLECTION_NAME: vector<u8> = b"Drips NFT Driver";
    const COLLECTION_DESCRIPTION: vector<u8> = b"NFT tokens that control Drips accounts";
    const COLLECTION_URI: vector<u8> = b"https://drips.network/nft-driver";

    /// NFTDriverAdmin manages token minting and administration
    struct NFTDriverAdmin has key {
        minted_tokens: u64,
        salt_used: Table<address, Table<u64, bool>>,
        collection_address: address,
    }

    /// TokenData stores additional data for each token
    struct TokenData has key, store {
        token_id: u256,
        burn_ref: Option<BurnRef>,
        mutator_ref: Option<MutatorRef>,
        metadata: Table<String, vector<u8>>, // Custom metadata fields
    }

    /// Events
    struct NFTDriverInitializedEvent has drop, store {
        admin: address,
        collection_address: address,
        timestamp: u64,
    }

    struct TokenMintedEvent has drop, store {
        token_id: u256,
        token_address: address,
        owner: address,
        timestamp: u64,
    }

    struct TokenURISetEvent has drop, store {
        token_id: u256,
        token_address: address,
        uri: String,
        timestamp: u64,
    }

    struct TokenBurnedEvent has drop, store {
        token_id: u256,
        token_address: address,
        timestamp: u64,
    }
    
    struct FundsCollectedEvent has drop, store {
        token_id: u256,
        token_address: address,
        collector: address,
        receiver: address,
        amount: u128,
        timestamp: u64,
    }
    
    struct FundsGivenEvent has drop, store {
        token_id: u256,
        token_address: address,
        sender: address,
        receiver: u256,
        amount: u128,
        timestamp: u64,
    }
    
    struct StreamsConfiguredEvent has drop, store {
        token_id: u256,
        token_address: address,
        sender: address,
        receivers_count: u64,
        balance_delta: i128,
        timestamp: u64,
    }
    
    struct SplitsConfiguredEvent has drop, store {
        token_id: u256,
        token_address: address,
        sender: address,
        receivers_count: u64,
        timestamp: u64,
    }

    /// Initialize the NFT Driver module
    /// This function should be called once by the module deployer
    public fun initialize(sender: &signer) {
        let sender_addr = signer::address_of(sender);
        
        // Ensure this is only called once
        error_handling::validate_resource_not_exists<NFTDriverAdmin>(
            exists<NFTDriverAdmin>(sender_addr),
            CATEGORY,
            E_DRIVER_ALREADY_EXISTS
        );
        
        // Create the collection for NFT Driver tokens
        let collection_constructor_ref = &collection::create_unlimited_collection(
            sender,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(COLLECTION_URI),
        );
        
        let collection_signer = object::generate_signer(collection_constructor_ref);
        let collection_address = signer::address_of(&collection_signer);
        
        // Create the NFTDriverAdmin resource
        let nft_driver_admin = NFTDriverAdmin {
            minted_tokens: 0,
            salt_used: table::new(),
            collection_address,
        };
        
        // Move resources to the sender's account
        move_to(sender, nft_driver_admin);
        
        // Emit initialization event
        event::emit(NFTDriverInitializedEvent {
            admin: sender_addr,
            collection_address,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Calculate the next token ID
    /// Every token ID is a 256-bit integer constructed by concatenating:
    /// `driverId (32 bits) | zeros (160 bits) | mintedTokensCounter (64 bits)`
    public fun next_token_id(): u256 acquires NFTDriverAdmin {
        let admin = borrow_global<NFTDriverAdmin>(@xylkit);
        calc_token_id_with_salt(@0x0, admin.minted_tokens)
    }

    /// Calculate token ID with salt
    /// Every token ID is a 256-bit integer constructed by concatenating:
    /// `driverId (32 bits) | minter (160 bits) | salt (64 bits)`
    public fun calc_token_id_with_salt(minter: address, salt: u64): u256 {
        // Start with the driver ID (32 bits)
        let token_id: u256 = (DRIVER_ID as u256);
        
        // Shift left by 160 bits and add minter address (160 bits)
        token_id = (token_id << 160) | ((minter as u256) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        
        // Shift left by 64 bits and add salt (64 bits)
        token_id = (token_id << 64) | ((salt as u256) & 0xFFFFFFFFFFFFFFFF);
        
        token_id
    }

    /// Check if a salt has been used by a minter
    public fun is_salt_used(minter: address, salt: u64): bool acquires NFTDriverAdmin {
        let admin = borrow_global<NFTDriverAdmin>(@xylkit);
        
        if (!table::contains(&admin.salt_used, minter)) {
            return false
        };
        
        let minter_salts = table::borrow(&admin.salt_used, minter);
        table::contains(minter_salts, salt)
    }

    /// Register a new token ID
    fun register_token_id(): u256 acquires NFTDriverAdmin {
        let admin = borrow_global_mut<NFTDriverAdmin>(@xylkit);
        let token_id = calc_token_id_with_salt(@0x0, admin.minted_tokens);
        admin.minted_tokens = admin.minted_tokens + 1;
        token_id
    }

    /// Register a new token ID with salt
    fun register_token_id_with_salt(sender: &signer, salt: u64): u256 acquires NFTDriverAdmin {
        let sender_addr = signer::address_of(sender);
        
        // Check if the salt has already been used
        error_handling::assert_with_error(
            !is_salt_used(sender_addr, salt),
            CATEGORY,
            E_SALT_ALREADY_USED
        );
        
        let admin = borrow_global_mut<NFTDriverAdmin>(@xylkit);
        
        // Create a new salt table for the sender if it doesn't exist
        if (!table::contains(&admin.salt_used, sender_addr)) {
            table::add(&mut admin.salt_used, sender_addr, table::new());
        };
        
        // Mark the salt as used
        let minter_salts = table::borrow_mut(&mut admin.salt_used, sender_addr);
        table::add(minter_salts, salt, true);
        
        // Calculate and return the token ID
        calc_token_id_with_salt(sender_addr, salt)
    }

    /// Mint a new token
    public entry fun mint(creator: &signer, to: address) acquires NFTDriverAdmin {
        let token_id = register_token_id();
        mint_internal(creator, token_id, to);
    }

    /// Mint a token with a specific salt
    public entry fun mint_with_salt(creator: &signer, salt: u64, to: address) acquires NFTDriverAdmin {
        let token_id = register_token_id_with_salt(creator, salt);
        mint_internal(creator, token_id, to);
    }

    /// Internal function to mint a token
    fun mint_internal(creator: &signer, token_id: u256, to: address) acquires NFTDriverAdmin {
        let admin = borrow_global<NFTDriverAdmin>(@xylkit);
        let token_name = string::utf8(b"Drips NFT #");
        string::append(&mut token_name, string::utf8(to_string(token_id)));
        
        // Create the token using the Aptos Digital Asset standard
        let token_constructor_ref = &token::create(
            creator,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"Token that controls a Drips account"),
            token_name,
            option::none(), // No royalty
            string::utf8(b"https://drips.network/nft/"), // Base URI
        );
        
        // Generate a signer for the token object
        let token_signer = object::generate_signer(token_constructor_ref);
        let token_address = signer::address_of(&token_signer);
        
        // Generate burn and mutator references
        let burn_ref = token::generate_burn_ref(token_constructor_ref);
        let mutator_ref = token::generate_mutator_ref(token_constructor_ref);
        
        // Store token data on the token object
        move_to(&token_signer, TokenData {
            token_id,
            burn_ref: option::some(burn_ref),
            mutator_ref: option::some(mutator_ref),
            metadata: table::new(),
        });
        
        // Transfer the token to the recipient
        object::transfer(creator, object::address_to_object<Token>(token_address), to);
        
        // Emit token minted event
        event::emit(TokenMintedEvent {
            token_id,
            token_address,
            owner: to,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Check if an address is the owner of a token
    public fun is_token_owner(addr: address, token: Object<Token>): bool {
        object::owner(token) == addr
    }

    /// Set the URI for a token
    public entry fun set_token_uri(sender: &signer, token_obj: Object<Token>, uri: String) acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        // Validate URI is not empty
        error_handling::assert_with_error(
            !string::is_empty(&uri),
            CATEGORY,
            E_INVALID_URI
        );
        
        let token_address = object::object_address(&token_obj);
        
        // Get the token data
        error_handling::validate_resource_exists<TokenData>(
            exists<TokenData>(token_address),
            CATEGORY,
            E_INVALID_TOKEN_ID
        );
        let token_data = borrow_global_mut<TokenData>(token_address);
        
        // Update the token URI using the mutator reference
        if (option::is_some(&token_data.mutator_ref)) {
            let mutator_ref = option::borrow(&token_data.mutator_ref);
            token::set_uri(mutator_ref, uri);
            
            // Emit token URI set event
            event::emit(TokenURISetEvent {
                token_id: token_data.token_id,
                token_address,
                uri,
                timestamp: timestamp::now_seconds(),
            });
        } else {
            // If there's no mutator reference, the token might have been burned
            assert!(false, E_TOKEN_ALREADY_BURNED);
        };
    }
    
    /// Set the description for a token
    public entry fun set_token_description(sender: &signer, token_obj: Object<Token>, description: String) acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        let token_address = object::object_address(&token_obj);
        
        // Get the token data
        error_handling::validate_resource_exists<TokenData>(
            exists<TokenData>(token_address),
            CATEGORY,
            E_INVALID_TOKEN_ID
        );
        let token_data = borrow_global_mut<TokenData>(token_address);
        
        // Update the token description using the mutator reference
        if (option::is_some(&token_data.mutator_ref)) {
            let mutator_ref = option::borrow(&token_data.mutator_ref);
            token::set_description(mutator_ref, description);
        } else {
            // If there's no mutator reference, the token might have been burned
            assert!(false, E_TOKEN_ALREADY_BURNED);
        };
    }
    
    /// Set a custom metadata field for a token
    public entry fun set_token_metadata(
        sender: &signer, 
        token_obj: Object<Token>, 
        key: String, 
        value: vector<u8>
    ) acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        // Validate key is not empty
        error_handling::assert_with_error(
            !string::is_empty(&key),
            CATEGORY,
            E_INVALID_METADATA_KEY
        );
        
        // Validate value is not empty
        error_handling::assert_with_error(
            !vector::is_empty(&value),
            CATEGORY,
            E_INVALID_METADATA_VALUE
        );
        
        let token_address = object::object_address(&token_obj);
        
        // Get the token data
        error_handling::validate_resource_exists<TokenData>(
            exists<TokenData>(token_address),
            CATEGORY,
            E_INVALID_TOKEN_ID
        );
        let token_data = borrow_global_mut<TokenData>(token_address);
        
        // Update or add the metadata field
        if (table::contains(&token_data.metadata, key)) {
            *table::borrow_mut(&mut token_data.metadata, key) = value;
        } else {
            table::add(&mut token_data.metadata, key, value);
        };
    }
    
    /// Get a custom metadata field from a token
    public fun get_token_metadata(token_obj: Object<Token>, key: String): vector<u8> acquires TokenData {
        let token_address = object::object_address(&token_obj);
        
        // Get the token data
        error_handling::validate_resource_exists<TokenData>(
            exists<TokenData>(token_address),
            CATEGORY,
            E_INVALID_TOKEN_ID
        );
        let token_data = borrow_global<TokenData>(token_address);
        
        // Return the metadata field if it exists, otherwise return an empty vector
        if (table::contains(&token_data.metadata, key)) {
            *table::borrow(&token_data.metadata, key)
        } else {
            vector::empty<u8>()
        }
    }
    
    /// Remove a custom metadata field from a token
    public entry fun remove_token_metadata(
        sender: &signer, 
        token_obj: Object<Token>, 
        key: String
    ) acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        let token_address = object::object_address(&token_obj);
        
        // Get the token data
        error_handling::validate_resource_exists<TokenData>(
            exists<TokenData>(token_address),
            CATEGORY,
            E_INVALID_TOKEN_ID
        );
        let token_data = borrow_global_mut<TokenData>(token_address);
        
        // Remove the metadata field if it exists
        if (table::contains(&token_data.metadata, key)) {
            table::remove(&mut token_data.metadata, key);
        };
    }

    /// Burn a token
    public entry fun burn(sender: &signer, token_obj: Object<Token>) acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        let token_address = object::object_address(&token_obj);
        
        // Get the token data and burn reference
        error_handling::validate_resource_exists<TokenData>(
            exists<TokenData>(token_address),
            CATEGORY,
            E_INVALID_TOKEN_ID
        );
        let TokenData { token_id, burn_ref, mutator_ref: _ } = move_from<TokenData>(token_address);
        
        // Burn the token if we have a burn reference
        if (option::is_some(&burn_ref)) {
            let burn_ref_value = option::extract(&mut burn_ref);
            token::burn(burn_ref_value);
            
            // Emit token burned event
            event::emit(TokenBurnedEvent {
                token_id,
                token_address,
                timestamp: timestamp::now_seconds(),
            });
        };
        
        option::destroy_none(burn_ref);
    }

    /// Get the token ID from a token object
    public fun get_token_id(token_obj: Object<Token>): u256 acquires TokenData {
        let token_address = object::object_address(&token_obj);
        error_handling::validate_resource_exists<TokenData>(
            exists<TokenData>(token_address),
            CATEGORY,
            E_INVALID_TOKEN_ID
        );
        let token_data = borrow_global<TokenData>(token_address);
        token_data.token_id
    }
    
    /// Collect funds for a token
    /// This function collects funds from both drips and splits and transfers them to the specified address
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - token_obj: The token object representing the account ID
    /// - transfer_to: The address to transfer the collected funds to
    /// Returns: The total amount of funds collected
    public fun collect<CoinType>(sender: &signer, token_obj: Object<Token>, transfer_to: address): u128 acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        // Get the token ID which is also the account ID
        let token_id = get_token_id(token_obj);
        let token_address = object::object_address(&token_obj);
        
        // Convert token_id from u256 to address for drips and splits modules
        // This is a simplification - in a real implementation we would need to handle this conversion properly
        let account_id = token_address;
        
        // Initialize the DripsHub and SplitsStore for this token if they don't exist
        if (!drips::exists_hub(account_id)) {
            // We need to create a signer for the token to initialize the DripsHub and SplitsStore
            // This would typically be done during token minting
            // For now, we'll just use a placeholder approach
            drips::initialize(sender);
        };
        
        if (!splits::exists_store(account_id)) {
            splits::initialize(sender);
        };
        
        // Collect funds from drips
        let drips_amount: u128 = drips::collect_for_account<CoinType>(account_id);
        
        // Collect funds from splits
        let splits_amount: u128 = splits::collect_for_account<CoinType>(account_id);
        
        let total_amount = drips_amount + splits_amount;
        
        // If the total amount is greater than 0, transfer the funds to the specified address
        if (total_amount > 0) {
            // Convert from u128 to u64 for coin operations
            let amount_u64 = (total_amount as u64);
            
            // Register the recipient for the coin type if not already registered
            if (!coin::is_account_registered<CoinType>(transfer_to)) {
                // We can't register the recipient's account directly if they're not the sender
                // In a real implementation, we might want to handle this differently
                assert!(coin::is_account_registered<CoinType>(transfer_to), E_INVALID_RECEIVER);
            };
            
            // Create coins and deposit them to the recipient's account
            // In a real implementation, we would withdraw from the module account
            let coins = coin::withdraw<CoinType>(@xylkit, amount_u64);
            coin::deposit<CoinType>(transfer_to, coins);
        };
        
        // Emit funds collected event
        event::emit(FundsCollectedEvent {
            token_id,
            token_address,
            collector: sender_addr,
            receiver: transfer_to,
            amount: total_amount,
            timestamp: timestamp::now_seconds(),
        });
        
        total_amount
    }
    
    /// Entry function for collecting funds
    public entry fun collect_funds<CoinType>(sender: &signer, token_obj: Object<Token>, transfer_to: address) acquires TokenData {
        collect<CoinType>(sender, token_obj, transfer_to);
    }
    
    /// Give funds from a token to another account
    /// This function transfers funds directly from the sender to another account
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - token_obj: The token object representing the sending account ID
    /// - receiver: The receiver account ID (can be another token ID or an address)
    /// - amount: The amount of funds to transfer
    public fun give<CoinType>(sender: &signer, token_obj: Object<Token>, receiver: u256, amount: u128) acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        // Validate inputs
        error_handling::assert_with_error(amount > 0, CATEGORY, E_INVALID_AMOUNT);
        
        // Get the token ID which is also the account ID
        let token_id = get_token_id(token_obj);
        let token_address = object::object_address(&token_obj);
        
        // Convert from u128 to u64 for coin operations
        let amount_u64 = (amount as u64);
        
        // Ensure the sender has enough balance
        assert!(coin::balance<CoinType>(sender_addr) >= amount_u64, E_INVALID_AMOUNT);
        
        // Convert receiver token ID to address
        // For simplicity, we'll use the module address as a placeholder
        // In a real implementation, we would need to map token IDs to their object addresses
        let receiver_address = @xylkit;
        
        // Withdraw the coins from the sender's account
        let coins = coin::withdraw<CoinType>(sender, amount_u64);
        
        // Deposit the coins to the receiver's account
        coin::deposit<CoinType>(receiver_address, coins);
        
        // Add the funds to the receiver's splittable balance if they have a SplitsStore
        if (splits::exists_store(receiver_address)) {
            splits::add_splittable<CoinType>(receiver_address, amount);
        };
        
        // Emit funds given event
        event::emit(FundsGivenEvent {
            token_id,
            token_address,
            sender: sender_addr,
            receiver,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }
    
    /// Entry function for giving funds
    public entry fun give_funds<CoinType>(sender: &signer, token_obj: Object<Token>, receiver: u256, amount: u128) acquires TokenData {
        give<CoinType>(sender, token_obj, receiver, amount);
    }
    
    /// Configure streams for a token
    /// This function updates the stream configurations for the token
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - token_obj: The token object representing the configured account ID
    /// - curr_receivers: The current stream configurations
    /// - balance_delta: The change in balance required for the new configuration
    /// - new_receivers: The new stream configurations
    /// - transfer_to: The address to transfer any excess funds to
    /// Returns: The actual balance delta applied
    public fun set_streams<CoinType>(
        sender: &signer,
        token_obj: Object<Token>,
        curr_receivers: vector<DripsConfig>,
        balance_delta: i128,
        new_receivers: vector<DripsConfig>,
        transfer_to: address
    ): i128 acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        error_handling::assert_with_error(
            is_token_owner(sender_addr, token_obj),
            CATEGORY,
            E_NOT_TOKEN_OWNER
        );
        
        // Get the token ID which is also the account ID
        let token_id = get_token_id(token_obj);
        let token_address = object::object_address(&token_obj);
        
        // Convert token_id from u256 to address for drips module
        // This is a simplification - in a real implementation we would need to handle this conversion properly
        let account_id = token_address;
        
        // If the balance delta is positive, we need to add funds
        if (balance_delta > 0) {
            // Convert from i128 to u64 for coin operations
            let amount_u64 = ((balance_delta as u128) as u64);
            
            // Ensure the sender has enough balance
            assert!(coin::balance<CoinType>(sender_addr) >= amount_u64, E_INVALID_AMOUNT);
            
            // Withdraw the coins from the sender's account
            let coins = coin::withdraw<CoinType>(sender, amount_u64);
            
            // Deposit the coins to the module account
            // In a real implementation, we would store the coins in a module account
            coin::destroy_zero(coins);
        };
        
        // Initialize the DripsHub for this token if it doesn't exist
        if (!drips::exists_hub(account_id)) {
            drips::initialize(sender);
        };
        
        // Update streams configuration
        // Convert balance_delta from i128 to u128 for drips::set_streams
        let balance_delta_u128 = if (balance_delta >= 0) {
            (balance_delta as u128)
        } else {
            0 // If negative, we'll handle the withdrawal separately
        };
        
        drips::set_streams<CoinType>(sender, new_receivers, balance_delta_u128);
        
        // If the balance delta is negative, we need to return funds
        if (balance_delta < 0 && transfer_to != @0x0) {
            // Convert from i128 to u64 for coin operations
            let amount_u64 = (((-balance_delta) as u128) as u64);
            
            // Register the recipient for the coin type if not already registered
            if (!coin::is_account_registered<CoinType>(transfer_to)) {
                // We can't register the recipient's account directly if they're not the sender
                // In a real implementation, we might want to handle this differently
                assert!(coin::is_account_registered<CoinType>(transfer_to), E_INVALID_RECEIVER);
            };
            
            // Create the coins and deposit them to the recipient's account
            // In a real implementation, we would withdraw from the module account
            let coins = coin::withdraw<CoinType>(@xylkit, amount_u64);
            coin::deposit<CoinType>(transfer_to, coins);
        };
        
        // Emit streams configured event
        event::emit(StreamsConfiguredEvent {
            token_id,
            token_address,
            sender: sender_addr,
            receivers_count: vector::length(&new_receivers),
            balance_delta,
            timestamp: timestamp::now_seconds(),
        });
        
        balance_delta
    }
    
    /// Entry function for setting streams
    public entry fun set_streams_entry<CoinType>(
        sender: &signer,
        token_obj: Object<Token>,
        curr_receivers: vector<DripsConfig>,
        balance_delta: i128,
        new_receivers: vector<DripsConfig>,
        transfer_to: address
    ) acquires TokenData {
        set_streams<CoinType>(sender, token_obj, curr_receivers, balance_delta, new_receivers, transfer_to);
    }
    
    /// Configure splits for a token
    /// This function updates the splits configuration for the token
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - token_obj: The token object representing the configured account ID
    /// - receivers: The new splits configuration
    public fun set_splits(
        sender: &signer,
        token_obj: Object<Token>,
        receivers: vector<SplitsReceiver>
    ) acquires TokenData {
        let sender_addr = signer::address_of(sender);
        
        // Verify the sender is authorized to operate on this token
        assert!(is_token_owner(sender_addr, token_obj), E_NOT_TOKEN_OWNER);
        
        // Get the token ID which is also the account ID
        let token_id = get_token_id(token_obj);
        let token_address = object::object_address(&token_obj);
        
        // Convert token_id from u256 to address for splits module
        // This is a simplification - in a real implementation we would need to handle this conversion properly
        let account_id = token_address;
        
        // Initialize the SplitsStore for this token if it doesn't exist
        if (!splits::exists_store(account_id)) {
            splits::initialize(sender);
        };
        
        // Update splits configuration
        splits::set_splits(sender, receivers);
        
        // Emit splits configured event
        event::emit(SplitsConfiguredEvent {
            token_id,
            token_address,
            sender: sender_addr,
            receivers_count: vector::length(&receivers),
            timestamp: timestamp::now_seconds(),
        });
    }
    
    /// Entry function for setting splits
    public entry fun set_splits_entry(
        sender: &signer,
        token_obj: Object<Token>,
        receivers: vector<SplitsReceiver>
    ) acquires TokenData {
        set_splits(sender, token_obj, receivers);
    }

    /// Helper function to convert u256 to string
    fun to_string(value: u256): vector<u8> {
        if (value == 0) {
            return b"0"
        };
        
        let buffer = vector::empty<u8>();
        let temp = value;
        
        while (temp > 0) {
            let digit = ((temp % 10) as u8) + 48; // Convert to ASCII
            vector::push_back(&mut buffer, digit);
            temp = temp / 10;
        };
        
        // Reverse the buffer
        let result = vector::empty<u8>();
        let i = vector::length(&buffer);
        while (i > 0) {
            i = i - 1;
            vector::push_back(&mut result, *vector::borrow(&buffer, i));
        };
        
        result
    }
}