import { ethers } from "hardhat";
import { getConfig } from "./use.config";

async function main(){
    const config = getConfig();
    const defRouter = await ethers.getContractAt("UniswapV2DefutureRouter", config.defutureRouter);
    const defutureFactory = await ethers.getContractAt("UniswapV2DefutureFactory", config.defutureFactory);

    console.log(config.t1, config.t2)
    console.log(await defutureFactory.getDefuture(config.t1, config.t2))
    console.log(await defRouter.getFutureMarketInfo(config.t1, config.t2))
    console.log(await defRouter.getFutureMarketInfo(config.t2, config.t1))
}

main()