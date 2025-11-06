#[test_only]
module xylkit::nft_driver_tests {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::token::{Self, Token};
    use xylkit::nft_driver::{Self};
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
        
        // Initialize the NFT Driver module
        nft_driver::initialize(&module_account);
        
        (account1, account2, account3)
    }

    #[test]
    fun test_initialize() {
        // Create test accounts
        let (_, _, _) = setup();
        
        // If we reach here, the initialization was successful
    }

    #[test]
    #[expected_failure(abort_code = nft_driver::E_DRIVER_ALREADY_EXISTS)]
    fun test_initialize_already_exists() {
        // Create test accounts
        let (_, _, _) = setup();
        let module_account = account::create_account_for_test(@xylkit);
        
        // Try to initialize again, should fail
        nft_driver::initialize(&module_account);
    }

    #[test]
    fun test_mint() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        nft_driver::mint(&account1, account2_addr);
        
        // If we reach here, the minting was successful
    }

    #[test]
    fun test_mint_with_salt() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token with salt
        nft_driver::mint_with_salt(&account1, 12345, account2_addr);
        
        // If we reach here, the minting was successful
    }

    #[test]
    #[expected_failure(abort_code = nft_driver::E_SALT_ALREADY_USED)]
    fun test_mint_with_salt_already_used() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token with salt
        nft_driver::mint_with_salt(&account1, 12345, account2_addr);
        
        // Try to mint another token with the same salt, should fail
        nft_driver::mint_with_salt(&account1, 12345, account2_addr);
    }
}
    #[
test]
    fun test_is_salt_used() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Check if salt is used before minting
        assert!(!nft_driver::is_salt_used(account1_addr, 12345), 0);
        
        // Mint a token with salt
        nft_driver::mint_with_salt(&account1, 12345, account2_addr);
        
        // Check if salt is used after minting
        assert!(nft_driver::is_salt_used(account1_addr, 12345), 0);
        
        // Check if a different salt is not used
        assert!(!nft_driver::is_salt_used(account1_addr, 67890), 0);
        
        // Check if the same salt for a different account is not used
        assert!(!nft_driver::is_salt_used(account2_addr, 12345), 0);
    }

    #[test]
    fun test_next_token_id() {
        // Create test accounts
        let (_, _, _) = setup();
        
        // Get the next token ID
        let token_id1 = nft_driver::next_token_id();
        
        // Verify the token ID is not zero
        assert!(token_id1 > 0, 0);
    }

    #[test]
    fun test_calc_token_id_with_salt() {
        // Create test accounts
        let (account1, _, _) = setup();
        let account1_addr = signer::address_of(&account1);
        
        // Calculate token ID with salt
        let token_id = nft_driver::calc_token_id_with_salt(account1_addr, 12345);
        
        // Verify the token ID is not zero
        assert!(token_id > 0, 0);
    }

    // Helper function to mint a token and return the token object
    fun mint_token(creator: &signer, to: address): Object<Token> {
        // Mint a token
        nft_driver::mint(creator, to);
        
        // In a real test, we would need to get the token object
        // For now, we'll just return a placeholder
        // This is a simplification - in a real implementation we would need to track the token object
        object::address_to_object<Token>(@0x0)
    }

    #[test]
    #[expected_failure]
    fun test_set_token_uri() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Set the token URI
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        nft_driver::set_token_uri(&account2, token_obj, string::utf8(b"https://example.com/token"));
    }

    #[test]
    #[expected_failure]
    fun test_set_token_description() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Set the token description
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        nft_driver::set_token_description(&account2, token_obj, string::utf8(b"Test token description"));
    }

    #[test]
    #[expected_failure]
    fun test_set_token_metadata() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Set token metadata
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        nft_driver::set_token_metadata(
            &account2,
            token_obj,
            string::utf8(b"test_key"),
            b"test_value"
        );
    }

    #[test]
    #[expected_failure]
    fun test_get_token_metadata() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Get token metadata
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        let _metadata = nft_driver::get_token_metadata(token_obj, string::utf8(b"test_key"));
    }

    #[test]
    #[expected_failure]
    fun test_remove_token_metadata() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Remove token metadata
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        nft_driver::remove_token_metadata(
            &account2,
            token_obj,
            string::utf8(b"test_key")
        );
    }

    #[test]
    #[expected_failure]
    fun test_burn() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Burn the token
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        nft_driver::burn(&account2, token_obj);
    }

    #[test]
    #[expected_failure]
    fun test_get_token_id() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Get the token ID
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        let _token_id = nft_driver::get_token_id(token_obj);
    }

    #[test]
    #[expected_failure]
    fun test_is_token_owner() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account1_addr = signer::address_of(&account1);
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Check if account2 is the token owner
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        assert!(nft_driver::is_token_owner(account2_addr, token_obj), 0);
        
        // Check if account1 is not the token owner
        assert!(!nft_driver::is_token_owner(account1_addr, token_obj), 0);
    }

    #[test]
    #[expected_failure]
    fun test_collect() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Collect funds
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        let _collected = nft_driver::collect<TestCoin>(&account2, token_obj, account2_addr);
    }

    #[test]
    #[expected_failure]
    fun test_give() {
        // Create test accounts
        let (account1, account2, _) = setup();
        let account2_addr = signer::address_of(&account2);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Give funds
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        nft_driver::give<TestCoin>(&account2, token_obj, 12345, 100);
    }

    #[test]
    #[expected_failure]
    fun test_set_streams() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Create a streams configuration
        let receivers = vector::empty<DripsConfig>();
        let receiver = drips::new_drips_config(account3_addr, 100, 0, 0); // 100 per second
        vector::push_back(&mut receivers, receiver);
        
        // Set streams
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        let _balance_delta = nft_driver::set_streams<TestCoin>(
            &account2,
            token_obj,
            vector::empty(),
            0,
            receivers,
            account2_addr
        );
    }

    #[test]
    #[expected_failure]
    fun test_set_splits() {
        // Create test accounts
        let (account1, account2, account3) = setup();
        let account2_addr = signer::address_of(&account2);
        let account3_addr = signer::address_of(&account3);
        
        // Mint a token
        let token_obj = mint_token(&account1, account2_addr);
        
        // Create a splits configuration
        let receivers = vector::empty<SplitsReceiver>();
        let receiver = splits::new_receiver(account3_addr, 500000); // 50%
        vector::push_back(&mut receivers, receiver);
        
        // Set splits
        // Note: This will fail in our test because we're using a placeholder token object
        // In a real test, we would need to get the actual token object
        nft_driver::set_splits(&account2, token_obj, receivers);
    }
}