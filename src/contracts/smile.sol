// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SmileCredit {
    address public owner;
    mapping(address => uint256) public balances;

    event Credit(address indexed user, uint256 amount);
    event Donation(address indexed donor, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function creditUser(address user) external onlyOwner {
        require(user != address(0), "Invalid address");

        uint256 creditAmount = 0.01 ether;

        require(
            address(this).balance >= creditAmount,
            "Insufficient funds in contract"
        );

        balances[user] += creditAmount;

        emit Credit(user, creditAmount);
    }

    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");

        emit Donation(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(
            amount <= address(this).balance,
            "Insufficient balance to withdraw"
        );

        payable(owner).transfer(amount);
    }

    function checkBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        emit Donation(msg.sender, msg.value);
    }
}