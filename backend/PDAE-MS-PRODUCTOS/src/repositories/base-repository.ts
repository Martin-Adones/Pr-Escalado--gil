import { db } from '../database/pg-client';
import { BaseRepository as SharedBaseRepository } from 'shared';

export abstract class BaseRepository extends SharedBaseRepository {
  protected getDb() { return db; }
}
