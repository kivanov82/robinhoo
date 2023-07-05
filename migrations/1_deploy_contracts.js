const { verifyContract } = require("./helpers/helpers.js");

const HoneyBotCoin = artifacts.require("HoneyBot");

module.exports = async (deployer, network, accounts) => {
  deployer.deploy(HoneyBotCoin);

  //const token = await HoneyBotCoin.at("0x0756e6aec5be4b1893c21ad72ca91e31aae128b4");
  //await token.toggleDex("0x34071e3ff120a00c32f9de817674f4c17bde63dc");

  /*try {
    await verifyContract(network, "HoneyBot", token.address, false);
  } catch (e) {
    //not deployed
  }*/
};
