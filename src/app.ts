import { ethers, Wallet } from 'ethers';
import assets, { tokenList } from './constants/assets';
import { ierc20 } from './constants/abis';
import chalk from 'chalk';
import { Token, Tokens } from './types/Assets';
import { getAllBalance } from './services/TokenService';
import { addLiquidity, getQuote, swapToken } from './services/RouterService';
import { getPool } from './services/FactoryService';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import { sign } from 'crypto';

console.log(chalk.bgGreen('foo'));

const formatOpt = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

let slippage = 0.03;

// async function swap(signer: Wallet) {
//   inquirer
//     .prompt([
//       {
//         type: 'input',
//         name: 'price',
//         message: 'enter tBora value:',
//         validate(input: string): boolean | string {
//           if (Number(input) && !isNaN(Number(input))) {
//             return true;
//           }
//           return 'only number can be accepted';
//         },
//       },
//     ])
//     .then(async (ans) => {
//       const quote = await getQuote('tBora', 'sODN', 'in', ans.price, signer);
//       console.log(`entered: ${ans.price} tBora`);
//       console.log(`tBora (in): ${quote.in} tBora`);
//       console.log(`sODN (out): ${quote.out} sODN`);
//       console.log(`slippage: 1%`);
//       inquirer
//         .prompt([
//           {
//             type: 'input',
//             name: 'choice',
//             message: 'Continue Swap? (Y/N)',
//             validate(input: string): boolean | string {
//               if (['Y', 'N'].includes(input.toUpperCase())) {
//                 return true;
//               }
//               return 'invalid input';
//             },
//           },
//         ])
//         .then(async (ans2) => {
//           if (['Y', 'N'].includes(ans2.choice.toUpperCase())) {
//             const amount = String(quote.in);
//             const slippage = String(quote.out * 0.99);
//             await swapToken('tBora', 'sODN', 'in', amount, slippage, signer);
//           }
//         });
//     });
// }

async function proceedAddLiquidity(signer: Wallet) {
  const tokens = await selectTokens();
  const pool = await getPool(tokens[0], tokens[1], signer);
  let amounts: [string, string] = ['', ''];
  if (pool) {
    console.log(chalk.blue('Pool Exist! Getting Quote...'));
    amounts[0] = await getAmountInput(`Enter ${tokens[0]} Amount to Transfer`);
    amounts[1] = await getQuote(pool, amounts[0], signer);
  } else {
    console.log(chalk.yellow('Pool Not Found! Create LP with Initial Ratio'));
    amounts[0] = await getAmountInput(`Enter ${tokens[0]} Amount to Transfer`);
    amounts[1] = await getAmountInput(`Enter ${tokens[1]} Amount to Transfer`);
  }
  console.log('<< Liquidity Transaction Bill >>');
  console.log(
    chalk.green(`1. ${tokens[0]}: -${formatCurrency(amounts[0], tokens[0])}`)
  );
  console.log(
    chalk.green(`2. ${tokens[1]}: -${formatCurrency(amounts[1], tokens[1])}`)
  );
  if (await promptConsent()) {
    const process = createSpinner(
      'Add Liquidity Transaction in Progress...'
    ).start();
    await sleep(500);
    try {
      const tRate = 1 - slippage;
      const minValues: [string, string] = [
        String(Number(amounts[0]) * tRate),
        String(Number(amounts[1]) * tRate),
      ];
      await addLiquidity(tokens, amounts, minValues, signer);
      process.success({ text: 'Liquidity Added!' });
    } catch (e) {
      console.error(e);
      process.success({ text: 'Something Went Wrong :(' });
    }
  }
}

function formatCurrency(value: string, unit: string) {
  return `${Number(value).toLocaleString('en-US', formatOpt)} ${unit}`;
}

async function selectTokens(): Promise<[Tokens, Tokens]> {
  const tkQuery = await inquirer.prompt([
    {
      type: 'list',
      name: 'dep',
      message: 'Select an asset of departure:',
      choices: tokenList,
    },
    {
      type: 'list',
      name: 'des',
      message: 'Select an asset of destination:',
      choices: tokenList,
    },
  ]);
  return [tkQuery.dep as Tokens, tkQuery.des as Tokens];
}

