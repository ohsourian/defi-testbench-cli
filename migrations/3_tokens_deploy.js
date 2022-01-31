const Token = artifacts.require('TokenBase');

module.exports = function (deployer, network, addresses) {
  const address = addresses[0];
  deployer.deploy(Token, 'tBora', 'tBora', 18).then(async (inst) => {
    const name = await inst.name();
    await inst.supplyFund(address, '5000000000000000000000000000');
    const fund = await inst.totalSupply();
    console.log(`${name}: ${fund}`);
  });
  deployer.deploy(Token, 'sODN', 'sODN', 18).then(async (inst) => {
    const name = await inst.name();
    await inst.supplyFund(address, '30000000000000000000000000000');
    const fund = await inst.totalSupply();
    console.log(`${name}: ${fund}`);
  });
  deployer.deploy(Token, 'sMDL', 'sMDL', 18).then(async (inst) => {
    const name = await inst.name();
    await inst.supplyFund(address, '30000000000000000000000000000');
    const fund = await inst.totalSupply();
    console.log(`${name}: ${fund}`);
  });
  deployer.deploy(Token, 'sFST', 'sFST', 18).then(async (inst) => {
    const name = await inst.name();
    await inst.supplyFund(address, '30000000000000000000000000000');
    const fund = await inst.totalSupply();
    console.log(`${name}: ${fund}`);
  });
};
