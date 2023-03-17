# Blockchain Bootcamp2.0


## Project setup:

First, make sure that you have installed NodeJs with at least v16.15.1. 


## Make you are in Project root folder and run below commands to setup:
### Step 1:
Run `npm i` to install all dependencies

### Step 2:
Start hardhat blockchain node,
```
npx hardhat node
```
To learn more about Hardhat [check here](https://hardhat.org/hardhat-runner/docs/getting-started#installation)

### Step 3:
Create react development environment,
```
npm run start
```
### Step 4:
Deploy smart contracts for initial setup by running,
```
npx hardhat run --network localhost scripts/01_deploy.js
```
and last, let's show some data on the page to know how exactly project look like, run below command,
```
npx hardhat run --network localhost scripts/02_seed-exchange.js

```

and, here we go, you should see project running at [http://localhost:3000/](http://localhost:3000/)



