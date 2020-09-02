const ethersUtils = require('ethers').utils

const getHash = (value) => {
	return web3.utils.keccak256(value)
}

const products = [
	{
		hash: getHash("car-1"),
		tokenId: 0,
		name: "Car",
		nameBytes32: ethersUtils.formatBytes32String("Car"),
		purchaserNameBytes32: ethersUtils.formatBytes32String("Jack")
	},
	{
		hash: getHash("Hoodie-8456"),
		tokenId: 1,
		name: "Hoodie",
		nameBytes32: ethersUtils.formatBytes32String("Hoodie"),
		purchaserNameBytes32: ethersUtils.formatBytes32String("John")
	}
]

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

module.exports.version = "V0" // Set the version you want to test here (most of the cases the current version)
module.exports.products = products
module.exports.getHash = getHash
module.exports.ZERO_ADDRESS = ZERO_ADDRESS
