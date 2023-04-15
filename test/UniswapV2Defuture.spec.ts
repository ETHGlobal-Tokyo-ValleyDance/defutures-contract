import { ethers } from "hardhat"
import { BigNumberish } from "ethers"
import { SnapshotRestorer, setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { assert, expect } from "chai"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { latest } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time"

let t1, t2, WETH, uniswapV2Factory, uniswapV2Router, snapshotRestorer, snapshotId

const { parseEther, formatEther } = ethers.utils
const { MaxUint256 } = ethers.constants
/***********
  Configs
***********/
// ETH: Token1: Token2의 가격비
const LIQUIDITY_NUMERATOR = 6000
const tokenValues = {
  t1: 3,
  t2: 2,
  ETH: 10,
}

describe("UniswapDefuture", function () {
  before("Preset Tokens, UniswapV2", async () => {
    const [deployer, other1] = await ethers.getSigners()

    // FREE MINT ETH
    await setBalance(deployer.address, parseEther("10000000"))
    await setBalance(other1.address, parseEther("10000000"))

    /** Create Mock ERC20s */
    const tokenFactory = await ethers.getContractFactory("FreeERC20")
    t1 = await tokenFactory.deploy("Token1", "T1").then((t) => t.deployed())
    t2 = await tokenFactory.deploy("Token2", "T2").then((t) => t.deployed())
    if (t1.address > t2.address) [t1, t2] = [t2, t1]

    // FREE MINT ERC20
    await t1.mint(deployer.address, parseEther("100000"), { gasLimit: 30000000 })
    await t2.mint(deployer.address, parseEther("100000"), { gasLimit: 30000000 })
    await t1.mint(other1.address, parseEther("100000"), { gasLimit: 30000000 })
    await t2.mint(other1.address, parseEther("100000"), { gasLimit: 30000000 })

    WETH = await ethers.getContractFactory("WETH9").then((f) => f.deploy())
    /** Create Mock UniswapV2 */
    uniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory").then(
      // factory를 만드는 factory
      (factoryFactory) => factoryFactory.deploy(deployer.address)
    )
    const uniswapV2RouterFactory = await ethers.getContractFactory("UniswapV2Router02")
    uniswapV2Router = await uniswapV2RouterFactory.deploy(uniswapV2Factory.address, WETH.address)

    // // Decide Liquidity for init provide
    const [amount1, amount2, amountETH] = [
      parseEther("" + LIQUIDITY_NUMERATOR / tokenValues.t1),
      parseEther("" + LIQUIDITY_NUMERATOR / tokenValues.t2),
      parseEther("" + LIQUIDITY_NUMERATOR / tokenValues.ETH),
    ]
  })
})
