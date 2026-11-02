/* CalOS Phase 1A DESIGN PROTOTYPE — kind metadata and synthetic seed data.
   ALL kinds are described ONLY by JSON Schema + `x-calos-editor` hints. The renderer (ui.js) contains
   no kind-specific code. Seed content is obviously synthetic and carries NO metrology values:
   numeric ranges are {"$input":"MI-nn"} markers. */
'use strict';

const DIMENSIONS = ['V', 'A', 'Ω', 'Hz', 's', '°C'];
const UNITS = { V: ['V', 'mV', 'µV', 'kV'], A: ['A', 'mA', 'µA'], 'Ω': ['Ω', 'kΩ', 'MΩ'], Hz: ['Hz', 'kHz', 'MHz'], s: ['s', 'ms', 'µs'], '°C': ['°C', 'K'] };
/* Synthetic capability vocabulary following the `<domain>.<name>` grammar (07 §2.3). */
const CAPABILITIES = ['measure.dc_voltage', 'measure.dc_current', 'measure.resistance', 'measure.frequency', 'source.dc_voltage', 'scpi.error_queue', 'adjust.supported'];
const MI_REGISTER = { 'MI-01': 'Authoritative instrument documentation set', 'MI-02': 'Functions/ranges in calibration scope', 'MI-06': 'Reference standard capability and uncertainty', 'MI-15': 'Environmental conditions and sensor sources' };

const EH = (o) => o; /* readability: editor hint */
const LOC = (labelKey, extra) => ({ type: 'object', 'x-calos-editor': EH({ widget: 'localized', label: labelKey, ...extra }) });
const REF = (kind, labelKey, extra) => ({ type: 'object', required: ['$ref'], additionalProperties: false, properties: { $ref: { type: 'object' } }, 'x-calos-editor': EH({ widget: 'reference', ref_kind: kind, label: labelKey, ...extra }) });
const ENUM_MULTI = (values, labelKey, extra) => ({ type: 'array', uniqueItems: true, items: { type: 'string', enum: values }, 'x-calos-editor': EH({ widget: 'enum-multi', label: labelKey, ...extra }) });
const IDENT = { type: 'string', pattern: '[a-z][a-z0-9_]{0,47}', 'x-calos-editor': { widget: 'text', label: 'f.id', pattern_help: 'help.identifier', mono: true } };

const DEFS = {
  Quantity: { type: 'object', required: ['value', 'unit'], additionalProperties: false, properties: { value: { type: 'string', 'x-calos-editor': { widget: 'decimal-string' } }, unit: { type: 'string' } } },
  InputMarker: { type: 'object', required: ['$input'], additionalProperties: false, properties: { $input: { type: 'string', pattern: '(MI|Q)-[0-9]{2}' } } },
  Interval: { type: 'object', required: ['lower', 'upper', 'lower_inclusive', 'upper_inclusive'], additionalProperties: false, properties: { lower: { $ref: '#/$defs/Quantity' }, upper: { $ref: '#/$defs/Quantity' }, lower_inclusive: { type: 'boolean' }, upper_inclusive: { type: 'boolean' } } },
};
const QTY_OR_INPUT = (labelKey, mi, extra) => ({ oneOf: [{ $ref: '#/$defs/InputMarker' }, { type: 'array', minItems: 1, items: { $ref: '#/$defs/Quantity' } }], 'x-calos-editor': EH({ widget: 'quantity-or-input', label: labelKey, default_input: mi, ...extra }) });
const LIMITS = (labelKey, mi) => ({ oneOf: [{ $ref: '#/$defs/InputMarker' }, { $ref: '#/$defs/Interval' }], 'x-calos-editor': EH({ widget: 'interval-or-input', label: labelKey, default_input: mi }) });

const COMMON_CLASSES = [{ match: '^/(name|title|description|aliases)', cls: 'editorial' }];

