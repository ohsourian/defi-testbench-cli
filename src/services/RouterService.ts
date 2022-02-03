import { ethers, providers, Wallet } from 'ethers';
import { UniRouter, Tokens, InputFix, Quote, UniPair } from '../types/Assets';
import assets from '../constants/assets';
import { ipair, irouter } from '../constants/abis';
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
      { nonce: nonce + 1, gasLimit: '1500000' }
    );
  }
}

export async function getQuote(
  pool: string,
  amount: string,
  signer: Wallet
): Promise<string> {
  const uniPool = <UniPair>new ethers.Contract(pool, ipair, signer);
  const reserves = await uniPool.getReserves();
  const uniRouter = <UniRouter>(
    new ethers.Contract(assets.router, irouter, signer)
  );
  const amountB = await uniRouter.quote(
    ethers.utils.parseEther(amount),
    reserves.reserve0,
    reserves.reserve1
  );
  return Number(ethers.utils.formatEther(amountB)).toString();
}

async function getDeadline(
  provider: providers.Provider,
  future: number
): Promise<string> {
  const block = await provider.getBlock(await provider.getBlockNumber());
  return String(block.timestamp + future);
}
