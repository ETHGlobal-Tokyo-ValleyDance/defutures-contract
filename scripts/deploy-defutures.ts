import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2DefutureFactory, uniswapV2DefutureRouter
let uniswapV2FactoryAddress = "0xE1282AdE40cd5b0Acd8074B0A7167fCBe8d6578A"
let uniswapV2RouterAddress = "0xa520f4815e4aeE3a30CACa681aabD4bEc9144BCA"
let wethAddress = "0xa0F06e730C1C6d38381f8dB784BC96497315D334"

async function deploy() {
  const isDevelopment = developmentChains.includes(network.name)
  if (isDevelopment) {
    return "Not deploying to development network"
  }

  const [deployer] = await ethers.getSigners()
  const uniswapV2DefutureFactoryFactory = await ethers.getContractFactory("UniswapV2DefutureFactory")
  uniswapV2DefutureFactory = await uniswapV2DefutureFactoryFactory
    .deploy(uniswapV2FactoryAddress, wethAddress)
    .then((t) => t.deployed())
  await uniswapV2DefutureFactory.deployed()

  const uniswapV2RouterFactory = await ethers.getContractFactory("UniswapV2DefutureRouter")
  uniswapV2DefutureRouter = await uniswapV2RouterFactory.deploy(
    uniswapV2RouterAddress,
    uniswapV2DefutureFactory.address,
    wethAddress
  )
  await uniswapV2DefutureRouter.deployed()
}

deploy()
