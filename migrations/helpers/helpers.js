require("dotenv").config();
const { execSync } = require("child_process");
const ethers = require("ethers");
const Web3 = require("web3");

const hex = (string) => "0x" + Buffer.from(string).toString("hex");

const parseLogs = (tx) => {
    return tx.logs.map((log) => {
        console.log(log);
        return log;
    });
};

const verifyContract = async (network, contractName, proxyContractAddress, proxy) => {
    let provider = null,
        site = null;
    switch (
        network // TODO: add remain of net provider
    ) {
        case "development":
            //do nothing
            return;
        case "mainnet":
            provider = new Web3(`wss://mainnet.infura.io/ws/v3/${process.env.PROJECT_ID}`);
            break;
        case "rinkeby":
            provider = new Web3(`wss://rinkeby.infura.io/ws/v3/${process.env.PROJECT_ID}`);
            site = `https://rinkeby.etherscan.io/address/0xd8cd96c677c6ba5ce4405057e2decec448862bae#code`;
            break;
        case "kovan":
            provider = new Web3(`wss://speedy-nodes-nyc.moralis.io/205ac1736f7cd36ac53b59d7/eth/kovan/ws`);
            break;
    }
    let implementation;
    if (proxy) {
        // ERC1967 Standard proxy storage slot
        let storagePosition = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
        implementation = await provider.eth.getStorageAt(proxyContractAddress, storagePosition);
        implementation = ethers.utils.hexStripZeros(implementation);
    } else {
        implementation = proxyContractAddress;
    }

    try {
        Promise.resolve(execSync(`truffle run verify ${contractName}@${implementation} --network ${network}`)).then(
            () => console.log("\n", "\n", `${contractName} verified at ${implementation} on ${network} network`, "\n")
        );
    } catch (e) {
        console.log(`Error verifying ${contractName}@${implementation} : ${e})`);
    }
};

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

module.exports = {
    hex,
    parseLogs,
    ETH,
    ZERO_ADDRESS,
    verifyContract,
};
