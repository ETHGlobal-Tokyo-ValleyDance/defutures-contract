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
    mumbai: {
      chainId: 80001,
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: ["0xd1bce78f2658016e2d4677718f31b852e0de955c69c219bfb63ac840e3ffe7d1"],
    },
    baobab: {
      url: "https://baobab01.fautor.app/",
      accounts: ["5399ae80a491ad8474a16a66321f7b0841a35d764b4bd67e5f583f324d7206f7"],
    },
    localhost: {
      chainId: 31337,
    },
  },
}

export default config
