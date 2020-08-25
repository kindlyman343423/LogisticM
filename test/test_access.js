const truffleAssert = require('truffle-assertions')
var Web3 = require('web3')

const { registerV0 } = require("../registerer/registerV0");
const { ZERO_ADDRESS } = require("./utils");

const uri = "http://localhost:8545"
var web3 = new Web3(uri)

const OwnedRegistry = artifacts.require("OwnedRegistry")
const LogisticInterface = artifacts.require("LogisticInterface")

contract("AccessImplementation & OwnerImplementation", async (accounts) => {
	const [owner, supplier, deliveryMan, other] = accounts

	before(async function () {
		// Create proxy
		const ownedRegistry = await OwnedRegistry.deployed()
	    const { logs } = await ownedRegistry.createProxy('0')
		const { proxy } = logs.find(l => l.event === 'ProxyCreated').args
		instance = await LogisticInterface.at(proxy)
	});

	it("Owner", async () => {
		let actualOwner = await instance.getOwner()
		assert.equal(actualOwner, owner)

		assert.equal(await instance.getRole(owner), 3)

		// await instance.initializeOwner(owner, { from: OwnedRegistry.address })
		await truffleAssert.reverts(
			instance.initializeOwner(owner, { from: owner }),
			"Upgradeable: bad caller"
		)
	})

	it("transferOwnership", async () => {
		await instance.transferOwnership(other, { from: owner })
		assert.equal((await instance.getOwner()), other)
		await instance.transferOwnership(owner, { from: other })

		await truffleAssert.reverts(
			instance.transferOwnership(owner, { from: other }),
			"Owner: caller is not the owner"
		)

		await truffleAssert.reverts(
			instance.transferOwnership(ZERO_ADDRESS, { from: owner }),
			"Owner: new owner is the zero address"
		)
	})

	it("Getter", async () => {
		await truffleAssert.reverts(
			instance.isSupplier(ZERO_ADDRESS),
			"RolesLibrary: account is the zero address"
		)
		await truffleAssert.reverts(
			instance.isDeliveryMan(ZERO_ADDRESS),
			"RolesLibrary: account is the zero address"
		)
	})

	it("Add a supplier", async () => {
		await truffleAssert.reverts(
			instance.addSupplier(owner, { from: owner }),
			"Access: Owner can't be supplier"
		)

		assert.isFalse((await instance.isSupplier(supplier)))
		const result = await instance.addSupplier(supplier, { from: owner })
		truffleAssert.eventEmitted(result, 'SupplierAdded', ev =>
			ev.account === supplier
		);
		assert.isTrue((await instance.isSupplier(supplier)))

		await truffleAssert.reverts(
			instance.addSupplier(deliveryMan, { from: supplier }),
			"Ownable: caller is not the owner"
		)
	})

	describe('When other is supplier', function () {
		beforeEach(async function () {
			await instance.addSupplier(other, { from: owner })
		});
		it("Remove supplier", async () => {
			await instance.removeSupplier(other, { from: owner })
			assert.isFalse((await instance.isSupplier(other)))
			await truffleAssert.reverts(
				instance.removeSupplier(other, { from: owner }),
				"RolesLibrary: account is not supplier"
			)
		})

		it("Renounce supplier", async () => {
			await instance.renounceSupplier({ from: other })
			assert.isFalse((await instance.isSupplier(other)))

			await truffleAssert.reverts(
				instance.renounceSupplier({ from: other }),
				"Access: caller is not supplier"
			)
		})

		it("Other can't be delivery man", async () => {
			await truffleAssert.reverts(
				instance.addDeliveryMan(other, { from: owner }),
				"RolesLibrary: roles already defined"
			)
		})

		after(async function () {
			await instance.renounceSupplier({ from: other })
		})
	})

	it("Add delivery men", async () => {
		await truffleAssert.reverts(
			instance.addDeliveryMan(owner, { from: owner }),
			"Access: Owner can't be delivery man"
		)

		assert.isFalse((await instance.isDeliveryMan(deliveryMan)))
		const result = await instance.addDeliveryMan(deliveryMan, { from: owner })
		assert.isTrue((await instance.isDeliveryMan(deliveryMan)))
		truffleAssert.eventEmitted(result, 'DeliveryManAdded', ev =>
			ev.account === deliveryMan
		);

		await truffleAssert.reverts(
			instance.addDeliveryMan(deliveryMan, { from: other }),
			"Ownable: caller is not the owner"
		)
	})

	describe('When other is delivery man', function () {
		beforeEach(async function () {
			await instance.addDeliveryMan(other, { from: owner })
		});

		it("Remove delivery man", async () => {
			await instance.removeDeliveryMan(other, { from: owner })
			assert.isFalse((await instance.isDeliveryMan(other)))
			await truffleAssert.reverts(
				instance.removeDeliveryMan(other, { from: owner }),
				"RolesLibrary: account is not delivery man"
			)
		})

		it("Renounce delivery man", async () => {
			await instance.renounceDeliveryMan({ from: other })
			assert.isFalse((await instance.isDeliveryMan(other)))

			await truffleAssert.reverts(
				instance.renounceDeliveryMan({ from: other }),
				"Access: caller is not delivery man"
			)
		})

		it("Other can't be supplier", async () => {
			await truffleAssert.reverts(
				instance.addSupplier(other, { from: owner }),
				"RolesLibrary: roles already defined"
			)
		})
	})
})
