const { BigNumber, ethers } = require("ethers");
const { contractAddr, verifyMessage, alchemyAPI, nftAddr } = require('../config.json');
const contractABI = require('./abi.json');

const readContract = {
    getBalanceOf721: async (signature) => {
        try {
            const provider = new ethers.providers.JsonRpcProvider(alchemyAPI);
            const signer = provider.getSigner();
            const connectContract = new ethers.Contract(contractAddr, contractABI, provider)
            const getBalance = await connectContract.balanceOfERC721(nftAddr, verifyMessage, signature)
            const bigNumber = BigNumber.from(getBalance._hex).toNumber();
            console.log("[getBalanceOf721]bigNumber ---> ", bigNumber)
            return bigNumber;
        } catch (error) {
            console.error("[getBalanceOf721] Error ---> ", error);
            return null
        }
    },
    getBalanceOf1155: async () => {

    },
    getOwnerOf721: async () => {

    }
}

module.exports = readContract;