import factory from './factory';
import { globalInstantSearch, globalSearchClientFactory } from './globals';

const instantsearch = globalInstantSearch();

export default factory(globalSearchClientFactory(), instantsearch, instantsearch.connectors);
