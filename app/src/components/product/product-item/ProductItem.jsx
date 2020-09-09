import React from 'react'
import PropTypes from 'prop-types';
import { ListGroup, Accordion } from 'react-bootstrap';

import ProductLink from "../product-page/ProductLink"

var ProductItem = React.Component({
	render() {
		return (
			<ListGroup.Item key={this.props.idx}>
				<ProductLink
					drizzle={this.props.drizzle}
					drizzleState={this.props.drizzleState}
					productHash={this.props.productHash}
				/>
			</ListGroup.Item>
		);
	}
});

export default ProductItem;
