// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;


interface IBaseDefuture {
    // metadatas
    function slot0() external view returns (uint16, uint16, uint16);
    
    // current future price: amount of X to buy "futureAmount" of Y
    function getFuturePrice(
        uint8 positionType,
        uint112 futureAmount
    ) external view returns (uint112);

    // whether margin is lower than minMargin
    function isLiquidatable(uint positionId) external view returns (bool);

    // force liquidate
    function liquidate(uint positionId) external;

    function totalSupply() external view returns (uint);
}