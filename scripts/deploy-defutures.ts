import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let uniswapV2DefutureFactory, uniswapV2DefutureRouter
let uniswapV2FactoryAddress = "0xAC71263c6ed24ea08Fd983932a0f7EeAca16734c"
let uniswapV2RouterAddress = "0x9C4205C75c1C14463018FD333FF3cf765BB86309"

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
