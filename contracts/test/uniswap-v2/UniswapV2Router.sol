// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (token/ERC20/ERC20.sol)

pragma solidity =0.6.6;

import "@uniswap/v2-periphery/contracts/UniswapV2Router01.sol";

contract V2Router is UniswapV2Router01 {
    constructor(
        address _factory,
        address _WETH
    ) public UniswapV2Router01(_factory, _WETH) {}
}
