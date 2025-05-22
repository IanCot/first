// src/logic/simulation.js

export class Simulation {
    constructor() {
        this.components = []; // All components: gates, input points, output points
        this.inputPoints = []; // Specifically track input points for easy access
        this.outputPoints = []; // Specifically track output points
        this.gates = []; // Specifically track gates
    }

    /**
     * Adds a component to the simulation.
     * @param {LogicGate | InputPoint | OutputPoint} component
     */
    addComponent(component) {
        if (!this.components.includes(component)) {
            this.components.push(component);
            if (component.constructor.name === 'InputPoint') {
                this.inputPoints.push(component);
            } else if (component.constructor.name === 'OutputPoint') {
                this.outputPoints.push(component);
            } else if (component instanceof Object.getPrototypeOf(this.gates).constructor) { // A bit hacky way to check if it's a gate
                 // A more robust check would be `component instanceof LogicGate` if LogicGate is imported and used as a base.
                 // For now, assuming gates will have an 'evaluate' method.
                 if (typeof component.evaluate === 'function') {
                    this.gates.push(component);
                 }
            }
        }
    }

    /**
     * Removes a component from the simulation.
     * Also handles disconnecting it from other components.
     * @param {LogicGate | InputPoint | OutputPoint} component
     */
    removeComponent(component) {
        this.components = this.components.filter(c => c !== component);
        
        if (component.constructor.name === 'InputPoint') {
            this.inputPoints = this.inputPoints.filter(ip => ip !== component);
            // Disconnect this input point from all its connected gates/outputs
            component.outputs.forEach(outputConnection => {
                if (outputConnection && typeof outputConnection.removeInput === 'function') {
                    outputConnection.removeInput(component);
                }
            });
            component.outputs = []; // Clear its own output list
        } else if (component.constructor.name === 'OutputPoint') {
            this.outputPoints = this.outputPoints.filter(op => op !== component);
            // Disconnect this output point from its source
            if (component.input && typeof component.input.removeOutput === 'function') {
                component.input.removeOutput(component);
            }
            component.input = null; // Clear its own input
        } else if (typeof component.evaluate === 'function') { // It's a gate
            this.gates = this.gates.filter(g => g !== component);
            // Disconnect this gate from its inputs
            component.inputs.forEach(inputSource => {
                if (inputSource && typeof inputSource.removeOutput === 'function') {
                    inputSource.removeOutput(component);
                }
            });
            component.inputs = [];

            // Disconnect this gate from its outputs
            component.outputs.forEach(outputConnection => {
                if (outputConnection && typeof outputConnection.removeInput === 'function') {
                    outputConnection.removeInput(component);
                }
            });
            component.outputs = [];
        }
    }

    /**
     * Propagates signals through the circuit.
     * This is a simple, depth-first propagation.
     * For more complex circuits with feedback loops, a more sophisticated algorithm
     * (e.g., event-based or iterative) would be needed.
     */
    propagate() {
        // For this basic propagation, we assume a directed acyclic graph (DAG).
        // We start evaluation from gates that have inputs from InputPoints or gates that have already been evaluated.
        // A simple approach is to iterate multiple times to allow signals to settle,
        // or to build a topological sort of gates.

        // Simple iterative approach:
        // Iterate a few times to ensure propagation. Max iterations to prevent infinite loops in cyclic graphs (though not fully handled here).
        const maxIterations = this.gates.length + 1; // Heuristic
        
        for (let i = 0; i < maxIterations; i++) {
            let changed = false;
            this.gates.forEach(gate => {
                const oldOutput = gate.getOutput();
                gate.evaluate(); // Recalculate gate's output
                if (gate.getOutput() !== oldOutput) {
                    changed = true;
                }
            });

            this.outputPoints.forEach(outputPoint => {
                outputPoint.update(); // Update output points based on their connected gates
            });
            
            // If no gate outputs changed in this iteration, the circuit is stable.
            // This is a simplification; true stability in complex circuits (especially with feedback) is harder.
            if (!changed && i > 0) break; 
        }

        // Final update for output points after all gate evaluations.
        this.outputPoints.forEach(outputPoint => {
            outputPoint.update();
        });
    }

