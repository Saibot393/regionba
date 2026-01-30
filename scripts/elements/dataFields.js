class LocationField extends foundry.data.fields.ArrayField {
    /**
   * @param {ArrayFieldOptions} [options]  Options which configure the behavior of the field
   * @param {DataFieldContext} [context]   Additional context which describes the field
   */
    constructor(options, context) {
        super(new TypedSchemaField(foundry.data.BaseShapeData.TYPES), options, context);
    }

    /* ---------------------------------------- */

    /** @override */
    initialize(value, model, options={}) {
        if (!value)
            return value;
        return value.map( (v, i) => {
            const shape = this.element.initialize(v, model, options);
            shape._index = i;
            return shape;
        }
        );
    }
}