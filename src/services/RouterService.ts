import { ethers, providers, Wallet } from 'ethers';
import {
  UniRouter,
  Tokens,
  InputFix,
  Quote,
  UniPair,
  Token,
} from '../types/Assets';
import assets from '../constants/assets';
import { ierc20, ipair, irouter } from '../constants/abis';
import { approve } from './TokenService';

export async function addLiquidity(
  tokenPair: [Tokens, Tokens],
  amountPair: [string, string],
  minPair: [string, string],
  signer: Wallet
): Promise<void> {
  const nonce = await signer.getTransactionCount();
  const assetMap = assets as { [key: string]: string };
  const uniRouter = <UniRouter>(
    new ethers.Contract(assets.router, irouter, signer)
  );
  const approvals = [
    await approve(tokenPair[0], amountPair[0], assets.router, signer, {
      nonce: nonce,
    }),
    await approve(tokenPair[1], amountPair[1], assets.router, signer, {
      nonce: nonce + 1,
    }),
  ];
  const weiA = ethers.utils.parseEther(amountPair[0]);
  const weiB = ethers.utils.parseEther(amountPair[1]);
  const weiMA = ethers.utils.parseEther(minPair[0]);
  const weiMB = ethers.utils.parseEther(minPair[1]);
  const deadline = await getDeadline(signer.provider, 1000);
  if (approvals.every((el) => el)) {
    try {
      await uniRouter.addLiquidity(
        assetMap[tokenPair[0]],
        assetMap[tokenPair[1]],
        weiA,
        weiB,
        weiMA,
        weiMB,
        signer.address,
        deadline,
        { nonce: nonce + 2, gasLimit: '3800000' }
      );
    } catch (e) {
      console.error(e);
    }
  }
}

export async function getSwapPreview(
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
      in: amount,
      out: Number(
        ethers.utils.formatEther(amountOut[amountOut.length - 1])
      ).toString(),
    };
  } else {
    const amountIn = await uniRouter.getAmountsIn(
      ethers.utils.parseEther(amount),
      path
    );
    return {
      in: Number(ethers.utils.formatEther(amountIn[0])).toString(),
      out: amount,
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
      { nonce: nonce + 1, gasLimit: '1500000' }
    );
  } else {
    await uniRouter.swapTokensForExactTokens(
      weiExt,
      weiEst,
      path,
      signer.address,
      deadline,
      { nonce: nonce + 1, gasLimit: '1500000' }
    );
  }
}

export async function getQuote(
  tokenA: Tokens,
  tokenB: Tokens,
  pool: string,
  amount: string,
  signer: Wallet
): Promise<string> {
  const assetMap = assets as { [key: string]: string };
  const tknA = <Token>new ethers.Contract(assetMap[tokenA], ierc20, signer);
  const tknB = <Token>new ethers.Contract(assetMap[tokenB], ierc20, signer);
  const balA = await tknA.balanceOf(pool);
  const balB = await tknB.balanceOf(pool);
  if (Number(balA.toString()) > 0 && Number(balB.toString()) > 0) {
    const amountA = ethers.utils.parseEther(amount);
    return Number(
      ethers.utils.formatEther(amountA.mul(balB).div(balA))
    ).toString();
  }
  return '0';
}

async function getDeadline(
  provider: providers.Provider,
  future: number
): Promise<string> {
  const block = await provider.getBlock(await provider.getBlockNumber());
  return String(block.timestamp + future);
}
