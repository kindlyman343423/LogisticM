const ethersUtils = require('ethers').utils

const getHash = (value) => {
	return web3.utils.keccak256(value)
}

const products = [
	{
		hash: getHash("car-1"),
		tokenId: 0,
		name: "Car",
		nameBytes32: ethersUtils.formatBytes32String("Car")
	},
	{
		hash: getHash("Hoodie-8456"),
		tokenId: 1,
		name: "Hoodie",
		nameBytes32: ethersUtils.formatBytes32String("Hoodie")
	}
]

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

module.exports.version = "V0"
module.exports.products = products
module.exports.getHash = getHash
module.exports.ZERO_ADDRESS = ZERO_ADDRESS
