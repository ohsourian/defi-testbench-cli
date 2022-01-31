pragma solidity 0.5.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract TokenBase is ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable, Ownable {
    constructor (string memory name, string memory symbol, uint8 decimals) ERC20Detailed(name, symbol, decimals) public {}

    function supplyFund(address recipient, uint256 amount) public onlyOwner {
        _mint(recipient, amount);
    }
}
