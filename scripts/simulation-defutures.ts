import { readFileSync, writeFileSync } from "fs"
import { network, ethers } from "hardhat"
import path from "path"
import { getConfig, saveConfig } from "./use.config"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2DefutureFactory, uniswapV2DefutureRouter, uniswapV2Factory, uniswapV2Router, t1, t2, t3
let uniswapV2DefutureFactoryAddress = "0xA0217e8B6995650e9C82E4Ac3DC88c49c753b02F"
let uniswapV2DefutureRouterAddress = "0x48C795467E0a894806F8aaF7dc93061180DA2E20"
let uniswapV2FactoryAddress = "0xa4c0547F7a042B6a82daF2761BCB3eC6be8729Ea"
let uniswapV2RouterAddress = "0xF5C4a92A261Cc31D0AbCc920A09b37eC9AE4b926"
let t1Address = "0x6371522F18eCBeE32177437236b72AB41F491B0C"
let t2Address = "0xD8adc83cF3f68A15d4F9e728C9A4b4558f687D88"

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
    uniswapV2DefutureFactoryAddress
  )
  const uniswapV2DefutureRouter = await ethers.getContractAt("UniswapV2DefutureRouter", uniswapV2DefutureRouterAddress)
  const uniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapV2FactoryAddress)
  const uniswapV2Router = await ethers.getContractAt("IUniswapV2Router02", uniswapV2RouterAddress)

  // SAVE CONFIG
  saveConfig("defutureFactory", uniswapV2DefutureFactory.address);
  saveConfig("defutureRouter", uniswapV2DefutureRouter.address);


  console.log("uniswapV2DefutureRouterT1Balance", (await t1.balanceOf(uniswapV2DefutureRouter.address)).toString())
  console.log("uniswapV2DefutureRouterT2Balance", (await t2.balanceOf(uniswapV2DefutureRouter.address)).toString())

  console.log("deployerT1BalBefore", (await t1.balanceOf(deployer.address)).toString())
  console.log("deployerT2BalBefore", (await t2.balanceOf(deployer.address)).toString())

  const approveT1Tx = await t1.approve(uniswapV2DefutureRouter.address, ethers.utils.parseEther("1000"))
  await approveT1Tx.wait()

  const pairA = await uniswapV2Factory.getPair(t1.address, t2.address)
  const pairContract = await ethers.getContractAt("IUniswapV2Pair", pairA)
  console.log("paircontract address", pairContract.address)
  saveConfig("defuture12", pairA);


  const createDefTx = await uniswapV2DefutureFactory.createDefuture(
    2000, 1500, 2000, t1.address, t2.address)
  await createDefTx.wait()

  console.log("FINALE")

  const addLiquidityHedgedTx = await uniswapV2DefutureRouter.addLiquidityHedged(
    t1.address,
    t2.address,
    deployer.address,
    ethers.utils.parseEther("90"),
    ethers.utils.parseEther("10"),
    { gasLimit: 10000000 }
  )
  await addLiquidityHedgedTx.wait()
  console.log("addLiquidityHedgedTx", addLiquidityHedgedTx.hash)

  console.log("uniswapV2DefutureRouterT1Balance", (await t1.balanceOf(uniswapV2DefutureRouter.address)).toString())
  console.log("uniswapV2DefutureRouterT2Balance", (await t2.balanceOf(uniswapV2DefutureRouter.address)).toString())

  console.log("deployerT1BalAfter", (await t1.balanceOf(deployer.address)).toString())
  console.log("deployerT2BalAfter", (await t2.balanceOf(deployer.address)).toString())

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
