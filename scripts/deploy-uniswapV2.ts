import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2Pair, uniswapV2Factory, uniswapV2Router, weth
let t1Address = "0x6371522F18eCBeE32177437236b72AB41F491B0C"
let t2Address = "0xD8adc83cF3f68A15d4F9e728C9A4b4558f687D88"

async function deploy() {
  const isDevelopment = developmentChains.includes(network.name)
  if (isDevelopment) {
    return "Not deploying to development network"
  }

  const [deployer] = await ethers.getSigners()

  // weth deploy
  const wethFactory = await ethers.getContractFactory("WETH9")
  weth = await wethFactory.deploy().then((t) => t.deployed())

  // uniswapV2Factory deploy
  const uniswapV2FactoryFactory = await ethers.getContractFactory("UniswapV2Factory")
  uniswapV2Factory = await uniswapV2FactoryFactory.deploy(deployer.address).then((t) => t.deployed())

  // uniswapV2Router deploy
  const uniswapV2RouterFactory = await ethers.getContractFactory("UniswapV2Router01")
  uniswapV2Router = await uniswapV2RouterFactory
    .deploy(uniswapV2Factory.address, weth.address)
    .then((t) => t.deployed())

  const t1 = await ethers.getContractAt("FreeERC20", t1Address)
  const t2 = await ethers.getContractAt("FreeERC20", t2Address)

  console.log("t1 deployed to:", t1.address)
  console.log("t2 deployed to:", t2.address)

  const t1ApproveTx = await t1.approve(uniswapV2Router.address, ethers.constants.MaxUint256)
  await t1ApproveTx.wait(1)

  console.log("t1 approved")

  const t2ApproveTx = await t2.approve(uniswapV2Router.address, ethers.constants.MaxUint256)
  await t2ApproveTx.wait(1)

  console.log("t2 approved")

  // CreatePair Manual
  const createPairt1t2Tx = await uniswapV2Factory.createPair(t1Address, t2Address)
  await createPairt1t2Tx.wait()
  const pairAddresst1t2 = await uniswapV2Factory.getPair(t1Address, t2Address)

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
    ethers.constants.MaxUint256,
    { gasLimit: 1000000 }
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
