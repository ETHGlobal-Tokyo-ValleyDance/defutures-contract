import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import dotenv from "dotenv"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.18" }, { version: "0.6.6" }, { version: "0.5.16" }],
    overrides: {
      "contracts/uniswap-v2/core": {
        version: "0.5.16",
      },
      "contracts/uniswap-v2/periphery": {
        version: "0.6.6",
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
  },
}

export default config
