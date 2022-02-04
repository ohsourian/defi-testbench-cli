import { Token, Tokens, UniPair } from './Assets';
import { ethers, Wallet } from 'ethers';
import { ierc20, ipair } from '../constants/abis';

export class PairWrap {
  pool: UniPair;
  tokenA: Token;
  tokenB: Token;

  constructor(pool: UniPair, tokenA: string, tokenB: string) {
    this.pool = pool;
    this.tokenA = <Token>new ethers.Contract(tokenA, ierc20, pool.signer);
    this.tokenB = <Token>new ethers.Contract(tokenB, ierc20, pool.signer);
  }

  static async buildPairWrap(
    graph: Map<string, Array<string>>,
    pair: UniPair
  ): Promise<PairWrap> {
    const [tA, tB] = [await pair.token0(), await pair.token1()];
    if (graph.get(tA) !== undefined) {
      graph.get(tA)?.push(tB);
    } else {
      graph.set(tA, [tB]);
    }
    if (graph.get(tB) !== undefined) {
      graph.get(tB)?.push(tA);
    } else {
      graph.set(tB, [tA]);
    }
    return new PairWrap(pair, tA, tB);
  }
}
