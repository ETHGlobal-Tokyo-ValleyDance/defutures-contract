import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

// UniswapV2DefutureFactory = 0xe8ce6a7989d918d5ad37a3b5716d901d71fbe85a
// UniswapV2DefutureRouter = 0xf38629f9046be0efb785137f74a041c8547122e8
// UniswapV2Factory = 0x5eabeff5aacb79ad34a403d8de70b7ce94ae7b58
// UniswapV2Router = 0x4b9e4e5c53aba6978157d6ab8e09d0b64ae4f5ae
// Token1Address = 0x826e7e00d66f55b3cf0c1f13f07af3a71559e0ab
// Token2Address = 0x4df7e30b763e1b3c2b0552940e2fb952404a1ac5
// Token3Address = 0x12a380c04084454664ce5ff155319c8640164c60

let uniswapV2DefutureFactory, uniswapV2DefutureRouter, uniswapV2Factory, uniswapV2Router, t1, t2, t3
let uniswapV2DefutureFactoryAddress = "0xe8ce6a7989d918d5ad37a3b5716d901d71fbe85a"
let uniswapV2DefutureRouterAddress = "0xf38629f9046be0efb785137f74a041c8547122e8"
let uniswapV2FactoryAddress = "0x5eabEfF5AaCB79ad34a403d8de70B7CE94Ae7b58"
let uniswapV2RouterAddress = "0x4B9E4e5C53aBA6978157d6aB8e09D0B64aE4F5AE"
let t1Address = "0x826e7e00d66f55b3cf0c1f13f07af3a71559e0ab"
let t2Address = "0x4df7e30b763e1b3c2b0552940e2fb952404a1ac5"
let t3Address = "0x12a380c04084454664ce5ff155319c8640164c60"

async function simulate() {
  const isDevelopment = developmentChains.includes(network.name)
  if (isDevelopment) {
    return "Not deploying to development network"
  }

  const [deployer] = await ethers.getSigners()

  const t1 = await ethers.getContractAt("FreeERC20", t1Address)
  const t2 = await ethers.getContractAt("FreeERC20", t2Address)
  const t3 = await ethers.getContractAt("FreeERC20", t3Address)
  const uniswapV2DefutureFactory = await ethers.getContractAt(
    "UniswapV2DefutureFactory",
    uniswapV2DefutureFactoryAddress
  )
  const uniswapV2DefutureRouter = await ethers.getContractAt("UniswapV2DefutureRouter", uniswapV2DefutureRouterAddress)
  const uniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", uniswapV2FactoryAddress)
  const uniswapV2Router = await ethers.getContractAt("IUniswapV2Router02", uniswapV2RouterAddress)

  console.log("uniswapV2DefutureRouterT1Balance", (await t1.balanceOf(uniswapV2DefutureRouter.address)).toString())
  console.log("uniswapV2DefutureRouterT2Balance", (await t2.balanceOf(uniswapV2DefutureRouter.address)).toString())

  console.log("deployerT1BalBefore", (await t1.balanceOf(deployer.address)).toString())
  console.log("deployerT2BalBefore", (await t2.balanceOf(deployer.address)).toString())

  console.log("approve before")

  const approveT1Tx = await t1.approve(uniswapV2DefutureRouter.address, ethers.utils.parseEther("900"))
  await approveT1Tx.wait(1)
  const approveT2Tx = await t2.approve(uniswapV2DefutureRouter.address, ethers.utils.parseEther("100"))
  await approveT2Tx.wait(1)

  console.log("approve after")

  const addLiquidityHedgedTx = await uniswapV2DefutureRouter.addLiquidityHedged(
    t1.address,
    t2.address,
    deployer.address,
    ethers.utils.parseEther("90"),
    ethers.utils.parseEther("10")
  )
  await addLiquidityHedgedTx.wait(1)
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
