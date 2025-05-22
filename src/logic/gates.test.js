// src/logic/gates.test.js
import { AndGate, NotGate, HIGH, LOW, LogicGate } from './gates';
import { InputPoint } from './io'; // Needed for testing connections

describe('LogicGate Base Class', () => {
    it('should instantiate with a name', () => {
        const gate = new LogicGate('BaseGate');
        expect(gate.name).toBe('BaseGate');
        expect(gate.inputs).toEqual([]);
        expect(gate.outputValue).toBe(LOW);
    });

    it('should throw error if evaluate is called directly', () => {
        const gate = new LogicGate();
        expect(() => gate.evaluate()).toThrow('Evaluate method must be implemented by subclasses.');
    });
});

describe('AndGate', () => {
    let andGate;
    let input1, input2;

    beforeEach(() => {
        andGate = new AndGate('TestAndGate');
        input1 = new InputPoint('Input1');
        input2 = new InputPoint('Input2');
    });

    it('should initialize with LOW output', () => {
        expect(andGate.getOutput()).toBe(LOW);
    });

    it('should correctly evaluate AND logic', () => {
        // Connect inputs
        andGate.addInput(input1);
        andGate.addInput(input2);

        // Test all 4 input combinations
        input1.setValue(LOW);
        input2.setValue(LOW);
        andGate.evaluate();
        expect(andGate.getOutput()).toBe(LOW);

        input1.setValue(LOW);
        input2.setValue(HIGH);
        andGate.evaluate();
        expect(andGate.getOutput()).toBe(LOW);

        input1.setValue(HIGH);
        input2.setValue(LOW);
        andGate.evaluate();
        expect(andGate.getOutput()).toBe(LOW);

        input1.setValue(HIGH);
        input2.setValue(HIGH);
        andGate.evaluate();
        expect(andGate.getOutput()).toBe(HIGH);
    });

    it('should output LOW if not enough inputs are connected', () => {
        andGate.evaluate(); // No inputs
        expect(andGate.getOutput()).toBe(LOW);

        andGate.addInput(input1); // One input
        andGate.evaluate();
        expect(andGate.getOutput()).toBe(LOW);
    });
    
    it('maxInputs should be 2', () => {
        expect(andGate.maxInputs).toBe(2);
    });
});

describe('NotGate', () => {
    let notGate;
    let input;

    beforeEach(() => {
        notGate = new NotGate('TestNotGate');
        input = new InputPoint('InputNot');
    });

    it('should initialize with LOW output (or default for unconnected)', () => {
        // Current implementation defaults to LOW if no input is connected and evaluate is called
        notGate.evaluate(); 
        expect(notGate.getOutput()).toBe(LOW);
    });

    it('should correctly evaluate NOT logic', () => {
        notGate.addInput(input);

        input.setValue(LOW);
        notGate.evaluate();
        expect(notGate.getOutput()).toBe(HIGH);

        input.setValue(HIGH);
        notGate.evaluate();
        expect(notGate.getOutput()).toBe(LOW);
    });
    
    it('maxInputs should be 1', () => {
        expect(notGate.maxInputs).toBe(1);
    });
});
