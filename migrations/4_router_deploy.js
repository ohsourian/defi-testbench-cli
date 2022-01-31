const WKLAY = artifacts.require('WKLAY');
const Router = artifacts.require('UniswapV2Router01');

module.exports = function (deployer, network, addresses) {
  const factory = '0x39c8b5bdc9554ED2Ff7C513c00b34593f3cAD0A4';
  deployer.deploy(WKLAY).then((wklay) => {
    deployer.deploy(Router, factory, wklay.address).then((router) => {
      console.log({ wklay: wklay.address, router: router.address });
    });
  });
};
