import { network, ethers } from "hardhat"

const developmentChains = ["hardhat", "localhost"]

let t1, t2, t3

async function deploy() {
  const isDevelopment = developmentChains.includes(network.name)
  if (isDevelopment) {
    return "Not deploying to development network"
  }

  const [deployer] = await ethers.getSigners()

  const freeTokenFactory = await ethers.getContractFactory("FreeERC20")
  t1 = await freeTokenFactory.deploy("Token1", "T1").then((t) => t.deployed())
  t2 = await freeTokenFactory.deploy("Token2", "T2").then((t) => t.deployed())
  t3 = await freeTokenFactory.deploy("Token3", "T3").then((t) => t.deployed())

  await t1.deployed()
  await t2.deployed()
  await t3.deployed()

  const t1tx = await t1.mint(deployer.address, ethers.utils.parseEther("100000"))
  await t1tx.wait(3)

  const t2tx = await t2.mint(deployer.address, ethers.utils.parseEther("100000"))
  await t2tx.wait(3)

  const t3tx = await t3.mint(deployer.address, ethers.utils.parseEther("100000"))
  await t3tx.wait(3)

  console.log("t1 deployed to:", t1.address)
  console.log("t2 deployed to:", t2.address)
  console.log("t3 deployed to:", t3.address)
}

deploy()
