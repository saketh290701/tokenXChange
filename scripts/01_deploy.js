// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  const Token = await hre.ethers.getContractFactory("Token");
  const Exchange = await hre.ethers.getContractFactory("Exchange");

  const accounts = await hre.ethers.getSigners()
  console.log(
    `Accounts fetched:\n ${accounts[0].address}\n ${accounts[1].address}`
  );


  // Deploy token contracts
  const dapp = await Token.deploy('Bipin Parmar', "BIPS");
  await dapp.deployed();
  console.log(
    `dapp Token contract deployed at ${dapp.address}`
  );

  const mDai = await Token.deploy('Mock Dai', "mDai");
  await mDai.deployed();
  console.log(
    `mDai Token contract deployed at ${mDai.address}`
  );

  const mETH = await Token.deploy('mETH', "mETH");
  await mETH.deployed();
  console.log(
    `mETH Token contract deployed at ${mETH.address}`
  );


  // Deploy exchange contracts
  const exchange = await Exchange.deploy(accounts[1].address, 10);
  await exchange.deployed();
  console.log(
    `Exchange contract deployed at ${exchange.address}`
  );

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
