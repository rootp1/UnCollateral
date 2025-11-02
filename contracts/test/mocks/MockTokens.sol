// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing (6 decimals)
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "MUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

/**
 * @title MockWETH
 * @dev Mock Wrapped Ether for testing (18 decimals)
 */
contract MockWETH is ERC20 {
    constructor() ERC20("Mock Wrapped Ether", "MWETH") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }
}

/**
 * @title MockDAI
 * @dev Mock DAI token for testing (18 decimals)
 */
contract MockDAI is ERC20 {
    constructor() ERC20("Mock Dai Stablecoin", "MDAI") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title MockWBTC
 * @dev Mock Wrapped Bitcoin for testing (8 decimals)
 */
contract MockWBTC is ERC20 {
    constructor() ERC20("Mock Wrapped Bitcoin", "MWBTC") {}

    function decimals() public pure override returns (uint8) {
        return 8;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
