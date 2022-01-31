import { Tokens, UniFactory } from '../types/Assets';
import { ethers, Wallet } from 'ethers';
import assets from '../constants/assets';
import { ifactory } from '../constants/abis';

export async function getPool(tokenA: Tokens, tokenB: Tokens, signer: Wallet) {
  const uniFactory = <UniFactory>(
    new ethers.Contract(assets.factory, ifactory, signer)
  );
  const assetMap = assets as { [key: string]: string };
  const poolLength: string = (await uniFactory.allPairsLength()).toString();
  const lpAddress: string = await uniFactory.getPair(
    assetMap[tokenA],
    assetMap[tokenB]
  );
  return { poolLength, lpAddress };
}
