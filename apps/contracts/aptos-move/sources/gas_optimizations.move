module xylkit::gas_optimizations {
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::table::{Self, Table};
    use xylkit::drips::{Self, DripsConfig};
    use xylkit::splits::{Self, SplitsReceiver};
    use xylkit::error_handling;

    /// Error codes
    const CATEGORY: u8 = error_handling::CATEGORY_GENERAL;
    const E_INVALID_ARGUMENT: u64 = error_handling::E_INVALID_ARGUMENT;

    /// Gas optimization techniques for the Drips protocol
    /// This module provides optimized versions of common operations used in the Drips protocol

    /// Optimized vector sorting for DripsConfig
    /// This function uses insertion sort which is efficient for small vectors
    /// Parameters:
    /// - configs: A vector of DripsConfig to sort by receiver address
    /// Returns: A sorted vector of DripsConfig
    public fun sort_drips_configs(configs: vector<DripsConfig>): vector<DripsConfig> {
        let len = vector::length(&configs);
        if (len <= 1) {
            return configs
        };

        let i = 1;
        while (i < len) {
            let current = *vector::borrow(&configs, i);
            let j = i;
            while (j > 0 && vector::borrow(&configs, j - 1).receiver > current.receiver) {
                let prev = vector::borrow(&configs, j - 1);
                *vector::borrow_mut(&mut configs, j) = *prev;
                j = j - 1;
            };
            *vector::borrow_mut(&mut configs, j) = current;
            i = i + 1;
        };

        configs
    }

    /// Optimized vector sorting for SplitsReceiver
    /// This function uses insertion sort which is efficient for small vectors
    /// Parameters:
    /// - receivers: A vector of SplitsReceiver to sort by receiver address
    /// Returns: A sorted vector of SplitsReceiver
    public fun sort_splits_receivers(receivers: vector<SplitsReceiver>): vector<SplitsReceiver> {
        let len = vector::length(&receivers);
        if (len <= 1) {
            return receivers
        };

        let i = 1;
        while (i < len) {
            let current = *vector::borrow(&receivers, i);
            let j = i;
            while (j > 0 && vector::borrow(&receivers, j - 1).receiver > current.receiver) {
                let prev = vector::borrow(&receivers, j - 1);
                *vector::borrow_mut(&mut receivers, j) = *prev;
                j = j - 1;
            };
            *vector::borrow_mut(&mut receivers, j) = current;
            i = i + 1;
        };

        receivers
    }

    /// Optimized binary search for DripsConfig
    /// This function uses binary search which is more efficient than linear search
    /// Parameters:
    /// - configs: A sorted vector of DripsConfig
    /// - receiver: The receiver address to search for
    /// Returns: (bool, u64) - (found, index)
    public fun binary_search_drips_config(configs: &vector<DripsConfig>, receiver: address): (bool, u64) {
        let len = vector::length(configs);
        if (len == 0) {
            return (false, 0)
        };

        let left = 0;
        let right = len - 1;

        while (left <= right) {
            let mid = left + (right - left) / 2;
            let config = vector::borrow(configs, mid);

            if (config.receiver == receiver) {
                return (true, mid)
            } else if (config.receiver < receiver) {
                left = mid + 1;
            } else {
                if (mid == 0) {
                    return (false, mid)
                };
                right = mid - 1;
            };
        };

        (false, left)
    }

    /// Optimized binary search for SplitsReceiver
    /// This function uses binary search which is more efficient than linear search
    /// Parameters:
    /// - receivers: A sorted vector of SplitsReceiver
    /// - receiver: The receiver address to search for
    /// Returns: (bool, u64) - (found, index)
    public fun binary_search_splits_receiver(receivers: &vector<SplitsReceiver>, receiver: address): (bool, u64) {
        let len = vector::length(receivers);
        if (len == 0) {
            return (false, 0)
        };

        let left = 0;
        let right = len - 1;

        while (left <= right) {
            let mid = left + (right - left) / 2;
            let config = vector::borrow(receivers, mid);

            if (config.receiver == receiver) {
                return (true, mid)
            } else if (config.receiver < receiver) {
                left = mid + 1;
            } else {
                if (mid == 0) {
                    return (false, mid)
                };
                right = mid - 1;
            };
        };

        (false, left)
    }

    /// Optimized batch operation for updating multiple DripsConfig at once
    /// This function is more gas efficient than updating configs one by one
    /// Parameters:
    /// - old_configs: The existing vector of DripsConfig
    /// - updates: A vector of (receiver, amt_per_sec, start_cycle, duration) tuples
    /// Returns: A new vector of DripsConfig with the updates applied
    public fun batch_update_drips_configs(
        old_configs: vector<DripsConfig>,
        updates: vector<(address, u128, u64, u64)>
    ): vector<DripsConfig> {
        let result = old_configs;
        let updates_len = vector::length(&updates);
        let i = 0;

        while (i < updates_len) {
            let (receiver, amt_per_sec, start_cycle, duration) = *vector::borrow(&updates, i);
            
            // Create a new config
            let new_config = DripsConfig {
                receiver,
                amt_per_sec,
                start_cycle,
                duration
            };
            
            // Find if this receiver already exists
            let (found, index) = binary_search_drips_config(&result, receiver);
            
            if (found) {
                // Update existing config
                *vector::borrow_mut(&mut result, index) = new_config;
            } else {
                // Insert new config at the correct position
                vector::insert(&mut result, index, new_config);
            };
            
            i = i + 1;
        };
        
        result
    }

    /// Optimized batch operation for updating multiple SplitsReceiver at once
    /// This function is more gas efficient than updating receivers one by one
    /// Parameters:
    /// - old_receivers: The existing vector of SplitsReceiver
    /// - updates: A vector of (receiver, weight) tuples
    /// Returns: A new vector of SplitsReceiver with the updates applied
    public fun batch_update_splits_receivers(
        old_receivers: vector<SplitsReceiver>,
        updates: vector<(address, u32)>
    ): vector<SplitsReceiver> {
        let result = old_receivers;
        let updates_len = vector::length(&updates);
        let i = 0;

        while (i < updates_len) {
            let (receiver, weight) = *vector::borrow(&updates, i);
            
            // Create a new receiver
            let new_receiver = SplitsReceiver {
                receiver,
                weight
            };
            
            // Find if this receiver already exists
            let (found, index) = binary_search_splits_receiver(&result, receiver);
            
            if (found) {
                // Update existing receiver
                *vector::borrow_mut(&mut result, index) = new_receiver;
            } else {
                // Insert new receiver at the correct position
                vector::insert(&mut result, index, new_receiver);
            };
            
            i = i + 1;
        };
        
        result
    }

    /// Optimized calculation of streamed amount
    /// This function uses a more efficient algorithm to calculate streamed amounts
    /// Parameters:
    /// - amt_per_sec: Amount per second
    /// - duration: Duration in seconds
    /// - elapsed: Elapsed time in seconds
    /// Returns: The streamed amount
    public fun calculate_streamed_amount_optimized(
        amt_per_sec: u128,
        duration: u64,
        elapsed: u64
    ): u128 {
        // If elapsed time is greater than duration, return the total amount
        if (elapsed >= duration) {
            return amt_per_sec * (duration as u128)
        };
        
        // Otherwise, calculate the partial amount
        amt_per_sec * (elapsed as u128)
    }

    /// Optimized table access with default value
    /// This function avoids the need to check if a key exists in a table
    /// Parameters:
    /// - t: The table to access
    /// - key: The key to look up
    /// - default_value: The default value to return if the key doesn't exist
    /// Returns: The value associated with the key, or the default value
    public fun table_get_with_default<K: copy, V: copy>(t: &Table<K, V>, key: K, default_value: V): V {
        if (table::contains(t, key)) {
            *table::borrow(t, key)
        } else {
            default_value
        }
    }

    /// Optimized vector deduplication
    /// This function removes duplicate elements from a vector
    /// Parameters:
    /// - v: The vector to deduplicate
    /// Returns: A new vector with duplicates removed
    public fun deduplicate_addresses(v: vector<address>): vector<address> {
        let result = vector::empty<address>();
        let len = vector::length(&v);
        let i = 0;
        
        while (i < len) {
            let addr = *vector::borrow(&v, i);
            let j = 0;
            let found = false;
            let result_len = vector::length(&result);
            
            while (j < result_len && !found) {
                if (*vector::borrow(&result, j) == addr) {
                    found = true;
                };
                j = j + 1;
            };
            
            if (!found) {
                vector::push_back(&mut result, addr);
            };
            
            i = i + 1;
        };
        
        result
    }

    /// Optimized batch transfer
    /// This function transfers funds to multiple receivers in a single operation
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - receivers: A vector of receiver addresses
    /// - amounts: A vector of amounts to transfer
    /// Returns: The total amount transferred
    public fun batch_transfer<CoinType>(
        sender: &signer,
        receivers: vector<address>,
        amounts: vector<u64>
    ): u64 {
        let receivers_len = vector::length(&receivers);
        let amounts_len = vector::length(&amounts);
        
        // Ensure the vectors have the same length
        error_handling::assert_with_error(
            receivers_len == amounts_len,
            CATEGORY,
            E_INVALID_ARGUMENT
        );
        
        let total_amount = 0;
        let i = 0;
        
        while (i < receivers_len) {
            let receiver = *vector::borrow(&receivers, i);
            let amount = *vector::borrow(&amounts, i);
            
            if (amount > 0) {
                // Transfer funds to the receiver
                let coin = aptos_framework::coin::withdraw<CoinType>(sender, amount);
                aptos_framework::coin::deposit<CoinType>(receiver, coin);
                total_amount = total_amount + amount;
            };
            
            i = i + 1;
        };
        
        total_amount
    }
    /// Optimized calculation of total weight for splits receivers
    /// This function calculates the total weight of all receivers in a single pass
    /// Parameters:
    /// - receivers: A vector of SplitsReceiver
    /// Returns: The total weight
    public fun calculate_total_weight(receivers: &vector<SplitsReceiver>): u32 {
        let total_weight: u32 = 0;
        let len = vector::length(receivers);
        let i = 0;
        
        while (i < len) {
            let receiver = vector::borrow(receivers, i);
            total_weight = total_weight + receiver.weight;
            i = i + 1;
        };
        
        total_weight
    }

    /// Optimized calculation of total streamed amount
    /// This function calculates the total amount streamed by all configs in a single pass
    /// Parameters:
    /// - configs: A vector of DripsConfig
    /// Returns: The total streamed amount
    public fun calculate_total_streamed(configs: &vector<DripsConfig>): u128 {
        let total: u128 = 0;
        let len = vector::length(configs);
        let i = 0;
        
        while (i < len) {
            let config = vector::borrow(configs, i);
            let stream_amount = config.amt_per_sec * (config.duration as u128);
            total = total + stream_amount;
            i = i + 1;
        };
        
        total
    }

    /// Optimized batch collection of funds
    /// This function collects funds from multiple accounts in a single operation
    /// Parameters:
    /// - sender: The signer of the transaction
    /// - account_ids: A vector of account IDs to collect from
    /// Returns: The total amount collected
    public fun batch_collect<CoinType>(
        sender: &signer,
        account_ids: vector<address>
    ): u128 {
        let total_collected: u128 = 0;
        let len = vector::length(&account_ids);
        let i = 0;
        
        while (i < len) {
            let account_id = *vector::borrow(&account_ids, i);
            let collected = drips::collect_for_account<CoinType>(account_id);
            total_collected = total_collected + collected;
            i = i + 1;
        };
        
        total_collected
    }

    /// Optimized batch splitting of funds
    /// This function splits funds for multiple accounts in a single operation
    /// Parameters:
    /// - account_ids: A vector of account IDs to split funds for
    /// Returns: The total amount split
    public fun batch_split<CoinType>(
        account_ids: vector<address>
    ): u128 {
        let total_split: u128 = 0;
        let len = vector::length(&account_ids);
        let i = 0;
        
        while (i < len) {
            let account_id = *vector::borrow(&account_ids, i);
            
            // Skip accounts that don't have a SplitsStore
            if (splits::exists_store(account_id)) {
                let receivers = splits::get_receivers(account_id);
                let (split_amount, _) = splits::split<CoinType>(account_id, receivers);
                total_split = total_split + split_amount;
            };
            
            i = i + 1;
        };
        
        total_split
    }

    /// Optimized validation of DripsConfig vector
    /// This function validates a vector of DripsConfig in a single pass
    /// Parameters:
    /// - sender_addr: The address of the sender
    /// - configs: A vector of DripsConfig to validate
    /// Returns: true if the configs are valid, false otherwise
    public fun validate_drips_configs(sender_addr: address, configs: &vector<DripsConfig>): bool {
        let len = vector::length(configs);
        
        // If the vector is empty, it's valid
        if (len == 0) {
            return true
        };
        
        // Check the first config
        let config = vector::borrow(configs, 0);
        if (config.amt_per_sec == 0 || config.duration == 0 || config.receiver == sender_addr) {
            return false
        };
        
        // Check the rest of the configs
        let i = 1;
        while (i < len) {
            let prev_config = vector::borrow(configs, i - 1);
            let curr_config = vector::borrow(configs, i);
            
            // Validate the current config
            if (curr_config.amt_per_sec == 0 || curr_config.duration == 0 || curr_config.receiver == sender_addr) {
                return false
            };
            
            // Check that receivers are sorted and there are no duplicates
            if (prev_config.receiver >= curr_config.receiver) {
                return false
            };
            
            i = i + 1;
        };
        
        true
    }

    /// Optimized validation of SplitsReceiver vector
    /// This function validates a vector of SplitsReceiver in a single pass
    /// Parameters:
    /// - sender_addr: The address of the sender
    /// - receivers: A vector of SplitsReceiver to validate
    /// - total_weight_limit: The maximum total weight allowed
    /// Returns: true if the receivers are valid, false otherwise
    public fun validate_splits_receivers(
        sender_addr: address,
        receivers: &vector<SplitsReceiver>,
        total_weight_limit: u32
    ): bool {
        let len = vector::length(receivers);
        
        // If the vector is empty, it's valid
        if (len == 0) {
            return true
        };
        
        // Calculate total weight and check for duplicates
        let total_weight: u32 = 0;
        
        // Check the first receiver
        let receiver = vector::borrow(receivers, 0);
        if (receiver.weight == 0 || receiver.receiver == sender_addr) {
            return false
        };
        total_weight = total_weight + receiver.weight;
        
        // Check the rest of the receivers
        let i = 1;
        while (i < len) {
            let prev_receiver = vector::borrow(receivers, i - 1);
            let curr_receiver = vector::borrow(receivers, i);
            
            // Validate the current receiver
            if (curr_receiver.weight == 0 || curr_receiver.receiver == sender_addr) {
                return false
            };
            
            // Check that receivers are sorted and there are no duplicates
            if (prev_receiver.receiver >= curr_receiver.receiver) {
                return false
            };
            
            // Add to total weight
            total_weight = total_weight + curr_receiver.weight;
            
            i = i + 1;
        };
        
        // Check total weight doesn't exceed maximum
        total_weight <= total_weight_limit
    }

    /// Optimized memory usage for storing multiple balances
    /// This function creates a compact representation of multiple balances
    /// Parameters:
    /// - addresses: A vector of addresses
    /// - balances: A vector of balances
    /// Returns: A vector of (address, balance) tuples
    public fun create_compact_balances(
        addresses: vector<address>,
        balances: vector<u128>
    ): vector<(address, u128)> {
        let result = vector::empty<(address, u128)>();
        let len = vector::length(&addresses);
        let i = 0;
        
        // Ensure the vectors have the same length
        error_handling::assert_with_error(
            len == vector::length(&balances),
            CATEGORY,
            E_INVALID_ARGUMENT
        );
        
        while (i < len) {
            let addr = *vector::borrow(&addresses, i);
            let balance = *vector::borrow(&balances, i);
            
            // Only store non-zero balances
            if (balance > 0) {
                vector::push_back(&mut result, (addr, balance));
            };
            
            i = i + 1;
        };
        
        result
    }

    /// Optimized calculation of cycle boundaries
    /// This function calculates the start and end timestamps of a cycle
    /// Parameters:
    /// - cycle: The cycle number
    /// - seconds_per_cycle: The number of seconds in a cycle
    /// Returns: (start_timestamp, end_timestamp)
    public fun calculate_cycle_boundaries(cycle: u64, seconds_per_cycle: u64): (u64, u64) {
        let start_timestamp = cycle * seconds_per_cycle;
        let end_timestamp = start_timestamp + seconds_per_cycle;
        (start_timestamp, end_timestamp)
    }

    /// Optimized calculation of cycles between timestamps
    /// This function calculates the number of complete cycles between two timestamps
    /// Parameters:
    /// - start_timestamp: The start timestamp
    /// - end_timestamp: The end timestamp
    /// - seconds_per_cycle: The number of seconds in a cycle
    /// Returns: The number of complete cycles
    public fun calculate_cycles_between(
        start_timestamp: u64,
        end_timestamp: u64,
        seconds_per_cycle: u64
    ): u64 {
        if (end_timestamp <= start_timestamp) {
            return 0
        };
        
        let time_diff = end_timestamp - start_timestamp;
        time_diff / seconds_per_cycle
    }
}