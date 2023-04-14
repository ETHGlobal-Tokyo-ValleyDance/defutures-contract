// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Math.sol";

library DefutureLibrary {
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, "UniswapV2Library: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * (reserveB)) / reserveA;
    }
}
