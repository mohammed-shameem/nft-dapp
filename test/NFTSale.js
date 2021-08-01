const NFTSale = artifacts.require("NFTSale");

contract("NFTSale Tests", (accounts) => {
  const seller = accounts[0];
  const buyer1 = accounts[1];
  const buyer2 = accounts[2];
  const tokenId = 1234;
  const tokenId2 = 3456;
  let NFTSaleInstance;
  it("Seller should be able to mint a non fungible token", async () => {
    NFTSaleInstance = await NFTSale.deployed();
    await NFTSaleInstance.mint(tokenId, { from: seller });
    await NFTSaleInstance.mint(tokenId2, { from: seller });
    const balance = await NFTSaleInstance.balanceOf.call(seller);
    assert.equal(balance.valueOf(), 2);
  });
  it("Users should not be able to mint a token with already minted tokenId", async () => {
    try {
      await NFTSaleInstance.mint(tokenId, { from: seller });
    } catch (err) {
      assert.isAbove(err.message.indexOf('tokenId already exist'), -1);
    }
  });
});