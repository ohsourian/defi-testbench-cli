const Router = artifacts.require('UniswapV2Router01');

module.exports = function (deployer, network, addresses) {
  const factory = '0x8d80a204523d967Cb72Ea394B987Ba5aCC47d403';
  const wklay = '0xf33229A78c7CD5DabE6F6A05bb620075875f2693';
  deployer.deploy(Router, factory, wklay).then((router) => {
    console.log({ wklay: wklay, router: router.address });
  });
};
