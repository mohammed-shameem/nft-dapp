// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import './IERC721.sol';
import './IERC721Receiver.sol';

contract NFTSale is IERC721 {
  string private _name; 
  string private _symbol;

  mapping(uint256 => address) private _owners;
  mapping(address => uint256) private _balances;
  mapping(uint256 => address) private _approvedTokens;
  mapping(address => mapping(address => bool)) _approvedOperators;

  constructor(string memory name, string memory symbol) {
    _name = name;
    _symbol = symbol;
  }

  /**
  checks if a token already exist
  @param tokenId - token id
   */
  function _exists(uint256 tokenId) internal view returns (bool) {
    return _owners[tokenId] != address(0);
  }

  /**
  Mint a token with id `tokenId`
  @param tokenId - token id
   */
  function mint(uint256 tokenId) public {
    require(!_exists(tokenId), 'tokenId already exist');
    _safeMint(msg.sender, tokenId, "");
  }

  /**
  Mint safely as this function checks whether the receiver has implemented onERC721Received if its a contract
  @param to - to address
  @param tokenId - token id
  @param data - data
   */
  function _safeMint(address to, uint256 tokenId, bytes memory data) internal {
    _mint(to, tokenId);
    require(_checkOnERC721Received(address(0), to, tokenId, data), "receiver has not implemented ERC721Receiver");
  }

  /**
  Internal function to mint a token `tokenId` to `to`
  @param to - to address
  @param tokenId - token id
   */
  function _mint(address to, uint256 tokenId) internal {
    require(to != address(0), 'transfering to zero addres');
    _balances[to] += 1;
    _owners[tokenId] = to;
    emit Transfer(address(0), to, tokenId);
  }

  /**
  Internal function to check if msg.sender is either owner or approved
  @param sender - address
  @param tokenId - token id
   */
  function isOwnerOrApproved (address sender, uint256 tokenId) internal view returns (bool) {
    require(_owners[tokenId] != address(0), 'no token exists');
    return (sender == _owners[tokenId] || sender == _approvedTokens[tokenId]);
  }

  /**
  Internal function to approve a token `tokenId` to `to`
  @param to - to address
  @param tokenId - token id
   */
  function _approve(address to, uint256 tokenId) internal {
    _approvedTokens[tokenId] = to;
    emit Approval(_owners[tokenId], to, tokenId);
  }

  /**
  IERC721 specification
   */
  function approve(address approved, uint256 tokenId) public override { 
    address owner = _owners[tokenId];
    require(msg.sender == _owners[tokenId] || isApprovedForAll(owner, msg.sender), 'caller not an owner or not approved all');
    _approve(approved, tokenId);
  }

  /**
  IERC721 specification
   */
  function getApproved(uint256 tokenId) public view override returns (address) {
    require(_owners[tokenId] != address(0), 'no token exists');
    return _approvedTokens[tokenId];
  }

  /**
  IERC721 specification
   */
  function setApprovalForAll(address operator, bool approved) public override {
    require(operator != msg.sender, "approve to caller");
    _approvedOperators[msg.sender][operator] = approved;
    emit ApprovalForAll(msg.sender, operator, approved);
  }

  /**
  IERC721 specification
   */
  function isApprovedForAll(address owner, address operator) public view override returns (bool) {
    return _approvedOperators[owner][operator];
  }

  /**
  IERC721 specification
   */
  function balanceOf(address owner) public view override returns (uint256) {
    require(owner != address(0));
    return _balances[owner];
  }

  /**
  IERC721 specification
   */
  function ownerOf(uint256 tokenId) public view override returns (address) {
    require(_owners[tokenId] != address(0), 'no token exists');
    return _owners[tokenId];
  }

  /**
  Internal function to transfer a token from `from` to `to`
  @param from - from address
  @param to - to address
  @param tokenId - token id
   */
  function _transfer(address from, address to, uint256 tokenId) internal {
    require(to != address(0), 'transfering to zero addres');
    _owners[tokenId] = to;
    _balances[to] += 1;
    _balances[from] -= 1;

    emit Transfer(from, to, tokenId);
  }

  /**
  IERC721 specification
   */
  function safeTransferFrom(address from, address to, uint256 tokenId) public override {
    safeTransferFrom(from, to, tokenId, "");
  }

  /**
  IERC721 specification
   */
  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
    require(isOwnerOrApproved(msg.sender, tokenId), 'caller not an owner or approved');
    _transfer(from, to, tokenId);
    require(_checkOnERC721Received(from, to, tokenId, data), "receiver has not implemented ERC721Receiver");
  }

  /**
  Transfer a token from `from` to `to`
  @param from - from address
  @param to - to address
  @param tokenId - token id
   */
  function transferFrom(address from, address to, uint256 tokenId) public override {
    require(isOwnerOrApproved(msg.sender, tokenId), 'caller not an owner or approved');
    _transfer(from, to, tokenId);
  }

  /**
  Checks if the tartget is a contract and has implemented onERC721Received
   */
  function _checkOnERC721Received(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data
  ) private returns (bool) {
      if (isContract(to)) {
          try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, _data) returns (bytes4 retval) {
              return retval == IERC721Receiver.onERC721Received.selector;
          } catch (bytes memory reason) {
              if (reason.length == 0) {
                  revert("receiver has not implemented ERC721Receiver");
              } else {
                  assembly {
                      revert(add(32, reason), mload(reason))
                  }
              }
          }
      } else {
          return true;
      }
  }

  function isContract(address account) internal view returns (bool) {
    // This method relies on extcodesize, which returns 0 for contracts in
    // construction, since the code is only stored at the end of the
    // constructor execution.

    uint256 size;
    assembly {
        size := extcodesize(account)
    }
    return size > 0;
  }
}