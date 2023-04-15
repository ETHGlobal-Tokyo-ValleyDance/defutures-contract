import { ethers } from "hardhat";
import { getConfig } from "./use.config";

async function main(){
    const config = getConfig();
    const defRouter = await ethers.getContractAt("UniswapV2DefutureRouter", config.defutureRouter);
    const defutureFactory = await ethers.getContractAt("UniswapV2DefutureFactory", config.defutureFactory);
}

main()