    /**
     * Connects two components in the simulation.
     * Example: connect(inputA, andGate1, 0) // Connects inputA to input 0 of andGate1
     * Example: connect(andGate1, outputX)   // Connects andGate1's output to outputX
     *
     * @param {InputPoint | LogicGate} sourceComponent - The source of the signal.
     * @param {LogicGate | OutputPoint} targetComponent - The target of the signal.
     * @param {number | null} [targetInputPin=null] - Optional. For LogicGates, specifies which input pin to connect to.
     */
    connect(sourceComponent, targetComponent, targetInputPin = null) {
        if (!this.components.includes(sourceComponent) || !this.components.includes(targetComponent)) {
            console.error("Simulation.connect: Both components must be added to the simulation first.");
            return;
        }

        // Source is InputPoint or LogicGate (has addOutput)
        // Target is LogicGate (has addInput) or OutputPoint (has addInput)
        if (typeof sourceComponent.addOutput === 'function' && typeof targetComponent.addInput === 'function') {
            // The addOutput/addInput methods in the components themselves already handle bidirectional connection.
            // LogicGate.addInput takes an optional second parameter for the pin, but our current implementation
            // adds inputs to a list. If specific pin assignment becomes crucial, this logic (and LogicGate.addInput)
            // would need refinement. For now, we assume sequential input connection.
            
            // `targetInputPin` is not directly used here because `addOutput` on source calls `addInput` on target.
            // The `addInput` on `LogicGate` takes `source` and an optional `inputPin` (which is currently not strictly used
            // to place at a specific index if inputs are managed as a simple list).
            // This connection logic primarily relies on the component's internal methods.
            sourceComponent.addOutput(targetComponent); 
            
            // If connecting to a specific input pin of a LogicGate becomes a strict requirement later,
            // we might need a more direct call:
            // if (targetComponent instanceof LogicGate && targetInputPin !== null) {
            //    targetComponent.setInputAt(targetInputPin, sourceComponent); // Hypothetical method
            // } else {
            //    sourceComponent.addOutput(targetComponent); // Existing mechanism
            // }

        } else {
            console.error("Simulation.connect: Invalid components for connection. Source must be connectable (has addOutput), Target must be connectable (has addInput).");
        }

        this.propagate(); // Propagate signals after connection
    }

    /**
     * Disconnects two components.
     * @param {InputPoint | LogicGate} sourceComponent
     * @param {LogicGate | OutputPoint} targetComponent
     */
    disconnect(sourceComponent, targetComponent) {
        if (typeof sourceComponent.removeOutput === 'function') {
            sourceComponent.removeOutput(targetComponent);
        } else {
            console.error("Cannot disconnect: sourceComponent does not have removeOutput method.");
        }
        // The removeOutput method in components should also call removeInput on the targetComponent.
        this.propagate(); // Propagate signals after disconnection
    }

    /**
     * Gets the state of the simulation (e.g., for rendering or debugging).
     * @returns {object} An object describing the current state.
     */
    getCircuitState() {
        const state = {
            inputs: this.inputPoints.map(ip => ({ name: ip.name, value: ip.getOutput() })),
            gates: this.gates.map(g => ({ name: g.name, output: g.getOutput(), inputs: g.inputs.map(i => i ? i.name : 'disconnected') })),
            outputs: this.outputPoints.map(op => ({ name: op.name, value: op.getValue() })),
            connections: []
        };
        
        this.components.forEach(comp => {
            if (comp.outputs && comp.outputs.length > 0) {
                comp.outputs.forEach(out_conn => {
                    state.connections.push({ from: comp.name, to: out_conn.name });
                });
            }
            // For OutputPoints, their input is singular
            if (comp.constructor.name === 'OutputPoint' && comp.input) {
                 state.connections.push({ from: comp.input.name, to: comp.name });
            }
        });
        // Deduplicate connections if bidirectional linking added them from both ends for the state representation
        state.connections = state.connections.filter((conn, index, self) =>
            index === self.findIndex((c) => (
                (c.from === conn.from && c.to === conn.to) || (c.to === conn.from && c.from === conn.to && comp.constructor.name !== 'OutputPoint') // Avoid reversing outputpoint connections
            ))
        );


        return state;
    }
}

// Example usage (for testing purposes, would typically be in a test file or main app logic)
/*
import { AndGate, NotGate, LogicGate } from './gates.js'; // Adjust path as needed
import { InputPoint, OutputPoint } from './io.js';     // Adjust path as needed

const sim = new Simulation();

const inputA = new InputPoint('InputA');
const inputB = new InputPoint('InputB');
const notGate = new NotGate('Not1');
const andGate = new AndGate('And1');
const outputX = new OutputPoint('OutputX');

sim.addComponent(inputA);
sim.addComponent(inputB);
sim.addComponent(notGate);
sim.addComponent(andGate);
sim.addComponent(outputX);

// Connections
// inputA -> notGate
// notGate -> andGate (input 0)
// inputB -> andGate (input 1)
// andGate -> outputX

sim.connect(inputA, notGate);
sim.connect(notGate, andGate); // Assumes connects to first available input
sim.connect(inputB, andGate); // Assumes connects to next available input
sim.connect(andGate, outputX);

inputA.setValue(HIGH);
inputB.setValue(LOW);
sim.propagate();
console.log("Initial State:", sim.getCircuitState());

inputB.setValue(HIGH);
sim.propagate();
console.log("Input B HIGH:", sim.getCircuitState());

// Disconnect example
// sim.disconnect(notGate, andGate);
// sim.propagate();
// console.log("After disconnecting notGate from andGate:", sim.getCircuitState());

// Remove component example
// sim.removeComponent(notGate);
// sim.propagate();
// console.log("After removing notGate:", sim.getCircuitState());

*/
