import { existsSync, mkdirSync, writeFileSync } from "fs"
import { artifacts } from "hardhat"
import { join } from "path"

async function main() {
  const names = await artifacts.getAllFullyQualifiedNames()

  // [path, name]
  const targetContracts: [string, string][] = [
    ["contracts/core/uniswap-v2/UniswapV2Defuture.sol:UniswapV2Defuture", "UniswapV2Defuture"],
    ["contracts/core/uniswap-v2/UniswapV2DefutureRouter.sol:UniswapV2DefutureRouter", "UniswapV2DefutureRouter"],
    ["contracts/interfaces/utils/IERC20.sol:IERC20", "ERC20"],
    ["contracts/interfaces/utils/IERC721.sol:IERC721", "ERC721"],
    ["contracts/utils/Multicall2.sol:Multicall2", "Multicall2"],
    ["contracts/uniswap-v2/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair", "UniswapV2Pair"],
  ]

  const abiDir = join(__dirname, "../abi")
  if (!existsSync(abiDir)) mkdirSync(abiDir)

  targetContracts.map(([path, name]) => {
    artifacts.readArtifact(path).then((res) => {
      writeFileSync(
        join(abiDir, name + ".json"),
        JSON.stringify(
          res.abi.filter((item) => item.type !== "constructor"),
          null,
          2
        )
      )
    })
  })
}

main()
