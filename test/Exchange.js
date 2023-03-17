const {ethers} = require("hardhat");
const {expect} = require("chai");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
describe('Exchange', () => {

    let accounts
    let deployer, user1, user2
    let feeAccount, exchange, token1, token2

    const feePercent = 10

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

        token1 = await Token.deploy('Bipin Parmar', 'BIPS')
        token2 = await Token.deploy('Mock Dai', 'mDAI')

        exchange = await Exchange.deploy(feeAccount.address, feePercent)

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))

    })

    describe('Deployment', () => {

        it('tracks the fee account', async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })

        it('tracks the fee percent', async () => {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })

    })

    describe('Depositing tokens ', () => {

        let transaction, result

        let amount = tokens(10)


        describe('success ', () => {

            beforeEach(async () => {

                // console.log(user1.address, exchange.address, amount.toString())
                // approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()

                // deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()


            });


            it('tracks the token deposit', async ()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address,user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(amount)
            })

            it('emits a depostite event', async ()=>{

                const event = result.events[1];
                const arg = event.args

                expect(event.event).to.equal('Deposit')

                expect(arg.token).to.equal(token1.address)
                expect(arg.user).to.equal(user1.address)
                expect(arg.amount).to.equal(amount)
                expect(arg.balance).to.equal(amount)
            })
        })

        describe('failure ', () => {

            it('fails if no token approved', async ()=>{
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
            });

        })

    })

    describe('Withdraw tokens ', () => {

        let transaction, result

        let amount = tokens(10)


        describe('success ', () => {

            beforeEach(async () => {

                // deposit tokens before withdrawing
                // console.log(user1.address, exchange.address, amount.toString())
                // approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()

                // deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()

                // now withdraw tokens
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
                result = await transaction.wait()

            });


            it('withdraw token funds', async ()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.tokens(token1.address,user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(0)
            })

            it('emits a withdraw event', async ()=>{

                const event = result.events[1];
                const arg = event.args

                expect(event.event).to.equal('Withdraw')

                expect(arg.token).to.equal(token1.address)
                expect(arg.user).to.equal(user1.address)
                expect(arg.amount).to.equal(amount)
                expect(arg.balance).to.equal(0)
            })
        })

        describe('failure ', () => {

            it('fails for insufficient balance', async ()=>{
                // attempt to withdraw
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
            });

        })

    })

    describe('Checking balances ', async () => {

        let transaction, result

        let amount = tokens(1)


        beforeEach(async ()=>{

            // deposit tokens before withdrawing
            // console.log(user1.address, exchange.address, amount.toString())
            // approve token
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()

            // deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()

        })

        it('return user balance', async ()=>{
            expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(amount)
        })


    })

    describe('Making Orders ', () => {

        let transaction, result

        let amount = tokens(1)


        describe('success ', () => {

            beforeEach(async () => {

                // deposit tokens before making order
                // console.log(user1.address, exchange.address, amount.toString())
                // approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()

                // deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()

                // make order
                transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                result = await transaction.wait()

            });


            it('tracks the newly created orders', async ()=>{
                expect(await exchange.ordersCount()).to.equal(1)
            })

            it('emits a order event', async ()=>{

                const event = result.events[0];
                const arg = event.args

                expect(event.event).to.equal('Order')

                expect(arg.id).to.equal(1)
                expect(arg.user).to.equal(user1.address)
                expect(arg.tokenGet).to.equal(token2.address)
                expect(arg.amountGet).to.equal(amount)
                expect(arg.tokenGive).to.equal(token1.address)
                expect(arg.amountGive).to.equal(amount)
                expect(arg.timestamp).to.at.least(1)
            })
        })

        describe('failure ', () => {

            it('rejects with no balance', async ()=>{
                await expect(exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)).to.be.reverted;
            })

        })

    })

    describe('Order actions ', () => {

        let transaction, result
        let amount = tokens(1)

        beforeEach(async ()=>{

            // user1 deposit tokens
            // deposit tokens before making order
            // console.log(user1.address, exchange.address, amount.toString())
            // approve token
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            // deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()

            // make order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
            result = await transaction.wait()


            // for user2
            // give tokens to user2
            transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
            result = await transaction.wait()
            // user2 deposit token
            transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
            result = await transaction.wait()
            // deposit token
            transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
            result = await transaction.wait()

        })

        describe('Cancelling Orders ', () => {

            describe('success', function () {

                beforeEach(async ()=>{
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    result = await transaction.wait()

                });


                it('update cancel orders', async ()=>{
                    expect(await exchange.orderCancelled(1)).to.equal(true)
                })

                it('emits a cancel event', async ()=>{

                    const event = result.events[0];
                    const arg = event.args

                    expect(event.event).to.equal('Cancel')

                    expect(arg.id).to.equal(1)
                    expect(arg.user).to.equal(user1.address)
                    expect(arg.tokenGet).to.equal(token2.address)
                    expect(arg.amountGet).to.equal(amount)
                    expect(arg.tokenGive).to.equal(token1.address)
                    expect(arg.amountGive).to.equal(amount)
                    expect(arg.timestamp).to.at.least(1)
                })
            });

            describe('failure', function () {

                beforeEach(async ()=>{

                    // approve token
                    transaction = await token1.connect(user1).approve(exchange.address, amount)
                    result = await transaction.wait()

                    // deposit token
                    transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                    result = await transaction.wait()


                    // make order
                    transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                    result = await transaction.wait()

                })

                it('rejects invalid order id', async ()=>{

                    const invalidOrderId = 999;
                    await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.reverted

                });


                it('rejects unauthorized user cancel order', async ()=>{

                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted

                });

            })
        })

        describe('Filling Orders ', () => {

            describe('success', async ()=>{
                beforeEach(async ()=>{

                 // user2 fill order
                transaction = await exchange.connect(user2).fillOrder('1')
                result = await transaction.wait()

            });

                it('execute the trade and charge fees', async ()=>{
                    // ensure trade happens
                    // token give
                    expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
                    expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))

                    // token get
                    expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
                    expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))

                })

                it('update filled order', async ()=>{
                    expect(await exchange.orderFilled(1)).to.equal(true)

                })

                it('emits a trade event', async ()=>{

                    const event = result.events[0];
                    const arg = event.args

                    expect(event.event).to.equal('Trade')

                    expect(arg.id).to.equal(1)
                    expect(arg.user).to.equal(user2.address)
                    expect(arg.tokenGet).to.equal(token2.address)
                    expect(arg.amountGet).to.equal(tokens(1))
                    expect(arg.tokenGive).to.equal(token1.address)
                    expect(arg.amountGive).to.equal(tokens(1))
                    expect(arg.creator).to.equal(user1.address)
                    expect(arg.timestamp).to.at.least(1)
                })
            })

            describe('failure', async ()=>{
                it('rejects invalid order id', async ()=>{

                    const invalidOrderId = 999;
                    await expect(exchange.connect(user2).fillOrder(invalidOrderId)).to.be.reverted

                });


                it('rejects already filled orders', async ()=>{

                    transaction = await exchange.connect(user2).fillOrder(1)
                    await transaction.wait()

                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted

                });

                it('rejects cancelled orders', async ()=>{

                    transaction = await exchange.connect(user1).cancelOrder(1)
                    await transaction.wait()

                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted

                });

            })

        });

    })

})