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
      .then((f) => f.deploy(uniswapV2Factory.address))
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
    await expect(tx).to.emit(uniDefutureFactory, "DefutureCreated").withArgs(t1.address, t2.address, anyValue, anyValue)

    defuture12 = await ethers.getContractAt("UniswapV2Defuture", address)
    expect(await defuture12.token0(), "!token0").equal(t1.address)
    expect(await defuture12.token1(), "!token1").equal(t2.address)

    // leading값이 정확히 반영되었는지 확인
    const leadings = await defuture12.getLeadings()
    expect(leadings._leading0, "!leading0").to.equal(parseEther("" + LIQUIDITY_NUMERATOR / tokenValues.t1))
    expect(leadings._leading1, "!leading1").to.equal(parseEther("" + LIQUIDITY_NUMERATOR / tokenValues.t2))
  })
  it("UniswapV2DefutureRouter should be deployed", async () => {
    uniDefutureRouter = await ethers
      .getContractFactory("UniswapV2DefutureRouter")
      .then((f) => f.deploy(uniswapV2Router.address, uniDefutureFactory.address))

    expect(await uniDefutureRouter.defutureFactory()).to.equals(uniDefutureFactory.address)
  })
  it("addPosition", async () => {
    const [deployer] = await ethers.getSigners()
    const amount = parseEther("100")

    await t1.approve(uniDefutureRouter.address, amount)

    const positionTX = await uniDefutureRouter.addPosition(
      t2.address,
      t1.address,
      deployer.address,
      parseEther("90"),
      parseEther("10"),
      ethers.constants.MaxUint256
    )

    const positionTXR = await positionTX.wait()
    const positionEvent = positionTXR.events?.find((log) => log.event === "PositionAdded")!

    // getLeadings
    const leadings = await defuture12.getLeadings()
    expect(leadings[0]).to.equal("2066001910095278157349")
    expect(leadings[1]).to.equal("2910000000000000000000")
  })

  // let snapshot: SnapshotRestorer
  // snapshot = await takeSnapshot()
  // await snapshot.restore()

  it("addLiquidityHedged", async () => {
    const [deployer] = await ethers.getSigners()

    const firstBaseBalance = await t1.balanceOf(deployer.address)

    const amount = parseEther("100")

    // pair contract factory
    const Pair = await uniswapV2Factory.getPair(t1.address, t2.address)
    const pair = await ethers.getContractAt("UniswapV2Pair", Pair)

    const reservesBeforeLH = await pair.getReserves()
    expect(reservesBeforeLH[1]).to.equal(parseEther("3000"))
    expect(reservesBeforeLH[0]).to.equal(parseEther("2000"))

    // previous lp token balance of deployer
    const lpTokenBalanceBefore = await pair.balanceOf(deployer.address)

    await t1.approve(uniDefutureRouter.address, amount)

    // const pair = await
    const leadingsBeforeHedged = await defuture12.getLeadings()
    expect(leadingsBeforeHedged[0]).to.equal("2066001910095278157349")
    expect(leadingsBeforeHedged[1]).to.equal("2910000000000000000000")

    // addLiquidityHedged
    const tx = await uniDefutureRouter.addLiquidityHedged(
      t1.address,
      t2.address,
      deployer.address,
      parseEther("90"),
      parseEther("10")
    )

    // getLeadings
    const leadingsAfterHedged = await defuture12.getLeadings()
    expect(leadingsAfterHedged[0]).to.equal("2064207925004791286423")
    expect(leadingsAfterHedged[1]).to.equal("3038711755798463160190")

    // deployer LP Token amount
    const lpTokenBalanceAfter = await pair.balanceOf(deployer.address)

    // retrieves exact amount of LP token
    assert.equal(Number(lpTokenBalanceAfter) / 10 ** 18 - Number(lpTokenBalanceBefore) / 10 ** 18, 53.638461520799865)

    // adds margin
    // const recentPositionId = await defuture12.recentPositionId()
    // await defuture12.addMargin(deployer.address, parseEther("10"))

    // ------------------- ADD TIME 45 days ------------------- //
    await ethers.provider.send("evm_increaseTime", [45 * 24 * 60 * 60])
    await ethers.provider.send("evm_mine", [])

    const signers = await ethers.getSigners()
    const other1 = signers[1]

    // previous reserves of t1 and t2
    const reservesBefore = await pair.getReserves()
    const kBefore = reservesBefore[0].mul(reservesBefore[1])

    expect(reservesBefore[0]).to.equal("2100000000000000000000")
    expect(reservesBefore[1]).to.equal("2983882823347796106811")
    expect(kBefore).to.equal("6266153929030371824303100000000000000000000")

    // other1 swaps t1 for t2
    const uniswapV2RouterOther1 = uniswapV2Router.connect(other1)
    await t1.connect(other1).approve(uniswapV2RouterOther1.address, parseEther("100"))
    await uniswapV2RouterOther1.swapExactTokensForTokens(
      parseEther("100"),
      1,
      [t1.address, t2.address],
      other1.address,
      ethers.constants.MaxUint256
    )

    // current reserves of t1 and t2
    const reservesAfter = await pair.getReserves()
    const kAfter = reservesAfter[0].mul(reservesAfter[1])
    expect(reservesAfter[0]).to.equal(parseEther("2200"))
    expect(reservesAfter[1].toString()).to.equal("2848640236864286868348")
    expect(kAfter).to.be.greaterThan(kBefore)

    // ------------------- ADD TIME 45 days ------------------- //
    await ethers.provider.send("evm_increaseTime", [45 * 24 * 60 * 60])
    await ethers.provider.send("evm_mine", [])

    // profit calculation
    const finalBaseBalance = await t1.balanceOf(deployer.address)
  })

  it("withdraw", async () => {
    const [deployer] = await ethers.getSigners()
    const balDefuture12t2 = await t2.balanceOf(defuture12.address)
    await defuture12.withdraw(t2.address, balDefuture12t2)
  })

  it("info", async () => {
    console.log(await uniDefutureRouter.getFutureMarketInfo(t1.address, t2.address))
    console.log(await uniDefutureRouter.getFutureMarketInfo(t2.address, t1.address))
  })
})
