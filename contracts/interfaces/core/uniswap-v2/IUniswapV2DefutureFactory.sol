// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title Interface of UniswapV2DefutureRouter
 * @notice
 *  100 USDC를 가지고, USDC + DOGE 풀에 헷징 전략으로 투자하는 경우
 *  base token: USDC
 *  farm token: DOGE
 */
interface IUniswapV2DefutureFactory {
    function getDefuture(address tokenA, address tokenB) external view returns (address pair);

    function owner() external view returns (address);
}
