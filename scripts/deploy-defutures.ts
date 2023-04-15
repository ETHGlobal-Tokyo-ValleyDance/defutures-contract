import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2DefutureFactory, uniswapV2DefutureRouter
let uniswapV2FactoryAddress = "0x983f4c51cA44C21b909955317C69FAFB040bFa3b"
let uniswapV2RouterAddress = "0x4f151D0291ef956c43C2c08C1b8AFBA9E30b6b52"
let wethAddress = "0xBaEcB9546111941382981f3530951eAe7b46f108"

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
