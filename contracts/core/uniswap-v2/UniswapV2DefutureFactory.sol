// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./UniswapV2Defuture.sol";
import "../../interfaces/core/IUniswapV2DefutureFactory.sol";
import "../../uniswap-v2/core/interfaces/IUniswapV2Factory.sol";

contract UniswapV2DefutureFactory is IUniswapV2DefutureFactory {
    address[] public defutures;
    address public owner;
    address public uniswapV2Factory;
    address public WETH;

    mapping(address => mapping(address => address)) public override getDefuture;

    constructor(address _uniswapV2Factory, address _WETH) {
        owner = msg.sender;
        uniswapV2Factory = _uniswapV2Factory;
        WETH = _WETH;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DEFUTURE: !Owner");
        _;
    }

    function transferOwnership(address _owner) external onlyOwner {
        owner = _owner;
    }

    function createDefuture(
        uint16 _minMarginBps,
        uint16 _liquidateFactorBps,
        uint16 _liquidatePaybackBps,
        address _tokenA,
        address _tokenB
    ) external onlyOwner returns (address defuture) {
        if (_tokenA > _tokenB) (_tokenA, _tokenB) = (_tokenB, _tokenA);
        // This check is enough
        require(getDefuture[_tokenA][_tokenB] == address(0), "DEFUTURE: PAIR_EXISTS");
        address pair = IUniswapV2Factory(uniswapV2Factory).getPair(_tokenA, _tokenB);
        require(pair != address(0), "DEFUTURE: PAIR NOT EXISTS");
        // defuture = address(new UniswapV2Defuture(_minMarginBps, _liquidateFactorBps, _liquidatePaybackBps, pair, WETH));

        getDefuture[_tokenA][_tokenB] = defuture;
        getDefuture[_tokenB][_tokenA] = defuture;
        defutures.push(defuture);
    }

    function defuturesLength() public view returns (uint len) {
        len = defutures.length;
    }
}
