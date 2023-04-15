// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IUniswapV3Defuture {
    function addPosition(address to, bool buy0, uint112 amountBuy, uint112 marginWithFee) external;

    function clear(uint positionId, address to) external returns (uint);

    function getLeadings()
        external
        view
        returns (uint112 _leading0, uint112 _leading1, uint32 _timestampLastSync);

    function addMargin(uint positionId, uint112 amount) external;
}
