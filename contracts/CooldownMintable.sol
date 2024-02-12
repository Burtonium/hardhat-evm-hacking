// contracts/CoolDownMintable.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract CoolDownMintableERC1155 is ERC1155 {
    error CooldownNotFinished();
    error InvalidTokenId(uint256 tokenId);

    uint256 public constant COOLDOWN_DURATION = 1 days;

    mapping(address => uint256) public lastMintTime;

    constructor() ERC1155("") {}

    modifier checkMintableToken(uint256 tokenId) {
        if (tokenId > 5) {
            revert InvalidTokenId(tokenId);
        }
        _;
    }

    // Minting function with cooldown
    function mint(uint256 tokenId) public checkMintableToken(tokenId) {
        if (block.timestamp < lastMintTime[msg.sender] + COOLDOWN_DURATION) {
            revert CooldownNotFinished();
        }

        // Update the last mint time for the sender
        lastMintTime[msg.sender] = block.timestamp;

        // Mint the token
        _mint(msg.sender, tokenId, 1, "");
    }

    // Function that allows us to trade tokens 3, 2 and 1 for 6
    function tradeIn() public {
        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 1; // Token ID 1
        tokenIds[1] = 2; // Token ID 2
        tokenIds[2] = 3; // Token ID 3

        address[] memory users = new address[](3);
        users[0] = msg.sender; // User's address for Token ID 1
        users[1] = msg.sender; // User's address for Token ID 2
        users[2] = msg.sender; // User's address for Token ID 3

        uint256[] memory balances = balanceOfBatch(users, tokenIds);

        require(balances[0] >= 1, "Insufficient token 1 balance");
        require(balances[1] >= 2, "Insufficient token 2 balance");
        require(balances[2] >= 3, "Insufficient token 3 balance");

        _burn(msg.sender, 3, 3);
        _burn(msg.sender, 2, 2);
        _burn(msg.sender, 1, 1);

        _mint(msg.sender, 6, 1, "");
    }
}
