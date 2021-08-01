const NFTSale = artifacts.require("NFTSale");

module.exports = function (deployer, network, accounts) {
  
  deployer.then(async () => {
    const instance = await deployer.deploy(NFTSale, "Non Fungable Tokens", "NFT");
    console.log("address", instance.address);
  });

};
