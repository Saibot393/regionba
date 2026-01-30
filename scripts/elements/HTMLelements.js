
document.querySelector("canvas#board").onclick = (pEvent) => {Hooks.call(cModuleName + ".onCanvasClick", {pEvent})} //IMPROVE

class HTMLColorPickerElement extends foundry.applications.elements.AbstractFormInputElement {
    /**
   * @param {HTMLColorPickerOptions} [options]
   */
    constructor({value}={}) {
        super();
        this._setValue(value || this.getAttribute("value"));
        // Initialize existing color value
    }

    /** @override */
    static tagName = "position-picker";

    /* -------------------------------------------- */

    /**
   * The button element to add a new document.
   * @type {HTMLInputElement}
   */
    #positionSelector;

    /**
   * The input element to define a Document UUID.
   * @type {HTMLInputElement}
   */
    #positionString;

    /* -------------------------------------------- */

    /** @override */
    _buildElements() {
        // Create string input element
        this.#positionString = this._primaryInput = document.createElement("input");
        this.#positionString.type = "text";
        this.#positionString.placeholder = this.getAttribute("placeholder") || "";
        this._applyInputAttributes(this.#positionString);

        // Create position selector element
        this.#positionSelector = document.createElement("button");
    }

    /* -------------------------------------------- */

    /** @override */
    _refresh() {
        if (!this.#positionString)
            return;
        // Not yet connected
        this.#positionString.value = this._value;
    }

    /* -------------------------------------------- */

    /** @override */
    _activateListeners() {
        const onChange = this.#onChangeInput.bind(this);
        this.#positionString.addEventListener("change", onChange);
		
		this.#positionSelector.onclick = () => {Hooks.once(cModuleName + ".onCanvasClick", (pEvent) => {this.value = `[${canvas.scene.id},${canvas.scene.level.id},${pEvent.clientX},${pEvent.clientY}]`}}
    }

    /* -------------------------------------------- */

    /**
   * Handle changes to one of the inputs of the color picker element.
   * @param {InputEvent} event     The originating input change event
   */
    #onChangeInput(event) {
        event.stopPropagation();
        this.value = event.currentTarget.value;
    }

    /* -------------------------------------------- */

    /** @override */
    _toggleDisabled(disabled) {
        this.#positionString.disabled = disabled;
        this.#positionSelector.disabled = disabled;
    }

    /* -------------------------------------------- */

    /**
   * Create a HTMLColorPickerElement using provided configuration data.
   * @param {FormInputConfig} config
   * @returns {HTMLColorPickerElement}
   */
    static create(config) {
        const {value} = config;
        const picker = new this({
            value
        });
        picker.name = config.name;
        picker.setAttribute("value", config.value ?? "");
        foundry.applications.fields.setInputAttributes(picker, config);
        return picker;
    }
}