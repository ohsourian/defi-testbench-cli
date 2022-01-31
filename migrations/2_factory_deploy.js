const Factory = artifacts.require("UniswapV2Factory");

module.exports = function (deployer, network, addresses) {
  const address = addresses[0]
  deployer.deploy(Factory, address).then(async (inst) => {
    const codeHash = await inst.INIT_CODE_HASH();
    console.log(codeHash);
  });
};
