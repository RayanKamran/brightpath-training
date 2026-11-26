import {Injectable} from '@nestjs/common';
import type {IDocumentSession} from 'ravendb';
import {RavenDocumentStoreProvider} from './document-store.provider';

export type DisposableSession = IDocumentSession & Disposable;

export interface ISessionFactory {
  openSession(): DisposableSession;
}

@Injectable()
export class RavenSessionFactory implements ISessionFactory {
  public constructor(private readonly _storeProvider: RavenDocumentStoreProvider) {}

  public openSession(): DisposableSession {
    const session = this._storeProvider.getStore().openSession();
    return Object.assign(session, {
      [Symbol.dispose](): void {
        session.dispose();
      },
    });
  }
}
