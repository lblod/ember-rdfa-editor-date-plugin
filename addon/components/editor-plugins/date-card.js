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
  hintOwner: 'editor-plugins/date-card',

  isDateTime: computed('info.rdfaProperty.range.rdfaType', function(){
    return this.get('info.rdfaProperty.range.rdfaType') == 'http://www.w3.org/2001/XMLSchema#dateTime';
  }),

  formatTimeStr(isoStr, hours){
    if(hours)
      return moment(isoStr).format('LL, LT');
    return moment(isoStr).format('LL');
  },

  insert(propertyMeta, value, content){
    let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
    this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), this.hintOwner);
    this.get('editor').replaceTextWithHTML(...mappedLocation, this.getRdfa(propertyMeta, value, content), [{ who: 'editor-plugins/date-card' }]);
  },

  actions: {
    async insert(data){
      this.insert(await data.rdfaProperty,
                  data.plainValue,
                  data.rdfaContent);
    },

    async insertDateTime(data, hours, minutes){
      let dateTimeIso = moment(data.rdfaContent, data.rdfaContentDateFormat).hours(hours || 0).minutes(minutes || 0).toISOString();
      let value = this.formatTimeStr(dateTimeIso, hours);

      this.insert(await data.rdfaProperty,
            value, dateTimeIso);
    }
  }
});
