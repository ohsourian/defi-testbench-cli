import { ethers, Wallet } from 'ethers';
import { tokenList } from './constants/assets';
import chalk from 'chalk';
import { Tokens } from './types/Assets';
import { getAllBalance, getLPBalance } from './services/TokenService';
import {
  addLiquidity,
  getQuote,
  getSwapPreview,
  optimizePath,
  swapToken,
} from './services/RouterService';
import { getPool } from './services/FactoryService';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import { depositTo } from './services/WKLAYService';

const formatOpt = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};
const availableActions = [
  'Add Liquidity',
  'remove Liquidity',
  'Swap Tokens',
  'Send Asset',
  'Wrapped Token',
  'Update Info',
  'Exit',
];
let slippage = 0.03;

async function proceedSwap(signer: Wallet) {
  const tokens = await selectTokens();
  const swapAmount = await getAmountInput(
    `Enter ${chalk.bgBlueBright(tokens[0])} Amount to Swap`
  );
  const pathProcess = createSpinner('Finding Optimal Path...\n').start();
  await sleep(500);
  const optimalPath = await optimizePath(tokens[0], tokens[1], signer);
  if (!optimalPath) {
    pathProcess.error({ text: chalk.red('Swap Path Not Exist! :(') });
    return;
  }
  pathProcess.success({ text: chalk.green('Swap Preview Generated!') });
  const quote = await getSwapPreview(optimalPath, 'in', swapAmount, signer);
  console.log(chalk.bgBlackBright('<< Swap Transaction Bill >>'));
  console.log(
    `1. ${tokens[0]}: ${chalk.red('-' + formatCurrency(quote.in, tokens[0]))}`
  );
  console.log(
    `2. ${tokens[1]}: ${chalk.green(
      '+' + formatCurrency(quote.out, tokens[1])
    )}`
  );
  if (await promptConsent()) {
    const process = createSpinner(
      'Add Swap Transaction in Progress...'
    ).start();
    await sleep(500);
    try {
      const amount = quote.in;
      const minOut = (Number(quote.out) * (1 - slippage)).toString();
      await swapToken(optimalPath, tokens[0], 'in', amount, minOut, signer);
      process.success({ text: 'Swap Completed!' });
    } catch (e) {
      console.error(e);
      process.error({ text: 'Something Went Wrong :(' });
    }
  }
}

async function proceedAddLiquidity(signer: Wallet) {
  const tokens = await selectTokens();
  const pool = await getPool(tokens[0], tokens[1], signer);
  let amounts: [string, string] = ['', ''];
  if (pool) {
    console.log(chalk.blue('Pool Exist! Getting Quote...'));
    amounts[0] = await getAmountInput(
      `Enter ${chalk.bgBlueBright(tokens[0])} Amount to Transfer`
    );
    amounts[1] = await getQuote(tokens[0], tokens[1], pool, amounts[0], signer);
  } else {
    console.log(chalk.yellow('Pool Not Found! Create LP with Initial Ratio'));
    amounts[0] = await getAmountInput(
      `Enter ${chalk.bgBlueBright(tokens[0])} Amount to Transfer`
    );
    amounts[1] = await getAmountInput(
      `Enter ${chalk.bgBlueBright(tokens[1])} Amount to Transfer`
    );
  }
  console.log(chalk.bgBlackBright('<< Liquidity Transaction Bill >>'));
  console.log(
    `1. ${tokens[0]}: ${chalk.red('-' + formatCurrency(amounts[0], tokens[0]))}`
  );
  console.log(
    `2. ${tokens[1]}: ${chalk.red('-' + formatCurrency(amounts[1], tokens[1]))}`
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
      process.error({ text: 'Something Went Wrong :(' });
    }
  }
}

async function proceedRemoveLiquidity(signer: Wallet) {
  const tokens = await selectTokens();
  const pool = await getPool(tokens[0], tokens[1], signer);
  if (pool) {
    const balance = await getLPBalance(pool, signer);
    console.log(
      chalk.green(
        `${tokens[0]}-${tokens[1]} LP: ${formatCurrency(balance, 'LP')}`
      )
    );
    await sleep();
  } else {
    console.log(chalk.red('LP Not Exist :('));
  }
}

async function proceedDeposit(signer: Wallet) {
  console.log(chalk.yellow('!!WARNING!! Your KLAY will be used!'));
  const intake = await getAmountInput();
  console.log(chalk.bgBlackBright('<< WKLAY Deposit Bill >>'));
  console.log(`1. KLAY: ${chalk.red('-' + formatCurrency(intake, 'KLAY'))}`);
  console.log(
    `2. WKLAY: ${chalk.green('+' + formatCurrency(intake, 'WKLAY'))}`
  );
  if (await promptConsent()) {
    const process = createSpinner(
      'WKLAY Deposit Transaction in Progress...'
    ).start();
    await sleep(500);
    try {
      await depositTo(intake, signer);
      process.success({ text: 'Deposit Success' });
    } catch (e) {
      console.error(e);
      process.error({ text: 'Deposit Failed' });
    }
  }
}

async function proceedTransferToken(signer: Wallet) {
  const tokens = await selectTokens();
}

/**
 * COMMON FUNCTIONS
 */

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

async function selectSingleToken(): Promise<Tokens> {
  const tkQuery = await inquirer.prompt([
    {
      type: 'list',
      name: 'tk',
      message: 'Select an asset:',
      choices: tokenList,
    },
  ]);
  return tkQuery.tk as Tokens;
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
    message: 'Continue Process? (Y/N)',
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

/**
 * CLI MAIN FUNCTION
 */
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
    '682bdd66664f073f48705553f608f5cf399b72c7850c74cdd1c5bc654d36b8a2',
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
      gradient.retro(
        '================================================================='
      )
    );
    const balanceUpdate = createSpinner('Update chain info....').start();
    await sleep(500);
    try {
      const balances = await getAllBalance(signer);
      balanceUpdate.success({ text: chalk.yellow('Your Assets:') });
      console.log(`Address: ${signer.address}`);
      console.log(`Block Sync: ${await signer.provider.getBlockNumber()}`);
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
      message: chalk.yellow('What should you do?'),
      choices: availableActions,
    });
    switch (selected.main) {
      case availableActions[0]: // Add Liquidity
        await proceedAddLiquidity(signer);
        break;
      case availableActions[1]: // remove Liquidity
        await proceedRemoveLiquidity(signer);
        break;
      case availableActions[2]: // Swap Tokens
        await proceedSwap(signer);
        break;
      case availableActions[3]: // Send Asset
        await proceedTransferToken(signer);
        break;
      case availableActions[4]: // Wrapped Token
        await proceedDeposit(signer);
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
