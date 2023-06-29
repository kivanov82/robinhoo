const { verifyContract } = require("./helpers/helpers.js");

const RobinHooCoin = artifacts.require("RobinHoo");

module.exports = async (deployer, network, accounts) => {
  //deployer.deploy(RobinHooCoin);

  const token = await RobinHooCoin.at("0xe198a9e104cf5390abf4ecb018d38c1c93eb86a7");
  await token.toggleDex("0x34071e3ff120a00c32f9de817674f4c17bde63dc");

  try {
    await verifyContract(network, "RobinHoo", token.address, false);
  } catch (e) {
    //not deployed
  }
};
