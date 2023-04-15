// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title Interface of UniswapV2DefutureRouter
 * @notice
 *  100 USDC를 가지고, USDC + DOGE 풀에 헷징 전략으로 투자하는 경우
 *  base token: USDC
 *  farm token: DOGE
 */
interface IUniswapV2DefutureRouter {
    function factory() external view returns (address);

    function router() external view returns (address);

    function defutureFactory() external view returns (address);

    function WETH() external view returns (address);

    function addPosition(
        address buyToken,
        address sellToken,
        address to,
        uint112 amountBuy,
        uint112 margin,
        uint deadline
    ) external;
}
