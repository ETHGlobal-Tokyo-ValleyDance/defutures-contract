import { ethers } from "hardhat"
import { saveConfig } from "./use.config"

const deployMulticall = async () => {
  const mf = await ethers.getContractFactory("Multicall2")
  const t = await mf.deploy()
  console.log(t.address)
  saveConfig("Multicall2", t.address)
}

deployMulticall()
