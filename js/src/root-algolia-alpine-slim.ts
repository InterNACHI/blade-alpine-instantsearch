import { liteClient } from 'algoliasearch/lite';
import instantsearch from 'instantsearch.js/es';
import { startAlpine } from './alpine';
import * as connectors from './component-connectors';
import factory from './factory';
import type { InstantSearchFactory } from './types';

startAlpine();

export default factory(liteClient, instantsearch as unknown as InstantSearchFactory, connectors);
