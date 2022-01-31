import { ethers, Wallet } from 'ethers';
import assets, { tokenList } from './constants/assets';
import { ierc20 } from './constants/abis';
import chalk from 'chalk';
import { Token } from './types/Assets';
import { getAllBalance } from './services/TokenService';
import { addLiquidity } from './services/RouterService';
import { getPool } from './services/FactoryService';

console.log(chalk.bgGreen('foo'));

const formatOpt = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
};

async function addLQ() {}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    'http://127.0.0.1:7545'
  );
  const signer = new Wallet(
    '02b963fc2dddea61c13b89a54023cedd0eb415209c79d80ecb5dbe8645b8a862',
    provider
  );
  const blockNo = await provider.getBlockNumber();
  console.log({ blockNo });

  // 1. My Token Balances
  const balances = await getAllBalance(signer);
  tokenList.forEach((name, index) => {
    const balance = balances[index] || 0;
    console.log(
      `${index + 1}. ${balance.toLocaleString('en-US', formatOpt)} ${name}`
    );
  });
  // await addLiquidity('tBora', 'sODN', signer);
  const res = await getPool('tBora', 'sODN', signer);
  console.log(res);
}

main();
