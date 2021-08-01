const NFTSale = artifacts.require("NFTSale");
const helper = require('./utils.js');

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

  it("Should fail when a different user who is not owner tries to put on sale", async () => {
    try {
      const endTime = helper.getTimeStamp() + 60*60; //1 hour from now 
      const price = web3.utils.toWei('1', 'ether');
      await NFTSaleInstance.putOnAuction(tokenId, price, endTime, { from: accounts[6] });
    } catch (err) {
      assert.isAbove(err.message.indexOf('caller not an owner or approved'), -1);
    }
  });

  it("Seller as owner of token should be able to put token on sale", async () => {
    const endTime = helper.getTimeStamp() + 60*60; //1 hour from now
    const price = web3.utils.toWei('1', 'ether');
    await NFTSaleInstance.putOnAuction(tokenId, price, endTime, { from: seller });
    const isOnSale = await NFTSaleInstance.getNFTBidStatus.call(tokenId);
    assert.equal(isOnSale[0], true);
  });

  it("Seller should not be able to put on sale the same token again", async () => {
    try {
      const endTime = helper.getTimeStamp() + 60*60; //1 hour from now
      const price = web3.utils.toWei('1', 'ether');
      
      await NFTSaleInstance.putOnAuction(tokenId, price, endTime, { from: seller });
    } catch (err) {
      assert.isAbove(err.message.indexOf('Already on sale'), -1);
    }
  });

  it("Should fail to bid when owner tries to bid", async () => {
    try {
      const price = web3.utils.toWei('1', 'ether');
      await NFTSaleInstance.bid(tokenId, { from: seller, value: price });
    } catch (err) {
      assert.isAbove(err.message.indexOf('owner cannot bid'), -1);
    }
  });

  it("Should fail to bid when token is not on sale", async () => {
    try {
      const price = web3.utils.toWei('1', 'ether');
      await NFTSaleInstance.bid(tokenId2, { from : buyer1, value: price });
    } catch (err) {
      assert.isAbove(err.message.indexOf('Not on sale'), -1);
    }
  });

  it("Should fail when buyer1 tries to bid with a lower amount than minimum price", async () => {
    try {
      const price = web3.utils.toWei('.1', 'ether');
      await NFTSaleInstance.bid(tokenId, { from: buyer1, value: price });
    } catch (err) {
      assert.isAbove(err.message.indexOf('value sent is lower than min price'), -1);
    }
  });

  it("Buyer 1 should be able to bid with price higher than minimum price", async () => {
    const price = web3.utils.toWei('1.1', 'ether');
    await NFTSaleInstance.bid(tokenId, { from : buyer1, value: price});
  });

  it("Should fail when buyer2 tries to bid with same price as buyer1s bid", async () => {
    try {
      const price = web3.utils.toWei('1.1', 'ether');
      await NFTSaleInstance.bid(tokenId, { from : buyer2, value: price });
    } catch (err) {
      assert.isAbove(err.message.indexOf('value sent is lower than current bid'), -1);
    }
  });

  it("Buyer 2 should be able to bid with price higher than buyer1s price", async () => {
    const price = web3.utils.toWei('2', 'ether');
    await NFTSaleInstance.bid(tokenId, { from : buyer2, value: price });
    const bidData = await NFTSaleInstance.getNFTBidStatus.call(tokenId);
    assert.equal(bidData[1], buyer2);
  });

  it("Buyer 1 should get refund when someone place higher bid", async () => {
    const balance = await NFTSaleInstance.getUserEtherBalance.call({ from : buyer1 });
    assert.equal(web3.utils.fromWei(balance), 1.1);
  });

  it("Buyer 1 should be able to withdraw Ether from contract", async () => {
    const buyer1InitialBalance = web3.utils.fromWei(await web3.eth.getBalance(buyer1), 'ether');
    await NFTSaleInstance.withDrawEther({ from : buyer1 });
    const buyer1FinalBalance = web3.utils.fromWei(await web3.eth.getBalance(buyer1), 'ether');
    assert.isAbove(Number(buyer1FinalBalance), Number(buyer1InitialBalance));
  });

  it("Should fail when buyer1 tries to claim as buyer1s bid is no more valid", async () => {
    try {
      await NFTSaleInstance.claim(tokenId, { from : buyer1 });
    } catch (err) {
      assert.isAbove(err.message.indexOf('Not latest bidder'), -1);
    }
  });

  it("Should fail when buyer2 tries to claim the token before end of sale", async () => {
    try {
      await NFTSaleInstance.claim(tokenId, { from : buyer2 });
    } catch (err) {
      assert.isAbove(err.message.indexOf('Cannot claim before sale end time'), -1);
    }
  });
  
  it("Buyer 2 should be able to claim token after end of sale", async () => {
      // take snapshot and advance time to test claim after end of sale
      const snapShot = await helper.takeSnapShot(); 
      const snapshotId = snapShot['result'];
      await helper.advanceTimeAndBlock(86400);

      await NFTSaleInstance.claim(tokenId, { from : buyer2 });
      const newOwner = await NFTSaleInstance.ownerOf.call(tokenId);
      assert.equal(newOwner, buyer2); // new owner is buyer2

      // revert back snapshot
      await helper.revertToSnapShot(snapshotId);
  });
});