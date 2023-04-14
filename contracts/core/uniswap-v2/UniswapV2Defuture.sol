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
}