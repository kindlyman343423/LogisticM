# LogisticM

This repository contains a smart contract and a web application in ReactJS.

[*Demo!*](http://urlr.me/!logisticm)

## Smart contract

The smart contract runs on the Ethereum blockchain.

The source code is under the **AGPL-3.0-or-later** license.

### Getting started

First of all, install npm packages: `npm install`.

Then run `cp .env-dist .env`. Fill the `.env` file.

In a new terminal window, start the local blockchain: `ganache-cli`

**Lint contracts**: `npm run lint`

**Compile**: `truffle compile` or `npm run compile`


**Deploy**: `truffle migrate --reset --network development` or `npm run deploy-local`

**Test**: `truffle test` or `npm run test`

*Tests include gas report.*

**Test a sing file**: `truffle test test/test_proxy.js`

**Test with coverage**: `npm run coverage`

**Doc**: `npm run doc`

**Lint truffle files** (tests, migrations...): `./truffle-lint.sh`


### Branch master

Branch master won't work in a local development environment because it binds the
address of the contract deployed on Ropsten testnet.

**Don't merge master into develop.**

### Deployment

You can look at the migration file `./migrations/2_deploy_logisticM_V0.js`.
You will see that we deploy the registry and all the logic contracts.
Then, we register all the functions implemented in the logic contracts.
Finally, we create the proxy.

### Deploy to Ropsten

First of all, you will need some ethereum. Use this faucet: <https://faucet.metamask.io>.

In the `truffle-config.js` file, set the variables (be careful to not put it on github):
 - `mnemonic`: of your wallet,
 - `apiKey`: your infura API key.

Then, run `migrate --network ropsten`


### Contract layout

![contract layout diagram](contract-diagram.png "Contract diagram")

### Upgradeability

The smart contract is split into multiple contracts deployed on the Ethereum blockchain to
implement an upgradeability pattern.

This also solves the problem of a big contract that can't stand in a block when deploying.

The implemented pattern is inspired by <https://github.com/OpenZeppelin/openzeppelin-labs/tree/master/upgradeability_with_vtable> and <https://github.com/OpenZeppelin/openzeppelin-labs/tree/master/upgradeability_ownership>.

There or three main contracts:
 - **OwnedRegistry**: this is where you register your functions and create the proxy
 - **LogisticMProxy**: this is the proxy. The web3 contract calls are sent to this contract
 - **LogisticMInterface**: this defines the ABI used to interact with the whole contract through web3

And other important contracts:
 - **several logic contracts**: for example `HandoverImplementation`, `ProductImplementation`, `NameImplementation`, `PauseImplementation`...
 - **LogisticMSharedStorage**: gather all the storage of the LogisticMProxy contract

#### The registry: OwnedRegistry

With this contract, the owner can register functions implemented in logic contracts.

To register a function, call `OwnedRegistry.addVersionFromName(string memory version, string memory func, address implementation)`.

Like this: `OwnedRegistry.addVersionFromName('V1', 'createProduct(uint256,...)', 0x...)`

The creator of the `OwnedRegistry` contract is the owner and can transfer the ownership.

#### The proxy: LogisticMProxy

The proxy contract defines a fallback function that performs a delegate call to the logic contract.
For this, it first needs to know the address of the logic contract. When loading a version, it calls  `OwnedRegistry` to get these addresses.

The creator of the contract is a `OwnedRegistry` instance, and the owner is the creator of this `OwnedRegistry` instance.
The owner of the proxy can `upgradeTo` a new version and transfer the ownership.

#### The interface: LogisticMInterface

This contract gathers all the logic contract interfaces. It does not implement any function.


#### Logic contracts

Each contract where its name ends with `Implementation` is a logic contract.

For each logic contract, we need to define:
 - its storage: `LogisticMSharedStorage` must inherit each storage logic contract.
 - then events it emits
 - its interface: the interface derives from the contract that defines the events logic contract.

Example: the logic contract Name is in the folder `contracts/name`.
In the folder, there are four files:
 - NameStorage.sol
 - NameEvents.sol
 - NameInterface.sol
 - NameImplementation.sol

The `NameStorage.sol` contract defines the state variable needed in the
`NameImplementation` contract.

The `NameEvents.sol` contract defines the events emitted in the
`NameImplementation` contract.

The `NameInterface.sol` contract derives from `NameEvents.sol` and defines the
interface of `NameImplementation` contract.

`NameImplementation` implements the functions that perform part of the logic of
the LogisticM contract.

##### Delegate call between logic contracts

Some logic contracts need to call other logic contracts. For example,
`HandoverImplementation` call `ProductImplementation`. To do this, the
constructor of `HandoverImplementation` requires the address of the registry.
With this address, it can call `IRegistry.getFunction` to get the address of the
logic contract implementation. With this address, it can perform a delegate call.

Functions called by delegate call can only have value type parameters. This is
why, for example, `HandoverImplementation.createProduct` receives the name of the
product in bytes. Indeed, the function sends the name to `ProductImplementation.newProduct`.
So, on the client side, the string is converted in bytes to reduce gas usage.

#### LogisticMSharedStorage

`LogisticMSharedStorage` is the contract that gathers all the storage of the
logic contracts. Because the upgradeability pattern use delegate call to logic
contracts, the storage of all the logic contracts and the proxy contract must
be the same. This is why all logic contract Implementation derive from
`LogisticMSharedStorage`. And this is also why `LogisticMSharedStorage` derives
from all the storage logic contract.

#### How does the proxy work?

When sending a transaction to the proxy contract, the implementation of the
function doesn't exist. So the fallback function is called. This is where the
proxy delegates the call to the logic contract. In the fallback function,
the proxy performs a delegate call to the deployed logic contract implementation.
Because it is a delegate call, the storage used in the logic contract is the one
of the proxy contract. So, all the storage resides in the proxy contract.


#### Upgrade to a new version

##### Versionning

Versions are like `V0.0`, where the first number is incremented each time the registry or the proxy are changed; and the second number is incremented each time a logic contract is updated through the upgradeability pattern.

##### How to upgrade?

To upgrade to a new version:
 - change the `version` variable in the file `test/utils.js`
 - create a new migration file, with layout of `migrations/3_deploy_logisticM_V0.1.js`
 - change the "Deploy new implementation" part: upload the logic contract that need to be upgraded.
 - if the interface changes, adapt the `addVersionFromName` calls.
 - run `truffle migrate`


### How to use the smart contract?

To use the smart contract, you need to create a web3 Contract with the ABI of `LogisticMInterface`
and the address of `LogisticMProxy`.

The address of the proxy is accessible in the log event `ProxyCreated` of the registry that created the proxy.

#### How to use lock and pause?
The contract is lock by default. This means some operation can only be done
in a certain context: transfer a token is only doable through `send` and `receive`
methods (`HandoverImplementation`).

To unlock the contract:
 - call pause()
 - call setLock(false)
 - make operations
 - call setLock(true)
 - call unpause()




## The handover process

### Roles

The roles are:
 - supplier: can create products and send them
 - Delivery man: can receive and send products
 - purchaser: can receive the product
 - owner: grant and revoke roles

The supplier creates a product and tells to which address the product will ultimately
belong to. Then, it can either send this product to a delivery man or directly
to the purchaser.

The delivery man is an intermediary person. There can be as much as Delivery Men
in the supply channel as it is needed. Ultimately, a Delivery Man will send the
product to the purchaser.

The Purchaser doesn't order a product through the app (at least for now). This
is the supplier that creates a product for a purchaser. The only action a purchaser
can do is receive the product from the person who sends it to him.

The owner can't manipulate products.

### When a handover happens?

For a handover to happens, the two participants must agree on it.
 - the sender must declare that it sent the product to the receiver,
 - the receiver must declare that it received the same product from the sender.

### Data structure

For each product:
 - product ID: collected in the front-end app but not stored anywhere
 - product hash: sha3 of the product ID, stored in the smart contract
 - product name: collected in the front-end app and stored in the smart contract
 - purchaser: the address of the person who purchased the product

For each account
 - name: a string representing the name of the user.

The name is 32-bytes long because it is passed to the storing function as a `bytes32`.
This may be solve <https://ethereum.stackexchange.com/questions/1081/how-to-concatenate-a-bytes32-array-to-a-string>.




## Client side: front end application

### Getting started

Got to the app folder: `cd app`

Run the development server: `npm run start`

Log in to metamask with the same mnemonic as ganache.

Create a build: `npm run build`.

Serve the build: `npm run serve`.

The source code is on *Gitlab* and *Netlify* is connected to the repo.
*Netlify* build and deploy the app at each commit.

The command used by *Netlify* is `npm install && npm run compile && cd app && npm install && npm build`.
