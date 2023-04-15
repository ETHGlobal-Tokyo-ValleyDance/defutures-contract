import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import dotenv from "dotenv"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      "contracts/uniswap-v2/core": {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            run: 200,
          },
        },
      },
      "contracts/uniswap-v2/periphery": {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            run: 200,
          },
        },
      },
      "contracts/uniswap-v3": {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            run: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    baobab: {
      url: "https://baobab01.fautor.app/",
      accounts: ["5399ae80a491ad8474a16a66321f7b0841a35d764b4bd67e5f583f324d7206f7"],
      gas: 6000000,
    },
  },
}

export default config
