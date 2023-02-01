import { log, BigInt } from "@graphprotocol/graph-ts";
import {
  LightmCatalogDeployed,
  LightmCollectionCreated,
} from "../generated/LightmUniversalFactory/LightmUniversalFactory";
import {
  Token,
  Owner,
  Collection,
  Transfer,
  Catalog,
} from "../generated/schema";
import {
  LightmCollection as LightmCollectionTemplate,
  LightmCatalogImplementer as LightmCatalogImplementerTemplate,
} from "../generated/templates";
import {
  LightmCollection,
  Transfer as TransferEvent,
} from "../generated/templates/LightmCollection/LightmCollection";

export function handleCollectionCreated(event: LightmCollectionCreated): void {
  log.debug("CollectionCreated detected. Owner is {}", [
    event.params.owner.toHex(),
  ]);

  const collectionAddress = event.params.collectionAddress;
  const collection = new Collection(collectionAddress.toHex());
  LightmCollectionTemplate.create(collectionAddress);

  collection.metadataURI = "";
  collection.address = collectionAddress.toHex();
  collection.totalSupply = BigInt.fromI32(0);
  collection.createAtBlock = event.block.number;
  collection.transactionHash = event.transaction.hash.toHex();

  const instance = LightmCollection.bind(collectionAddress);
  const name = instance.try_name();
  if (!name.reverted) {
    collection.name = name.value;
  }

  const symbol = instance.try_symbol();
  if (!symbol.reverted) {
    collection.symbol = symbol.value;
  }

  let owner = Owner.load(event.params.owner.toHex());

  if (owner === null) {
    owner = new Owner(event.params.owner.toHex());
    owner.address = event.params.owner.toHex();
    owner.balance = BigInt.fromI32(0);
    owner.collectionBalance = BigInt.fromI32(1);
    owner.catalogBalance = BigInt.fromI32(0);
  } else {
    owner.collectionBalance = owner.collectionBalance.plus(BigInt.fromI32(1));
  }

  collection.owner = event.params.owner.toHex();

  owner.save();
  collection.save();
}

export function handleCatalogDeployed(event: LightmCatalogDeployed): void {
  const catalogAddress = event.params.catalogAddress;
  LightmCatalogImplementerTemplate.create(catalogAddress);

  const catalog = new Catalog(catalogAddress.toHex());
  catalog.address = catalogAddress.toHex();
  catalog.metadataURI = "";
  catalog.type = "";
  catalog.createAtBlock = event.block.number;
  catalog.transactionHash = event.transaction.hash.toHex();

  const ownerAddress = event.transaction.from;
  let owner = Owner.load(ownerAddress.toHex());
  if (owner === null) {
    owner = new Owner(ownerAddress.toHex());
    owner.address = ownerAddress.toHex();
    owner.collectionBalance = BigInt.fromI32(0);
    owner.catalogBalance = BigInt.fromI32(1);
    owner.balance = BigInt.fromI32(0);
  } else {
    owner.catalogBalance = owner.catalogBalance.plus(BigInt.fromI32(1));
  }
  owner.save();

  catalog.owner = owner.id;

  catalog.save();
}

export function handleTransfer(event: TransferEvent): void {
  log.debug("Transfer detected. From: {} | To: {} | TokenID: {}", [
    event.params.from.toHex(),
    event.params.to.toHex(),
    event.params.tokenId.toHex(),
  ]);

  const instance = LightmCollection.bind(event.address);

  let previousOwner = Owner.load(event.params.from.toHex());
  let newOwner = Owner.load(event.params.to.toHex());
  let token = Token.load(event.params.tokenId.toHex());
  const transferId = event.transaction.hash
    .toHex()
    .concat(":".concat(event.transactionLogIndex.toHex()));
  let transfer = Transfer.load(transferId);
  let collection = Collection.load(event.address.toHex())!;

  if (previousOwner == null) {
    previousOwner = new Owner(event.params.from.toHex());

    previousOwner.address = event.params.from.toHex();
    previousOwner.balance = BigInt.fromI32(0);
    previousOwner.catalogBalance = BigInt.fromI32(0);
    previousOwner.collectionBalance = BigInt.fromI32(0);
  } else {
    let prevBalance = previousOwner.balance;
    if (prevBalance > BigInt.fromI32(0)) {
      previousOwner.balance = prevBalance.minus(BigInt.fromI32(1));
    }
  }

  if (newOwner == null) {
    newOwner = new Owner(event.params.to.toHex());

    newOwner.address = event.params.to.toHex();
    newOwner.balance = BigInt.fromI32(1);
    newOwner.collectionBalance = BigInt.fromI32(0);
    newOwner.catalogBalance = BigInt.fromI32(0);
  } else {
    let prevBalance = newOwner.balance;
    newOwner.balance = prevBalance.plus(BigInt.fromI32(1));
  }

  const id = `${event.address.toHex()}:${event.params.tokenId.toHex()}`;
  if (token == null) {
    token = new Token(id);
    token.tokenId = event.params.tokenId;
    token.createAtBlock = event.block.number;
    token.transactionHash = event.transaction.hash.toHex();
    token.collection = event.address.toHex();
  }

  token.owner = event.params.to.toHex();

  if (transfer == null) {
    transfer = new Transfer(transferId);
    transfer.token = id;
    transfer.from = event.params.from.toHex();
    transfer.to = event.params.to.toHex();
    transfer.timestamp = event.block.timestamp;
    transfer.block = event.block.number;
    transfer.transactionHash = event.transaction.hash.toHex();
  }

  const totalSupply = instance.try_totalSupply();
  if (!totalSupply.reverted) {
    collection.totalSupply = totalSupply.value;
  }

  previousOwner.save();
  newOwner.save();
  token.save();
  collection.save();
  transfer.save();
}
