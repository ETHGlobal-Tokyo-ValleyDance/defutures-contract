// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IUniswapV3DefutureFactory {
    function getDefuture(address tokenA, address tokenB) external view returns (address pair);

    function owner() external view returns (address);
}
