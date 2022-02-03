const Router = artifacts.require('UniswapV2Router01');

module.exports = function (deployer, network, addresses) {
  const factory = '0x8109762838Cb871199FcbdaF12830196277b0A8a';
  const wklay = '0xdDa9eA64C54Dd13b09aeaFFB6cA3c7deD666eB50';
  deployer.deploy(Router, factory, wklay).then((router) => {
    console.log({ wklay: wklay, router: router.address });
  });
};