const KINDS = {
  Manufacturer: {
    icon: 'M', nav: 'instruments/manufacturers', change_classes: COMMON_CLASSES,
    schema: { type: 'object', required: ['name'], additionalProperties: false, properties: {
      name: LOC('f.name', { title: true, help: 'help.mfr_name', group: 'g.general' }),
      aliases: { type: 'array', uniqueItems: true, items: { type: 'string', minLength: 1, maxLength: 160 }, 'x-calos-editor': EH({ widget: 'string-list', label: 'f.aliases', help: 'help.aliases', group: 'g.general' }) },
      description: LOC('f.description', { localized_required: false, multiline: true, group: 'g.general' }),
    }, $defs: DEFS },
  },
  InstrumentFamily: {
    icon: 'F', nav: 'instruments/families', change_classes: [{ match: '^/capabilities', cls: 'functional' }, ...COMMON_CLASSES],
    schema: { type: 'object', required: ['title', 'manufacturer'], additionalProperties: false, properties: {
      title: LOC('f.title', { title: true, group: 'g.general' }),
      manufacturer: REF('Manufacturer', 'f.manufacturer', { group: 'g.general' }),
      capabilities: ENUM_MULTI(CAPABILITIES, 'f.capabilities', { help: 'help.capabilities', group: 'g.capabilities', vocabulary: true }),
      description: LOC('f.description', { localized_required: false, multiline: true, group: 'g.general' }),
    }, $defs: DEFS },
  },
  InstrumentModel: {
    icon: 'I', nav: 'instruments/models',
    change_classes: [{ match: '^/functions/.*/ranges', cls: 'metrological' }, { match: '^/(functions|capabilities|options|manufacturer|family|identification)', cls: 'functional' }, ...COMMON_CLASSES, { match: '^/model_name', cls: 'functional' }],
    schema: { type: 'object', required: ['manufacturer', 'model_name'], additionalProperties: false, properties: {
      manufacturer: REF('Manufacturer', 'f.manufacturer', { group: 'g.general', order: 1 }),
      family: REF('InstrumentFamily', 'f.family', { group: 'g.general', order: 2, optional: true, filter_by: 'manufacturer' }),
      model_name: { type: 'string', pattern: '[A-Za-z0-9][A-Za-z0-9 ._/-]{0,39}', 'x-calos-editor': EH({ widget: 'text', label: 'f.model_name', title: true, group: 'g.general', order: 3, pattern_help: 'help.model_name', mono: true }) },
      aliases: { type: 'array', uniqueItems: true, items: { type: 'string', minLength: 1, maxLength: 160 }, 'x-calos-editor': EH({ widget: 'string-list', label: 'f.aliases', help: 'help.aliases', group: 'g.general', order: 4 }) },
      description: LOC('f.description', { localized_required: false, multiline: true, group: 'g.general', order: 5 }),
      functions: { type: 'array', 'x-calos-editor': EH({ widget: 'record-list', label: 'f.functions', help: 'help.functions', group: 'g.functions', unique_by: 'id', item_title: 'title', add_label: 'a.add_function' }),
        items: { type: 'object', required: ['id', 'title', 'quantity', 'ranges'], additionalProperties: false, properties: {
          id: IDENT,
          title: LOC('f.title', {}),
          quantity: { type: 'string', enum: DIMENSIONS, 'x-calos-editor': EH({ widget: 'enum', label: 'f.quantity', enum_prefix: 'dim.', help: 'help.quantity' }) },
          ranges: QTY_OR_INPUT('f.ranges', 'MI-02', { unit_dimension_from: 'quantity', help: 'help.ranges' }),
        } } },
      options: { type: 'array', 'x-calos-editor': EH({ widget: 'record-list', label: 'f.options', group: 'g.options', unique_by: 'id', item_title: 'title', add_label: 'a.add_option' }),
        items: { type: 'object', required: ['id', 'title'], additionalProperties: false, properties: { id: IDENT, title: LOC('f.title', {}) } } },
      capabilities: ENUM_MULTI(CAPABILITIES, 'f.capabilities', { help: 'help.capabilities', group: 'g.capabilities', vocabulary: true }),
      identification: { type: 'object', additionalProperties: false, properties: {
        model_pattern: { type: 'string', maxLength: 80, 'x-calos-editor': EH({ widget: 'text', label: 'f.model_pattern', help: 'help.model_pattern', mono: true }) } },
        'x-calos-editor': EH({ widget: 'record', label: 'f.identification', group: 'g.identification' }) },
    }, $defs: DEFS },
  },
  StandardRole: {
    icon: 'R', nav: 'equipment/roles', change_classes: [{ match: '^/required_capability', cls: 'metrological' }, ...COMMON_CLASSES],
    schema: { type: 'object', required: ['role_id', 'title', 'required_capability'], additionalProperties: false, properties: {
      role_id: { ...IDENT, 'x-calos-editor': { ...IDENT['x-calos-editor'], label: 'f.role_id', group: 'g.general', order: 1 } },
      title: LOC('f.title', { title: true, group: 'g.general', order: 2 }),
      required_capability: { type: 'object', required: ['quantity', 'range', 'max_uncertainty'], additionalProperties: false, 'x-calos-editor': EH({ widget: 'record', label: 'f.required_capability', group: 'g.capability_req', help: 'help.role_cap' }), properties: {
        quantity: { type: 'string', enum: DIMENSIONS, 'x-calos-editor': EH({ widget: 'enum', label: 'f.quantity', enum_prefix: 'dim.' }) },
        range: QTY_OR_INPUT('f.range', 'MI-06', { unit_dimension_from: 'quantity' }),
        max_uncertainty: QTY_OR_INPUT('f.max_uncertainty', 'MI-06', { unit_dimension_from: 'quantity' }),
      } },
      allowed_models: { type: 'array', items: REF('InstrumentModel', 'f.model', {}), 'x-calos-editor': EH({ widget: 'reference-list', label: 'f.allowed_models', ref_kind: 'InstrumentModel', group: 'g.capability_req' }) },
    }, $defs: DEFS },
  },
  StationRequirement: {
    icon: 'S', nav: 'equipment/stations', change_classes: COMMON_CLASSES,
    schema: { type: 'object', required: ['title', 'transports'], additionalProperties: false, properties: {
      title: LOC('f.title', { title: true, group: 'g.general' }),
      transports: ENUM_MULTI(['simulator', 'visa'], 'f.transports', { group: 'g.transports', help: 'help.transports', disabled_options: { visa: 'help.visa_disabled' }, enum_prefix: 'tr.' }),
      environment_inputs: { type: 'array', 'x-calos-editor': EH({ widget: 'record-list', label: 'f.environment', group: 'g.environment', unique_by: 'id', item_title: 'id', add_label: 'a.add_condition', help: 'help.environment' }),
        items: { type: 'object', required: ['id', 'quantity', 'limits'], additionalProperties: false, properties: {
          id: IDENT,
          quantity: { type: 'string', enum: ['°C'], 'x-calos-editor': EH({ widget: 'enum', label: 'f.quantity', enum_prefix: 'dim.' }) },
          limits: LIMITS('f.limits', 'MI-15') } } },
    }, $defs: DEFS },
  },
  ApplicationManifest: {
    icon: 'A', nav: 'apps', wizard: true, change_classes: [{ match: '^/(instrument_models|standard_roles|station_requirement|intended_modes)', cls: 'functional' }, ...COMMON_CLASSES],
    schema: { type: 'object', required: ['title', 'intended_modes', 'instrument_models'], additionalProperties: false, properties: {
      title: LOC('f.title', { title: true, group: 'g.general', order: 1, wizard_step: 1 }),
      description: LOC('f.description', { localized_required: false, multiline: true, group: 'g.general', order: 2, wizard_step: 1 }),
      intended_modes: ENUM_MULTI(['simulation', 'validation', 'production'], 'f.intended_modes', { wizard_step: 1, initial: ['simulation'], group: 'g.modes', help: 'help.modes', enum_prefix: 'mode.', disabled_options: { validation: 'help.mode_validation', production: 'help.mode_production' } }),
      instrument_models: { type: 'array', minItems: 1, items: REF('InstrumentModel', 'f.model', {}), 'x-calos-editor': EH({ widget: 'reference-list', label: 'f.instrument_models', ref_kind: 'InstrumentModel', group: 'g.contents', help: 'help.app_models', wizard_step: 2, initial: [] }) },
      standard_roles: { type: 'array', items: REF('StandardRole', 'f.role', {}), 'x-calos-editor': EH({ widget: 'reference-list', label: 'f.standard_roles', ref_kind: 'StandardRole', group: 'g.contents', wizard_step: 2 }) },
      station_requirement: REF('StationRequirement', 'f.station_requirement', { group: 'g.contents', optional: true, wizard_step: 2 }),
      requires: { type: 'object', 'x-calos-editor': EH({ widget: 'derived', derive: 'closure-requirements', show_fields: ['intended_modes'], enum_prefix: 'mode.', label: 'f.requires', group: 'g.requirements' }) },
    }, $defs: DEFS },
  },
};
/* `requires` is derived, never stored */
delete KINDS.ApplicationManifest.schema.properties.requires.type;
KINDS.ApplicationManifest.schema.properties.requires = { 'x-calos-editor': { widget: 'derived', derive: 'closure-requirements', show_fields: ['intended_modes'], enum_prefix: 'mode.', label: 'f.requires', group: 'g.requirements' } };

