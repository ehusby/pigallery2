import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Message} from '../../../../common/entities/Message';
import {LoadingBarService} from '@ngx-loading-bar/core';
import {ErrorCodes, ErrorDTO} from '../../../../common/entities/Error';
import {Config} from '../../../../common/config/public/Config';
import {Utils} from '../../../../common/Utils';
import {CustomHeaders} from '../../../../common/CustomHeaders';
import {VersionService} from '../version.service';

@Injectable()
export class NetworkService {

  readonly apiBaseUrl = Utils.concatUrls(Config.Client.urlBase, '/api');
  private globalErrorHandlers: Array<(error: ErrorDTO) => boolean> = [];

  constructor(private http: HttpClient,
              private loadingBarService: LoadingBarService,
              private versionService: VersionService) {
  }

  public static buildUrl(url: string, data?: { [key: string]: any }): string {
    if (data) {
      const keys = Object.getOwnPropertyNames(data);
      if (keys.length > 0) {
        url += '?';
        for (let i = 0; i < keys.length; i++) {
          url += keys[i] + '=' + data[keys[i]];
          if (i < keys.length - 1) {
            url += '&';
          }
        }
      }
    }
    return url;
  }

  public getXML<T>(url: string): Promise<Document> {


    this.loadingBarService.useRef().start();

    const process = (res: string): Document => {
      this.loadingBarService.useRef().complete();
      const parser = new DOMParser();
      return parser.parseFromString(res, 'text/xml');
    };

    const err = (error: any) => {
      this.loadingBarService.useRef().complete();
      return this.handleError(error);
    };

    return this.http.get(this.apiBaseUrl + url, {responseType: 'text'})
      .toPromise()
      .then(process)
      .catch(err);
  }

  public postJson<T>(url: string, data: any = {}): Promise<T> {
    return this.callJson('post', url, data);
  }

  public putJson<T>(url: string, data: any = {}): Promise<T> {
    return this.callJson('put', url, data);
  }

  public getJson<T>(url: string, query?: { [key: string]: any }): Promise<T> {
    return this.callJson('get', NetworkService.buildUrl(url, query));
  }

  public deleteJson<T>(url: string): Promise<T> {
    return this.callJson('delete', url);
  }

  addGlobalErrorHandler(fn: (error: ErrorDTO) => boolean): void {
    this.globalErrorHandlers.push(fn);
  }

  private callJson<T>(method: 'get' | 'post' | 'delete' | 'put', url: string, data: any = {}): Promise<T> {
    const body = data;

    this.loadingBarService.useRef().start();

    const process = (res: HttpResponse<Message<T>>): T => {
      this.loadingBarService.useRef().complete();
      const msg = res.body;
      if (res.headers.has(CustomHeaders.dataVersion)) {
        this.versionService.onNewVersion(res.headers.get(CustomHeaders.dataVersion));
      }
      if (!!msg.error) {
        if (msg.error.code) {
          (msg.error as any).title = ErrorCodes[msg.error.code];
        }
        throw msg.error;
      }
      return msg.result;
    };

    const err = (error: any) => {
      this.loadingBarService.useRef().complete();
      return this.handleError(error);
    };

    switch (method) {
      case 'get':
        return this.http.get<Message<T>>(this.apiBaseUrl + url, {observe: 'response'})
          .toPromise()
          .then(process)
          .catch(err);
      case 'delete':
        return this.http.delete<Message<T>>(this.apiBaseUrl + url, {observe: 'response'})
          .toPromise()
          .then(process)
          .catch(err);
      case 'post':
        return this.http.post<Message<T>>(this.apiBaseUrl + url, body, {observe: 'response'})
          .toPromise()
          .then(process)
          .catch(err);
      case 'put':
        return this.http.put<Message<T>>(this.apiBaseUrl + url, body, {observe: 'response'})
          .toPromise()
          .then(process)
          .catch(err);
      default:
        throw new Error('Unknown method');
    }

  }

  private handleError(error: any): Promise<any> {
    if (typeof error.code !== 'undefined') {
      for (const item of this.globalErrorHandlers) {
        if (item(error) === true) {
          return;
        }
      }
      return Promise.reject(error);
    }
    // instead of just logging it to the console
    console.error('error:', error);
    return Promise.reject(error.message || error || 'Server error');
  }
}
