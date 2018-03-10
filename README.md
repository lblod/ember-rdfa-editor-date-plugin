# ember-rdfa-editor-date-plugin

## Installation

```
ember install git+https://github.com/lblod/ember-rdfa-editor-date-plugin.git
```

## Configuration
There are some defaults set, but you can add other supported formats in the config of the consuming application. e.g.
```
APP: {
'ember-rdfa-editor-date-plugin': {
        allowedInputDateFormats: ['DD/MM/YYYY', 'DD-MM-YYYY',  'DD.MM.YYYY'],
        outputDateFormat: 'D MMMM YYYY',
        moment: {
          includeLocales: ['nl']
        }
      }
}
```
Please note, we have some preprocessing of data. You can customize these too through config.
Note: Using custom formats might affect performance, if you don't update the preprocessing formats. See code how.

