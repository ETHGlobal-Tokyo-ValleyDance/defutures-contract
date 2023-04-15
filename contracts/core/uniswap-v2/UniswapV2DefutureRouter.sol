// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../libraries/Math.sol";
import "../../libraries/SafeToken.sol";
import "./UniswapV2Defuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2Defuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2DefutureRouter.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2DefutureFactory.sol";
import "../../interfaces/utils/IERC20.sol";
import "../../interfaces/utils/IWETH.sol";
import "../../uniswap-v2/periphery/interfaces/IUniswapV2Router02.sol";

error Defuture__Expired();

contract UniswapV2DefutureRouter is IUniswapV2DefutureRouter {
    address public immutable override factory;
    address public immutable override router;

    address public immutable override defutureFactory;
    address public immutable override WETH;

    constructor(address router_, address defutureFactory_, address WETH_) {
        router = router_;
        factory = IUniswapV2Router02(router_).factory();
        defutureFactory = defutureFactory_;
        WETH = WETH_;
    }

    modifier ensure(uint deadline) {
        if (deadline < block.timestamp) {
            revert Defuture__Expired();
        }
        _;
    }

    receive() external payable {
        assert(msg.sender == WETH);
    }

    function addPosition(
        address buyToken,
        address sellToken,
        address to,
        uint112 amountBuy,
        uint112 marginWithFee,
        uint deadline
    ) public override ensure(deadline) {
        address defuture = IUniswapV2DefutureFactory(defutureFactory).getDefuture(buyToken, sellToken);
        SafeToken.safeTransferFrom(sellToken, msg.sender, address(this), marginWithFee);
        SafeToken.safeApprove(sellToken, defuture, marginWithFee);

        IUniswapV2Defuture(defuture).addPosition(to, buyToken < sellToken, amountBuy, marginWithFee);
    }

    function getSwapAmountForAddLiquidity(
        address base,
        address farm,
        uint amount
    ) internal pure returns (uint swapAmount) {
        swapAmount = amount / 2;
    }

    function addLiquidityHedged(
        address baseToken,
        address farmToken,
        address to,
        uint spotAmount,
        uint hedgeAmount
    ) public override {
        // 90$ 중에 얼마의 USDC를 DOGE로 바꿀것인가
        uint farmAmountToSwap = getSwapAmountForAddLiquidity(baseToken, farmToken, spotAmount);
        // addLiquidity할 USDC
        uint stakeBaseAmount = spotAmount - farmAmountToSwap;
        uint[] memory amounts;
        {
            address[] memory path = new address[](2);
            path[0] = baseToken;
            path[1] = farmToken;
            amounts = IUniswapV2Router02(router).swapExactTokensForTokens(
                farmAmountToSwap + hedgeAmount,
                1,
                path,
                address(this),
                block.timestamp
            );
        }

        (, uint addedFarm, ) = IUniswapV2Router02(router).addLiquidity(
            baseToken,
            farmToken,
            stakeBaseAmount,
            amounts[1],
            1,
            1,
            to,
            block.timestamp
        );

        uint totalMargin = amounts[1] - addedFarm;

        address defuture = IUniswapV2DefutureFactory(defutureFactory).getDefuture(baseToken, farmToken);
        IUniswapV2Defuture(defuture).addPosition(
            to,
            baseToken < farmToken,
            uint112(stakeBaseAmount),
            uint112(totalMargin)
        );
    }

    // function addPositionETH(
    //     address token,
    //     address to,
    //     bool buyETH,
    //     uint112 amountBuy,
    //     uint112 margin,
    //     uint deadline
    // ) public override {
    //     // MORE...
    // }
}
