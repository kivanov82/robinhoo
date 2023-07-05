const { verifyContract } = require("./helpers/helpers.js");

const HoneyBotCoin = artifacts.require("HoneyBot");

module.exports = async (deployer, network, accounts) => {
  //deployer.deploy(HoneyBotCoin);

  const token = await HoneyBotCoin.at("0x136f5015de80b92848745dcd2729ffeb3f9a654e");
  //await token.toggleDex("0x34071e3ff120a00c32f9de817674f4c17bde63dc");

  try {
    await verifyContract(network, "HoneyBot", token.address, false);
  } catch (e) {
    //not deployed
  }
};
