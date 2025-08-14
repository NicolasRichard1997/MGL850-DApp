// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WhisperChainDApp {
    struct Promise {
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
    mapping(uint256 => Comment[]) private _comments;
    mapping(address => string) private _nicknames;

    event NicknameSet(address indexed user, string nickname);
    event PromiseAdded(uint256 index, string category);
    event CommentAdded(address indexed user, uint256 promiseIndex);

    // Ajouter un pseudonyme lié à l'adresse 
    function setNickname(string calldata _nickname) external {
        require(bytes(_nickname).length > 0, "Empty nickname");
        _nicknames[msg.sender] = _nickname;
        emit NicknameSet(msg.sender, _nickname);
    }

    // Retourne le pseudonyme lié à l'adresse
    function getNickname(address _user) external view returns (string memory) {
        return _nicknames[_user];
    }

    // Soumettre un promesse
    function addPromise(
        string calldata _message,
        string calldata _category,
        uint40 _timestamp
    ) external {
        require(bytes(_message).length > 0 && bytes(_message).length <= 140, "Invalid message");

        promises.push(Promise({
            message: _message,
            category: _category,
            timestamp: _timestamp
        }));

        emit PromiseAdded(promises.length - 1, _category);
    }

    // Permet de lire toutes les confessions enregistrées sur la blockchaine
    function getAllPromises() external view returns (Promise[] memory) {
        return promises;
    }

    // Ajouter un commentaire à une confession
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

     // Récupérer tous les commentaires pour une confession spécifique
    function getComments(uint256 _promiseIndex) external view returns (Comment[] memory) {
        return _comments[_promiseIndex];
    }
}
