const Router = artifacts.require('UniswapV2Router01');

module.exports = function (deployer, network, addresses) {
  const factory = '0xCf5f27a4bB123280e2109b41f6fC980f03A5874D';
  const wklay = '0xa01282B03e7f5b0f14BE6a3AE44C4AD1ad64f5d6';
  deployer.deploy(Router, factory, wklay).then((router) => {
    console.log({ wklay: wklay, router: router.address });
  });
};
