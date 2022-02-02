import {
  Contract,
  ContractReceipt,
  ethers,
  providers,
  Transaction,
  Wallet,
} from 'ethers';
import { UniRouter, Tokens, InputFix, Token, Quote } from '../types/Assets';
import assets from '../constants/assets';
import { irouter } from '../constants/abis';
import { approve } from './TokenService';
import { sign } from 'crypto';

export async function addLiquidity(
  tokenA: Tokens,
  tokenB: Tokens,
  signer: Wallet
) {
  const amountA = '500000000';
  const amountB = '1000000000';
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
  const deadline = await getDeadline(signer.provider, 10000);
  if (approvals.every((el) => el)) {
    try {
      const tx = await uniRouter.addLiquidity(
        assetMap[tokenA],
        assetMap[tokenB],
        weiA,
        weiB,
        wei0,
        wei0,
        signer.address,
        deadline,
        { nonce: nonce + 2, gasLimit: '3800000' }
      );
      tx.wait().then(
        (res: any) => {
          console.log('success??');
          return true;
        },
        async (error: any) => {
          console.log('error receipt');
          const code = await signer.provider.call(tx, tx.blockNumber);
          console.log({ code });
          return false;
        }
      );
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }
}

function hex_to_ascii(str1: string) {
  const hex = str1.toString();
  let str = '';
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

export async function getQuote(
  tokenIn: Tokens,
  tokenOut: Tokens,
  fix: InputFix,
  amount: string,
  signer: Wallet
): Promise<Quote> {
  const uniRouter = <UniRouter>(
    new ethers.Contract(assets.router, irouter, signer)
  );
  const assetMap = assets as { [key: string]: string };
  const path = [assetMap[tokenIn], assetMap[tokenOut]];
  if (fix === 'in') {
    const amountOut = await uniRouter.getAmountsOut(
      ethers.utils.parseEther(amount),
      path
    );
    return {
      in: Number(amount) || 0,
      out:
        Number(ethers.utils.formatEther(amountOut[amountOut.length - 1])) || 0,
    };
  } else {
    const amountIn = await uniRouter.getAmountsIn(
      ethers.utils.parseEther(amount),
      path
    );
    return {
      in: Number(ethers.utils.formatEther(amountIn[0])) || 0,
      out: Number(amount) || 0,
    };
  }
}

export async function swapToken(
  tokenIn: Tokens,
  tokenOut: Tokens,
  fix: InputFix,
  amount: string,
  slippage: string,
  signer: Wallet
) {
  const uniRouter = <UniRouter>(
    new ethers.Contract(assets.router, irouter, signer)
  );
  const assetMap = assets as { [key: string]: string };
  const path = [assetMap[tokenIn], assetMap[tokenOut]];
  const deadline = await getDeadline(signer.provider, 1000);
  const weiExt = ethers.utils.parseEther(amount);
  const weiEst = ethers.utils.parseEther(slippage);
  const nonce = await signer.getTransactionCount();
  await approve(tokenIn, amount, assets.router, signer, { nonce: nonce });
  if (fix === 'in') {
    await uniRouter.swapExactTokensForTokens(
      weiExt,
      weiEst,
      path,
      signer.address,
      deadline,
      { nonce: nonce + 1 }
    );
  } else {
    await uniRouter.swapTokensForExactTokens(
      weiExt,
      weiEst,
      path,
      signer.address,
      deadline,
      { nonce: nonce + 1, gasLimit: '1500000'}
    );
  }
}

async function getDeadline(
  provider: providers.Provider,
  future: number
): Promise<string> {
  const block = await provider.getBlock(await provider.getBlockNumber());
  return String(block.timestamp + future);
}
