import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2Pair, uniswapV2Factory, uniswapV2Router, weth
let t1Address = "0xA729DFC4f7b55B77C0cdfc04D49575E512412a6C"
let t2Address = "0xd3320E21E9bca19EE252bb9c5acc4dFD3815d698"
let t3Address = "0x826289e8EEa0ce70Cdb9a76959A1E26A46773c00"

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
  const t3 = await ethers.getContractAt("FreeERC20", t3Address)

  console.log("t1 deployed to:", t1.address)
  console.log("t2 deployed to:", t2.address)
  console.log("t3 deployed to:", t3.address)

  const t1ApproveTx = await t1.approve(uniswapV2Router.address, ethers.constants.MaxUint256)
  await t1ApproveTx.wait(1)

  console.log("t1 approved")

  const t2ApproveTx = await t2.approve(uniswapV2Router.address, ethers.constants.MaxUint256)
  await t2ApproveTx.wait(1)

  console.log("t2 approved")
  const t3ApproveTx = await t3.approve(uniswapV2Router.address, ethers.constants.MaxUint256)
  await t3ApproveTx.wait(1)

  console.log("t3 approved")

  // CreatePair Manual
  const createPairt1t2Tx = await uniswapV2Factory.createPair(t1Address, t2Address)
  await createPairt1t2Tx.wait()
  const pairAddresst1t2 = await uniswapV2Factory.getPair(t1Address, t2Address)

  const createPairt1t3Tx = await uniswapV2Factory.createPair(t1Address, t3Address)
  await createPairt1t3Tx.wait()
  const pairAddresst1t3 = await uniswapV2Factory.getPair(t1Address, t3Address)

  const createPairt2t3Tx = await uniswapV2Factory.createPair(t2Address, t3Address)
  await createPairt2t3Tx.wait()
  const pairAddresst2t3 = await uniswapV2Factory.getPair(t2Address, t3Address)

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
  await t1t3LPtx.wait()

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
  await t2t3LPtx.wait()

  console.log("T2T3LPTX added")

  console.log("uniswapV2Factory deployed to:", uniswapV2Factory.address)
  console.log("uniswapV2Router deployed to:", uniswapV2Router.address)
  console.log("weth deployed to:", weth.address)
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
