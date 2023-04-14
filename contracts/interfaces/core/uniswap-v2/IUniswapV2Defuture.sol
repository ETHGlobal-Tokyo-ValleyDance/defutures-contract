// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUniswapV2Defuture {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function pair() external view returns (address);
}