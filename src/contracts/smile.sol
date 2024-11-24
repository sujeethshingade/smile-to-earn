// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SmileReward is Ownable, ReentrancyGuard {
    uint256 public constant REWARD_AMOUNT = 0.01 ether;

    event Rewarded(address indexed user, uint256 amount);
    event Donated(address indexed donor, uint256 amount);

    receive() external payable {
        emit Donated(msg.sender, msg.value);
    }

    function donate() public payable {
        require(msg.value > 0, "Must donate some ETH");
        emit Donated(msg.sender, msg.value);
    }

    function rewardSmile(address user) public nonReentrant {
        require(
            address(this).balance >= REWARD_AMOUNT,
            "Insufficient contract balance"
        );

        lastReward[user] = block.timestamp;
        (bool success, ) = user.call{value: REWARD_AMOUNT}("");
        require(success, "Transfer failed");

        emit Rewarded(user, REWARD_AMOUNT);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }
}