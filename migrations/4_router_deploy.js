const Router = artifacts.require('UniswapV2Router01');

module.exports = function (deployer, network, addresses) {
  const factory = '0x0F8D6FB1F39c9E14EB2201c75DfC73cA6888f4D4';
  const wklay = '0x68b59E3B4F0FEc468CeB279956eDE35E5e5bBc80';
  deployer.deploy(Router, factory, wklay).then((router) => {
    console.log({ wklay: wklay, router: router.address });
  });
};
