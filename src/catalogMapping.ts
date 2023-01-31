import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Catalog, Owner, Part } from "../generated/schema";
import {
  AddedEquippables,
  AddedPart,
  LightmCatalogMetadataURISet,
  LightmCatalogTypeSet,
  OwnershipTransferred,
  SetEquippables,
  SetEquippableToAll,
} from "../generated/templates/LightmCatalogImplementer/LightmCatalogImplementer";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const previousOwnerAddress = event.params.previousOwner.toHex();
  const newOwnerAddress = event.params.newOwner.toHex();

  let catalog = Catalog.load(event.address.toHex())!;
  let previousOwner = Owner.load(previousOwnerAddress)!;
  let newOwner = Owner.load(newOwnerAddress);

  if (newOwner === null) {
    newOwner = new Owner(newOwnerAddress);
    newOwner.balance = BigInt.fromI32(0);
    newOwner.collectionBalance = BigInt.fromI32(0);
    newOwner.catalogBalance = BigInt.fromI32(1);
  } else {
    newOwner.catalogBalance = newOwner.catalogBalance.plus(BigInt.fromI32(1));
  }

  previousOwner.catalogBalance = previousOwner.catalogBalance.minus(
    BigInt.fromI32(1)
  );

  catalog.owner = newOwner.id;

  previousOwner.save();
  newOwner.save();
  catalog.save();
}

export function handleLightmCatalogMetadataURISet(
  event: LightmCatalogMetadataURISet
): void {
  const metadataURI = event.params.metadataURI;
  const catalogAddress = event.address;

  const catalog = Catalog.load(catalogAddress.toHex())!;
  catalog.metadataURI = metadataURI;
  catalog.save();
}

export function handleLightmCatalogTypeSet(event: LightmCatalogTypeSet): void {
  const type = event.params.type_;
  const catalogAddress = event.address;

  const catalog = Catalog.load(catalogAddress.toHex())!;
  catalog.type = type;
  catalog.save();
}

export function handleAddedPart(event: AddedPart): void {
  const catalogAddress = event.address.toHex();
  const partGlobalId = `${catalogAddress}:${event.params.partId}`;
  const part = new Part(partGlobalId);

  part.partId = event.params.partId;
  part.catalog = catalogAddress;
  part.equippableAddresses = event.params.equippableAddresses.map<string>(
    (addr) => addr.toHex()
  );
  part.itemType = event.params.itemType;
  part.zIndex = event.params.zIndex;
  part.metadataURI = event.params.metadataURI;
  part.equippableToAll = false;

  part.save();
}

export function handleAddedEquippables(event: AddedEquippables): void {
  const catalogAddress = event.address.toHex();
  const partGlobalId = `${catalogAddress}:${event.params.partId}`;
  const part = Part.load(partGlobalId)!;

  const deltaEquippables = event.params.equippableAddresses.map<string>(
    (addr) => addr.toHex()
  );

  part.equippableAddresses = part.equippableAddresses.concat(deltaEquippables);
  part.equippableToAll = false;

  part.save();
}

export function handleSetEquippables(event: SetEquippables): void {
  const catalogAddress = event.address.toHex();
  const partGlobalId = `${catalogAddress}:${event.params.partId}`;
  const part = Part.load(partGlobalId)!;

  part.equippableAddresses = event.params.equippableAddresses.map<string>(
    (addr: Address) => addr.toHex()
  );
  part.equippableToAll = false;

  part.save();
}

export function handleSetEquippableToAll(event: SetEquippableToAll): void {
  const catalogAddress = event.address.toHex();
  const partGlobalId = `${catalogAddress}:${event.params.partId}`;
  const part = Part.load(partGlobalId)!;

  part.equippableToAll = true;

  part.save();
}
