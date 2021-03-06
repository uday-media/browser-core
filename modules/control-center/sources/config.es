/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import config from '../core/config';

const isGhosteryTab = config.settings.channel && config.settings.channel.startsWith('GT');

export default {
  features: {
  },
  settings: {
    BASE_URL: config.baseURL,
    NEW_TAB_URL: config.settings.NEW_TAB_URL,
    ONBOARDING_URL: config.settings.ONBOARDING_URL,
    BRAND: isGhosteryTab ? 'Ghostery' : 'Cliqz',
    PRIVACY_POLICY_URL: config.settings.PRIVACY_POLICY_URL,
    USER_SUPPORT_URL: (
      isGhosteryTab
        ? config.settings.SUPPORT_URL
        : `${config.settings.FEEDBACK}${config.EXTENSION_VERSION}-${config.settings.channel}`
    ),
    SHOW_POWERED_BY: !isGhosteryTab,
  },
};
