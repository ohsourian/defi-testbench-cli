import { BigNumber, Contract } from 'ethers';

export interface Token extends Contract {
  symbol(): Promise<string>;

  totalSupply(): Promise<BigNumber>;

  balanceOf(address: string, options?: any): Promise<BigNumber>;

  transfer(recipient: string, amount: BigNumber, options?: any): Promise<void>;

  approve(spender: string, amount: BigNumber, options?: any): Promise<void>;
}

export type Tokens = 'tBora' | 'sODN' | 'sMDL' | 'sFST' | 'wklay';

export type InputFix = 'in' | 'out';

export interface Quote {
  in: string;
  out: string;
  path: Array<string>;
}

export interface UniRouter extends Contract {
  addLiquidity(
    tokenA: string,
    tokenB: string,
    desiredA: BigNumber,
    desiredB: BigNumber,
    minA: BigNumber,
    minB: BigNumber,
    to: string,
    deadline: string,
    options?: any
  ): Promise<any>;

  swapExactTokensForTokens(
    amountIn: BigNumber,
    outMin: BigNumber,
    path: Array<string>,
    to: string,
    deadline: string,
    options?: any
  ): Promise<void>;

  swapTokensForExactTokens(
    amountOut: BigNumber,
    inMax: BigNumber,
    path: Array<string>,
    to: string,
    deadline: string,
    options?: any
  ): Promise<void>;

  quote(
    amountA: BigNumber,
    reserveA: BigNumber,
    reserveB: BigNumber
  ): Promise<BigNumber>;

  getAmountsOut(
    amountIn: BigNumber,
    path: Array<string>
  ): Promise<Array<BigNumber>>;

  getAmountsIn(
    amountOut: BigNumber,
    path: Array<string>
  ): Promise<Array<BigNumber>>;
}

export interface UniFactory extends Contract {
  allPairsLength(options?: any): Promise<BigNumber>;

  getPair(tokenA: string, tokenB: string): Promise<string>;
}

export interface Reserves {
  reserve0: BigNumber;
  reserve1: BigNumber;
  blockTimestampLast: number;
}

export interface UniPair extends Contract {
  getReserves(): Promise<Reserves>;

  balanceOf(owner: string): Promise<BigNumber>;

  token0(): Promise<string>;

  token1(): Promise<string>;
}
