import { network, ethers } from "hardhat"
import { saveConfig } from "./use.config"

const developmentChains = ["hardhat", "localhost"]

let t1, t2

async function deploy() {
  // const isDevelopment = developmentChains.includes(network.name)
  // if (isDevelopment) {
  //   return "Not deploying to development network"
  // }

  const [deployer] = await ethers.getSigners()

  const freeTokenFactory = await ethers.getContractFactory("FreeERC20")
  t1 = await freeTokenFactory.deploy("USD-Tether", "USDT")
  await t1.deployed()
  console.log("t1 deployed to:", t1.address)
  saveConfig("t1", t1.address)

  t2 = await freeTokenFactory.deploy("GnosisChain", "GC")
  await t2.deployed()
  console.log("t2 deployed to:", t2.address)
  saveConfig("t2", t2.address)

  console.log("Wait to mint tokens...");

  console.log("fully deployed")
  const t1tx = await t1.mint(deployer.address, ethers.utils.parseEther("100000"))
  await t1tx.wait()

  const t2tx = await t2.mint(deployer.address, ethers.utils.parseEther("100000"))
  await t2tx.wait()


}

deploy()
