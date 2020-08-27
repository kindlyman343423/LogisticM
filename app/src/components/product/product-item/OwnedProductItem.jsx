import React from 'react';
import { Container,
	Row,
	Col,
	Button,
	InputGroup,
	FormControl,
	Accordion,
	Card
 } from 'react-bootstrap';
import { BsChevronDoubleDown } from "react-icons/bs";
import PropTypes from 'prop-types'

import ProductLink from "../product-page/ProductLink";
import { ZERO_ADDRESS } from '../../../store/constants';
import { send, sendToPurchaser } from '../../../contract-call'

class OwnedProductItem extends React.Component {
	state = {
		dataKeyProductSentFrom: null,
		dataKeyProductInfo: null,
		account: null
	}

	getPendingDelivery() {
		const dataKeyProductSentFrom = this.props.drizzle.contracts.Logistic.methods
		.productSentFrom.cacheCall(
			this.props.productHash,
			this.props.drizzleState.accounts[0]
		);
		this.setState({ dataKeyProductSentFrom })
	}

	getProductInfo() {
		this.setState({ dataKeyProductInfo: this.props.drizzle.contracts
			.Logistic.methods.getProductInfo.cacheCall(this.props.productHash) })
	}

	componentDidMount() {
		this.getPendingDelivery()
		this.getProductInfo()
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.props.productHash !== prevProps.productHash) {
			this.getPendingDelivery()
			this.getProductInfo()
		}
	}

	handleChange = (event) => {
		this.setState({ account: event.target.value })
	}

	handleSubmit = (event) => {
		event.preventDefault()
		send(this.props.drizzle, this.props.drizzleState, this.state.account, this.props.productHash)
	}

	sendToPurchaser = () => {
		sendToPurchaser(this.props.drizzle, this.props.drizzleState, this.props.productHash)
	}

	render () {
		const tokenInDeliveryObject = this.props.drizzleState.contracts.Logistic
			.productSentFrom[this.state.dataKeyProductSentFrom]
		if (!tokenInDeliveryObject) return null
		const tokenInDelivery = tokenInDeliveryObject.value
		if (tokenInDelivery !== ZERO_ADDRESS) {
			// The product is shipped
			return null
		}

		const productInfoObject = this.props.drizzleState.contracts.Logistic
			.getProductInfo[this.state.dataKeyProductInfo]
		if (!productInfoObject) return null
		const productName = productInfoObject.value.productName

		return (
			<Card>
				<Card.Header>
					<Accordion.Toggle
						as={Button}
						variant="link"
						eventKey={this.props.idx+1}
					>
						<span className="mr-2">
							{productName}
						</span>
						<BsChevronDoubleDown />
					</Accordion.Toggle>
				</Card.Header>
				<Accordion.Collapse eventKey={this.props.idx+1}>
					<Card.Body>
						<Container fluid>
							<Row>
								<Col md={2}>
									<ProductLink
										productName={productName}
										as={Button}
									/>
								</Col>
								<Col md={4}>
									<Button onClick={this.sendToPurchaser}>
										<span>Send to purchaser</span>
									</Button>
								</Col>
								<Col md={6}>
									<InputGroup>
										<FormControl
											placeholder="Recipient"
											aria-label="Recipient"
											onChange={this.handleChange}
										/>
										<InputGroup.Append>
											<Button
												onClick={this.handleSubmit}
												variant="outline-primary"
											>
												<span>Send</span>
											</Button>
										</InputGroup.Append>
									</InputGroup>
								</Col>
							</Row>
						</Container>
					</Card.Body>
				</Accordion.Collapse>
			</Card>
		)
	}
}

OwnedProductItem.propTypes = {
	productHash: PropTypes.string.isRequired,
	idx: PropTypes.number.isRequired
};

export default OwnedProductItem
