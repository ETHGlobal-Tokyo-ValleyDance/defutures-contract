// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../BaseDefuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2Defuture.sol";
import "../../uniswap-v2/core/interfaces/IUniswapV2Pair.sol";

abstract contract UniswapV2Defuture is BaseDefuture, IUniswapV2Defuture {
    enum PositionType {
        BUY0,
        BUY1
    }

    uint leading0;
    uint leading1;
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

    function addPosition(address to, bool buy0, uint112 amountBuy, uint112 marginWithFee) public override {
        Slot0 memory _slot0 = slot0;

        uint112 strike = getStrikeAmount(_leadingBuy, _leadingSell, amountBuy);
        uint112 margin = (marginWithFee * 997) / 1000;
        require(margin >= (strike * _slot0.minMarginBps) / 1E4, "DEFUTURE: MARGIN SHORTAGE");

        // sync K ?

        if (buy0) {
            SafeToken.safeTransferFrom(token1, msg.sender, address(this), marginWithFee);
            // buy token0 Futures
            leading0 -= uint112(amountBuy);
            leading1 += (strike * 997) / 1000;
        } else {
            SafeToken.safeTransferFrom(token0, msg.sender, address(this), marginWithFee);
            // buy token1 Futures
            leading0 += (strike * 997) / 1000;
            leading1 -= uint112(amountBuy);
        }

        _mintPosition(to, uint8(buy0 ? PositionType.BUY0 : PositionType.BUY1), margin, strike, amountBuy);
    }

    function closePosition(uint positionId, address to, uint deadline) public {}

    function getStrikeAmount(uint _leadingBuy, uint _leadingSell, uint _amountBuy) public returns (uint) {}

    // getFuturePrice -> getStrikeAmount ?

    function clear(uint positionId, address to) external returns (uint) {
        Position memory p = positions[positionId];
        uint futurePrice = getFuturePrice(p.positionType, p.future);
        closePosition(positionId, to, futurePrice);
        _burnPosition(positionId);
        return uint(p.margin + futurePrice / p.strike);
    }

    // TODO:
    function liquidate(uint positionId) public override {}
}
