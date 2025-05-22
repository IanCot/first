// src/logic/io.js
import { HIGH, LOW } from './gates.js'; // Assuming gates.js is in the same directory

/**
 * Represents an input point in the circuit.
 * This can be toggled by the user (or programmatically) to set its state.
 */
export class InputPoint {
    constructor(name = 'Input', initialState = LOW) {
        this.name = name;
        this.value = initialState;
        this.outputs = []; // Connections to LogicGate inputs
    }

    /**
     * Sets the state of the input point.
     * @param {number} newValue - HIGH or LOW
     */
    setValue(newValue) {
        if (newValue === HIGH || newValue === LOW) {
            this.value = newValue;
            // Future: Notify connected components of the change for real-time simulation
        } else {
            console.error(`${this.name}: Invalid value. Must be HIGH or LOW.`);
        }
    }

    /**
     * Toggles the state of the input point (HIGH to LOW, LOW to HIGH).
     */
    toggle() {
        this.value = (this.value === HIGH) ? LOW : HIGH;
        // Future: Notify connected components
    }

    /**
     * Gets the current output value of this input point.
     * @returns {number} HIGH or LOW
     */
    getOutput() {
        return this.value;
    }

    /**
     * Adds an output connection from this InputPoint.
     * The 'destination' is typically a LogicGate's input.
     * @param {LogicGate} destination
     */
    addOutput(destination) {
        if (!this.outputs.includes(destination)) {
            this.outputs.push(destination);
            // Automatically connect back if the destination is a LogicGate
            // and expects an input from this InputPoint.
            if (destination && typeof destination.addInput === 'function' && !destination.inputs.includes(this)) {
                 destination.addInput(this);
            }
        }
    }

    /**
     * Removes an output connection.
     * @param {LogicGate} destination
     */
    removeOutput(destination) {
        this.outputs = this.outputs.filter(output => output !== destination);
        if (destination && typeof destination.removeInput === 'function') {
            destination.removeInput(this);
        }
    }
}

/**
 * Represents an output point in the circuit.
 * Its state is determined by the component it's connected to.
 */
export class OutputPoint {
    constructor(name = 'Output') {
        this.name = name;
        this.input = null; // Connection from a LogicGate's output
        this.value = LOW; // Current value, determined by its input
    }

    /**
     * Adds an input connection to this OutputPoint.
     * The 'source' is typically a LogicGate's output.
     * @param {LogicGate | InputPoint} source
     */
    addInput(source) {
        if (this.input && this.input !== source) {
            console.warn(`${this.name}: Already connected to ${this.input.name}. Replacing connection.`);
            // Optionally remove itself from the old source's outputs
            if (this.input && typeof this.input.removeOutput === 'function') {
                this.input.removeOutput(this);
            }
        }
        this.input = source;
        if (source && typeof source.addOutput === 'function' && !source.outputs.includes(this)) {
            source.addOutput(this);
        }
        this.update(); // Update value when connection is made
    }

    /**
     * Removes the input connection.
     */
    removeInput() {
        if (this.input && typeof this.input.removeOutput === 'function') {
            this.input.removeOutput(this);
        }
        this.input = null;
        this.value = LOW; // Reset to LOW when disconnected
    }

    /**
     * Updates the value of this output point based on its input.
     * This should be called by the simulation when the input's state changes.
     */
    update() {
        if (this.input && typeof this.input.getOutput === 'function') {
            this.value = this.input.getOutput();
        } else {
            this.value = LOW; // Default to LOW if no input or input is invalid
        }
    }

    /**
     * Gets the current value of the output point.
     * @returns {number} HIGH or LOW
     */
    getValue() {
        // Ensure value is up-to-date before returning
        // For a more reactive system, `update` would be called by the simulation engine
        // or an event system. For now, a direct call here ensures it's fresh if queried.
        // However, the primary update mechanism should be through the simulation loop.
        // this.update(); // Re-evaluating this: update should be driven by simulation, not getter.
        return this.value;
    }

    // Conforming to the "getOutput" naming convention for connectable objects
    getOutput() {
        return this.getValue();
    }
}
