import { ethers, network } from "hardhat"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const filePath = join(__dirname, "configs.json")
export const getConfig = () => {
  const { chainId } = network.config;
  const config = JSON.parse(readFileSync(filePath, "utf-8"))
  return config[chainId + ""] || {};
}

export const saveConfig = (key: string, value: string) => {
  const { chainId } = network.config

  // @ts-ignore
  const config = JSON.parse(readFileSync(filePath, "utf-8"))
  const thisConfig = config[chainId + ""] || {}

  writeFileSync(
    join(__dirname, "configs.json"),
    JSON.stringify({ ...config, [chainId + ""]: { ...thisConfig, [key]: value } }, null, 2)
  )
}

