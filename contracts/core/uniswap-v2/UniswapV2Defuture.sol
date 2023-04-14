// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../BaseDefuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2Defuture.sol";

abstract contract UniswapV2Defuture is BaseDefuture, IUniswapV2Defuture {
    enum PositionType {
        BUY0,
        BUY1
    }

    address public token0;
    address public token1;
    address public pair;
    address public WETH;

    function addPosition(address buyToken, address sellToken, address to, uint margin, uint deadline) public {}

    function closePosition(uint positionId, address to, uint deadline) public {}

    constructor(
        uint16 _minMarginBps,
        uint16 _liquidateFactorBps,
        uint16 _liquidatePaybackBps,
        address _pair,
        address _WETH
    ) BaseDefuture("UniswapV2 Defuture", "UNI2DF", _minMarginBps, _liquidateFactorBps, _liquidatePaybackBps) {}
}
