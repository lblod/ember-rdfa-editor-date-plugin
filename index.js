'use strict';

module.exports = {
  name: '@lblod/ember-rdfa-editor-date-plugin',
  config: function (env, config) {
    let addonConfig = (config['APP'] && config['APP'][this.name])|| {};
    return {
      allowedInputDateFormats: addonConfig['allowedInputDateFormats']|| ['DD/MM/YYYY'],
      outputDateFormat: addonConfig['outputDateFormat'] || 'DD.MM.YYYY',
      moment: {
        includeLocales: (addonConfig['moment'] && addonConfig['moment']['includeLocales']) || ['nl-be']
      }
    };
  },
  isDevelopingAddon() { return true; }
};
