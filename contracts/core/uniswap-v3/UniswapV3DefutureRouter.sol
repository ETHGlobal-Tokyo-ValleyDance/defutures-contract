// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libraries/Math.sol";
import "../../libraries/SafeToken.sol";
import "./UniswapV3Defuture.sol";
import "../../interfaces/core/uniswap-v3/IUniswapV3DefutureRouter.sol";
import "../../interfaces/core/uniswap-v3/IUniswapV3Defuture.sol";
import "../../interfaces/core/uniswap-v3/IUniswapV3DefutureFactory.sol";
import "../../interfaces/utils/IERC20.sol";
import "../../interfaces/utils/IWETH.sol";
// import "../../uniswap-v3/periphery/libraries/LiquidityAmounts.sol";
// import "../../uniswap-v3/core/libraries/TickMath.sol";
import "../../interfaces/utils/IERC20Minimal.sol";

//IUniswapV2Router02.sol와 역할 동일
import "../../uniswap-v3/periphery/interfaces/ISwapRouter.sol";
import "../../uniswap-v3/periphery/interfaces/INonfungiblePositionManager.sol";
//IUniswapV2Factory.sol와 역할 동일
import "../../uniswap-v3/core/interfaces/IUniswapV3Factory.sol";

//UniswapPair.sol와 역할 동일
import "../../uniswap-v3/core/interfaces/IUniswapV3Pool.sol";

error Defuture__Expired();

