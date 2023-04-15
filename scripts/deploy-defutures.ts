import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2DefutureFactory, uniswapV2DefutureRouter
let uniswapV2FactoryAddress = "0x5eabEfF5AaCB79ad34a403d8de70B7CE94Ae7b58"
let uniswapV2RouterAddress = "0x4B9E4e5C53aBA6978157d6aB8e09D0B64aE4F5AE"

async function deploy() {
  const isDevelopment = developmentChains.includes(network.name)
  if (isDevelopment) {
    return "Not deploying to development network"
  }

  const [deployer] = await ethers.getSigners()

  console.log("Deploying defuture factory")

  const uniswapV2DefutureFactoryFactory = await ethers.getContractFactory("UniswapV2DefutureFactory")
  uniswapV2DefutureFactory = await uniswapV2DefutureFactoryFactory
    .deploy(uniswapV2FactoryAddress)
    .then((t) => t.deployed())
  await uniswapV2DefutureFactory.deployed()

  console.log("Deploying defuture router")

  const uniswapV2RouterFactory = await ethers.getContractFactory("UniswapV2DefutureRouter")
  uniswapV2DefutureRouter = await uniswapV2RouterFactory.deploy(
    uniswapV2RouterAddress,
    uniswapV2DefutureFactory.address
  )
  await uniswapV2DefutureRouter.deployed()
}

deploy()
