const WTKN = artifacts.require("WKLAY");
const Router = artifacts.require("UniswapV2Router02");

module.exports = function (deployer, network, addresses) {
  const address = addresses[0]
  const factory = '0xD9a7E85bD152b9e694376F60DFBbA1fBD95fD040';
  const wtkn = '0x430030Ca8760c8daB5fF525771Afa8b91EDA10E7'
  deployer.deploy(Router, factory, wtkn).then((router) => {
    console.log(router.address)
  })
};
