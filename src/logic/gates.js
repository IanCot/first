// src/logic/gates.js

// Define HIGH and LOW constants for clarity
export const HIGH = 1;
export const LOW = 0;

/**
 * Base class for logic gates.
 * It's not meant to be instantiated directly, but rather to provide
 * common functionality for specific gate types.
 */
export class LogicGate {
    constructor(name = 'LogicGate') {
        this.name = name;
        this.inputs = []; // Connections to other gates or InputPoints
        this.outputValue = LOW; // Current output value of the gate
        this.outputs = []; // Connections to other gates or OutputPoints
        this.maxInputs = 2; // Default, can be overridden by specific gates
    }

    /**
     * Sets the number of inputs for this gate.
     * Specific gates like NOT will have a fixed number.
     * @param {number} num
     */
    setInputCount(num) {
        // Basic gates usually have a fixed number of inputs
        // but this could be useful for generic gates or future expansion.
        // For now, let's keep inputs managed by connections.
        console.warn("setInputCount is not fully implemented for dynamic input pins yet. Inputs are managed via connections.");
    }

    /**
     * Adds an input connection to this gate.
     * The 'source' can be an InputPoint or another LogicGate.
     * @param {LogicGate | InputPoint} source
     * @param {number} [inputPin=null] - Optional: specific input pin to connect to.
     */
    addInput(source, inputPin = null) {
        if (this.inputs.length < this.maxInputs) {
            // For simplicity, we'll just add to the list.
            // More complex gates might need specific pin assignments.
            if (!this.inputs.includes(source)) {
                this.inputs.push(source);
                // Automatically connect back if the source is a connectable object
                if (source && typeof source.addOutput === 'function') {
                    source.addOutput(this);
                }
            }
        } else {
            console.error(`${this.name}: Maximum number of inputs (${this.maxInputs}) reached.`);
        }
    }

    /**
     * Adds an output connection from this gate.
     * The 'destination' can be another LogicGate or an OutputPoint.
     * @param {LogicGate | OutputPoint} destination
     */
    addOutput(destination) {
        if (!this.outputs.includes(destination)) {
            this.outputs.push(destination);
             // Automatically connect back if the destination is a connectable object
            if (destination && typeof destination.addInput === 'function' && !destination.inputs.includes(this)) {
                // Check if the destination expects a specific input pin or just a generic connection
                // This logic might need refinement based on how `addInput` on the destination is implemented.
                destination.addInput(this);
            }
        }
    }

    /**
     * Removes an input connection.
     * @param {LogicGate | InputPoint} source
     */
    removeInput(source) {
        this.inputs = this.inputs.filter(input => input !== source);
        if (source && typeof source.removeOutput === 'function') {
            source.removeOutput(this);
        }
    }

    /**
     * Removes an output connection.
     * @param {LogicGate | OutputPoint} destination
     */
    removeOutput(destination) {
        this.outputs = this.outputs.filter(output => output !== destination);
        if (destination && typeof destination.removeInput === 'function') {
            destination.removeInput(this);
        }
    }

    /**
     * Evaluates the gate's logic based on its input values.
     * This method MUST be overridden by specific gate implementations.
     */
    evaluate() {
        throw new Error("Evaluate method must be implemented by subclasses.");
    }

    /**
     * Gets the current output value of the gate.
     * @returns {number} HIGH or LOW
     */
    getOutput() {
        return this.outputValue;
    }

    // Helper to get input values. Assumes inputs are objects with getOutput()
    getInputValue(index) {
        if (index < this.inputs.length && this.inputs[index]) {
            const inputSource = this.inputs[index];
            // Check if it's a direct value (e.g. from an InputPoint) or another gate
            if (typeof inputSource.getOutput === 'function') {
                return inputSource.getOutput();
            } else if (inputSource && typeof inputSource.value !== 'undefined') { // For simple input objects
                return inputSource.value;
            }
        }
        // console.warn(`${this.name}: Input ${index} not connected or invalid.`);
        return LOW; // Default to LOW if input is not connected or invalid
    }
}

export class AndGate extends LogicGate {
    constructor(name = 'AndGate') {
        super(name);
        this.maxInputs = 2; // Common AND gates have 2 inputs
    }

    evaluate() {
        if (this.inputs.length < this.maxInputs) {
            // Not enough inputs to evaluate properly for a standard AND gate
            // console.warn(`${this.name}: Not enough inputs connected to evaluate. Requires ${this.maxInputs}.`);
            this.outputValue = LOW;
            return this.outputValue;
        }
        const val1 = this.getInputValue(0);
        const val2 = this.getInputValue(1);
        this.outputValue = (val1 === HIGH && val2 === HIGH) ? HIGH : LOW;
        return this.outputValue;
    }
}

export class NotGate extends LogicGate {
    constructor(name = 'NotGate') {
        super(name);
        this.maxInputs = 1; // NOT gate has 1 input
    }

    evaluate() {
        if (this.inputs.length < 1) {
            // console.warn(`${this.name}: No input connected to evaluate.`);
            this.outputValue = LOW; // Or HIGH, depending on desired behavior for unconnected NOT
            return this.outputValue;
        }
        const val = this.getInputValue(0);
        this.outputValue = (val === HIGH) ? LOW : HIGH;
        return this.outputValue;
    }
}

// Example of a generic N-input AND gate if needed in the future
export class NAndGate extends LogicGate {
    constructor(name = 'NAndGate', numInputs = 2) {
        super(name);
        this.maxInputs = numInputs; // N inputs
    }

    evaluate() {
        if (this.inputs.length === 0) {
             this.outputValue = LOW; // Or HIGH, depending on convention for empty AND
             return this.outputValue;
        }
        let result = HIGH;
        for (let i = 0; i < this.inputs.length; i++) {
            if (this.getInputValue(i) === LOW) {
                result = LOW;
                break;
            }
        }
        this.outputValue = result;
        return this.outputValue;
    }
}
