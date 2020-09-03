pragma solidity ^0.5.0;

import "./HandoverInterface.sol";
import "../logistic/LogisticSharedStorage.sol";
import "../upgradeability/ImplementationBase.sol";
import "../commons/Pausable.sol";


contract HandoverImplementation is
    HandoverInterface,
    LogisticSharedStorage,
    Pausable,
    ImplementationBase {

    constructor(address registry, string memory _version) public ImplementationBase(registry, _version) {}

    function createProduct(
        address purchaser,
        bytes32 productHash,
        bytes32 productNameBytes,
        bytes32 purchaserNameBytes
    )
        external
        whenNotPaused(paused)
    {
        lock = false;
        require(
            abi.decode(dCall(abi.encodeWithSignature(
                "isSupplier(address)", msg.sender)), (bool)),
            "Logistic: Caller is not Supplier"
        );
        require(
            abi.decode(dCall(abi.encodeWithSignature(
                "getRole(address)", purchaser)), (uint)) == 0,
            "Logistic: Invalid purchaser"
        );
        bool productExists = abi.decode(dCall(abi.encodeWithSignature(
            "productExists(bytes32)", productHash)), (bool));
        require(
            productExists == false,
            "Logistic: This product already exists"
        );

        uint256 tokenId = abi.decode(dCall(
            abi.encodeWithSignature("getCounter()")), (uint256));
        dCall(
            abi.encodeWithSignature(
                "newProduct(bytes32,address,uint256,bytes32)",
                productHash, purchaser, tokenId, productNameBytes
            )
        );
        dCall(abi.encodeWithSignature("mint(address)", msg.sender));
        dCall(
            abi.encodeWithSignature(
                "setName(address,bytes32)",
                purchaser,
                purchaserNameBytes
            )
        );
        lock = true;
    }

    function send(address to, bytes32 productHash)
        external
        whenNotPaused(paused)
    {
        lock = false;
        uint256 senderRole = abi.decode(dCall(abi.encodeWithSignature(
            "getRole(address)", msg.sender)), (uint));
        require(
            senderRole == 1 || senderRole == 2,
            "Logistic: Caller can't send product"
        );
        uint256 receiverRole = abi.decode(dCall(abi.encodeWithSignature(
            "getRole(address)", to)), (uint));
        require(
            receiverRole != 1 && receiverRole != 3,
            "Logistic: Can't send to supplier nor owner"
        );
        require(
            abi.decode(dCall(abi.encodeWithSignature(
                "productSentFrom(bytes32,address)", productHash, msg.sender)
            ), (address)) == address(0),
            "Logistic: Can't send a product in pending delivery"
        );

        (address purchaser, uint256 tokenId, string memory productName) =
            abi.decode(
                dCall(abi.encodeWithSignature(
                    "getProductInfo(bytes32)", productHash)),
                (address, uint256, string)
        );

        if (receiverRole == 0) {
            // the receiver is a purchaser (RolesLibrary.RoleNames.Nobody)
            require(purchaser == to,
                "Logistic: This purchaser has not ordered this product");
        }

        address sender = abi.decode(dCall(abi.encodeWithSignature(
            "productReceivedFrom(bytes32,address)", productHash, msg.sender)
        ), (address));

        if (sender == to) {
            _handoverToken(tokenId, msg.sender, to, productHash, productName);
        } else {
            dCall(abi.encodeWithSignature(
                "approve(address,uint256)",
                to, tokenId
            ));
        }

        dCall(abi.encodeWithSignature(
            "setProductSent(bytes32,address,address)",
            productHash, msg.sender, to
        ));
        lock = true;
    }

    function receive(address from, bytes32 productHash)
        external
        whenNotPaused(paused)
    {
        lock = false;
        // only DeliveryMan or Purchaser can receive a product
        uint256 msgSenderRole = abi.decode(dCall(abi.encodeWithSignature(
            "getRole(address)", msg.sender)), (uint));
        require(
            msgSenderRole != 1 && msgSenderRole != 3,
            "Logistic: Caller can't receive product"
        );
        require(
            abi.decode(dCall(abi.encodeWithSignature(
                "productReceivedFrom(bytes32,address)", productHash, from)
            ), (address)) == address(0),
            "Logistic: Already received"
        );
        // Comment these lines because if a supplier or a delivery man has his
        // role revoked, nobody would be able to receive product that ihe sent.
        // uint256 senderRole = abi.decode(dCall(abi.encodeWithSignature(
        //     "getRole(address)", from)), (uint));
        // require(
        //     senderRole == 1 || senderRole == 2,
        //     "Logistic: Sender is not delivery man nor supplier"
        // );

        (address purchaser, uint256 tokenId, string memory productName) =
            abi.decode(
                dCall(abi.encodeWithSignature(
                    "getProductInfo(bytes32)", productHash)),
                (address, uint256, string)
        );

        if (msgSenderRole == 0) {
            // the caller is a purchaser
            require(purchaser == msg.sender,
                "Logistic: This purchaser has not ordered this product");
        }

        address receiver = abi.decode(dCall(abi.encodeWithSignature(
            "productSentFrom(bytes32,address)", productHash, from)
        ), (address));
        if (receiver == msg.sender) {
            _handoverToken(tokenId, from, msg.sender, productHash, productName);
        }

        dCall(abi.encodeWithSignature(
            "setProductReceived(bytes32,address,address)",
            productHash, from, msg.sender
        ));
        lock = true;
    }

    function _handoverToken(
        uint256 tokenId,
        address from,
        address to,
        bytes32 productHash,
        string memory productName
    )
        internal
    {
        dCall(abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            from, to, tokenId
        ));
        emit Handover(from, to, productHash, productName);
    }
}
