// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IUniswapV3DefutureRouter {
    function factory() external view returns (address);

    function swapRouter() external view returns (address);

    function positionManager() external view returns (address);

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

    // function addPositionETH(
    //     address token,
    //     address to,
    //     bool buyETH,
    //     uint112 amountBuy,
    //     uint112 margin,
    //     uint deadline
    // ) external;
    function clearPosition(address baseToken, address farmToken, uint positioinId, address to) external;

    function addLiquidityHedged(
        address baseToken,
        address farmToken,
        address to,
        uint spotAmount,
        uint hedgeAmount,
        int24 tickLower,
        int24 tickUpper,
        uint24 fee
    ) external returns (uint tokenId);
    //function addLiquidityHedged(HedgeParams calldata params) external returns (uint tokenId);
}
