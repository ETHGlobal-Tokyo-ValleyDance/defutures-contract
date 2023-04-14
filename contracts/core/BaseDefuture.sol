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
    mapping(uint => address) public maturities;
    mapping(uint => Position) public positions;
    mapping(address => bool) public isLiquidator;
    /** TODO: REMOVE */
    mapping(address => uint[]) public positionIdOf;

    /***** EVENTS *****/
    event AddPosition(
        address indexed owner,
        uint positionId,
        uint8 positionType,
        uint112 margin,
        uint112 strike,
        uint112 future
    );
    event ClosePosition(
        address indexed owner,
        uint positionId,
        uint8 positionType,
        uint112 margin,
        uint112 strike,
        uint112 future
    );
    event Liquidated(
        address indexed owner,
        uint positionId,
        uint8 positionType,
        uint112 margin,
        uint112 futurePrice
    );
    event ChangeLiquidatorStatus(address liquidator, bool status);

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

    function totalSupply() public view returns (uint) {
        return _totalSupply;
    }

    function getFuturePrice(
        uint8 positionType,
        uint112 future
    ) external view virtual override returns (uint112);

    function isLiquidatable(
        uint positionId
    ) external view virtual override returns (bool);

    function liquidate(uint positionId) external virtual override;

    function changeLiquidatorStatus(
        address[] calldata _liquidators,
        bool status
    ) external {
        for (uint i = 0; i < _liquidators.length; i++) {
            isLiquidator[_liquidators[i]] = status;
            emit ChangeLiquidatorStatus(_liquidators[i], status);
        }
    }
}
