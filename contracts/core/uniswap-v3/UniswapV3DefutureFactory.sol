// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UniswapV3Defuture.sol";
import "../../interfaces/core/uniswap-v3/IUniswapV3DefutureFactory.sol";
import "../../uniswap-v3/core/interfaces/IUniswapV3Factory.sol";

contract UniswapV3DefutureFactory is IUniswapV3DefutureFactory {
    address[] public defutures;
    address public owner;
    address public uniswapV3Factory;
    address public WETH;

    // tokenA => tokenB => Defuture
    // tokenB => tokenA => Defuture
    mapping(address => mapping(address => address)) public override getDefuture;

    event DefutureCreated(address indexed token0, address indexed token1, address defuture, uint);

    constructor(address _uniswapV3Factory, address _WETH) {
        owner = msg.sender;
        uniswapV3Factory = _uniswapV3Factory;
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
        address _tokenB,
        uint24 _fee
    ) external onlyOwner returns (address defuture) {
        if (_tokenA > _tokenB) (_tokenA, _tokenB) = (_tokenB, _tokenA);
        // This check is enough
        require(getDefuture[_tokenA][_tokenB] == address(0), "DEFUTURE: PAIR_EXISTS");
        address pair = IUniswapV3Factory(uniswapV3Factory).getPool(_tokenA, _tokenB, _fee);
        require(pair != address(0), "DEFUTURE: PAIR NOT EXISTS");
        defuture = address(new UniswapV3Defuture(_minMarginBps, _liquidateFactorBps, _liquidatePaybackBps, pair, WETH));

        getDefuture[_tokenA][_tokenB] = defuture;
        getDefuture[_tokenB][_tokenA] = defuture;
        defutures.push(defuture);

        emit DefutureCreated(_tokenA, _tokenB, defuture, defutures.length);
    }

    function defuturesLength() public view returns (uint len) {
        len = defutures.length;
    }
}
