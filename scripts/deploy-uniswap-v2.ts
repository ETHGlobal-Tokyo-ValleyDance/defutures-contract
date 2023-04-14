import { ethers } from "hardhat"
import { V2Factory, V2Factory__factory } from "../typechain-types"

async function main() {
  const [deployer] = await ethers.getSigners()
  const v2FactoryFactory = (await ethers.getContractFactory("V2Factory")) as V2Factory__factory
  await v2FactoryFactory.deploy(deployer.address)
}

main()
