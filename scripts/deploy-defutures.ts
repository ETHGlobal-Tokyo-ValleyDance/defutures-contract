import { network, ethers } from "hardhat"
import { getConfig, saveConfig } from "./use.config";


let uniswapV2DefutureFactory, uniswapV2DefutureRouter

async function deploy() {
  const config = getConfig();

  let uniswapV2FactoryAddress = config.V2Factory
  let uniswapV2RouterAddress = config.V2Router


  const [deployer] = await ethers.getSigners()

  console.log("Deploying defuture factory")

  const uniswapV2DefutureFactoryFactory = await ethers.getContractFactory("UniswapV2DefutureFactory")
  uniswapV2DefutureFactory = await uniswapV2DefutureFactoryFactory
    .deploy(uniswapV2FactoryAddress)
    .then((t) => t.deployed())
  await uniswapV2DefutureFactory.deployed();

  console.log("Defuture factory deployed to:", uniswapV2DefutureFactory.address)
  saveConfig("defutureFactory", uniswapV2DefutureFactory.address)

  const creationTx = await uniswapV2DefutureFactory.createDefuture(2000, 1500, 2000, config.t1, config.t2)
  await creationTx.wait();

  console.log("Deploying defuture router")
  const uniswapV2RouterFactory = await ethers.getContractFactory("UniswapV2DefutureRouter")
  uniswapV2DefutureRouter = await uniswapV2RouterFactory.deploy(
    uniswapV2RouterAddress,
    uniswapV2DefutureFactory.address
  )
  await uniswapV2DefutureRouter.deployed()
  console.log("Defuture router deployed to:", uniswapV2DefutureRouter.address)
  saveConfig("defutureRouter", uniswapV2DefutureRouter.address)


}

deploy()

// defuture factory: 0xcd377Bb4857ec8a23b756873f30bE6853c7f0aBD
// defuture router: 0x571C963238606baD495ed3c14841b188eF97b733
