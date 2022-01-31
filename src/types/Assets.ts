import { BigNumber, Contract } from 'ethers';

export interface Token extends Contract {
  symbol(options?: any): Promise<string>;

  totalSupply(options?: any): Promise<BigNumber>;

  balanceOf(address: string, options?: any): Promise<BigNumber>;

  transfer(recipient: string, amount: BigNumber, options?: any): Promise<void>;

  approve(spender: string, amount: BigNumber, options?: any): Promise<void>;
}

export type Tokens = 'tBora' | 'sODN' | 'sMDL' | 'sFST' | 'wklay';

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
  ): Promise<void>;
}

export interface UniFactory extends Contract {
  allPairsLength(options?: any): Promise<BigNumber>;

  getPair(tokenA: string, tokenB: string): Promise<string>;
}
