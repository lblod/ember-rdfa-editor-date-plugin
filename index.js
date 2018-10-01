'use strict';

module.exports = {
  name: require('./package').name,
  config: function (env, config) {
    let addonConfig = (config['APP'] && config['APP'][this.name])|| {};
    return {
      allowedInputDateFormats: addonConfig['allowedInputDateFormats']|| ['DD/MM/YYYY'],
      outputDateFormat: addonConfig['outputDateFormat'] || 'DD.MM.YYYY',
      moment: {
        includeLocales: (addonConfig['moment'] && addonConfig['moment']['includeLocales']) || ['nl-be']
      }
    };
  }
};
