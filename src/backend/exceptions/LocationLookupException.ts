export class LocationLookupException extends Error {

  constructor(message: string, public location: string) {
    super(message);
  }
}
