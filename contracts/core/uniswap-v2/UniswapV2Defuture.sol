// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../BaseDefuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2Defuture.sol";
import "../../uniswap-v2/core/interfaces/IUniswapV2Pair.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2DefutureFactory.sol";
import "../../libraries/SafeToken.sol";
import "./UniswapV2DefutureLibrary.sol";

contract UniswapV2Defuture is BaseDefuture, IUniswapV2Defuture {
    enum PositionType {
        BUY0,
        BUY1
    }

    address public token0;
    address public token1;
    address public pair;
    address public factory;
    uint112 private leading0;
    uint112 private leading1;
    uint32 private timestampLastSync;

    event Sync(uint112 leading0, uint112 leading1, uint beforeK);

    constructor() BaseDefuture("UniswapV2 Defuture", "UNI2DF", 1000, 1000, 1000) {}

    function initialize(
        // uint16 _minMarginBps,
        // uint16 _liquidateFactorBps,
        // uint16 _liquidatePaybackBps,
        address _pair
    ) public {
        token0 = IUniswapV2Pair(_pair).token0();
        token1 = IUniswapV2Pair(_pair).token1();
        pair = _pair;
        factory = msg.sender;
        (leading0, leading1, timestampLastSync) = IUniswapV2Pair(_pair).getReserves();
    }

    modifier onlyOwner() {
        require(msg.sender == IUniswapV2DefutureFactory(factory).owner(), "only owner");
        _;
    }
    modifier onlyLiquidator() {
        require(isLiquidator[msg.sender] == true, "only liquidator");
        _;
    }

    // 선물시장에서 가격을 측정하기 위한 지표.
    // leading은 Uniswap의 reserve에 대응된다.
    function getLeadings() public view returns (uint112 _leading0, uint112 _leading1, uint32 _timestampLastSync) {
        _leading0 = leading0;
        _leading1 = leading1;
        _timestampLastSync = timestampLastSync;
    }

    function getFuturePrice(uint8 positionType, uint112 future) public view override returns (uint112 price) {
        (uint112 _leadingSell, uint112 _leadingBuy, ) = getLeadings();
        if (isBuy0(positionType)) (_leadingSell, _leadingBuy) = (_leadingBuy, _leadingSell);

        // return getStrikeAmount(_leadingBuy, _leadingSell, future);
        return UniswapV2DefutureLibrary.getAmountIn(future, _leadingSell, _leadingBuy);
    }

    function addPosition(address to, bool buy0, uint112 amountBuy, uint112 marginWithFee) public override {
        Slot0 memory _slot0 = slot0;

        (uint112 _leadingSell, uint112 _leadingBuy) = sync();
        if (buy0) (_leadingSell, _leadingBuy) = (_leadingBuy, _leadingSell);

        // 100Y를 살 수 있는 권리를 사고 싶은데, 얼마야?
        // -> 선물 가격

        uint112 strike = UniswapV2DefutureLibrary.getStrikeAmount(_leadingBuy, _leadingSell, amountBuy);
        uint112 margin = (marginWithFee * 997) / 1000;
        require(margin >= (strike * _slot0.minMarginBps) / 1E4, "DEFUTURE: MARGIN SHORTAGE");

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

        // TODO: Logic for maturity input
        _mintPosition(to, uint8(buy0 ? PositionType.BUY0 : PositionType.BUY1), margin, strike, amountBuy, 1);
    }

    function _addMargin(uint positionId, uint112 amount) public {
        Position memory p = positions[positionId];
        SafeToken.safeTransferFrom(isBuy0(p.positionType) ? token1 : token0, msg.sender, address(this), amount);
        uint112 currentMargin = p.margin + (amount * 997) / 1000;
        positions[positionId].margin = currentMargin;
        emit AddMargin(msg.sender, positionId, amount, currentMargin);
    }

    function _closePosition(Position memory p, uint112 payback, uint112 futurePrice, address to) private {
        // token0을 사는 것이었으면, 구매 당시 leading0이(-) 되고 leading1이(+) 되었을 것
        // 포지션 종료 시에는 반대로 계산한다. 이때 token0에 대응되는 양은 futureAmount, token1은 futurePrice
        // TODO: 컨트랙트 내 잔고가 부족하다면?
        if (isBuy0(p.positionType)) {
            if (payback > 0) SafeToken.safeTransfer(token1, to, payback);
            // buy token0 Futures
            leading0 += p.future;
            leading1 -= futurePrice;
        } else {
            if (payback > 0) SafeToken.safeTransfer(token0, to, payback);
            // buy token1 Futures
            leading0 -= futurePrice;
            leading1 += p.future;
        }
    }

    function clear(uint positionId, address to) external onlyPositionOwner(positionId) lock returns (uint) {
        Position memory p = positions[positionId];
        uint112 futurePrice = getFuturePrice(p.positionType, p.future);
        require((p.margin + futurePrice) > p.strike, "DEFUTURE: LIQUIDATE TARGET");
        _closePosition(p, p.margin + futurePrice - p.strike, futurePrice, to);
        _burnPosition(positionId);
        return uint(p.margin + futurePrice - p.strike);
    }

    function isLiquidatable(uint positionId) public view override returns (bool) {
        if (!_exists(positionId)) return false;
        Slot0 memory _slot0 = slot0;
        Position memory p = positions[positionId];

        uint112 futurePrice = getFuturePrice(p.positionType, p.future);

        // virtualMargin = p.margin + futurePrice - p.strike <= futurePrice * liquidateFactorBps / 1E4;
        return p.margin + ((futurePrice * (1E4 - _slot0.liquidateFactorBps)) / 1E4) <= p.strike;
    }

    function liquidate(uint positionId) public override lock onlyLiquidator {
        require(_exists(positionId), "DEFUTURE: !POSITION");

        Position memory p = positions[positionId];

        (, uint16 liquidateFactorBps, uint16 liquidatePaybackBps) = this.slot0();
        uint112 futurePrice = getFuturePrice(p.positionType, p.future);

        // virtualMargin = p.margin + futurePrice - p.strike <= futurePrice * liquidateFactorBps / 1E4;
        require(p.margin + ((futurePrice * (1E4 - liquidateFactorBps)) / 1E4) <= p.strike, "DEFUTURE: !LIQUIDATABLE");

        // 청산당한 경우, margin의 일부분을 돌려준다.
        // 단, virtualMargin > 0인 경우에 한함 (virtualMargin < 0인 경우는 프로토콜에 손해임)
        _closePosition(
            p,
            p.margin + futurePrice > p.strike ? (p.margin * liquidatePaybackBps) / 1E4 : 0,
            futurePrice,
            _ownerOf(positionId)
        );
        _burnPosition(positionId);

        emit Liquidated(_ownerOf(positionId), positionId, p.positionType, p.margin, futurePrice);
    }

    function withdraw(address farm, uint amountToken1) external onlyOwner {
        SafeToken.safeTransfer(farm, msg.sender, amountToken1);
    }

    function sync() public returns (uint112 _leading0, uint112 _leading1) {
        (uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(pair).getReserves();

        (uint112 _prevLeading0, uint112 _prevLeading1, ) = getLeadings();

        _leading0 = uint112(Math.sqrt((uint(reserve0) * reserve1 * _prevLeading0) / _prevLeading1));
        _leading1 = uint112(Math.sqrt((uint(reserve0) * reserve1 * _prevLeading1) / _prevLeading0));

        timestampLastSync = uint32(block.timestamp);

        leading0 = _leading0;
        leading1 = _leading1;

        emit Sync(_leading0, _leading1, uint(_leading0) * _leading1);
    }

    function isBuy0(uint8 positionType) internal pure returns (bool) {
        return positionType == uint8(PositionType.BUY0);
    }
}
