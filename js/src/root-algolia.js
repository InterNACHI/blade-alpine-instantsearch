import algoliasearch from 'algoliasearch/lite';
import instantsearch from 'instantsearch.js';
import * as connectors from 'instantsearch.js/es/connectors';
import 'alpine-magic-helpers/dist/component.js';
import factory from './factory.js';

export default factory(algoliasearch, instantsearch, connectors);

