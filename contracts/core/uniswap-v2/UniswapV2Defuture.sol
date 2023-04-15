// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../BaseDefuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2Defuture.sol";
import "../../uniswap-v2/core/interfaces/IUniswapV2Pair.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2DefutureFactory.sol";
import "../../libraries/SafeToken.sol";

abstract contract UniswapV2Defuture is BaseDefuture, IUniswapV2Defuture {
    enum PositionType {
        BUY0,
        BUY1
    }

    address public token0;
    address public token1;
    address public pair;
    address public WETH;
    address public factory;
    uint112 private leading0;
    uint112 private leading1;
    uint32 private timestampLastSync;

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

    modifier onlyOwner() {
        require(msg.sender == IUniswapV2DefutureFactory(factory).owner(), "only owner");
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

    function getStrikeAmount(
        uint112 _leadingBuy,
        uint112 _leadingSell,
        uint112 _amountBuy
    ) public view returns (uint112) {
        // 20X -> 100Y
        // 100Y ->
        return
            ((getAmountIn(_amountBuy * 2, _leadingSell, _leadingBuy) -
                getAmountIn(_amountBuy, _leadingSell, _leadingBuy)) * 1000) / 997;
    }

    function addPosition(address to, bool buy0, uint112 amountBuy, uint112 marginWithFee) public override {
        Slot0 memory _slot0 = slot0;

        (uint112 _leadingSell, uint112 _leadingBuy) = sync();
        if (buy0) (_leadingSell, _leadingBuy) = (_leadingBuy, _leadingSell);

        // 100Y를 살 수 있는 권리를 사고 싶은데, 얼마야?
        // -> 선물 가격

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
        // NFT 민팅추가 기능
    }

    // 선물시장에서 가격을 측정하기 위한 지표.
    // leading은 Uniswap의 reserve에 대응된다.
    function getLeadings() public view returns (uint112 _leading0, uint112 _leading1, uint32 _timestampLastSync) {
        _leading0 = leading0;
        _leading1 = leading1;
        _timestampLastSync = timestampLastSync;
    }

    function closePosition(uint positionId, address to, uint deadline) public {}

    function getStrikeAmount(uint _leadingBuy, uint _leadingSell, uint _amountBuy) public returns (uint) {}

    // getFuturePrice -> getStrikeAmount ?

    function clear(uint positionId, address to) external returns (uint) {
        Position memory p = positions[positionId];
        // uint futurePrice = getFuturePrice(p.positionType, p.future);
        // closePosition(positionId, to, futurePrice);
        // _burnPosition(positionId);
        // return uint(p.margin + futurePrice / p.strike);
    }

    // TODO:
    function liquidate(uint positionId) public override {}

    function sync() public returns (uint112 _leading0, uint112 _leading1) {
        (uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(pair).getReserves();
        if (token0 < token1) {
            _leading0 = reserve0;
            _leading1 = reserve1;
        } else {
            _leading0 = reserve1;
            _leading1 = reserve0;
        }

        (uint112 _prevLeading0, uint112 _prevLeading1) = getLeadings();

        // LOGIC BEHIND

        // 1. 레이징이 일어나면, 레이징이 일어난 쪽의 리딩이 늘어나고, 레이징이 일어나지 않은 쪽의 리딩은 줄어든다.
        // 2. 레이징이 일어나지 않으면, 레이징이 일어나지 않은 쪽의 리딩은 줄어들고, 레이징이 일어난 쪽의 리딩은 늘어난다.

        _leading0 = _leading0;
        _leading1 = _leading1;

        // Return

        timestampLastSync = uint32(block.timestamp);

        leading0 = _leading0;
        leading1 = _leading1;
    }
}
