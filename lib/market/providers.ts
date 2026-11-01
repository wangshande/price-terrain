/** Future authorised sources implement this contract. No paid source is enabled. */
export type PriceType='listing_reference'|'platform_reference'|'transaction_average';
export interface MonthlyObservation {month:string;price:number;sampleCount:number|null;sourceUrl:string;fetchedAt:string;priceType:PriceType;}
export interface CommunityLocation {id:string;city:string;name:string;longitude:number;latitude:number;coordinateSystem:'WGS84';}
export interface CommunityProvider {
 id:string;
 search(input:{city:string;keyword?:string;cursor?:string}):Promise<{records:CommunityLocation[];nextCursor:string|null;completeCityCoverage:boolean}>;
 history(input:{city:string;id:string;from?:string;to?:string}):Promise<{records:MonthlyObservation[];sourceMethodology:string;missingMonths:string[]}>;
}
