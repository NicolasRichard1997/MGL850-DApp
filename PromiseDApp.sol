// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PromiseDApp {
    struct Promise {
        address user;
        string message;
        string category;
        uint40 timestamp;
    }

    struct Comment {
        address user;
        string message;
        uint40 timestamp;
    }

    Promise[] public promises;

    // Use mappings instead of nested dynamic arrays to reduce gas on reads
    mapping(uint256 => Comment[]) private _comments;
    mapping(address => string) private _nicknames;

    event NicknameSet(address indexed user, string nickname);
    event PromiseAdded(address indexed user, uint256 index, string category);
    event CommentAdded(address indexed user, uint256 promiseIndex);

    function setNickname(string calldata _nickname) external {
        require(bytes(_nickname).length > 0, "Empty nickname");
        _nicknames[msg.sender] = _nickname;
        emit NicknameSet(msg.sender, _nickname);
    }

    function getNickname(address _user) external view returns (string memory) {
        return _nicknames[_user];
    }

    function addPromise(string calldata _message, string calldata _category) external {
        require(bytes(_message).length > 0 && bytes(_message).length <= 140, "Invalid message");

        promises.push(Promise({
            user: msg.sender,
            message: _message,
            category: _category,
            timestamp: uint40(block.timestamp)
        }));

        emit PromiseAdded(msg.sender, promises.length - 1, _category);
    }

    function getAllPromises() external view returns (Promise[] memory) {
        return promises;
    }

    function addComment(uint256 _promiseIndex, string calldata _message) external {
        require(_promiseIndex < promises.length, "Invalid index");
        require(bytes(_message).length > 0 && bytes(_message).length <= 200, "Invalid comment");

        _comments[_promiseIndex].push(Comment({
            user: msg.sender,
            message: _message,
            timestamp: uint40(block.timestamp)
        }));

        emit CommentAdded(msg.sender, _promiseIndex);
    }

    function getComments(uint256 _promiseIndex) external view returns (Comment[] memory) {
        return _comments[_promiseIndex];
    }
}
