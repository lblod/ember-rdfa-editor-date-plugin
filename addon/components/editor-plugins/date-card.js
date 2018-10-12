import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/date-card';
import InsertPrimitivePropertyCardMixin from '@lblod/ember-generic-model-plugin-utils/mixins/insert-primitive-property-card-mixin';

/**
* Card displaying a hint of the Date plugin
*
* @module editor-date-plugin
* @class DateCard
* @extends Ember.Component
*/
export default Component.extend(InsertPrimitivePropertyCardMixin, {
  layout,

  actions: {
    async insert(data){
      this.insert(await data.rdfaProperty,
                  data.plainValue,
                  data.rdfaContent,
                  'editor-plugins/date-card',
                  [{ who: 'editor-plugins/date-card' }]);
    }
  }

});
