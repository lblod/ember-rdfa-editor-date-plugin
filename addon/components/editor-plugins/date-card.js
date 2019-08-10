import { action } from '@ember/object';
import { computed } from '@ember/object';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/date-card';
import InsertPrimitivePropertyCardMixin from '@lblod/ember-rdfa-editor-generic-model-plugin-utils/mixins/insert-primitive-property-card-mixin';
import { reads, not } from '@ember/object/computed';
import moment from 'moment';

/**
* Card displaying a hint of the Date plugin
*
* @module editor-date-plugin
* @class DateCard
* @extends Ember.Component
*/
export default class EditorPluginDateCardComponent extends Component.extend( InsertPrimitivePropertyCardMixin ) {
  layout = layout;
  hintOwner = 'editor-plugins/date-card';
  minutes = 0; // Setting default for minutes makes input nicer

  @computed('info.rdfaProperty.range.rdfaType')
  get isDateTime(){
    return this.get('info.rdfaProperty.range.rdfaType') == 'http://www.w3.org/2001/XMLSchema#dateTime';
  }

  @computed('isDateTime', 'minutes', 'hours')
  get isValidInput() {
  	const hours = parseInt(this.hours);
  	const minutes = parseInt(this.minutes);
    return !this.isDateTime || (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60);
  }
  @not('isValidInput') isInvalidInput;

  formatTimeStr(isoStr, hours){
    if(hours)
      return moment(isoStr).format('LL, LT');
    return moment(isoStr).format('LL');
  }

  async insertData(propertyMeta, value, content){
    let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
    this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), this.hintOwner);
    this.get('editor').replaceTextWithHTML(...mappedLocation, this.getRdfa(propertyMeta, value, content), [{ who: 'editor-plugins/date-card' }]);
  }

  @action
  async insertDate(data){
    this.insertData(await data.rdfaProperty,
                data.plainValue,
                data.rdfaContent);
  }

  @action
  async insertDateTime(){
    if( this.isValidInput ) {
      const data = this.info;
      const hours = this.hours;
      const minutes = this.minutes;

      let dateTimeIso = moment(data.rdfaContent, data.rdfaContentDateFormat).hours(hours || 0).minutes(minutes || 0).toISOString();
      let value = this.formatTimeStr(dateTimeIso, hours);

      this.insertData(await data.rdfaProperty,
                  value, dateTimeIso);
    }
  }
}
