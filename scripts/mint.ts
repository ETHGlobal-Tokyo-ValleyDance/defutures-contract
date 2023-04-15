import { ethers } from "hardhat";
import { getConfig } from "./use.config";

async function mint(to: string, amount: number){
    
    const config = getConfig();
    const t1 = await ethers.getContractAt("FreeERC20", config.t1);
    const t2 = await ethers.getContractAt("FreeERC20", config.t2);

    await t1.mint(to, ethers.utils.parseEther(""+amount)).then(r => r.wait());
    await t2.mint(to, ethers.utils.parseEther(""+amount)).then(r => r.wait());
}

mint("0x48d0056d0422291Bc2157e66592B4cA0c9eA0f3c", 100);
