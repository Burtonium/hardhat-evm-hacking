
import type { CoolDownMintableERC1155 } from "../typechain-types";

import { expect } from "chai";
import { ethers } from "hardhat";
import { setStorageAt, loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'

const abiCoder = new ethers.AbiCoder();

function getSlot(contractAddress: string, tokenId: string, storageSlot = 0n) {
  const hash = ethers.keccak256(abiCoder.encode(['uint', 'uint'], [tokenId, storageSlot]));
  return ethers.keccak256(abiCoder.encode(['address', 'bytes32'], [contractAddress, hash]));
}

async function seedBalances(contractAddr: string, userAddress: string, tokenBalances: [string, string][]): Promise<void> {
  await Promise.all(tokenBalances.map(async ([tokenId, balance]) => {
    const userNFTBalanceSlot = getSlot(userAddress, tokenId);
    await setStorageAt(
      contractAddr,
      userNFTBalanceSlot,
      abiCoder.encode(['uint'], [balance]),
    );
  }))
}

async function deploy() {
  const cooldownFactory = await ethers.getContractFactory("CoolDownMintableERC1155");
  const token = (await cooldownFactory.deploy()) as CoolDownMintableERC1155;
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  const account = (await ethers.getSigners())[0]!;
  const amountOfTokens = 7;
  const tokenIds = Array.from({ length: amountOfTokens }, (_, index) => index.toString());

  async function getBalances () {
    const accountIds = Array.from({ length: amountOfTokens }, () => account.address);
    return [...await token.balanceOfBatch(accountIds, tokenIds)];
  }

  const balanceSeeder = (balances: (bigint | string)[]) => seedBalances(
    tokenAddress,
    account.address,
    tokenIds.map((id, idx) => [id, balances[idx]?.toString()] as [string, string])
  );

  return {
    token,
    account,
    getBalances,
    seedBalances: balanceSeeder
  };
}


describe("CoolDownMintableERC1155 Contract Tests", function () {
  it("Should be able to trade in NFTs accordingly", async () => {
    const { token, seedBalances, getBalances } = await loadFixture(deploy);

    await seedBalances([3n, 3n, 3n, 3n, 0n, 0n, 0n])
    
    let balances = await getBalances();

    expect(balances).to.have.all.members([3n, 3n, 3n, 3n, 0n, 0n, 0n]);
    await token.tradeIn();
    balances = await getBalances();
    expect(balances).to.have.all.members([3n, 2n, 1n, 0n, 0n, 0n, 1n]);
  })
});