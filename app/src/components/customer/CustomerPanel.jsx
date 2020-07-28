import React from 'react'

import { getEventsAboutUser } from "../../store/selectors"
import { getPastEvents } from '../../store/events-helpers'
import Loading from '../Loading';
import { PRODUCT_EVENT_NAMES, NEW_ITEM } from '../../store/constants'
import PurchaserPanel from "../purchaser/PurchaserPanel"
import NoUserPanel from "./NoUserPanel"

class CustomerPanel extends React.Component {
	componentDidMount () {
		getPastEvents(
			this.props.drizzle,
			PRODUCT_EVENT_NAMES,
			{
				[NEW_ITEM]: { purchaser: this.props.drizzleState.accounts[0] }
			}
		)
	}

	render () {
		if (!this.props.drizzleState.events.events) return <Loading/>

		let eventsUser = getEventsAboutUser(
			this.props.drizzleState.events.events,
			this.props.drizzleState.accounts[0]
		)

		let tokenIds = []
		eventsUser.forEach(event => {
			tokenIds.push(event.returnValues.tokenId)
		});

		if (!eventsUser.length) {
			return <NoUserPanel/>
		}

		return (
			<PurchaserPanel
				drizzle={this.props.drizzle}
				drizzleState={this.props.drizzleState}
				events={this.props.drizzleState.events.events}
				tokenIds={tokenIds}
			/>
		)
	}
}

export default CustomerPanel
