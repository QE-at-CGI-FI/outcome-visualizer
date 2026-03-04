// Outcome Visualizer App
// Data stored in browser localStorage

const STORAGE_KEY = 'outcomeVisualizerData';

// State
let state = {
    outcomes: [],
    outputs: []
};

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            state = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading data:', e);
            state = { outcomes: [], outputs: [] };
        }
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Render outcomes list
function renderOutcomes() {
    const container = document.getElementById('outcomesList');
    
    if (state.outcomes.length === 0) {
        container.innerHTML = '<div class="empty-state">No outcomes yet. Add your first outcome above.</div>';
        return;
    }
    
    container.innerHTML = state.outcomes.map(outcome => `
        <div class="item-card outcome" data-id="${outcome.id}">
            <div class="item-header">
                <span class="item-name">${escapeHtml(outcome.name)}</span>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small" onclick="editOutcome('${outcome.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteOutcome('${outcome.id}')">Delete</button>
                </div>
            </div>
            ${outcome.value ? `<div class="item-meta"><span>Value: ${escapeHtml(outcome.value)}</span></div>` : ''}
            ${outcome.description ? `<div class="item-description">${escapeHtml(outcome.description)}</div>` : ''}
        </div>
    `).join('');
}

// Render outputs list
function renderOutputs() {
    const container = document.getElementById('outputsList');
    
    if (state.outputs.length === 0) {
        container.innerHTML = '<div class="empty-state">No outputs yet. Add your first output above.</div>';
        return;
    }
    
    container.innerHTML = state.outputs.map(output => {
        const linkedOutcome = state.outcomes.find(o => o.id === output.outcomeId);
        return `
            <div class="item-card output" data-id="${output.id}">
                <div class="item-header">
                    <span class="item-name">${escapeHtml(output.name)}</span>
                    <div class="item-actions">
                        <button class="btn btn-secondary btn-small" onclick="editOutput('${output.id}')">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="deleteOutput('${output.id}')">Delete</button>
                    </div>
                </div>
                <div class="item-meta">
                    ${output.cost ? `<span>Cost: ${escapeHtml(output.cost)}</span>` : ''}
                    ${linkedOutcome ? `<span class="linked-outcome">→ ${escapeHtml(linkedOutcome.name)}</span>` : ''}
                </div>
                ${output.description ? `<div class="item-description">${escapeHtml(output.description)}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Update outcome dropdown in output form
function updateOutcomeDropdown() {
    const select = document.getElementById('outputOutcome');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Link to outcome (optional)</option>' +
        state.outcomes.map(outcome => 
            `<option value="${outcome.id}">${escapeHtml(outcome.name)}</option>`
        ).join('');
    
    // Restore selection if still valid
    if (state.outcomes.find(o => o.id === currentValue)) {
        select.value = currentValue;
    }
}

// Render visualization
function renderVisualization() {
    const container = document.getElementById('visualization');
    
    if (state.outcomes.length === 0 && state.outputs.length === 0) {
        container.innerHTML = '<div class="empty-state">Add outcomes and outputs to see the mapping visualization.</div>';
        return;
    }
    
    let html = '';
    
    // Group outputs by outcome
    state.outcomes.forEach(outcome => {
        const linkedOutputs = state.outputs.filter(o => o.outcomeId === outcome.id);
        
        html += `
            <div class="outcome-group">
                <div class="outcome-group-header">
                    <span class="outcome-group-name">${escapeHtml(outcome.name)}</span>
                    ${outcome.value ? `<span class="outcome-group-value">${escapeHtml(outcome.value)}</span>` : ''}
                </div>
                ${linkedOutputs.length > 0 ? `
                    <div class="linked-outputs">
                        ${linkedOutputs.map(output => `
                            <div class="linked-output-card">
                                <div class="linked-output-name">${escapeHtml(output.name)}</div>
                                ${output.cost ? `<div class="linked-output-cost">Cost: ${escapeHtml(output.cost)}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-state">No outputs linked to this outcome yet.</div>'}
            </div>
        `;
    });
    
    // Show unlinked outputs
    const unlinkedOutputs = state.outputs.filter(o => !o.outcomeId);
    if (unlinkedOutputs.length > 0) {
        html += `
            <div class="unlinked-outputs">
                <h3>Outputs not linked to any outcome</h3>
                <div class="linked-outputs">
                    ${unlinkedOutputs.map(output => `
                        <div class="linked-output-card">
                            <div class="linked-output-name">${escapeHtml(output.name)}</div>
                            ${output.cost ? `<div class="linked-output-cost">Cost: ${escapeHtml(output.cost)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Render all
function render() {
    renderOutcomes();
    renderOutputs();
    updateOutcomeDropdown();
    renderVisualization();
}

// Add outcome
function addOutcome(name, value, description) {
    const outcome = {
        id: generateId(),
        name: name.trim(),
        value: value.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString()
    };
    state.outcomes.push(outcome);
    saveData();
    render();
}

// Add output
function addOutput(name, cost, description, outcomeId) {
    const output = {
        id: generateId(),
        name: name.trim(),
        cost: cost.trim(),
        description: description.trim(),
        outcomeId: outcomeId || null,
        createdAt: new Date().toISOString()
    };
    state.outputs.push(output);
    saveData();
    render();
}

// Delete outcome
function deleteOutcome(id) {
    if (!confirm('Delete this outcome? Linked outputs will be unlinked.')) return;
    
    // Unlink outputs
    state.outputs.forEach(output => {
        if (output.outcomeId === id) {
            output.outcomeId = null;
        }
    });
    
    state.outcomes = state.outcomes.filter(o => o.id !== id);
    saveData();
    render();
}

// Delete output
function deleteOutput(id) {
    if (!confirm('Delete this output?')) return;
    state.outputs = state.outputs.filter(o => o.id !== id);
    saveData();
    render();
}

// Edit outcome
function editOutcome(id) {
    const outcome = state.outcomes.find(o => o.id === id);
    if (!outcome) return;
    
    showEditModal('outcome', outcome, (data) => {
        outcome.name = data.name.trim();
        outcome.value = data.value.trim();
        outcome.description = data.description.trim();
        saveData();
        render();
    });
}

// Edit output
function editOutput(id) {
    const output = state.outputs.find(o => o.id === id);
    if (!output) return;
    
    showEditModal('output', output, (data) => {
        output.name = data.name.trim();
        output.cost = data.cost.trim();
        output.description = data.description.trim();
        output.outcomeId = data.outcomeId || null;
        saveData();
        render();
    });
}

// Show edit modal
function showEditModal(type, item, onSave) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const isOutcome = type === 'outcome';
    
    overlay.innerHTML = `
        <div class="modal">
            <h3>Edit ${isOutcome ? 'Outcome' : 'Output'}</h3>
            <form class="add-form" id="editForm">
                <input type="text" id="editName" value="${escapeHtml(item.name)}" placeholder="${isOutcome ? 'Outcome' : 'Output'} name" required>
                <input type="text" id="editMeta" value="${escapeHtml(isOutcome ? item.value : item.cost)}" placeholder="${isOutcome ? 'Value description' : 'Cost description'}">
                <textarea id="editDescription" placeholder="Description">${escapeHtml(item.description)}</textarea>
                ${!isOutcome ? `
                    <select id="editOutcome">
                        <option value="">Link to outcome (optional)</option>
                        ${state.outcomes.map(o => 
                            `<option value="${o.id}" ${item.outcomeId === o.id ? 'selected' : ''}>${escapeHtml(o.name)}</option>`
                        ).join('')}
                    </select>
                ` : ''}
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" id="cancelEdit">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('#cancelEdit').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    
    overlay.querySelector('#editForm').onsubmit = (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('editName').value,
            description: document.getElementById('editDescription').value
        };
        if (isOutcome) {
            data.value = document.getElementById('editMeta').value;
        } else {
            data.cost = document.getElementById('editMeta').value;
            data.outcomeId = document.getElementById('editOutcome').value;
        }
        onSave(data);
        overlay.remove();
    };
}

// Export data as JSON
function exportData() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `outcome-visualizer-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import data from JSON
function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (!imported.outcomes || !imported.outputs) {
                throw new Error('Invalid file format');
            }
            
            if (!confirm('This will replace all current data. Continue?')) return;
            
            state = imported;
            saveData();
            render();
            alert('Data imported successfully!');
        } catch (err) {
            alert('Error importing file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Clear all data
function clearAllData() {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) return;
    
    state = { outcomes: [], outputs: [] };
    saveData();
    render();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    render();
    
    // Outcome form
    document.getElementById('outcomeForm').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('outcomeName').value;
        const value = document.getElementById('outcomeValue').value;
        const description = document.getElementById('outcomeDescription').value;
        
        addOutcome(name, value, description);
        e.target.reset();
    };
    
    // Output form
    document.getElementById('outputForm').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('outputName').value;
        const cost = document.getElementById('outputCost').value;
        const description = document.getElementById('outputDescription').value;
        const outcomeId = document.getElementById('outputOutcome').value;
        
        addOutput(name, cost, description, outcomeId);
        e.target.reset();
    };
    
    // Export button
    document.getElementById('exportBtn').onclick = exportData;
    
    // Import file
    document.getElementById('importFile').onchange = (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    };
    
    // Clear button
    document.getElementById('clearBtn').onclick = clearAllData;
});
