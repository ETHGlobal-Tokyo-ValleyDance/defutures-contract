import { readFileSync, writeFileSync } from "fs"
import { network, ethers } from "hardhat"
import path from "path"
import { getConfig } from "./use.config"

const developmentChains = ["hardhat", "localhost"]

async function simulate() {
  // const isDevelopment = developmentChains.includes(network.name)
  // if (isDevelopment) {
  //   return "Not deploying to development network"
  // }

  const config = getConfig();

  // let uniswapV2DefutureFactoryAddress = config
// let uniswapV2DefutureRouterAddress = config.V2
let uniswapV2FactoryAddress = config.V2Factory
let uniswapV2RouterAddress = config.V2Router
let t1Address = config.t1
let t2Address = config.t2

  const [deployer] = await ethers.getSigners()

  const t1 = await ethers.getContractAt("FreeERC20", t1Address)
  const t2 = await ethers.getContractAt("FreeERC20", t2Address)
  const uniswapV2DefutureFactory = await ethers.getContractAt(
    "UniswapV2DefutureFactory",
    config.defutureFactory
  )
  const uniswapV2DefutureRouter = await ethers.getContractAt("UniswapV2DefutureRouter", config.defutureRouter)
  const uniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapV2FactoryAddress)
  const uniswapV2Router = await ethers.getContractAt("IUniswapV2Router02", uniswapV2RouterAddress)

  // SAVE CONFIG
  // console.log("uniswapV2DefutureRouterT1Balance", (await t1.balanceOf(uniswapV2DefutureRouter.address)).toString())
  // console.log("uniswapV2DefutureRouterT2Balance", (await t2.balanceOf(uniswapV2DefutureRouter.address)).toString())

  // console.log("deployerT1BalBefore", (await t1.balanceOf(deployer.address)).toString())
  // console.log("deployerT2BalBefore", (await t2.balanceOf(deployer.address)).toString())

  console.log("UniswapV2DefutureRouter", uniswapV2DefutureRouter.address)
  const approveT1Tx = await t1.approve(uniswapV2DefutureRouter.address, ethers.utils.parseEther("1000"))
  await approveT1Tx.wait()



  const addLiquidityHedgedTx = await uniswapV2DefutureRouter.addLiquidityHedged(
    t1.address,
    t2.address,
    deployer.address,
    ethers.utils.parseEther("90"),
    ethers.utils.parseEther("10"),
  )
  await addLiquidityHedgedTx.wait(1)
  console.log("addLiquidityHedgedTx", addLiquidityHedgedTx.hash)

  // console.log("uniswapV2DefutureRouterT1Balance", (await t1.balanceOf(uniswapV2DefutureRouter.address)).toString())
  // console.log("uniswapV2DefutureRouterT2Balance", (await t2.balanceOf(uniswapV2DefutureRouter.address)).toString())

  // console.log("deployerT1BalAfter", (await t1.balanceOf(deployer.address)).toString())
  // console.log("deployerT2BalAfter", (await t2.balanceOf(deployer.address)).toString())

  const pairAddress = await uniswapV2Factory.getPair(t1.address, t2.address)
  const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress)
  const deployerLPTokenBalance = await pair.balanceOf(deployer.address)
  console.log("deployerLPTokenBalance", deployerLPTokenBalance.toString())

  //   function addLiquidityHedged(
  //     address baseToken,
  //     address farmToken,
  //     address to,
  //     uint spotAmount,
  //     uint hedgeAmount
  // ) public override {
}

simulate()