contract UniswapV3DefutureRouter is IUniswapV3DefutureRouter {
    address public immutable override factory;
    address public immutable override swapRouter;
    address public immutable override positionManager;

    address public immutable override defutureFactory;
    address public immutable override WETH;

    constructor(address swapRouter_, address positionManager_, address defutureFactory_, address WETH_) {
        swapRouter = swapRouter_;
        positionManager = positionManager_;
        factory = INonfungiblePositionManager(positionManager_).factory();
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
        address defuture = IUniswapV3DefutureFactory(defutureFactory).getDefuture(buyToken, sellToken);
        SafeToken.safeTransferFrom(sellToken, msg.sender, address(this), marginWithFee);
        SafeToken.safeApprove(sellToken, defuture, marginWithFee);

        IUniswapV3Defuture(defuture).addPosition(to, buyToken < sellToken, amountBuy, marginWithFee);
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

    // /**
    //  *
    //  * @param baseToken  baseToken (Stable)
    //  * @param farmToken  farmToken (High Volatility)
    //  * @param to  to
    //  * @param spotAmount 90$
    //  * @param hedgeAmount 10$
    //  */
    // function addLiquidityHedged(
    //     address baseToken,
    //     address farmToken,
    //     address to,
    //     uint spotAmount,
    //     uint hedgeAmount,
    //     int24 tickLower,
    //     int24 tickUpper,
    //     uint24 fee
    // ) public override returns (uint tokenId) {
    //     // swap할 양 + addLiquidity할 양
    //     SafeToken.safeTransferFrom(baseToken, msg.sender, address(this), spotAmount + hedgeAmount);
    //     SafeToken.safeApprove(baseToken, swapRouter, spotAmount + hedgeAmount);

    //     uint farmAmount;
    //     // 90$ 중에 얼마의 USDC를 DOGE로 바꿀것인가
    //     uint farmAmountToSwap = spotAmount / 2;
    //     // addLiquidity할 USDC: spotAmount - farmAmountToSwap;
    //     {
    //         // address[] memory path = new address[](2);
    //         // path[0] = baseToken;
    //         // path[1] = farmToken;
    //         //* swap baseToken to farmToken using V3SwapRouter
    //         bytes memory path = abi.encodePacked(baseToken, farmToken);

    //         farmAmount = ISwapRouter(swapRouter).exactInput(
    //             ISwapRouter.ExactInputParams({
    //                 path: path,
    //                 recipient: address(this),
    //                 deadline: block.timestamp,
    //                 amountIn: farmAmountToSwap + hedgeAmount,
    //                 amountOutMinimum: 1
    //             })
    //         );
    //         // amounts = IUniswapV2Router02(router).swapExactTokensForTokens(
    //         //     farmAmountToSwap + hedgeAmount,
    //         //     1,
    //         //     path,
    //         //     address(this),
    //         //     block.timestamp
    //         // );
    //     }

    //     SafeToken.safeApprove(farmToken, swapRouter, farmAmount);
    //     // (, uint addedFarm, ) = IUniswapV2Router02(router).addLiquidity(
    //     //     baseToken,
    //     //     farmToken,
    //     //     stakeBaseAmount,
    //     //     amounts[1],
    //     //     1,
    //     //     1,
    //     //     to,
    //     //     block.timestamp
    //     // );

    //     //     struct MintParams {
    //     //     address token0;
    //     //     address token1;
    //     //     uint24 fee;
    //     //     int24 tickLower;
    //     //     int24 tickUpper;
    //     //     uint256 amount0Desired;
    //     //     uint256 amount1Desired;
    //     //     uint256 amount0Min;
    //     //     uint256 amount1Min;
    //     //     address recipient;
    //     //     uint256 deadline;
    //     // }
    //     // function mint(MintParams calldata params)
    //     // external
    //     // payable
    //     // returns (
    //     //     uint256 tokenId,
    //     //     uint128 liquidity,
    //     //     uint256 amount0,
    //     //     uint256 amount1
    //     // );
    //     {
    //         uint addedFarm;
    //         (tokenId, , , addedFarm) = INonfungiblePositionManager(positionManager).mint(
    //             INonfungiblePositionManager.MintParams({
    //                 token0: baseToken,
    //                 token1: farmToken,
    //                 fee: fee,
    //                 tickLower: tickLower,
    //                 tickUpper: tickUpper,
    //                 amount0Desired: spotAmount / 2,
    //                 amount1Desired: farmAmount,
    //                 amount0Min: 1,
    //                 amount1Min: 1,
    //                 recipient: to,
    //                 deadline: block.timestamp
    //             })
    //         );
    //         farmAmount -= addedFarm;
    //     }

    //     //* 증거금 = 10$ = 55$ - 45$
    //     address defuture;
    //     {
    //         defuture = IUniswapV3DefutureFactory(defutureFactory).getDefuture(baseToken, farmToken);
    //     }
    //     SafeToken.safeApprove(farmToken, defuture, farmAmount);
    //     IUniswapV3Defuture(defuture).addPosition(
    //         to,
    //         baseToken < farmToken,
    //         uint112(spotAmount / 2),
    //         uint112(farmAmount)
    //     );
    // }

    function addLiquidityHedged(
        address baseToken,
        address farmToken,
        address to,
        uint spotAmount,
        uint hedgeAmount,
        int24 tickLower,
        int24 tickUpper,
        uint24 fee
    ) public override returns (uint tokenId) {
        // swap할 양 + addLiquidity할 양
        SafeToken.safeTransferFrom(baseToken, msg.sender, address(this), spotAmount + hedgeAmount);
        SafeToken.safeApprove(baseToken, swapRouter, spotAmount + hedgeAmount);

        uint farmAmount;
        // 90$ 중에 얼마의 USDC를 DOGE로 바꿀것인가
        uint farmAmountToSwap = spotAmount / 2;
        // addLiquidity할 USDC: spotAmount - farmAmountToSwap;
        {
            //* swap baseToken to farmToken using V3SwapRouter
            bytes memory path = abi.encodePacked(baseToken, farmToken);

            farmAmount = ISwapRouter(swapRouter).exactInput(
                ISwapRouter.ExactInputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: farmAmountToSwap + hedgeAmount,
                    amountOutMinimum: 1
                })
            );
        }

        SafeToken.safeApprove(farmToken, swapRouter, farmAmount);

        {
            uint addedFarm;
            (tokenId, , , addedFarm) = INonfungiblePositionManager(positionManager).mint(
                INonfungiblePositionManager.MintParams({
                    token0: baseToken,
                    token1: farmToken,
                    fee: fee,
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    amount0Desired: spotAmount / 2,
                    amount1Desired: farmAmount,
                    amount0Min: 1,
                    amount1Min: 1,
                    recipient: to,
                    deadline: block.timestamp
                })
            );
            farmAmount -= addedFarm;
        }

        //* 증거금 = 10$ = 55$ - 45$
        address defuture;
        {
            defuture = IUniswapV3DefutureFactory(defutureFactory).getDefuture(baseToken, farmToken);
        }
        SafeToken.safeApprove(farmToken, defuture, farmAmount);
        IUniswapV3Defuture(defuture).addPosition(
            to,
            baseToken < farmToken,
            uint112(spotAmount / 2),
            uint112(farmAmount)
        );
    }

    function clearPosition(address baseToken, address farmToken, uint positioinId, address to) external {
        //* Clear position then get farm token
        uint baseAmount;
        uint farmAmount = IUniswapV3Defuture(
            IUniswapV3DefutureFactory(defutureFactory).getDefuture(baseToken, farmToken)
        ).clear(positioinId, address(this));
        // {
        //     //* if LP exist, burn and get base, farm token
        //     if (params.lpAmountToBurn > 0) {
        //         (, , , , , , , , , , uint128 tokensOwed0, uint128 tokensOwed1) = INonfungiblePositionManager(
        //             positionManager
        //         ).positions(params.tokenId);
        //         (uint tokensLeft0, uint tokensLeft1) = INonfungiblePositionManager(positionManager).decreaseLiquidity(
        //             INonfungiblePositionManager.DecreaseLiquidityParams({
        //                 tokenId: params.tokenId,
        //                 liquidity: uint128(params.lpAmountToBurn),
        //                 amount0Min: 1,
        //                 amount1Min: 1,
        //                 deadline: block.timestamp
        //             })
        //         );
        //         //* sort Token
        //         if (params.baseToken < params.farmToken) {
        //             baseAmount = (tokensOwed0 - tokensLeft0);
        //             farmAmount += (tokensOwed1 - tokensLeft1);
        //         } else {
        //             baseAmount = (tokensOwed1 - tokensLeft1);
        //             farmAmount += (tokensOwed0 - tokensLeft0);
        //         }
        //     }
        //}
        //* swap farm token to base token
        bytes memory path = abi.encodePacked(farmToken, baseToken);
        uint baseAmountOut = ISwapRouter(swapRouter).exactInput(
            ISwapRouter.ExactInputParams({
                path: path,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: farmAmount,
                amountOutMinimum: 1
            })
        );
        //* send all of base token to user
        SafeToken.safeTransfer(baseToken, to, baseAmountOut + baseAmount);
    }

    function getInfoForHedge(
        address tokenA,
        address tokenB,
        uint24 fee
    )
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint112 leading0,
            uint112 leading1,
            uint minMarginBps,
            uint totalSupply
        )
    {
        // (reserve0, reserve1, ) = IUniswapV3Pool(IUniswapV3Factory(factory).getPair(tokenA, tokenB))
        //     .getReserves();
        address pool = IUniswapV3Factory(factory).getPool(tokenA, tokenB, fee);

        (bool success, bytes memory data) = tokenA.staticcall(
            abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, pool)
        );
        require(success && data.length >= 32);
        reserve0 = abi.decode(data, (uint112));

        (success, data) = tokenB.staticcall(abi.encodeWithSelector(IERC20Minimal.balanceOf.selector, pool));
        require(success && data.length >= 32);
        reserve1 = abi.decode(data, (uint112));

        if (tokenA > tokenB) {
            (reserve0, reserve1) = (reserve1, reserve0);
        }
        address defuture = IUniswapV3DefutureFactory(defutureFactory).getDefuture(tokenA, tokenB);
        (leading0, leading1, ) = IUniswapV3Defuture(defuture).getLeadings();

        (minMarginBps, , ) = IBaseDefuture(defuture).slot0();

        totalSupply = IBaseDefuture(defuture).totalSupply();
    }
}
