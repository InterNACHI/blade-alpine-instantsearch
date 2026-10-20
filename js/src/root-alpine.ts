import { startAlpine } from './alpine';
import factory from './factory';
import { globalInstantSearch, globalSearchClientFactory } from './globals';

const instantsearch = globalInstantSearch();

startAlpine();

export default factory(globalSearchClientFactory(), instantsearch, instantsearch.connectors);
