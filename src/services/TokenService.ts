import assets, { tokenList } from '../constants/assets';
import { Token, Tokens } from '../types/Assets';
import { ethers, Wallet } from 'ethers';
import { ierc20 } from '../constants/abis';

export async function getAllBalance(
  provider: Wallet
): Promise<Array<number | undefined>> {
  const assetMap = assets as { [key: string]: string };
  return await Promise.all(
    tokenList.map(async (key) => {
      const tokenAddress = assetMap[key] ?? '';
      if (tokenAddress.length) {
        const tkn = <Token>new ethers.Contract(tokenAddress, ierc20, provider);
        const bal = ethers.utils.formatEther(
          await tkn.balanceOf(provider.address)
        );
        return Number(bal);
      }
    })
  );
}

export async function approve(
  symbol: Tokens,
  amount: string,
  spender: string,
  signer: Wallet,
  options?: any
): Promise<boolean> {
  const assetMap = assets as { [key: string]: string };
  const tkn = <Token>new ethers.Contract(assetMap[symbol], ierc20, signer);
  const weiVal = ethers.utils.parseEther(amount);
  try {
    await tkn.approve(spender, weiVal, options);
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
}
