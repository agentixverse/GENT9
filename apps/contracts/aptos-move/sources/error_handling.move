module xylkit::error_handling {
    use std::string::{Self, String};
    use aptos_framework::event;

    /// Error categories
    const CATEGORY_GENERAL: u8 = 0;
    const CATEGORY_DRIPS: u8 = 1;
    const CATEGORY_SPLITS: u8 = 2;
    const CATEGORY_ADDRESS_DRIVER: u8 = 3;
    const CATEGORY_NFT_DRIVER: u8 = 4;
    const CATEGORY_INTEGRATION: u8 = 5;

    /// General error codes (0-99)
    const E_UNAUTHORIZED: u64 = 1;
    const E_INVALID_ARGUMENT: u64 = 2;
    const E_RESOURCE_NOT_FOUND: u64 = 3;
    const E_RESOURCE_ALREADY_EXISTS: u64 = 4;
    const E_INSUFFICIENT_FUNDS: u64 = 5;
    const E_ARITHMETIC_ERROR: u64 = 6;
    const E_INVALID_STATE: u64 = 7;
    const E_OPERATION_NOT_SUPPORTED: u64 = 8;
    const E_LIMIT_EXCEEDED: u64 = 9;

    /// Drips module error codes (100-199)
    const E_DRIPS_HUB_ALREADY_EXISTS: u64 = 101;
    const E_DRIPS_HUB_NOT_FOUND: u64 = 102;
    const E_DRIPS_INSUFFICIENT_BALANCE: u64 = 103;
    const E_DRIPS_INVALID_AMOUNT: u64 = 104;
    const E_DRIPS_INVALID_RECEIVER: u64 = 105;
    const E_DRIPS_INVALID_AMT_PER_SEC: u64 = 106;
    const E_DRIPS_INVALID_DURATION: u64 = 107;
    const E_DRIPS_RECEIVERS_NOT_SORTED: u64 = 108;
    const E_DRIPS_DUPLICATE_RECEIVER: u64 = 109;
    const E_DRIPS_INVALID_BALANCE_DELTA: u64 = 110;
    const E_DRIPS_MAX_CYCLES_EXCEEDED: u64 = 111;
    const E_DRIPS_INVALID_CYCLE: u64 = 112;
    const E_DRIPS_STREAM_ALREADY_ENDED: u64 = 113;
    const E_DRIPS_STREAM_NOT_STARTED: u64 = 114;

    /// Splits module error codes (200-299)
    const E_SPLITS_INVALID_WEIGHT: u64 = 201;
    const E_SPLITS_TOO_MANY_RECEIVERS: u64 = 202;
    const E_SPLITS_RECEIVERS_NOT_SORTED: u64 = 203;
    const E_SPLITS_WEIGHT_SUM_TOO_HIGH: u64 = 204;
    const E_SPLITS_STORE_NOT_FOUND: u64 = 205;
    const E_SPLITS_DUPLICATE_RECEIVER: u64 = 206;
    const E_SPLITS_SELF_RECEIVER_NOT_ALLOWED: u64 = 207;
    const E_SPLITS_INSUFFICIENT_BALANCE: u64 = 208;
    const E_SPLITS_INVALID_AMOUNT: u64 = 209;

    /// Address driver error codes (300-399)
    const E_ADDRESS_DRIVER_ALREADY_EXISTS: u64 = 301;
    const E_ADDRESS_DRIVER_NOT_FOUND: u64 = 302;
    const E_ADDRESS_ACCOUNT_ID_ALREADY_REGISTERED: u64 = 303;
    const E_ADDRESS_NOT_REGISTERED: u64 = 304;
    const E_ADDRESS_INVALID_AMOUNT: u64 = 305;
    const E_ADDRESS_INVALID_RECEIVER: u64 = 306;
    const E_ADDRESS_UNAUTHORIZED: u64 = 307;

    /// NFT driver error codes (400-499)
    const E_NFT_TOKEN_ALREADY_MINTED: u64 = 401;
    const E_NFT_NOT_TOKEN_OWNER: u64 = 402;
    const E_NFT_INVALID_TOKEN_ID: u64 = 403;
    const E_NFT_INVALID_AMOUNT: u64 = 404;
    const E_NFT_INVALID_RECEIVER: u64 = 405;
    const E_NFT_SALT_ALREADY_USED: u64 = 406;
    const E_NFT_DRIVER_ALREADY_EXISTS: u64 = 407;
    const E_NFT_DRIVER_NOT_FOUND: u64 = 408;
    const E_NFT_UNAUTHORIZED: u64 = 409;
    const E_NFT_APPROVAL_ALREADY_EXISTS: u64 = 410;
    const E_NFT_NO_APPROVAL_EXISTS: u64 = 411;
    const E_NFT_SELF_APPROVAL_NOT_NEEDED: u64 = 412;
    const E_NFT_INVALID_METADATA_KEY: u64 = 413;
    const E_NFT_INVALID_METADATA_VALUE: u64 = 414;
    const E_NFT_INVALID_URI: u64 = 415;
    const E_NFT_INVALID_DESCRIPTION: u64 = 416;
    const E_NFT_TOKEN_ALREADY_BURNED: u64 = 417;
    const E_NFT_INSUFFICIENT_FUNDS: u64 = 418;
    const E_NFT_INVALID_BALANCE_DELTA: u64 = 419;
    const E_NFT_INVALID_TRANSFER_ADDRESS: u64 = 420;

    /// Integration error codes (500-599)
    const E_INTEGRATION_INVALID_MODULE_INTERACTION: u64 = 501;
    const E_INTEGRATION_CROSS_MODULE_CALL_FAILED: u64 = 502;
    const E_INTEGRATION_INCOMPATIBLE_CONFIGURATIONS: u64 = 503;
    const E_INTEGRATION_INVALID_DRIVER_TYPE: u64 = 504;
    const E_INTEGRATION_UNAUTHORIZED_CROSS_MODULE_CALL: u64 = 505;

    /// Error event for logging errors
    struct ErrorEvent has drop, store {
        category: u8,
        code: u64,
        message: String,
        timestamp: u64,
    }

    /// Utility function to create an error code with category
    public fun create_error_code(category: u8, code: u64): u64 {
        ((category as u64) << 32) | code
    }

    /// Utility function to extract category from an error code
    public fun get_error_category(error_code: u64): u8 {
        ((error_code >> 32) & 0xFF) as u8
    }

    /// Utility function to extract code from an error code
    public fun get_error_code(error_code: u64): u64 {
        error_code & 0xFFFFFFFF
    }

    /// Utility function to emit an error event
    public fun emit_error_event(category: u8, code: u64, message: String, timestamp: u64) {
        event::emit(ErrorEvent {
            category,
            code,
            message,
            timestamp,
        });
    }

    /// Utility function to get error message for a given error code
    public fun get_error_message(category: u8, code: u64): String {
        if (category == CATEGORY_GENERAL) {
            if (code == E_UNAUTHORIZED) {
                return string::utf8(b"Unauthorized operation")
            } else if (code == E_INVALID_ARGUMENT) {
                return string::utf8(b"Invalid argument")
            } else if (code == E_RESOURCE_NOT_FOUND) {
                return string::utf8(b"Resource not found")
            } else if (code == E_RESOURCE_ALREADY_EXISTS) {
                return string::utf8(b"Resource already exists")
            } else if (code == E_INSUFFICIENT_FUNDS) {
                return string::utf8(b"Insufficient funds")
            } else if (code == E_ARITHMETIC_ERROR) {
                return string::utf8(b"Arithmetic error")
            } else if (code == E_INVALID_STATE) {
                return string::utf8(b"Invalid state")
            } else if (code == E_OPERATION_NOT_SUPPORTED) {
                return string::utf8(b"Operation not supported")
            } else if (code == E_LIMIT_EXCEEDED) {
                return string::utf8(b"Limit exceeded")
            }
        } else if (category == CATEGORY_DRIPS) {
            if (code == E_DRIPS_HUB_ALREADY_EXISTS) {
                return string::utf8(b"DripsHub already exists")
            } else if (code == E_DRIPS_HUB_NOT_FOUND) {
                return string::utf8(b"DripsHub not found")
            } else if (code == E_DRIPS_INSUFFICIENT_BALANCE) {
                return string::utf8(b"Insufficient balance in DripsHub")
            } else if (code == E_DRIPS_INVALID_AMOUNT) {
                return string::utf8(b"Invalid amount for Drips operation")
            } else if (code == E_DRIPS_INVALID_RECEIVER) {
                return string::utf8(b"Invalid receiver for Drips operation")
            } else if (code == E_DRIPS_INVALID_AMT_PER_SEC) {
                return string::utf8(b"Invalid amount per second for Drips stream")
            } else if (code == E_DRIPS_INVALID_DURATION) {
                return string::utf8(b"Invalid duration for Drips stream")
            } else if (code == E_DRIPS_RECEIVERS_NOT_SORTED) {
                return string::utf8(b"Drips receivers not sorted")
            } else if (code == E_DRIPS_DUPLICATE_RECEIVER) {
                return string::utf8(b"Duplicate receiver in Drips configuration")
            } else if (code == E_DRIPS_INVALID_BALANCE_DELTA) {
                return string::utf8(b"Invalid balance delta for Drips operation")
            } else if (code == E_DRIPS_MAX_CYCLES_EXCEEDED) {
                return string::utf8(b"Maximum cycles exceeded for Drips operation")
            } else if (code == E_DRIPS_INVALID_CYCLE) {
                return string::utf8(b"Invalid cycle for Drips operation")
            } else if (code == E_DRIPS_STREAM_ALREADY_ENDED) {
                return string::utf8(b"Drips stream has already ended")
            } else if (code == E_DRIPS_STREAM_NOT_STARTED) {
                return string::utf8(b"Drips stream has not started yet")
            }
        } else if (category == CATEGORY_SPLITS) {
            if (code == E_SPLITS_INVALID_WEIGHT) {
                return string::utf8(b"Invalid weight for Splits receiver")
            } else if (code == E_SPLITS_TOO_MANY_RECEIVERS) {
                return string::utf8(b"Too many receivers in Splits configuration")
            } else if (code == E_SPLITS_RECEIVERS_NOT_SORTED) {
                return string::utf8(b"Splits receivers not sorted")
            } else if (code == E_SPLITS_WEIGHT_SUM_TOO_HIGH) {
                return string::utf8(b"Sum of weights too high in Splits configuration")
            } else if (code == E_SPLITS_STORE_NOT_FOUND) {
                return string::utf8(b"SplitsStore not found")
            } else if (code == E_SPLITS_DUPLICATE_RECEIVER) {
                return string::utf8(b"Duplicate receiver in Splits configuration")
            } else if (code == E_SPLITS_SELF_RECEIVER_NOT_ALLOWED) {
                return string::utf8(b"Self receiver not allowed in Splits configuration")
            } else if (code == E_SPLITS_INSUFFICIENT_BALANCE) {
                return string::utf8(b"Insufficient balance for Splits operation")
            } else if (code == E_SPLITS_INVALID_AMOUNT) {
                return string::utf8(b"Invalid amount for Splits operation")
            }
        } else if (category == CATEGORY_ADDRESS_DRIVER) {
            if (code == E_ADDRESS_DRIVER_ALREADY_EXISTS) {
                return string::utf8(b"AddressDriver already exists")
            } else if (code == E_ADDRESS_DRIVER_NOT_FOUND) {
                return string::utf8(b"AddressDriver not found")
            } else if (code == E_ADDRESS_ACCOUNT_ID_ALREADY_REGISTERED) {
                return string::utf8(b"Account ID already registered")
            } else if (code == E_ADDRESS_NOT_REGISTERED) {
                return string::utf8(b"Address not registered")
            } else if (code == E_ADDRESS_INVALID_AMOUNT) {
                return string::utf8(b"Invalid amount for AddressDriver operation")
            } else if (code == E_ADDRESS_INVALID_RECEIVER) {
                return string::utf8(b"Invalid receiver for AddressDriver operation")
            } else if (code == E_ADDRESS_UNAUTHORIZED) {
                return string::utf8(b"Unauthorized AddressDriver operation")
            }
        } else if (category == CATEGORY_NFT_DRIVER) {
            if (code == E_NFT_TOKEN_ALREADY_MINTED) {
                return string::utf8(b"NFT token already minted")
            } else if (code == E_NFT_NOT_TOKEN_OWNER) {
                return string::utf8(b"Not the owner of the NFT token")
            } else if (code == E_NFT_INVALID_TOKEN_ID) {
                return string::utf8(b"Invalid NFT token ID")
            } else if (code == E_NFT_INVALID_AMOUNT) {
                return string::utf8(b"Invalid amount for NFT operation")
            } else if (code == E_NFT_INVALID_RECEIVER) {
                return string::utf8(b"Invalid receiver for NFT operation")
            } else if (code == E_NFT_SALT_ALREADY_USED) {
                return string::utf8(b"Salt already used for NFT minting")
            } else if (code == E_NFT_DRIVER_ALREADY_EXISTS) {
                return string::utf8(b"NFTDriver already exists")
            } else if (code == E_NFT_DRIVER_NOT_FOUND) {
                return string::utf8(b"NFTDriver not found")
            } else if (code == E_NFT_UNAUTHORIZED) {
                return string::utf8(b"Unauthorized NFT operation")
            } else if (code == E_NFT_APPROVAL_ALREADY_EXISTS) {
                return string::utf8(b"NFT approval already exists")
            } else if (code == E_NFT_NO_APPROVAL_EXISTS) {
                return string::utf8(b"No NFT approval exists")
            } else if (code == E_NFT_SELF_APPROVAL_NOT_NEEDED) {
                return string::utf8(b"Self approval not needed for NFT")
            } else if (code == E_NFT_INVALID_METADATA_KEY) {
                return string::utf8(b"Invalid metadata key for NFT")
            } else if (code == E_NFT_INVALID_METADATA_VALUE) {
                return string::utf8(b"Invalid metadata value for NFT")
            } else if (code == E_NFT_INVALID_URI) {
                return string::utf8(b"Invalid URI for NFT")
            } else if (code == E_NFT_INVALID_DESCRIPTION) {
                return string::utf8(b"Invalid description for NFT")
            } else if (code == E_NFT_TOKEN_ALREADY_BURNED) {
                return string::utf8(b"NFT token already burned")
            } else if (code == E_NFT_INSUFFICIENT_FUNDS) {
                return string::utf8(b"Insufficient funds for NFT operation")
            } else if (code == E_NFT_INVALID_BALANCE_DELTA) {
                return string::utf8(b"Invalid balance delta for NFT operation")
            } else if (code == E_NFT_INVALID_TRANSFER_ADDRESS) {
                return string::utf8(b"Invalid transfer address for NFT operation")
            }
        } else if (category == CATEGORY_INTEGRATION) {
            if (code == E_INTEGRATION_INVALID_MODULE_INTERACTION) {
                return string::utf8(b"Invalid module interaction")
            } else if (code == E_INTEGRATION_CROSS_MODULE_CALL_FAILED) {
                return string::utf8(b"Cross-module call failed")
            } else if (code == E_INTEGRATION_INCOMPATIBLE_CONFIGURATIONS) {
                return string::utf8(b"Incompatible configurations between modules")
            } else if (code == E_INTEGRATION_INVALID_DRIVER_TYPE) {
                return string::utf8(b"Invalid driver type")
            } else if (code == E_INTEGRATION_UNAUTHORIZED_CROSS_MODULE_CALL) {
                return string::utf8(b"Unauthorized cross-module call")
            }
        }

        // Default error message
        string::utf8(b"Unknown error")
    }

    /// Utility function to assert with error message
    public fun assert_with_error(condition: bool, category: u8, code: u64) {
        if (!condition) {
            let error_message = get_error_message(category, code);
            let timestamp = aptos_framework::timestamp::now_seconds();
            emit_error_event(category, code, error_message, timestamp);
            assert!(condition, create_error_code(category, code));
        }
    }

    /// Utility function to validate amount
    public fun validate_amount(amount: u64, category: u8, error_code: u64) {
        assert_with_error(amount > 0, category, error_code);
    }

    /// Utility function to validate address
    public fun validate_address(addr: address, category: u8, error_code: u64) {
        assert_with_error(addr != @0x0, category, error_code);
    }

    /// Utility function to validate authorization
    public fun validate_authorization(is_authorized: bool, category: u8, error_code: u64) {
        assert_with_error(is_authorized, category, error_code);
    }

    /// Utility function to validate resource existence
    public fun validate_resource_exists<T: key>(exists: bool, category: u8, error_code: u64) {
        assert_with_error(exists, category, error_code);
    }

    /// Utility function to validate resource does not exist
    public fun validate_resource_not_exists<T: key>(exists: bool, category: u8, error_code: u64) {
        assert_with_error(!exists, category, error_code);
    }
}