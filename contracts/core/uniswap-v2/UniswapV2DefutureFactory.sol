// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./UniswapV2Defuture.sol";
import "../../interfaces/core/uniswap-v2/IUniswapV2DefutureFactory.sol";
import "../../uniswap-v2/core/interfaces/IUniswapV2Factory.sol";

contract UniswapV2DefutureFactory is IUniswapV2DefutureFactory {
    address[] public defutures;
    address public owner;
    address public uniswapV2Factory;

    // tokenA => tokenB => Defuture
    // tokenB => tokenA => Defuture
    mapping(address => mapping(address => address)) public override getDefuture;

    event DefutureCreated(address indexed token0, address indexed token1, address defuture, uint);

    constructor(address _uniswapV2Factory) {
        owner = msg.sender;
        uniswapV2Factory = _uniswapV2Factory;
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
    ) external onlyOwner {
        if (_tokenA > _tokenB) (_tokenA, _tokenB) = (_tokenB, _tokenA);
        // This check is enough
        require(getDefuture[_tokenA][_tokenB] == address(0), "DEFUTURE: PAIR_EXISTS");
        address pair = IUniswapV2Factory(uniswapV2Factory).getPair(_tokenA, _tokenB);
        require(pair != address(0), "DEFUTURE: PAIR NOT EXISTS");

        address defuture = address(
            new UniswapV2Defuture{salt: keccak256(abi.encodePacked(_tokenA, _tokenB))}(
                _minMarginBps,
                _liquidateFactorBps,
                _liquidatePaybackBps,
                pair
            )
        );

        getDefuture[_tokenA][_tokenB] = defuture;
        getDefuture[_tokenB][_tokenA] = defuture;
        defutures.push(defuture);

        emit DefutureCreated(_tokenA, _tokenB, defuture, defutures.length);
    }

    function defuturesLength() public view returns (uint len) {
        len = defutures.length;
    }
}
