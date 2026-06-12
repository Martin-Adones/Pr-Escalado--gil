import { BaseRepository as SharedBaseRepo } from 'shared';
import { db } from '../database/pg-client';

export abstract class BaseRepository extends SharedBaseRepo {
  protected override getDb() {
    return db;
  }
}
