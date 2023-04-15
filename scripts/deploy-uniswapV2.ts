import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2Pair, uniswapV2Factory, uniswapV2Router
let t1Address = "0x247ac1E62cEC4D6453d9add29e69A15494Bd6E50"
let t2Address = "0xa74Cf6662E87F246D6748F537e73F149FC58e365"
let t3Address = "0x35c22CFE17F8bee6191b08Fc06349c5Cb8578d51"

async function deploy() {
  const isDevelopment = developmentChains.includes(network.name)
  if (isDevelopment) {
    return "Not deploying to development network"
  }

  const [deployer] = await ethers.getSigners()

  // WETH deploy
  const WETHFactory = await ethers.getContractFactory("WETH9")
  const WETH = await WETHFactory.deploy().then((t) => t.deployed())

  // uniswapV2Factory deploy
  const uniswapV2FactoryFactory = await ethers.getContractFactory("UniswapV2Factory")
  uniswapV2Factory = await uniswapV2FactoryFactory.deploy(deployer.address).then((t) => t.deployed())

  // uniswapV2Router deploy
  const uniswapV2RouterFactory = await ethers.getContractFactory("UniswapV2Router01")
  uniswapV2Router = await uniswapV2RouterFactory
    .deploy(uniswapV2Factory.address, WETH.address)
    .then((t) => t.deployed())

  // 1. t1 - t2 -> 1000T1 + 3000T2
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
  await t1t2LPtx.wait(1)

  console.log("T1T2LPTX added")

  // 2. t1 - t3 -> 1000T1 + 2000T3
  const t1t3LPtx = await uniswapV2Router.addLiquidity(
    t1Address,
    t3Address,
    ethers.utils.parseEther("1000"),
    ethers.utils.parseEther("2000"),
    ethers.utils.parseEther("1000"),
    ethers.utils.parseEther("2000"),
    deployer.address,
    ethers.constants.MaxUint256,
    { gasLimit: 1000000 }
  )
  await t1t3LPtx.wait(1)

  console.log("T1T3LPTX added")

  // 3. t2 - t3 -> 3000T2 + 2000T3
  const t2t3LPtx = await uniswapV2Router.addLiquidity(
    t2Address,
    t3Address,
    ethers.utils.parseEther("3000"),
    ethers.utils.parseEther("2000"),
    ethers.utils.parseEther("3000"),
    ethers.utils.parseEther("2000"),
    deployer.address,
    ethers.constants.MaxUint256,
    { gasLimit: 1000000 }
  )
  await t2t3LPtx.wait(1)

  console.log("T2T3LPTX added")

  console.log("uniswapV2Factory deployed to:", uniswapV2Factory.address)
  console.log("uniswapV2Router deployed to:", uniswapV2Router.address)
  const t1t2pairAddress = await uniswapV2Factory.getPair(t1Address, t2Address)
  const t1t2pair = await ethers.getContractAt("UniswapV2Pair", t1t2pairAddress)
  await t1t2pair.deployed()
  const reserves = await t1t2pair.getReserves()
  console.log("t1t2 reserve0", reserves[0].toString())
  console.log("t1t2 reserve1", reserves[1].toString())

  const t1t3pairAddress = await uniswapV2Factory.getPair(t1Address, t3Address)
  const t1t3pair = await ethers.getContractAt("UniswapV2Pair", t1t3pairAddress)
  await t1t3pair.deployed()
  const reserves2 = await t1t3pair.getReserves()
  console.log("t1t3 reserve0", reserves2[0].toString())
  console.log("t1t3 reserve1", reserves2[1].toString())

  const t2t3pairAddress = await uniswapV2Factory.getPair(t2Address, t3Address)
  const t2t3pair = await ethers.getContractAt("UniswapV2Pair", t2t3pairAddress)
  await t2t3pair.deployed()
  const reserves3 = await t2t3pair.getReserves()
  console.log("t2t3 reserve0", reserves3[0].toString())
  console.log("t2t3 reserve1", reserves3[1].toString())
}

deploy()
