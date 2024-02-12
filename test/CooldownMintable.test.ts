import type { CoolDownMintableERC1155 } from "../typechain-types";

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'

async function deploy() {
  const cooldownFactory = await ethers.getContractFactory("CoolDownMintableERC1155");
  const token = (await cooldownFactory.deploy()) as CoolDownMintableERC1155;
  await token.waitForDeployment();
  const account = (await ethers.getSigners())[0]!;
  const amountOfTokens = 7;
  const tokenIds = Array.from({ length: amountOfTokens }, (_, index) => index.toString());

  async function getBalances () {
    const accountIds = Array.from({ length: amountOfTokens }, () => account.address);
    return [...await token.balanceOfBatch(accountIds, tokenIds)];
  }

  return {
    token,
    account,
    getBalances
  };
}

describe("CoolDownMintableERC1155 Contract Tests", function () {
  it("Should be able to trade in NFTs accordingly", async () => {
    const { token, getBalances } = await loadFixture(deploy);

    // We'd love to seed the balances right here before testing
    // await seedBalances([3n, 3n, 3n, 3n, 0n, 0n, 0n])

    let balances = await getBalances();
    expect(balances).to.have.all.members([3n, 3n, 3n, 3n, 0n, 0n, 0n]);
    await token.tradeIn();
    balances = await getBalances();
    expect(balances).to.have.all.members([3n, 2n, 1n, 0n, 0n, 0n, 1n]);
  })
});