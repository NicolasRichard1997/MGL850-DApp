// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PromiseDApp {
    struct Promise {
        address user;
        string message;
        string category;
        uint256 timestamp;
    }

    Promise[] public promises;

    function addPromise(string memory _message, string memory _category) public {
        require(bytes(_message).length > 0, "Empty message");
        require(bytes(_message).length <= 140, "Message too long");
        require(bytes(_category).length > 0, "Category required");

        promises.push(Promise({
            user: msg.sender,
            message: _message,
            category: _category,
            timestamp: block.timestamp
        }));
    }

    function getAllPromises() public view returns (Promise[] memory) {
        return promises;
    }
}
