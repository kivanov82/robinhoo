const Robinhoo = artifacts.require("RobinHoo");

contract('Robinhoo', (accounts) => {
  it('should put 10000 Robinhoo in the first account', async () => {
    const metaCoinInstance = await Robinhoo.deployed();
    const balance = await metaCoinInstance.getBalance.call(accounts[0]);

    assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
  });
  it('should call a function that depends on a linked library', async () => {
    const robinhooInstance = await Robinhoo.deployed();
    const metaCoinBalance = (await robinhooInstance.getBalance.call(accounts[0])).toNumber();
    const metaCoinEthBalance = (await robinhooInstance.getBalanceInEth.call(accounts[0])).toNumber();

    assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, 'Library function returned unexpected function, linkage may be broken');
  });
  it('should send coin correctly', async () => {
    const robinhooInstance = await Robinhoo.deployed();

    // Setup 2 accounts.
    const accountOne = accounts[0];
    const accountTwo = accounts[1];

    // Get initial balances of first and second account.
    const accountOneStartingBalance = (await robinhooInstance.getBalance.call(accountOne)).toNumber();
    const accountTwoStartingBalance = (await robinhooInstance.getBalance.call(accountTwo)).toNumber();

    // Make transaction from first account to second.
    const amount = 10;
    await robinhooInstance.sendCoin(accountTwo, amount, { from: accountOne });

    // Get balances of first and second account after the transactions.
    const accountOneEndingBalance = (await robinhooInstance.getBalance.call(accountOne)).toNumber();
    const accountTwoEndingBalance = (await robinhooInstance.getBalance.call(accountTwo)).toNumber();

    assert.equal(accountOneEndingBalance, accountOneStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(accountTwoEndingBalance, accountTwoStartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  });
});
