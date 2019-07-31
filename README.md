# @lblod/ember-rdfa-editor-date-plugin

Plugin to insert semantic dates in an RDFa editor
=======

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install @lblod/ember-rdfa-editor
ember install @lblod/ember-rdfa-editor-date-plugin
```

Configuration
------------------------------------------------------------------------------

The plugin will automatically be added in the `default` and `all` editor profiles in `app/config/editor-profiles.js`. Add the plugin name `rdfa-editor-date-plugin` to other editor profiles if you want to enable the plugin in these profiles, too.


Once the plugin is configured in the appropriate editor profiles in `app/config/editor-profiles.js` it will be automatically be picked up by the rdfa-editor.

There are some defaults set, but you can add other supported date formats in the config of the host application. E.g.
```
APP: {
    '@lblod/ember-rdfa-editor-date-plugin': {
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


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
