import { ethers, Wallet } from 'ethers';
import assets, { tokenList } from './constants/assets';
import { ierc20 } from './constants/abis';
import chalk from 'chalk';
import { Token } from './types/Assets';
import { getAllBalance } from './services/TokenService';
import { addLiquidity, getQuote, swapToken } from './services/RouterService';
import { getPool } from './services/FactoryService';
import inquirer from 'inquirer';

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
    'c93e89eb8d72050f2b3bdf1c10a0c6bde167e6cb95e8be979f1a095e74d4adf5',
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
  // Add Liquidity, create pool
  // await addLiquidity('tBora', 'sODN', signer);

  // check pool existence
  // const res = await getPool('tBora', 'sODN', signer);
  // console.log(res);

  // const quote = await getQuote('tBora', 'sODN', 'out', '120.0', signer);
  // console.log(quote);

  await inquirer
    .prompt([
      {
        type: 'input',
        name: 'price',
        message: 'enter tBora value:',
        validate(input: string): boolean | string {
          if (Number(input) && !isNaN(Number(input))) {
            return true;
          }
          return 'only number can be accepted';
        },
      },
    ])
    .then(async (ans) => {
      const quote = await getQuote('tBora', 'sODN', 'in', ans.price, signer);
      console.log(`entered: ${ans.price} tBora`);
      console.log(`tBora (in): ${quote.in} tBora`);
      console.log(`sODN (out): ${quote.out} sODN`);
      console.log(`slippage: 1%`);
      inquirer
        .prompt([
          {
            type: 'input',
            name: 'choice',
            message: 'Continue Swap? (Y/N)',
            validate(input: string): boolean | string {
              if (['Y', 'N'].includes(input.toUpperCase())) {
                return true;
              }
              return 'invalid input';
            },
          },
        ])
        .then(async (ans2) => {
          if (['Y', 'N'].includes(ans2.choice.toUpperCase())) {
            const amount = String(quote.in);
            const slippage = String(quote.out * 0.99);
            await swapToken('tBora', 'sODN', 'in', amount, slippage, signer);
          }
        });
    });
}

main();
