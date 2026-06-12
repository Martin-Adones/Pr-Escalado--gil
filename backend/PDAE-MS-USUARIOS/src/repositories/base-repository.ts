import { BaseRepository as SharedBaseRepo } from 'shared';
import { db } from '../database/pg-client';

export abstract class BaseRepository extends SharedBaseRepo {
  protected getDb() { return db; }
}
