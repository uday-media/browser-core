/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import ExtensionGlobals from '../shared/extension-globals';

const { Services: { search: searchService } } = ExtensionGlobals;

function getUriForType(type, engineWrapper) {
  const uriWrapper = engineWrapper.getSubmission('{searchTerms}', type);

  if (!uriWrapper) {
    return null;
  }

  const uri = uriWrapper.uri;
  const response = {
    method: 'GET',
    template: `${decodeURIComponent(uri.spec)}`,
    params: []
  };

  return response;
}

function buildUrls(engineWrapper) {
  const urls = {};

  // Commonly used two types;
  // text/html
  // application/x-suggestions+json
  const textHtmlType = 'text/html';
  const xJsonType = 'application/x-suggestions+json';

  const textHtmlTypeUri = getUriForType(textHtmlType, engineWrapper);
  const xJsonTypeUri = getUriForType(xJsonType, engineWrapper);

  if (textHtmlTypeUri !== null) {
    urls[textHtmlType] = textHtmlTypeUri;
  }

  if (xJsonTypeUri !== null) {
    urls[xJsonType] = xJsonTypeUri;
  }

  return urls;
}

function isDefaultSearchEngine(engineWrapper, defaultEngine) {
  // For Cliqz Browser >= 1.31.x
  if (defaultEngine.defaultSearchEngine) {
    return engineWrapper.identifier === defaultEngine.defaultSearchEngine
      || engineWrapper.name === (defaultEngine.defaultSearchEngineData
        && defaultEngine.defaultSearchEngineData.name);
  }

  return engineWrapper.name === defaultEngine.name;
}

const searchServiceGlobalPromise = new Promise((resolve) => {
  const isPromised = searchService.init(resolve);

  // from Fx67 the init function returns a promise
  if (isPromised) isPromised.then(resolve);
});

export async function getSearchEngines() {
  return searchServiceGlobalPromise.then(async () => {
    let defaultEngine = await searchService.getDefaultEngineInfo();
    const visibleEngines = await searchService.getVisibleEngines();

    if (visibleEngines.length > 0) {
      return visibleEngines.map((engineWrapper) => {
        const engine = {
          alias: engineWrapper.alias,
          default: isDefaultSearchEngine(engineWrapper, defaultEngine),
          description: engineWrapper.description,
          encoding: 'UTF-8',
          icon: engineWrapper.iconURI && engineWrapper.iconURI.spec,
          identifier: engineWrapper.identifier,
          name: engineWrapper.name,
          searchForm: engineWrapper.searchForm,
          urls: buildUrls(engineWrapper)
        };
        return engine;
      });
    }

    defaultEngine = await searchService.getDefaultEngineInfo();

    return visibleEngines.then(engines =>
      engines.map((engineWrapper) => {
        const engine = {
          alias: (engineWrapper._metaData && engineWrapper._metaData.alias) || null,
          default: isDefaultSearchEngine(engineWrapper, defaultEngine),
          description: engineWrapper.description,
          encoding: 'UTF-8',
          icon: engineWrapper.iconURI && engineWrapper.iconURI.spec,
          identifier: engineWrapper.shortName,
          name: engineWrapper.name,
          searchForm: engineWrapper.searchForm,
          urls: buildUrls(engineWrapper),
        };
        return engine;
      }));
  });
}

export async function setSelectedSearchEngine(nextSearchEngineName) {
  return searchServiceGlobalPromise.then(() => {
    const nextEngine = searchService.getEngineByName(nextSearchEngineName);
    if (!nextEngine) {
      return -1;
    }

    searchService.defaultEngine = nextEngine;
    return 0;
  }, () => {
    throw new Error('Reason: SearchService has not been initialized');
  });
}
