import { computed } from '@ember/object';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/date-card';
import InsertPrimitivePropertyCardMixin from '@lblod/ember-generic-model-plugin-utils/mixins/insert-primitive-property-card-mixin';
import moment from 'moment';

/**
* Card displaying a hint of the Date plugin
*
* @module editor-date-plugin
* @class DateCard
* @extends Ember.Component
*/
export default Component.extend(InsertPrimitivePropertyCardMixin, {
  layout,

  isDateTime: computed('info.rdfaProperty.range.rdfaType', function(){
    return this.get('info.rdfaProperty.range.rdfaType') == 'http://www.w3.org/2001/XMLSchema#dateTime';
  }),

  actions: {
    async insert(data){
      this.insert(await data.rdfaProperty,
                  data.plainValue,
                  data.rdfaContent,
                  'editor-plugins/date-card',
                  [{ who: 'editor-plugins/date-card' }]);
    },

    async insertDateTime(data, hours, minutes){
      let dateTimeIso = moment(data.rdfaContent, data.rdfaContentDateFormat).hours(hours || 0).minutes(minutes || 0).toISOString();
      let timeIfPresent = hours ? ` ${hours}:${minutes || '00'}` : '';
      let value = `${data.plainValue} ${timeIfPresent}`;

      this.insert(await data.rdfaProperty,
            value,
            dateTimeIso,
            'editor-plugins/date-card',
                 [{ who: 'editor-plugins/date-card' }]);
    }
  }
});
