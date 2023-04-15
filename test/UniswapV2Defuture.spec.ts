import { ethers } from "hardhat"
import { BigNumberish } from "ethers"
import { SnapshotRestorer, setBalance, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import { assert, expect } from "chai"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { latest } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time"
import {
  FreeERC20,
  UniswapV2Defuture,
  UniswapV2DefutureFactory,
  UniswapV2DefutureRouter,
  UniswapV2Factory,
  UniswapV2Router02,
  WETH9,
} from "../typechain-types"

let t1: FreeERC20
let t2: FreeERC20
let uniswapV2Factory: UniswapV2Factory
let uniswapV2Router: UniswapV2Router02
let uniDefutureFactory: UniswapV2DefutureFactory
let uniDefutureRouter: UniswapV2DefutureRouter
let WETH: WETH9
let defuture12: UniswapV2Defuture
let defuture01: UniswapV2Defuture
let defuture02: UniswapV2Defuture
let snapshotRestorer: SnapshotRestorer
let deployer: string
let other1: string

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
    // approve tokens to Router Contract
    await t1.approve(uniswapV2Router.address, parseEther("100000"))
    await t2.approve(uniswapV2Router.address, parseEther("100000"))

    // Create 3 Pairs
    // 1. t1 - t2 -> 2000T1 + 3000T2
    await uniswapV2Router
      .addLiquidity(
        t1.address,
        t2.address,
        amount1,
        amount2,
        amount1,
        amount2,
        deployer.address,
        ethers.constants.MaxUint256
      )
      .then((tx) => tx.wait())

    // 2. t1 - ETH -> 2000 T1 + 600 ETH
    await uniswapV2Router
      .addLiquidityETH(t1.address, amount1, amount1, amountETH, deployer.address, ethers.constants.MaxUint256, {
        value: amountETH,
      })
      .then((tx) => tx.wait())

    // 3. t2 - ETH -> 3000 T2 + 600 ETH
    await uniswapV2Router
      .addLiquidityETH(t2.address, amount2, amount2, amountETH, deployer.address, ethers.constants.MaxUint256, {
        value: amountETH,
      })
      .then((tx) => tx.wait())
  })

  it("UniswapV2DefutureFactory should be deployed", async () => {
    const [deployer, other1] = await ethers.getSigners()
    uniDefutureFactory = await ethers
      .getContractFactory("UniswapV2DefutureFactory")
      .then((f) => f.deploy(uniswapV2Factory.address, WETH.address))
    expect(await uniDefutureFactory.defuturesLength()).to.equal(0)
    expect(await uniDefutureFactory.owner()).to.equal(deployer.address)
  })

  it("UniswapV2Defuture should be deployed", async () => {
    const DEFUTURE_CREATION_SIGNATURE = "0xfaf7e41cf71d94e569389c599b3497ae16795e52fe5983371e94419caab7ec05"
    async function createDefuture(tokenA: string, tokenB: string) {
      const creationTx = await uniDefutureFactory.createDefuture(1000, 800, 5000, tokenA, tokenB)
      const receipt = await creationTx.wait()
      const creationEvent = receipt.logs.find((log) => log.topics[0] === DEFUTURE_CREATION_SIGNATURE)!
      const address = "0x" + creationEvent.data.slice(2 + 24, 2 + 64)
      return {
        tx: creationTx,
        address,
      }
    }

    const { tx, address } = await createDefuture(t2.address, t1.address)
    await expect(tx).to.emit(uniDefutureFactory, "DefutureCreated").withArgs(t1.address, t2.address, anyValue, 1)

    defuture12 = await ethers.getContractAt("UniswapV2Defuture", address)
    expect(await defuture12.token0(), "!token0").equal(t1.address)
    expect(await defuture12.token1(), "!token1").equal(t2.address)

    // leading값이 정확히 반영되었는지 확인
    const leadings = await defuture12.getLeadings()
    expect(leadings._leading0, "!leading0").to.equal(parseEther("" + LIQUIDITY_NUMERATOR / tokenValues.t1))
    expect(leadings._leading1, "!leading1").to.equal(parseEther("" + LIQUIDITY_NUMERATOR / tokenValues.t2))

    // deploy rest defutures..
    await createDefuture(WETH.address, t1.address).then(async ({ address }) => {
      defuture01 = await ethers.getContractAt("UniswapV2Defuture", address)
    })
    await createDefuture(WETH.address, t2.address).then(async ({ address }) => {
      defuture02 = await ethers.getContractAt("UniswapV2Defuture", address)
    })
  })
})
