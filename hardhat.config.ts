import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import dotenv from "dotenv"

dotenv.config()

const SH_ACCOUNT = process.env.SH_ACCOUNT!
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
    mumbai: {
      chainId: 80001,
      url: "https://rpc-mumbai.maticvigil.com",
      // 0x48d0056d0422291Bc2157e66592B4cA0c9eA0f3c
      accounts: [SH_ACCOUNT],
    },
    baobab: {
      url: "https://baobab01.fautor.app/",
      accounts: [SH_ACCOUNT],
    },
    localhost: {
      chainId: 31337,
    },
    scroll: {
      chainId: 534353,
      url: "https://alpha-rpc.scroll.io/l2",
      accounts: [SH_ACCOUNT],
    },
    linea: {
      chainId: 59140,
      url: "https://rpc.goerli.linea.build",
      accounts: [SH_ACCOUNT],
    },

    taiko: {
      chainId: 167002,
      url: "https://l2rpc.hackathon.taiko.xyz",
      accounts: [SH_ACCOUNT],
    },
    celo: {
      chainId: 44787,
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [SH_ACCOUNT],
    },
    mantle: {
      chainId: 5001,
      url: "https://rpc.testnet.mantle.xyz",
      accounts: [SH_ACCOUNT],
    },
  },
}
export default config
