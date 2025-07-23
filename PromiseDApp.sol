// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PromiseDApp {
    struct Promise {
        address user;
        string message;
        uint256 timestamp;
    }

    Promise[] public promises;

    function addPromise(string memory _message) public {
        require(bytes(_message).length > 0, "Empty message");
        require(bytes(_message).length <= 140, "Message too long");

        promises.push(Promise({
            user: msg.sender,
            message: _message,
            timestamp: block.timestamp
        }));
    }

    function getAllPromises() public view returns (Promise[] memory) {
        return promises;
    }
}
