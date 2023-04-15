// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library UniswapV2DefutureLibrary {
    function getAmountIn(
        uint112 amountOut,
        uint112 reserveIn,
        uint112 reserveOut
    ) internal pure returns (uint112 amountIn) {
        uint numerator = uint(reserveIn) * amountOut * 1000;
        uint denominator = (reserveOut - amountOut) * 997; // swap 하려고 넣은 토큰의 0.03% 수수료를 뺀다.
        amountIn = uint112(numerator / denominator + 1);
    }

    // Expand functionality
    function getAmountOut(
        uint112 amountIn,
        uint112 reserveIn,
        uint112 reserveOut
    ) internal pure returns (uint112 amountOut) {
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = amountInWithFee + reserveIn * 1000;
        amountOut = uint112(numerator / denominator);
    }

    function getStrikeAmount(
        uint112 _leadingBuy,
        uint112 _leadingSell,
        uint112 _amountBuy
    ) internal pure returns (uint112) {
        // 20X -> 100Y
        // 100Y ->
        return
            ((getAmountIn(_amountBuy * 2, _leadingSell, _leadingBuy) -
                getAmountIn(_amountBuy, _leadingSell, _leadingBuy)) * 1000) / 997;
    }
}
