import { getOwner } from '@ember/application';
import Service, { inject as service } from '@ember/service';
import memoize from '../utils/memoize';
import EmberObject, { computed } from '@ember/object';
import moment from 'moment';
import { task } from 'ember-concurrency';
import { findPropertiesWithRange } from '@lblod/ember-generic-model-plugin-utils/utils/meta-model-utils';

/**
 * Service responsible for correct annotation of dates
 *
 * @module editor-date-plugin
 * @class RdfaEditorDatePlugin
 * @constructor
 * @extends EmberService
 */
export default Service.extend({
  store: service(),
  who: 'editor-plugins/date-card',
  outputDateFormat: 'DD/MM/YYYY',
  rdfaOutput: 'YYYY-MM-DD',
  allowedInputDateFormats: ['DD/MM/YYYY'], // eslint-disable-line ember/avoid-leaking-state-in-ember-objects
  preprocessingFormatsMap: { // eslint-disable-line ember/avoid-leaking-state-in-ember-objects
    'DD/MM/YYYY': '[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4}',
    'DD-MM-YYYY': '[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4}',
    'DD.MM.YYYY': '[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4}' },

  init(){
    this._super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
    this.set('outputDateFormat', config['outputDateFormat']);
    this.set('allowedInputDateFormats', config['allowedInputDateFormats'] || this.get('allowedInputDateFormats'));
    const preprocessingMap = Object.assign(this.get('preprocessingFormatsMap'), config['preprocessingFormatsMap']);
    this.set('preprocessingMap', this.initPreprocessingMap(preprocessingMap));
    this.set('memoizedFindPropertiesWithRange',
         memoize((classType, range) => findPropertiesWithRange(this.store, classType, range)));
  },

  /**
   * Restartable task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor, extraInfo = []) { // eslint-disable-line require-yield
    if (contexts.length === 0) return;

    const cards = [];

    for(let context of contexts){

      let rdfaProperties = yield this.detectRdfaPropertiesToUse(context);

      if(rdfaProperties.length == 0) continue;

      let hints = yield this.generateHintsForContext(context);

      if(hints.length == 0) continue;

      hintsRegistry.removeHintsInRegion(context.region, hrId, this.get('who'));

      cards.push(...this.generateCards(hrId, rdfaProperties, hintsRegistry, editor, hints));
    }

    if(cards.length > 0){
      hintsRegistry.addHints(hrId, this.get('who'), cards);
    }
  }).restartable(),

  async detectRdfaPropertiesToUse(context){
    let lastTriple = context.context.slice(-1)[0] || {};
    if(!lastTriple.predicate == 'a')
      return [];
    let classType = lastTriple.object;
    return await this.memoizedFindPropertiesWithRange(classType, "http://www.w3.org/2001/XMLSchema#date");
    //TODO: tbd
    //let dateTimeContexts = await this.memoizedFindPropertiesWithRange(classType, "http://www.w3.org/2001/XMLSchema#dateTime");
    //return [...dateContexts.toArray(), ...dateTimeContexts.toArray()];
  },

  /**
   * scans a string for a date, provided multiple allowed inputDateFormats
   *
   * @method scanForDate
   *
   * @param {String} string
   *
   * @return {String} date string if found, else empty string
   *
   * @private
   */
  scanForDate(data){
    for(let allowedInputFormat of this.get('allowedInputDateFormats')){
      const subString = data.slice(0, allowedInputFormat.length);
      if(this.isPotentialDate(subString, allowedInputFormat) && this.isValidDate(subString, allowedInputFormat)){
        return subString;
      }
    }
    return '';
  },

  /**
   * Checks whether string is valid date
   *
   * @method isValidDate
   *
   * @param {String} string
   *
   * @return {Boolean}
   *
   * @private
   */
  isValidDate(data, inputFormat){
    return moment(data, [inputFormat], true).isValid();
  },

  /**
   * Is actually a preprocessing method, which speeds up date checking by running against a regex.
   *
   * @method isValidDate
   *
   * @param {String} string
   *
   * @private
   */
  isPotentialDate(data, inputFormat){
    const regexDate = this.get('preprocessingMap')[inputFormat];
    if(regexDate){
      return regexDate.test(data);
    }
    return true;
  },

  /**
   * Maps location of substring back within reference location
   *
   * @method normalizeLocation
   *
   * @param {[int,int]} [start, end] Location withing string
   * @param {[int,int]} [start, end] reference location
   *
   * @return {[int,int]} [start, end] absolute location
   *
   * @private
   */
  normalizeLocation(location, reference){
    return [location[0] + reference[0], location[1] + reference[0]];
  },

  generateCards(hrId, rdfaProperties, hintsRegistry, editor, hints){
    let cards = [];
    hints.forEach(hint => {
      rdfaProperties.forEach(rdfaProperty => {
        let card = this.generateCard(hrId, rdfaProperty, hintsRegistry, editor, hint);
        cards.push(card);
      });
    });
    return cards;
  },

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} rdfaProperty metamodel property
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, rdfaProperty, hintsRegistry, editor, hint){
    const userParsedDate =  moment(hint.dateString, this.get('allowedInputDateFormats')).format(this.get('outputDateFormat'));
    const rdfaContent = moment(hint.dateString, this.get('allowedInputDateFormats')).format(this.get('rdfaOutput'));
    return EmberObject.create({
      info: {
        rdfaContent,
        plainValue: userParsedDate,
        location: hint.location,
        hrId, hintsRegistry, editor, rdfaProperty
      },
      location: hint.location,
      card: this.get('who')
    });
  },

  /**
   * Generates a hint, given a context
   *
   * @method generateHintsForContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Object} [{dateString, location}]
   *
   * @private
   */
  generateHintsForContext(context){
    const hints = [];
    const stringToScan = context.text;

    for(let i=0; i < stringToScan.length; ++i){
      const dateString = stringToScan.slice(i);
      const scannedDate = this.scanForDate(dateString);

      if(!scannedDate){
        continue;
      }

      const location = this.normalizeLocation([i, i + scannedDate.length], context.region);

      hints.push({dateString, location});

    }
    return hints;
  },

  /**
   * inits the preProcessing map by casting it to RegExp objects.
   *
   * @method: initPreprocessingMap
   *
   * @return {Object}
   *
   * @private
   */
  initPreprocessingMap(preProcessingMap){
    const initMap = {};
    Object.keys(preProcessingMap).forEach(key => {
      initMap[key] = new RegExp(preProcessingMap[key], 'g');
    });
    return initMap;
  }

});
