import { network, ethers } from "hardhat"
import { getConfig, saveConfig } from "./use.config"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2Pair, uniswapV2Factory, uniswapV2Router, weth

async function deploy() {
  const config = getConfig();
  const t1Address = config.t1
  const t2Address = config.t2
  console.log(t1Address)
  console.log(t2Address)

  // const isDevelopment = developmentChains.includes(network.name)
  // if (isDevelopment) {
  //   return "Not deploying to development network"
  // }

  const [deployer] = await ethers.getSigners()

  // weth deploy
  const wethFactory = await ethers.getContractFactory("WETH9")
  weth = await wethFactory.deploy().then((t) => t.deployed())
  saveConfig("WETH", weth.address)

  // uniswapV2Factory deploy
  const uniswapV2FactoryFactory = await ethers.getContractFactory("UniswapV2Factory")
  uniswapV2Factory = await uniswapV2FactoryFactory.deploy(deployer.address).then((t) => t.deployed())
  saveConfig("V2Factory", uniswapV2Factory.address)

  // uniswapV2Router deploy
  const uniswapV2RouterFactory = await ethers.getContractFactory("UniswapV2Router01")
  uniswapV2Router = await uniswapV2RouterFactory
    .deploy(uniswapV2Factory.address, weth.address)
    .then((t) => t.deployed())
  saveConfig("V2Router", uniswapV2Router.address)


  const t1 = await ethers.getContractAt("FreeERC20", t1Address)
  const t2 = await ethers.getContractAt("FreeERC20", t2Address)

  const t1ApproveTx = await t1.approve(uniswapV2Router.address, ethers.constants.MaxUint256)
  await t1ApproveTx.wait()

  console.log("t1 approved")

  const t2ApproveTx = await t2.approve(uniswapV2Router.address, ethers.constants.MaxUint256)
  await t2ApproveTx.wait()

  console.log("t2 approved")

  // CreatePair Manual
  const createPairt1t2Tx = await uniswapV2Factory.createPair(t1Address, t2Address)
  await createPairt1t2Tx.wait()
  const pairAddresst1t2 = await uniswapV2Factory.getPair(t1Address, t2Address)

  saveConfig("pair12", pairAddresst1t2);

  console.log("pairs created")

  console.log("t1", t1.address)
  console.log("t2", t2.address)
  console.log("uniswapV2RouterAddress", uniswapV2Router.address)

  // 1. t1 - t2 -> 1000T1 + 3000T2
  console.log("deployer balance", await t1.balanceOf(deployer.address))
  const t1t2LPtx = await uniswapV2Router.addLiquidity(
    t1Address,
    t2Address,
    ethers.utils.parseEther("1000"),
    ethers.utils.parseEther("3000"),
    ethers.utils.parseEther("1000"),
    ethers.utils.parseEther("3000"),
    deployer.address,
    ethers.constants.MaxUint256
  )
  await t1t2LPtx.wait()

  console.log("T1T2LPTX added")

  console.log("uniswapV2Factory deployed to:", uniswapV2Factory.address)
  console.log("uniswapV2Router deployed to:", uniswapV2Router.address)
  console.log("weth deployed to:", weth.address)
  const t1t2pairAddress = await uniswapV2Factory.getPair(t1Address, t2Address)
  const t1t2pair = await ethers.getContractAt("UniswapV2Pair", t1t2pairAddress)
  await t1t2pair.deployed()
  const reserves = await t1t2pair.getReserves()
  console.log("t1t2 reserve0", reserves[0].toString())
  console.log("t1t2 reserve1", reserves[1].toString())

}

deploy()
