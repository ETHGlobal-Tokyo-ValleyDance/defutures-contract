import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2DefutureFactory, uniswapV2DefutureRouter
let uniswapV2FactoryAddress = "0xa4c0547F7a042B6a82daF2761BCB3eC6be8729Ea"
let uniswapV2RouterAddress = "0xF5C4a92A261Cc31D0AbCc920A09b37eC9AE4b926"

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

  console.log("Defuture factory deployed to:", uniswapV2DefutureFactory.address)
  console.log("Defuture router deployed to:", uniswapV2DefutureRouter.address)
}

deploy()

// defuture factory: 0xcd377Bb4857ec8a23b756873f30bE6853c7f0aBD
// defuture router: 0x571C963238606baD495ed3c14841b188eF97b733
