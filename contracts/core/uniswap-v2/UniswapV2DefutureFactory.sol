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

    function createDefuture(address _tokenA, address _tokenB) external onlyOwner returns (address defuture) {
        require(_tokenA != _tokenB, "UniswapV2: IDENTICAL_ADDRESSES");
        (address token0, address token1) = _tokenA < _tokenB ? (_tokenA, _tokenB) : (_tokenB, _tokenA);
        require(token0 != address(0), "UniswapV2: ZERO_ADDRESS");
        address pair = IUniswapV2Factory(uniswapV2Factory).getPair(token0, token1);
        bytes memory bytecode = type(UniswapV2Defuture).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            defuture := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Defuture(defuture).initialize(pair);

        // if (_tokenA > _tokenB) (_tokenA, _tokenB) = (_tokenB, _tokenA);
        // // This check is enough
        // require(getDefuture[_tokenA][_tokenB] == address(0), "DEFUTURE: PAIR_EXISTS");
        // address pair = IUniswapV2Factory(uniswapV2Factory).getPair(_tokenA, _tokenB);
        // require(pair != address(0), "DEFUTURE: PAIR NOT EXISTS");

        // bytes32 salt = keccak256(abi.encodePacked(_tokenA, _tokenB));
        // defuture = address(
        //     new UniswapV2Defuture{salt: salt}(_minMarginBps, _liquidateFactorBps, _liquidatePaybackBps, pair)
        // );

        getDefuture[_tokenA][_tokenB] = defuture;
        getDefuture[_tokenB][_tokenA] = defuture;
        defutures.push(defuture);

        emit DefutureCreated(_tokenA, _tokenB, defuture, defutures.length);
    }

    function defuturesLength() public view returns (uint len) {
        len = defutures.length;
    }
}
