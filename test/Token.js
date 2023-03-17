const {ethers} = require("hardhat");
const {expect} = require("chai");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
describe('Token', () => {

    let token
    let accounts
    let deployer
    let receiver
    let exchange
    beforeEach(async () => {

        // Fetch token from Blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Bipin Parmar', 'BIPS')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
        exchange = accounts[2]
    })

    describe('Deployment', () => {
        const name = "Bipin Parmar"
        const symbol = 'BIPS'
        const decimals = 18
        const totalSupply = tokens(1000000)

        it('has correct name', async () => {
            expect(await token.name()).to.equal(name)
        })

        it('has correct symbol', async () => {
            expect(await token.symbol()).to.equal(symbol)
        })

        it('has correct decimals', async () => {
            expect(await token.decimals()).to.equal(decimals)
        })

        it('has correct total supply', async () => {
            expect(await token.totalSupply()).to.equal(totalSupply)
        })

        it('assign total supply to deployer', async () => {
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
        })
    })

    describe('Sending tokens' , ()=>{
        describe('success' , ()=>{

            let transaction, result, amount
            beforeEach(async () => {

                amount = tokens(100)
                // transfer token
                transaction =  await token.connect(deployer).transfer(receiver.address, tokens(100))
                result = await transaction.wait()
            })

            it('transfer token balances', async ()=>{

                // console.log('deployer balance', await token.balanceOf(deployer.address))
                // console.log('receiver balance', await token.balanceOf(receiver.address))

                // ensure that tokens were transfer to receiver.
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)

                // console.log('deployer balance',await token.balanceOf(deployer.address))
                // console.log('receiver balance',await token.balanceOf(receiver.address))
            })


            it('emits a transfer event', async ()=>{

                const event = result.events[0];
                const arg = event.args

                expect(event.event).to.equal('Transfer')

                expect(arg.from).to.equal(deployer.address)
                expect(arg.to).to.equal(receiver.address)
                expect(arg.value).to.equal(amount)
            })


        })

        describe('failure' , ()=>{

            it('reject insufficient balances', async ()=>{

                // transfer more tokens than deployer has 100
                const invalidAmount = tokens(100000000)
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
            })
            it('reject invalid address', async ()=>{

                // transfer more tokens than deployer has 100
                const amount = tokens(10)
                await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })
        })

    })

    describe('Approving tokens' , ()=>{

        let transaction, result, amount
        beforeEach(async () => {

            amount = tokens(100)
            // transfer token
            transaction =  await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })

        describe('Success' , ()=>{

            it('allocates an allowance for delegated token spending', async ()=>{
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
            })

            it('emits a approval event', async ()=>{

                const event = result.events[0];
                const arg = event.args

                expect(event.event).to.equal('Approval')

                expect(arg.owner).to.equal(deployer.address)
                expect(arg.spender).to.equal(exchange.address)
                expect(arg.value).to.equal(amount)
            })
        })

        describe('Failure' , ()=>{

            it('reject invalid spenders', async ()=>{
                await expect( token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })

        })

    })


    describe('Delegated token transfer' , ()=>{

        let transaction, result, amount
        beforeEach(async () => {

            amount = tokens(10)
            // transfer token
            transaction =  await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })

        describe('Success' , ()=>{

            beforeEach(async () => {

                amount = tokens(10)
                // transfer token
                transaction =  await token.connect(exchange).transferFrom(deployer.address,receiver.address, amount)
                result = await transaction.wait()
            })

            it('transfers token balances', async ()=>{

                // ensure that tokens were transfer to receiver.
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)

            })


            it('reset allowance', async ()=>{

                // ensure that allowance is reset.
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(tokens(0))

            })

            it('emits a transfer event', async ()=>{

                const event = result.events[0];
                const arg = event.args

                expect(event.event).to.equal('Transfer')

                expect(arg.from).to.equal(deployer.address)
                expect(arg.to).to.equal(receiver.address)
                expect(arg.value).to.equal(amount)
            })

        })

        describe('Failure' , ()=>{

            it('reject insufficient balances', async ()=>{

                // transfer more tokens than deployer has 100
                const invalidAmount = tokens(100000000000)
                await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
            })

        })

    })
})