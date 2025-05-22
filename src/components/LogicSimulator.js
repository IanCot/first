// src/components/LogicSimulator.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Simulation } from '../logic/simulation';
import { AndGate, NotGate, HIGH, LOW, LogicGate } from '../logic/gates'; // Import LogicGate
import { InputPoint, OutputPoint } from '../logic/io';

const LogicSimulator = () => {
    const [simulation, setSimulation] = useState(null);
    const [circuitState, setCircuitState] = useState(null);
    
    const inputCounter = useRef(0);
    const outputCounter = useRef(0);
    const andGateCounter = useRef(0);
    const notGateCounter = useRef(0);

    // State for connection UI
    const [selectedSource, setSelectedSource] = useState(''); // Stores name of the source component
    const [selectedTarget, setSelectedTarget] = useState(''); // Stores name of the target component
    // const [selectedTargetPin, setSelectedTargetPin] = useState(0); // For future specific pin selection

    useEffect(() => {
        const sim = new Simulation();
        inputCounter.current = 2;
        outputCounter.current = 1;
        andGateCounter.current = 1;
        notGateCounter.current = 1;
        
        const inputA = new InputPoint('InputA', LOW);
        const inputB = new InputPoint('InputB', LOW);
        const notGate = new NotGate('Not1');
        const andGate = new AndGate('And1');
        const outputX = new OutputPoint('OutputX');

        sim.addComponent(inputA);
        sim.addComponent(inputB);
        sim.addComponent(notGate);
        sim.addComponent(andGate);
        sim.addComponent(outputX);

        sim.connect(inputA, notGate);
        sim.connect(notGate, andGate);
        sim.connect(inputB, andGate);
        sim.connect(andGate, outputX);
        
        sim.propagate();
        setSimulation(sim);
        setCircuitState(sim.getCircuitState());
    }, []);

    const updateAndRefreshState = useCallback(() => {
        if (simulation) {
            simulation.propagate();
            setCircuitState(simulation.getCircuitState());
        }
    }, [simulation]);

    const toggleInput = useCallback((inputName) => {
        if (simulation) {
            const inputComponent = simulation.inputPoints.find(ip => ip.name === inputName);
            if (inputComponent) {
                inputComponent.toggle();
                updateAndRefreshState();
            }
        }
    }, [simulation, updateAndRefreshState]);

    const addComponentToSim = useCallback((type) => {
        if (!simulation) return;
        let newComponent;
        switch (type) {
            case 'INPUT':
                inputCounter.current++;
                newComponent = new InputPoint(`Input${inputCounter.current}`);
                break;
            case 'OUTPUT':
                outputCounter.current++;
                newComponent = new OutputPoint(`Output${outputCounter.current}`);
                break;
            case 'AND':
                andGateCounter.current++;
                newComponent = new AndGate(`And${andGateCounter.current}`);
                break;
            case 'NOT':
                notGateCounter.current++;
                newComponent = new NotGate(`Not${notGateCounter.current}`);
                break;
            default:
                console.error("Unknown component type to add");
                return;
        }
        simulation.addComponent(newComponent);
        updateAndRefreshState();
    }, [simulation, updateAndRefreshState]);

    const handleConnectComponents = useCallback(() => {
        if (!simulation || !selectedSource || !selectedTarget) {
            alert("Please select a source and a target component.");
            return;
        }

        const sourceComponent = simulation.components.find(c => c.name === selectedSource);
        const targetComponent = simulation.components.find(c => c.name === selectedTarget);

        if (!sourceComponent || !targetComponent) {
            alert("Selected source or target component not found in simulation.");
            return;
        }

        // Basic validation:
        // Source must be InputPoint or LogicGate
        if (!(sourceComponent instanceof InputPoint || sourceComponent instanceof LogicGate)) {
            alert("Invalid source component type. Must be an Input or a Gate.");
            return;
        }
        // Target must be LogicGate or OutputPoint
        if (!(targetComponent instanceof LogicGate || targetComponent instanceof OutputPoint)) {
            alert("Invalid target component type. Must be a Gate or an Output.");
            return;
        }
        // Prevent connecting an OutputPoint to another OutputPoint or an InputPoint to an InputPoint directly
        if (sourceComponent instanceof InputPoint && targetComponent instanceof OutputPoint && targetComponent.input) {
             // This case is less common, usually Input -> Gate or Gate -> Output or Gate -> Gate
             // Allowing direct Input -> Output connection if OutputPoint is free
        } else if (sourceComponent instanceof LogicGate && targetComponent instanceof InputPoint) {
            alert("Cannot connect a Gate's output to an InputPoint.");
            return;
        }


        // The simulation.connect method handles the actual connection logic.
        // For now, targetInputPin is not explicitly passed or used in a way that
        // LogicGate.addInput places it at a specific pin index yet.
        // It will connect to the next available input slot as per current LogicGate.addInput.
        simulation.connect(sourceComponent, targetComponent /*, selectedTargetPin */);
        updateAndRefreshState();
        setSelectedSource(''); // Reset selections
        setSelectedTarget('');
    }, [simulation, selectedSource, selectedTarget, updateAndRefreshState]);

    if (!circuitState || !simulation) {
        return <div>Loading Simulation...</div>;
    }
    
    // Potential sources: InputPoints and LogicGates
    const potentialSources = [
        ...circuitState.inputs.map(i => ({ name: i.name, type: 'InputPoint' })),
        ...circuitState.gates.map(g => ({ name: g.name, type: g.constructor.name }))
    ];
    // Potential targets: LogicGates and OutputPoints
    const potentialTargets = [
        ...circuitState.gates.map(g => ({ name: g.name, type: g.constructor.name, inputs: g.inputs, maxInputs: simulation.components.find(c=>c.name === g.name)?.maxInputs || 0 })),
        ...circuitState.outputs.map(o => ({ name: o.name, type: 'OutputPoint', input: o.input }))
    ];


    return (
        <div style={{ fontFamily: 'monospace', padding: '20px' }}>
            <h2>Logic Gate Simulation (Textual)</h2>

            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee' }}>
                <h4>Add Components:</h4>
                <button onClick={() => addComponentToSim('INPUT')} style={{ marginRight: '5px' }}>Add Input</button>
                <button onClick={() => addComponentToSim('OUTPUT')} style={{ marginRight: '5px' }}>Add Output</button>
                <button onClick={() => addComponentToSim('AND')} style={{ marginRight: '5px' }}>Add AND Gate</button>
                <button onClick={() => addComponentToSim('NOT')} style={{ marginRight: '5px' }}>Add NOT Gate</button>
            </div>

            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee' }}>
                <h4>Connect Components:</h4>
                <div>
                    <label htmlFor="sourceSelect">Source: </label>
                    <select id="sourceSelect" value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ marginRight: '10px' }}>
                        <option value="">-- Select Source --</option>
                        {potentialSources.map(s => (
                            <option key={s.name} value={s.name}>{s.name} ({s.type})</option>
                        ))}
                    </select>

                    <label htmlFor="targetSelect">Target: </label>
                    <select id="targetSelect" value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)}>
                        <option value="">-- Select Target --</option>
                        {potentialTargets.map(t => {
                            // Disable target if it's a gate and its inputs are full, or if it's an output point already connected
                            let disabled = false;
                            if (t.type !== 'OutputPoint') { // It's a gate
                                const gateComp = simulation.gates.find(g => g.name === t.name);
                                if (gateComp && gateComp.inputs.length >= gateComp.maxInputs) {
                                    disabled = true;
                                }
                            } else { // It's an OutputPoint
                                if (t.input) { // OutputPoint already has an input
                                    disabled = true;
                                }
                            }
                            return <option key={t.name} value={t.name} disabled={disabled}>{t.name} ({t.type}) {disabled ? "(Full/Connected)" : ""}</option>;
                        })}
                    </select>
                    {/* 
                    // Future: Pin selection for multi-input gates
                    {selectedTarget && simulation.components.find(c => c.name === selectedTarget) instanceof LogicGate && (
                         <select value={selectedTargetPin} onChange={e => setSelectedTargetPin(parseInt(e.target.value, 10))} style={{ marginLeft: '5px' }}>
                            {[...Array(simulation.components.find(c => c.name === selectedTarget)?.maxInputs || 0).keys()].map(pinIndex => (
                                <option key={pinIndex} value={pinIndex}>Input Pin {pinIndex}</option>
                            ))}
                        </select>
                    )}
                    */}
                </div>
                <button onClick={handleConnectComponents} style={{ marginTop: '10px' }}>Connect Selected</button>
            </div>

            <div>
                <h3>Inputs:</h3>
                {circuitState.inputs.map(input => (
                    <div key={input.name}>
                        {input.name}: {input.value === HIGH ? 'HIGH' : 'LOW'}
                        <button onClick={() => toggleInput(input.name)} style={{ marginLeft: '10px' }}>
                            Toggle {input.name}
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Gates:</h3>
                {circuitState.gates.map(gate => (
                    <div key={gate.name}>
                        {gate.name} (Type: {gate.constructor.name}): Output = {gate.output === HIGH ? 'HIGH' : 'LOW'}
                        <br />
                        <small>Inputs: {gate.inputs.map(i => i ? i.name : 'N/A').join(', ') || 'None'}</small>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Outputs:</h3>
                {circuitState.outputs.map(output => (
                    <div key={output.name}>
                        {output.name}: {output.value === HIGH ? 'HIGH' : 'LOW'}
                         <small style={{marginLeft: '10px'}}>Connected to: {output.input ? output.input.name : 'None'}</small>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Connections:</h3>
                <ul>
                    {circuitState.connections.map((conn, index) => (
                        <li key={index}>{conn.from} --&gt; {conn.to}</li>
                    ))}
                </ul>
            </div>

            <div style={{ marginTop: '20px' }}>
                <button onClick={updateAndRefreshState}>Force Propagation/Refresh State</button>
            </div>
            
            <pre style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', background: '#f9f9f9' }}>
                {JSON.stringify(circuitState, null, 2)}
            </pre>
        </div>
    );
};

export default LogicSimulator;
