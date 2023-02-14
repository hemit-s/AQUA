// Heavily modified from the validator generated from @rkesters/typescript-json-validator
const Ajv = require('ajv');

export const ajv = new Ajv({
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  strict: false,
  strictNumbers: false,
  strictRequired: false,
  strictSchema: false,
  strictTuples: false,
  strictTypes: false,
  useDefaults: true,
});
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

const IStateSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  defaultProperties: [],
  definitions: {
    FilterTypeEnum: {
      enum: ['HSC', 'LSC', 'PK'],
      type: 'string',
    },
    Filters: {
      additionalProperties: {
        $ref: '#/definitions/IFilter',
      },
      defaultProperties: [],
      description: '----- Application Interfaces -----',
      type: 'object',
    },
    IFilter: {
      defaultProperties: [],
      properties: {
        frequency: {
          type: 'number',
        },
        gain: {
          type: 'number',
        },
        id: {
          type: 'string',
        },
        quality: {
          type: 'number',
        },
        type: {
          $ref: '#/definitions/FilterTypeEnum',
        },
      },
      required: ['frequency', 'gain', 'id', 'quality', 'type'],
      type: 'object',
    },
  },
  properties: {
    filters: {
      $ref: '#/definitions/Filters',
    },
    isAutoPreAmpOn: {
      type: 'boolean',
    },
    isEnabled: {
      type: 'boolean',
    },
    isGraphViewOn: {
      type: 'boolean',
    },
    preAmp: {
      type: 'number',
    },
  },
  required: [
    'filters',
    'isAutoPreAmpOn',
    'isEnabled',
    'isGraphViewOn',
    'preAmp',
  ],
  type: 'object',
};

const IPresetSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  defaultProperties: [],
  definitions: {
    FilterTypeEnum: {
      enum: ['HSC', 'LSC', 'PK'],
      type: 'string',
    },
    Filters: {
      additionalProperties: {
        $ref: '#/definitions/IFilter',
      },
      defaultProperties: [],
      description: '----- Application Interfaces -----',
      type: 'object',
    },
    IFilter: {
      defaultProperties: [],
      properties: {
        frequency: {
          type: 'number',
        },
        gain: {
          type: 'number',
        },
        id: {
          type: 'string',
        },
        quality: {
          type: 'number',
        },
        type: {
          $ref: '#/definitions/FilterTypeEnum',
        },
      },
      required: ['frequency', 'gain', 'id', 'quality', 'type'],
      type: 'object',
    },
  },
  properties: {
    filters: {
      $ref: '#/definitions/Filters',
    },
    preAmp: {
      type: 'number',
    },
  },
  required: ['filters', 'preAmp'],
  type: 'object',
};

export const validateState = ajv.compile(IStateSchema);
export const validatePreset = ajv.compile(IPresetSchema);
