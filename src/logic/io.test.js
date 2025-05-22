// src/logic/io.test.js
import { InputPoint, OutputPoint } from './io';
import { AndGate, HIGH, LOW } from './gates'; // For testing connection to a gate

describe('InputPoint', () => {
    let inputPoint;

    beforeEach(() => {
        inputPoint = new InputPoint('TestInput', LOW);
    });

    it('should initialize with given name and state', () => {
        expect(inputPoint.name).toBe('TestInput');
        expect(inputPoint.getOutput()).toBe(LOW);
    });

    it('setValue should change its state', () => {
        inputPoint.setValue(HIGH);
        expect(inputPoint.getOutput()).toBe(HIGH);
        inputPoint.setValue(LOW);
        expect(inputPoint.getOutput()).toBe(LOW);
    });

    it('setValue should only accept HIGH or LOW', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        inputPoint.setValue(2); // Invalid value
        expect(inputPoint.getOutput()).toBe(LOW); // Should remain unchanged or default
        expect(consoleErrorSpy).toHaveBeenCalledWith('TestInput: Invalid value. Must be HIGH or LOW.');
        consoleErrorSpy.mockRestore();
    });

    it('toggle should flip its state', () => {
        inputPoint.toggle();
        expect(inputPoint.getOutput()).toBe(HIGH);
        inputPoint.toggle();
        expect(inputPoint.getOutput()).toBe(LOW);
    });

    it('should manage output connections', () => {
        const gate = new AndGate(); // Dummy gate for connection
        inputPoint.addOutput(gate);
        expect(inputPoint.outputs).toContain(gate);
        expect(gate.inputs).toContain(inputPoint); // Check bidirectional connection

        inputPoint.removeOutput(gate);
        expect(inputPoint.outputs).not.toContain(gate);
        expect(gate.inputs).not.toContain(inputPoint);
    });
});

describe('OutputPoint', () => {
    let outputPoint;
    let sourceGate;

    beforeEach(() => {
        outputPoint = new OutputPoint('TestOutput');
        sourceGate = new AndGate('SourceGate'); // A connectable object with getOutput()
    });

    it('should initialize with given name and LOW value', () => {
        expect(outputPoint.name).toBe('TestOutput');
        expect(outputPoint.getValue()).toBe(LOW);
    });

    it('addInput should connect a source', () => {
        outputPoint.addInput(sourceGate);
        expect(outputPoint.input).toBe(sourceGate);
        expect(sourceGate.outputs).toContain(outputPoint); // Check bidirectional
    });
    
    it('removeInput should disconnect the source', () => {
        outputPoint.addInput(sourceGate);
        outputPoint.removeInput();
        expect(outputPoint.input).toBeNull();
        expect(sourceGate.outputs).not.toContain(outputPoint);
        expect(outputPoint.getValue()).toBe(LOW); // Should reset to LOW
    });

    it('update should set its value from the connected input', () => {
        outputPoint.addInput(sourceGate);
        
        // Simulate sourceGate output being HIGH
        jest.spyOn(sourceGate, 'getOutput').mockReturnValue(HIGH);
        outputPoint.update();
        expect(outputPoint.getValue()).toBe(HIGH);

        // Simulate sourceGate output being LOW
        jest.spyOn(sourceGate, 'getOutput').mockReturnValue(LOW);
        outputPoint.update();
        expect(outputPoint.getValue()).toBe(LOW);
        
        sourceGate.getOutput.mockRestore();
    });

    it('getValue should be LOW if no input is connected', () => {
        outputPoint.update(); // input is null
        expect(outputPoint.getValue()).toBe(LOW);
    });
});
