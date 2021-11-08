import {Request} from 'express';

export enum ErrorCodes {
  NOT_AUTHENTICATED = 1,
  ALREADY_AUTHENTICATED = 2,
  NOT_AUTHORISED = 3,
  PERMISSION_DENIED = 4,
  CREDENTIAL_NOT_FOUND = 5,


  USER_CREATION_ERROR = 6,


  GENERAL_ERROR = 7,
  THUMBNAIL_GENERATION_ERROR = 8,
  PERSON_ERROR = 9,
  SERVER_ERROR = 10,

  USER_MANAGEMENT_DISABLED = 11,

  INPUT_ERROR = 12,

  SETTINGS_ERROR = 13,
  TASK_ERROR = 14,
  JOB_ERROR = 15,
  LocationLookUp_ERROR = 16,

  ALBUM_ERROR = 17,
}

export class ErrorDTO {
  public detailsStr: string;
  public request: {
    method: string, url: string
  } = {method: '', url: ''};

  constructor(public code: ErrorCodes, public message?: string, public details?: any, req?: Request) {
    this.detailsStr = (this.details ? this.details.toString() : '') || ErrorCodes[code];
    if (req) {
      this.request = {
        method: req.method,
        url: req.url
      };
    }
  }

  toString(): string {
    return '[' + ErrorCodes[this.code] + '] ' + this.message + this.detailsStr;
  }
}
