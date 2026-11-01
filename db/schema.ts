import {sqliteTable,text,real,index} from 'drizzle-orm/sqlite-core';
export const priceObservations=sqliteTable('price_observations',{
 id:text('id').primaryKey(),level:text('level').notNull(),city:text('city').notNull(),communityId:text('community_id'),name:text('name').notNull(),period:text('period').notNull(),price:real('price').notNull(),priceType:text('price_type').notNull(),sourceUrl:text('source_url').notNull(),observedAt:text('observed_at').notNull(),longitude:real('longitude'),latitude:real('latitude')
},table=>[index('entity_period_idx').on(table.city,table.communityId,table.period),index('spatial_period_idx').on(table.city,table.period,table.longitude,table.latitude)]);
export const collectionRuns=sqliteTable('collection_runs',{id:text('id').primaryKey(),scope:text('scope').notNull(),period:text('period'),status:text('status').notNull(),recordCount:real('record_count').notNull(),collectedAt:text('collected_at').notNull()});

export const dataCache=sqliteTable('data_cache',{key:text('key').primaryKey(),kind:text('kind').notNull(),payload:text('payload').notNull(),updatedAt:text('updated_at').notNull(),expiresAt:text('expires_at').notNull()},table=>[index('cache_expiry_idx').on(table.kind,table.expiresAt)]);
