import { Contract, ethers, Wallet } from 'ethers';
import { UniRouter, Tokens } from '../types/Assets';
import assets from '../constants/assets';
import { irouter } from '../constants/abis';
import { approve } from './TokenService';

export async function addLiquidity(
  tokenA: Tokens,
  tokenB: Tokens,
  signer: Wallet
) {
  const amountA = '5000000000';
  const amountB = '10000000000';
  const nonce = await signer.getTransactionCount();
  const assetMap = assets as { [key: string]: string };
  const uniRouter = <UniRouter>(
    new ethers.Contract(assets.router, irouter, signer)
  );
  const approvals = [
    await approve(tokenA, amountA, assets.router, signer, { nonce: nonce }),
    await approve(tokenB, amountB, assets.router, signer, { nonce: nonce + 1 }),
  ];
  const weiA = ethers.utils.parseEther(amountA);
  const weiB = ethers.utils.parseEther(amountB);
  const wei0 = ethers.utils.parseEther('0');
  const block = await signer.provider.getBlockNumber();
  const blockTime = await signer.provider.getBlock(block);
  if (approvals.every((el) => el)) {
    try {
      await uniRouter.addLiquidity(
        assetMap[tokenA],
        assetMap[tokenB],
        weiA,
        weiB,
        wei0,
        wei0,
        signer.address,
        `${blockTime.timestamp + 100000}`,
        { nonce: nonce + 2 }
      );
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }
}
