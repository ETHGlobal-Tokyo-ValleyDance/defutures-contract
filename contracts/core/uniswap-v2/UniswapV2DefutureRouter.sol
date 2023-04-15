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
import "hardhat/console.sol";

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
