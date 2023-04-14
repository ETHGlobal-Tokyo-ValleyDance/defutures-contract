// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../BaseDefuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2Defuture.sol";
import "../../uniswap-v2/core/UniswapV2Pair.sol";

abstract contract UniswapV2Defuture is BaseDefuture, IUniswapV2Defuture {
    enum PositionType {
        BUY0,
        BUY1
    }

    address public token0;
    address public token1;
    address public pair;
    address public factory;
    address public WETH;

    constructor(
        uint16 _minMarginBps,
        uint16 _liquidateFactorBps,
        uint16 _liquidatePaybackBps,
        address _pair,
        address _WETH
    ) BaseDefuture("UniswapV2 Defuture", "UNI2DF", _minMarginBps, _liquidateFactorBps, _liquidatePaybackBps) {
        WETH = _WETH;
        token0 = IUniswapV2Pair(pair).token0();
        token1 = IUniswapV2Pair(pair).token1();
        pair = _pair;
        factory = msg.sender;
    }

    function addPosition(address buyToken, address sellToken, address to, uint margin, uint deadline) public {}

    function closePosition(uint positionId, address to, uint deadline) public {}

    function getStrikeAmount(uint _leadingBuy, uint _leadingSell, uint _amountBuy) public returns (uint) {}

    // getFuturePrice -> getStrikeAmount ?

    function clear(uint positionId, address to) external returns (uint) {}

    // TODO:
    function liquidate(uint positionId) public override {}
}
