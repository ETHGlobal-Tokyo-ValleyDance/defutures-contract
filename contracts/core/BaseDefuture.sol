// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../utils/ERC721.sol";
import "../interfaces/core/IBaseDefuture.sol";

abstract contract BaseDefuture is IBaseDefuture, ERC721 {
    // use single slot
    struct Slot0 {
        uint16 minMarginBps;
        uint16 liquidateFactorBps;
        uint16 liquidatePaybackBps;
    }

    /// @dev this position means, pay "strike" of X(short) & buy "future" of Y(long) at maturity.
    struct Position {
        uint8 positionType; // various position type can exists. e.g. long A / short B / ...
        uint24 maturity;
        uint112 margin;
        uint112 strike;
        uint112 future;
    }

    Slot0 public slot0;
    bool private mutex;
    uint private _totalSupply = 0;

    // preset maturities by admin
    mapping (uint => address) public maturities;
    

    modifier lock() {
        require(!mutex, "DEFUTURE: LOCKED");
        mutex = true;
        _;
        mutex = false;
    }

    modifier onlyPositionOwner(uint positionId) {
        require(msg.sender == ownerOf(positionId), "DEFUTURE: !PositionOwner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint16 _minMarginBps,
        uint16 _liquidateFactorBps,
        uint16 _liquidatePaybackBps
    ) ERC721(_name, _symbol) {
        require(_minMarginBps > _liquidateFactorBps);
        slot0 = Slot0({
            minMarginBps: _minMarginBps,
            liquidateFactorBps: _liquidateFactorBps,
            liquidatePaybackBps: _liquidatePaybackBps
        });
    }

}