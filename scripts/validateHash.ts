import { artifacts, ethers } from "hardhat";

async function main() {
  const { bytecode } = artifacts.readArtifactSync("UniswapV2Pair");
  const COMPUTED_INIT_CODE_HASH = ethers.utils.keccak256(bytecode);
  const initHash = COMPUTED_INIT_CODE_HASH.slice(2); // -> init code
  console.log("Init Code Hash: ", initHash);

  // console.log(await artifacts.getAllFullyQualifiedNames())
  const buildInfo = await artifacts.getBuildInfo(
    `contracts/uniswap-v2/periphery/libraries/UniswapV2Library.sol:UniswapV2Library`
  )!;
  const src =
    buildInfo?.input.sources[
      "contracts/uniswap-v2/periphery/libraries/UniswapV2Library.sol"
    ]?.content;
  console.log(src?.includes(initHash));
}

main();
