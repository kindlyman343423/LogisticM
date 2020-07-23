import { ZERO_ADDRESS } from './constants';
import { addAllEvents } from '../store/actions'
import store from '../store/store'

export const getEvents = (web3Contract, eventNames, filters, account) => {
	eventNames.forEach((eventName, i) => {
		web3Contract.getPastEvents(eventName, {
			fromBlock: 0,
			filter: filters[eventName]
		}).then(events => {
			store.dispatch(addAllEvents(events, account))
		})
	});
}

export const getBlockTimestamp = (web3, blockNumber) => {
	return web3.eth.getBlock(blockNumber)
	.then(block => {
		let timestamp = new Date(block.timestamp * 1000)
		return timestamp.toUTCString()
	})
}
