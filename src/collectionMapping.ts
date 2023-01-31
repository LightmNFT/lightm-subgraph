import { Collection } from "../generated/schema";
import { RMRKCollectionMetdataSet } from "../generated/templates/LightmCollection/LightmCollection";

export function handleRMRKCollectionMetdataSet(
  event: RMRKCollectionMetdataSet
) {
  const metadataURI = event.params.metadataURI;
  const collectionAddress = event.address;

  let collection = Collection.load(collectionAddress.toHex())!;

  collection.address = collectionAddress.toHex();
  collection.metadataURI = metadataURI;
  collection.save();
}
