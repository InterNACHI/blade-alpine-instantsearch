import { liteClient } from 'algoliasearch/lite';
import instantsearch from 'instantsearch.js/es';
import * as connectors from 'instantsearch.js/es/connectors';
import { startAlpine } from './alpine';
import factory from './factory';
import type { InstantSearchFactory } from './types';

startAlpine();

export default factory(liteClient, instantsearch as unknown as InstantSearchFactory, connectors);