async function getAmountInput(msg = ''): Promise<string> {
  const message = msg.length ? msg : 'Enter Token Amount to Transfer';
  const amount = await inquirer.prompt({
    type: 'input',
    name: 'val',
    message,
    validate(input: string): boolean | string {
      if (Number(input) && !isNaN(Number(input))) {
        return true;
      }
      return 'only number can be accepted';
    },
  });
  return amount.val;
}

async function promptConsent(): Promise<boolean> {
  const consent = await inquirer.prompt({
    type: 'input',
    name: 'choice',
    message: 'Continue Swap? (Y/N)',
    validate(input: string): boolean | string {
      if (['Y', 'N'].includes(input.toUpperCase())) {
        return true;
      }
      return 'invalid input';
    },
  });
  return consent.choice.toUpperCase() === 'Y';
}

function sleep(ms = 2000) {
  return new Promise((r) => setTimeout(r, ms));
}

const availableActions = [
  'Add Liquidity',
  'remove Liquidity',
  'Swap Tokens',
  'Send Asset',
  'Wrapped Token',
  'Update Info',
  'Exit',
];

async function main() {
  // ## STEP 1. welcome message

  console.log(
    gradient.retro(figlet.textSync('Defi TestBench', { font: 'Small' }))
  );

  // ## STEP 2. connecting network

  const networkConnection = createSpinner(
    'Connecting to Ganache Local Testnet... (rpc: http://127.0.0.1:7545)'
  ).start();
  const provider = new ethers.providers.JsonRpcProvider(
    'http://127.0.0.1:7545'
  );
  await sleep(1000);
  try {
    const blockNo = await provider.getBlockNumber();
    networkConnection.success({
      text: `Connected to Ganache! (following ${blockNo} Blocks)`,
    });
  } catch (e) {
    networkConnection.error({ text: 'Network connection failure!' });
    process.exit(1);
  }

  // ## STEP 3. login (private key => welcome with wallet address)

  // const pvtKey = await inquirer.prompt({
  //   type: 'input',
  //   name: 'val',
  //   message: 'login with private key:',
  // });
  // const loginAttempt = createSpinner('logging in...').start();
  const signer = new Wallet(
    'bcf743d15a90d53b5caca1f56f9e2edf2cee89292585b292329590f7a03f5a0b',
    provider
  );
  // await sleep();
  // try {
  //   const nonce = await signer.getTransactionCount();
  //   loginAttempt.success({ text: 'logged in!' });
  //   console.log(chalk.green(`-- Address: ${signer.address}`));
  //   console.log(chalk.green(`-- TX Count: ${nonce} tx`));
  // } catch (e) {
  //   loginAttempt.error({ text: 'Invalid Login!' });
  //   process.exit(1);
  // }

  // ## STEP 4. loop begin

  let proceed = true;
  while (proceed) {
    // ## STEP 5. show balance
    console.log(
      '================================================================='
    );
    const balanceUpdate = createSpinner('Update chain info....').start();
    await sleep(500);
    try {
      const balances = await getAllBalance(signer);
      balanceUpdate.success({ text: 'Your Assets:' });
      console.log(chalk.green(`Address: ${signer.address}`));
      console.log(
        chalk.green(
          `1. ${formatCurrency(
            Number(
              ethers.utils.formatEther(await signer.getBalance())
            ).toString(),
            'klay'
          )}`
        )
      );
      tokenList.forEach((name, index) => {
        const balance = balances[index] || 0;
        console.log(
          chalk.green(
            `${index + 2}. ${formatCurrency(balance.toString(), name)}`
          )
        );
      });
    } catch (e) {
      networkConnection.error({ text: 'Assets Malfunction Failure!' });
      process.exit(1);
    }
    const selected = await inquirer.prompt({
      type: 'list',
      name: 'main',
      message: 'What should you do?',
      choices: availableActions,
    });
    switch (selected.main) {
      case availableActions[0]: // Add Liquidity
        await proceedAddLiquidity(signer);
        break;
      case availableActions[1]: // remove Liquidity
        break;
      case availableActions[2]: // Swap Tokens
        break;
      case availableActions[3]: // Send Asset
        break;
      case availableActions[4]: // Wrapped Token
        break;
      case availableActions[5]: // Update Info (Continue)
        break;
      default:
        // Exit, Error
        proceed = false;
        break;
    }
  }

  // ## STEP 7. good-bye message
  console.log(chalk.yellow('Good-Bye!'));
}

main();
