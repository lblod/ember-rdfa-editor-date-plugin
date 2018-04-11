import { getOwner } from '@ember/application';
import Service from '@ember/service';
import EmberObject, { computed } from '@ember/object';
import moment from 'moment';
import { task } from 'ember-concurrency';

/**
 * Service responsible for correct annotation of dates
 *
 * @module editor-date-plugin
 * @class RdfaEditorDatePlugin
 * @constructor
 * @extends EmberService
 */
export default Service.extend({
  who: 'editor-plugins/date-card',
  outputDateFormat: 'DD/MM/YYYY',
  rdfaOutput: 'YYYY-MM-DD',
  allowedInputDateFormats: ['DD/MM/YYYY'], // eslint-disable-line ember/avoid-leaking-state-in-ember-objects
  preprocessingFormatsMap: { // eslint-disable-line ember/avoid-leaking-state-in-ember-objects
    'DD/MM/YYYY': '[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4}',
    'DD-MM-YYYY': '[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4}',
    'DD.MM.YYYY': '[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4}' },

  zittingUri: 'http://data.vlaanderen.be/ns/besluit#Zitting',
  artikelUri: 'http://data.vlaanderen.be/ns/besluit#Artikel',
  aanstellingUri: 'http://data.vlaanderen.be/ns/mandaat#AanstellingsBesluit',
  ontslagUri: 'http://data.vlaanderen.be/ns/mandaat#OntslagBesluit',
  generiekBesluitUri: 'http://data.vlaanderen.be/ns/besluit#Besluit',
  dateTypeUri: 'http://www.w3.org/2001/XMLSchema#date',
  dcTitleUri: 'http://purl.org/dc/terms/title',
  genericContextLabel: 'genericContext',

  /**
   * A map between Context URI, and annotation to use.
   *
   * @property rdfaAnnotationMap
   * @type {Object}
   *
   * @private
   */
  rdfaAnnotationsMap: computed(function(){
    const rdfaAnnotationsMap = {};

    rdfaAnnotationsMap[this.get('ontslagUri')] = {
      label: 'Wilde u deze ontslagdatum ingeven?',
      template: (content, display) => `<span class="annotation" property="mandaat:einde" datatype="xsd:date" content="${content}">${display}</span>`
    };

    rdfaAnnotationsMap[this.get('aanstellingUri')] = {
      label: 'Wilde u deze aanstellingsdatum ingeven?',
      template: (content, display) => `<span class="annotation" property="mandaat:start" datatype="xsd:date" content="${content}">${display}</span>`
    };

    rdfaAnnotationsMap[this.get('generiekBesluitUri')] = {
      label: 'Wilde u deze creatiedatum ingeven?',
      template: (content, display) => `<span class="annotation" property="dcterms:created" datatype="xsd:date" content="${content}">${display}</span>`
    };

    rdfaAnnotationsMap[this.get('genericContextLabel')] = {
      label: 'Wilde u deze creatiedatum ingeven?',
      template: (content, display) => `<span class="annotation" property="dcterms:created" datatype="xsd:date" content="${content}">${display}</span>`
    };

    rdfaAnnotationsMap['titleNotule'] = {
      label: 'Wilde u deze geplande start ingeven?',
      template: (content, display) => `<span class="annotation" property="besluit:geplandeStart" datatype="xsd:date" content="${content}">${display}</span>`
    };

    return rdfaAnnotationsMap;
  }),

  init(){
    this._super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
    this.set('outputDateFormat', config['outputDateFormat']);
    this.set('allowedInputDateFormats', config['allowedInputDateFormats'] || this.get('allowedInputDateFormats'));
    const preprocessingMap = Object.assign(this.get('preprocessingFormatsMap'), config['preprocessingFormatsMap']);
    this.set('preprocessingMap', this.initPreprocessingMap(preprocessingMap));
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
  execute: task(function * (hrId, contexts, hintsRegistry, editor) {
    if (contexts.length === 0) return;

    const cards = [];

    for(let context of contexts){
      const detectedContext = this.detectRelevantContext(context);

      if (!detectedContext) continue;

      const rdfaAnnotation = this.get('rdfaAnnotationsMap')[detectedContext];

      const hints = this.generateHintsForContext(context);

      hintsRegistry.removeHintsInRegion(context.region, hrId, this.get('who'));

      cards.push(...hints.map(hint => { return this.generateCard(hrId, rdfaAnnotation, hintsRegistry, editor, hint); }));
    }

    if(cards.length > 0){
      hintsRegistry.addHints(hrId, this.get('who'), cards);
    }
  }).restartable(),

  /**
   * Given context object, tries to detect a context the plugin can work on
   *
   * @method detectRelevantContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {String} URI of context if found, else empty string.
   *
   * @private
   */
  detectRelevantContext(context){
    const isArtikel = node => { return node.predicate == 'a' && node.object == this.get('artikelUri'); };
    const isAanstellingsBesluit = node => { return node.predicate == 'a' && node.object == this.get('aanstellingUri'); };
    const isOntslagBesluit = node => { return node.predicate == 'a' && node.object == this.get('ontslagUri'); };
    const isGeneriekBesluit = node => { return node.predicate == 'a' && node.object == this.get('generiekBesluit'); };
    const isAnnotedDate = node => { return node.datatype == this.get('dateTypeUri'); };
    const isDcTitle = node => { return node.predicate === this.get('dcTitleUri'); };
    const isZitting = node => { return node.predicate === 'a' && node.object === this.get('zittingUri'); };

    const isTitleNotule = context => {
      if(context.length !== 3) return false;
      if(!isZitting(context[1])) return false;
      if(!isDcTitle(context[2])) return false;

      return true;
    };

    //TODO: currently, if annoted date is modified again, output is broken. Needs specific flow.
    if(context.context.findIndex(isAnnotedDate) >= 0) return '';

    if(isTitleNotule(context.context)) return 'titleNotule';

    if(context.context.findIndex(isArtikel) < 0) return this.get('genericContextLabel');

    const typeBesluitFilter = node => { return isAanstellingsBesluit(node) || isOntslagBesluit(node) || isGeneriekBesluit(node); };

    const besluitTriple = context.context.find(typeBesluitFilter);
    return besluitTriple ? besluitTriple.object : this.get('genericContextLabel');
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

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} rdfaAnnotation object
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, rdfaAnnotation, hintsRegistry, editor, hint){
    const userParsedDate =  moment(hint.dateString, this.get('allowedInputDateFormats')).format(this.get('outputDateFormat'));
    const rdfaContent = moment(hint.dateString, this.get('allowedInputDateFormats')).format(this.get('rdfaOutput'));
    const htmlValue = rdfaAnnotation.template(rdfaContent, userParsedDate);
    return EmberObject.create({
      info: {
        value: htmlValue, label: rdfaAnnotation.label,
        plainValue: userParsedDate,
        location: hint.location,
        hrId, hintsRegistry, editor
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
