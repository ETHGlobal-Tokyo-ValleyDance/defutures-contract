// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUniswapV2Defuture {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function pair() external view returns (address);

    function addPosition(address to, bool buy0, uint112 amountBuy, uint112 marginWithFee) external;

    function clear(uint positionId, address to) external returns (uint);

    function getLeadings() external view returns (uint112 _leading0, uint112 _leading1, uint32 _timestampLastSync);
}