/* ---------- synthetic seed ---------- */
function seed() {
  const R = (kind, key) => ({ $ref: { kind, key } });
  const fn = (id, en, he, q) => ({ id, title: { en, he }, quantity: q, ranges: { $input: 'MI-02' } });
  const a = Store.create('Manufacturer', 'demo-maker', { name: { en: 'Demo Maker (synthetic)', he: 'יצרן לדוגמה (הדמיה)' }, aliases: ['DEMO MAKER'] }, 'engineer');
  Store.publishSeed(a, '1.0.0', 'Initial synthetic entry', 'quality');
  const b = Store.create('Manufacturer', 'example-instruments', { name: { en: 'Example Instruments (synthetic)' }, aliases: [] }, 'engineer');
  const f = Store.create('InstrumentFamily', 'demo-dmm-family', { title: { en: 'Demo bench multimeters (synthetic)', he: 'מולטימטרים שולחניים לדוגמה' }, manufacturer: R('Manufacturer', 'demo-maker'), capabilities: ['scpi.error_queue'] }, 'engineer');
  Store.publishSeed(f, '1.0.0', 'Initial synthetic entry', 'quality');
  const m1 = Store.create('InstrumentModel', 'demo-dmm-a', { manufacturer: R('Manufacturer', 'demo-maker'), family: R('InstrumentFamily', 'demo-dmm-family'), model_name: 'DMM-A', aliases: ['DMM A'], functions: [fn('dcv', 'DC voltage', 'מתח ישר', 'V')], capabilities: ['measure.dc_voltage'] }, 'engineer');
  Store.publishSeed(m1, '1.0.0', 'Initial synthetic model', 'quality');
  m1.draft = { content: clone(m1.versions[0].content), revision: 1, state: 'draft', author: 'engineer', contributors: ['engineer'], lease: 'engineer', provenance: 'synthetic_demo', snapshot: null, base: '1.0.0', comments: [] };
  m1.draft.content.capabilities.push('scpi.error_queue'); m1.draft.content.description = { en: 'Synthetic bench multimeter used for design review.' };
  Store.saveDraft(m1, m1.draft.content, 'engineer'); Store.submit(m1, 'engineer', digestOf(m1.draft.content)); m1.draft.state = 'approved'; m1.draft.snapshot.approvals.push({ by: 'approver', persona: 'approver', reason: 'Reviewed structural diff', at: Store.stamp() });
  Store.publish(m1, 'quality', '1.1.0', 'Add error-queue capability', 'functional');
  Store.newDraft(m1, 'engineer'); m1.draft.content.description = { en: 'Synthetic bench multimeter used for design review (updated wording).', he: 'מולטימטר שולחני סינתטי לצורכי סקירת עיצוב.' };
  Store.saveDraft(m1, m1.draft.content, 'engineer'); Store.submit(m1, 'engineer', digestOf(m1.draft.content));
  const m2 = Store.create('InstrumentModel', 'demo-dmm-b', { manufacturer: R('Manufacturer', 'demo-maker'), model_name: 'DMM-B', aliases: [], functions: [{ id: 'DCV', title: { en: 'DC voltage' }, quantity: 'V', ranges: { $input: 'MI-02' } }], capabilities: [] }, 'engineer');
  const sr = Store.create('StandardRole', 'ref-source', { role_id: 'ref_source', title: { en: 'Reference source (synthetic)' }, required_capability: { quantity: 'V', range: { $input: 'MI-06' }, max_uncertainty: { $input: 'MI-06' } }, allowed_models: [] }, 'engineer');
  const st = Store.create('StationRequirement', 'sim-bench', { title: { en: 'Simulated bench (synthetic)' }, transports: ['simulator'], environment_inputs: [{ id: 'room_temp', quantity: '°C', limits: { $input: 'MI-15' } }] }, 'engineer');
  const app = Store.create('ApplicationManifest', 'demo-dmm-verification', { title: { en: 'DMM verification (synthetic demo)' }, intended_modes: ['simulation'], instrument_models: [R('InstrumentModel', 'demo-dmm-a')], standard_roles: [R('StandardRole', 'ref-source')] }, 'engineer');
  Store.S.seq = 40;
}
