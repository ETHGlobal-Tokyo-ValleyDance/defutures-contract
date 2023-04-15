// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../BaseDefuture.sol";
import "../../interfaces/core/uniswap-v3/IUniswapV3Defuture.sol";
import "../../libraries/DefutureLibrary.sol";
import "../../uniswap-v3/core/interfaces/IUniswapV3Pool.sol";
import "../../interfaces/core/uniswap-v3/IUniswapV3DefutureFactory.sol";
import "../../interfaces/utils/IERC20Minimal.sol";
import "../../libraries/SafeToken.sol";

contract UniswapV3Defuture is BaseDefuture, IUniswapV3Defuture {
    enum PositionType {
        BUY0,
        BUY1
    }

    address public token0;
    address public token1;
    address public pool;
    address public WETH;
    address public factory;
    uint112 private leading0; // uses single storage slot, accessible via getLeadings
    uint112 private leading1; // us es single storage slot, accessible via getLeadings
    uint32 private timestampLastSync; // uses single storage slot, accessible via getLeadings

    uint public RESTAKE_FACTOR = 5;

    event Sync(uint112 leading0, uint112 leading1, uint beforeK);

    constructor(
        uint16 _minMarginBps,
        uint16 _liquidateFactorBps,
        uint16 _liquidatePaybackBps,
        address _pool,
        address _WETH
    ) BaseDefuture("Defuture", "UNIDF", _minMarginBps, _liquidateFactorBps, _liquidatePaybackBps) {
        WETH = _WETH;
        token0 = IUniswapV3Pool(_pool).token0();
        token1 = IUniswapV3Pool(_pool).token1();
        pool = _pool;
        factory = msg.sender;
        (bool success, bytes memory data) = token0.staticcall(
            abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, pool)
        );
        require(success && data.length >= 32);
        leading0 = abi.decode(data, (uint112));

        (success, data) = token1.staticcall(abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, pool));
        require(success && data.length >= 32);
        leading1 = abi.decode(data, (uint112));
    }

    modifier onlyOwner() {
        require(msg.sender == IUniswapV3DefutureFactory(factory).owner(), "only owner");
        _;
    }
    modifier onlyLiquidator() {
        require(isLiquidator[msg.sender] == true, "only liquidator");
        _;
    }

    function getAmountIn(
        uint112 amountOut,
        uint112 reserveIn,
        uint112 reserveOut
    ) internal pure returns (uint112 amountIn) {
        uint numerator = uint(reserveIn) * amountOut * 1000;
        uint denominator = (reserveOut - amountOut) * 997; // swap 하려고 넣은 토큰의 0.03% 수수료를 뺀다.
        amountIn = uint112(numerator / denominator + 1);
    }

    function getAmountOut(
        uint112 amountIn,
        uint112 reserveIn,
        uint112 reserveOut
    ) public pure returns (uint112 amountOut) {
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = amountInWithFee + reserveIn * 1000;
        amountOut = uint112(numerator / denominator);
    }

    // 선물시장에서 가격을 측정하기 위한 지표.
    // leading은 Uniswap의 reserve에 대응된다.
    function getLeadings() public view returns (uint112 _leading0, uint112 _leading1, uint32 _timestampLastSync) {
        _leading0 = leading0;
        _leading1 = leading1;
        _timestampLastSync = timestampLastSync;
    }

    function getStrikeAmount(
        uint112 _leadingBuy,
        uint112 _leadingSell,
        uint112 _amountBuy
    ) public pure returns (uint112) {
        // 20X -> 100Y
        // 100Y -> 30X
        return
            getAmountIn(_amountBuy * 2, _leadingSell, _leadingBuy) - getAmountIn(_amountBuy, _leadingSell, _leadingBuy);
    }

    /**
     * @dev 포지션의 현재 선물 가격
     */
    function getFuturePrice(uint8 positionType, uint112 future) public view override returns (uint112 price) {
        (uint112 _leadingSell, uint112 _leadingBuy, ) = getLeadings();
        if (isBuy0(positionType)) (_leadingSell, _leadingBuy) = (_leadingBuy, _leadingSell);

        return getStrikeAmount(_leadingBuy, _leadingSell, future);
    }

    /// @notice margin을 유저가 선택할 수 있다.
    function addPosition(address to, bool buy0, uint112 amountBuy, uint112 marginWithFee) public override {
        Slot0 memory _slot0 = slot0;

        (uint112 _leadingSell, uint112 _leadingBuy) = sync();
        if (buy0) (_leadingSell, _leadingBuy) = (_leadingBuy, _leadingSell);

        // 100Y를 살 수 있는 권리를 사고 싶은데, 얼마야?
        // -> 선물 가격

        uint112 strike = getStrikeAmount(_leadingBuy, _leadingSell, amountBuy);
        uint112 margin = (marginWithFee * 997) / 1000;
        require(margin >= (strike * _slot0.minMarginBps) / 1E4, "DEFUTURE: MARGIN SHORTAGE");

        if (buy0) {
            SafeToken.safeTransferFrom(token1, msg.sender, address(this), marginWithFee);
            // buy token0 Futures
            leading0 -= uint112(amountBuy);
            leading1 += (strike * 1000) / 997;
        } else {
            SafeToken.safeTransferFrom(token0, msg.sender, address(this), marginWithFee);
            // buy token1 Futures
            leading0 += (strike * 1000) / 997;
            leading1 -= uint112(amountBuy);
        }

        _mintPosition(to, uint8(buy0 ? PositionType.BUY0 : PositionType.BUY1), margin, strike, amountBuy, 1);
    }

    function addMargin(uint positionId, uint112 amount) public {
        Position memory p = positions[positionId];
        SafeToken.safeTransferFrom(isBuy0(p.positionType) ? token1 : token0, msg.sender, address(this), amount);
        uint112 currentMargin = p.margin + (amount * 997) / 1000;
        positions[positionId].margin = currentMargin;
        emit AddMargin(msg.sender, positionId, amount, currentMargin);
    }

    // 포지션 종료로 인한 leading 값 재설정
    // 스스로 포지션 정리하는 경우 payback = virtualMargin
    // 청산당하는 경우 max(virtualMargin * liquidatePaybackBps / 1E4, 0)
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
        require(p.margin + futurePrice > p.strike, "DEFUTURE: LIQUIDATE TARGET");

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
        require(isLiquidator[msg.sender], "DEFUTURE: !LIQUIDATOR");

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

    function withdraw(uint amountToken0, uint amountToken1) external onlyOwner {
        SafeToken.safeTransfer(token0, msg.sender, amountToken0);
        SafeToken.safeTransfer(token1, msg.sender, amountToken1);
    }

    /// @dev sync k value to adjust impermenant loss due to the price impact
    function sync() public returns (uint112 _leading0, uint112 _leading1) {
        (bool success, bytes memory data) = token0.staticcall(
            abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, pool)
        );
        require(success && data.length >= 32);
        uint reserve0 = abi.decode(data, (uint112));

        (success, data) = token1.staticcall(abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, pool));
        require(success && data.length >= 32);
        uint reserve1 = abi.decode(data, (uint112));
        ///@dev Current Period already registered
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
