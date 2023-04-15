import { network, ethers } from "hardhat"
const developmentChains = ["hardhat", "localhost"]
import {
  UniswapV3DefutureFactory,
  UniswapV3DefutureFactory__factory,
  UniswapV3DefutureRouter,
  UniswapV3DefutureRouter__factory,
} from "../typechain-types"
let minMarginBps = 100
let liquidateFactorBps = 100
let liquidatePaybackBps = 5000
let fee = 300

let t1
let t2
let t3
const uniswapV3FactoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
const swapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
const nonfungiblePositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const WETH = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa"

async function main() {
  //* 3 Token mint
  const [deployer] = await ethers.getSigners()

  console.log(deployer.address)

  const freeTokenFactory = await ethers.getContractFactory("FreeERC20")

  t1 = await freeTokenFactory.deploy("USD-Tether", "USDT").then((t) => t.deployed())
  t2 = await freeTokenFactory.deploy("GnosisChain", "GC").then((t) => t.deployed())
  t3 = await freeTokenFactory.deploy("Polygon", "PG").then((t) => t.deployed())

  const t1tx = await t1.mint(deployer.address, ethers.utils.parseEther("100000")).then((t) => t.wait())

  const t2tx = await t2.mint(deployer.address, ethers.utils.parseEther("100000")).then((t) => t.wait())

  const t3tx = await t3.mint(deployer.address, ethers.utils.parseEther("100000")).then((t) => t.wait())

  console.log("t1 deployed to:", t1.address)
  console.log("t2 deployed to:", t2.address)
  console.log("t3 deployed to:", t3.address)
  //* Deploy Defuture Factory
  const uniswapV3DefutureFactoryFactory: UniswapV3DefutureFactory__factory = await ethers.getContractFactory(
    "UniswapV3DefutureFactory"
  )
  const uniswapV3DefutureFactory: UniswapV3DefutureFactory = await uniswapV3DefutureFactoryFactory
    .deploy(uniswapV3FactoryAddr, WETH)
    .then((t) => t.deployed())

  console.log("uniswapV3DefutureFactory deployed to:", uniswapV3DefutureFactory.address)
  console.log("deployer address:", deployer.address)
  //* Before create 3 DefuturePairs, we need to addPair to uniswapV3Factory
  const uniswapV3Factory = await ethers.getContractAt("IUniswapV3Factory", uniswapV3FactoryAddr)
  await uniswapV3Factory.createPool(t1.address, t2.address, fee)
  await uniswapV3Factory.createPool(t2.address, t3.address, fee)
  await uniswapV3Factory.createPool(t1.address, t3.address, fee)
  console.log(",")
  const pair1 = await uniswapV3DefutureFactory.createDefuture(
    minMarginBps,
    liquidateFactorBps,
    liquidatePaybackBps,
    t1.address,
    t2.address,
    fee
  )
  console.log("pair1:", pair1)

  const pair2 = await uniswapV3DefutureFactory.createDefuture(
    minMarginBps,
    liquidateFactorBps,
    liquidatePaybackBps,
    t2.address,
    t3.address,
    fee
  )
  console.log("pair2:", pair2)
  const pair3 = await uniswapV3DefutureFactory.createDefuture(
    minMarginBps,
    liquidateFactorBps,
    liquidatePaybackBps,
    t1.address,
    t3.address,
    fee
  )

  console.log("pair3:", pair3)
  const uniswapV3DefutureRouterFactory: UniswapV3DefutureRouter__factory = await ethers.getContractFactory(
    "UniswapV3DefutureRouter"
  )

  const uniswapV3DefutureRouter: UniswapV3DefutureRouter = await uniswapV3DefutureRouterFactory
    .deploy(swapRouter, nonfungiblePositionManager, uniswapV3DefutureFactory.address, WETH)
    .then((t) => t.deployed())

  console.log("uniswapV3DefutureRouter deployed to:", uniswapV3DefutureRouter.address)
  console.log("deployer address:", deployer.address)
}

main()
