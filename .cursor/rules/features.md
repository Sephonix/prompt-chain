# Prompt-Chain Feature Ideas

This document outlines potential features to enhance the Prompt Chain application.

## Graph Management & Workflow

- [ ] **Save/Load Workflows:** Ability to save the current node graph and edge configuration to a file (e.g., JSON) and load it back.
- [ ] **Export/Import Graphs:** Allow exporting graph structure for sharing or backup.
- [ ] **Node Duplication:** Right-click or keyboard shortcut to duplicate selected node(s).
- [ ] **Node Grouping/Subflows:** Ability to group multiple nodes into a single collapsed unit or sub-graph for better organization.
- [ ] **Undo/Redo:** Implement undo/redo functionality for graph modifications (node add/delete/move, edge connect/disconnect, data changes).
- [ ] **Workflow Versioning:** Basic version tracking for saved graph files.
- [ ] **Graph Templates:** Allow saving parts of a graph as reusable templates.

## Node Functionality & Types

### New Node Types
- [ ] **Data Transformation Node:** For manipulating data passing between nodes (e.g., Regex, JSON parsing/stringifying, string formatting, basic math).
- [ ] **Conditional Logic Node:** Route execution flow based on input conditions (e.g., If/Else, Switch).
- [ ] **Web Request Node:** Fetch data from external URLs/APIs.
- [ ] **Code Execution Node:** Execute small, sandboxed scripts (e.g., Python, JavaScript) for custom logic (Requires security considerations).
- [ ] **Variable Node:** Define and manage global or flow-specific variables accessible by other nodes.
- [ ] **Annotation Node:** Add text notes or comments directly onto the graph canvas.

### Enhanced Node Features
- [ ] **Multiple Named Handles:** Allow nodes to have multiple distinct input and output connection points (handles) with labels.
- [ ] **Custom Node Templates:** UI for users to define their own node types with predefined data structures, UI elements, and appearance.
- [ ] **Advanced Model Config:** Expose more API parameters for Model Nodes (e.g., top_p, frequency_penalty, presence_penalty, stop sequences).
- [ ] **Node Status Indicators:** Visual cues on nodes for states like 'running', 'completed', 'error', 'cached result'.

## Execution & Data Handling

- [ ] **Parallel Execution:** Support for executing independent branches of the graph concurrently.
- [ ] **Execution Progress Visualization:** Highlight the currently executing node and/or edge.
- [ ] **Enhanced Error Reporting:** Clearly indicate which node failed and provide detailed error messages in the UI.
- [ ] **Result Caching:** Option to cache node results to avoid re-running API calls when inputs haven't changed.
- [ ] **Variable Injection:** System for referencing outputs of other nodes or global variables within node prompts/settings (e.g., `{{node_id.output}}`, `{{variable_name}}`).
- [ ] **Data Type Handling:** Support passing and interpreting structured data like JSON between nodes.
- [ ] **Batch Processing:** Ability to run the entire graph multiple times with varying inputs from a dataset (e.g., CSV file).

## User Interface & Experience

- [ ] **Minimap:** A small overview panel for easy navigation of large graphs.
- [ ] **Auto-Layout:** Option to automatically arrange nodes in a structured layout.
- [ ] **Improved Zoom/Pan:** Smoother and more intuitive controls for navigating the canvas.
- [ ] **Keyboard Shortcuts:** Define shortcuts for frequent actions (add nodes, run/stop flow, save/load, undo/redo, delete).
- [ ] **Graph Search:** Find nodes within the graph by label or content.
- [ ] **Resizable Panels:** Allow resizing the sidebar and potentially other UI panels.
- [ ] **Node Appearance Customization:** Allow users to set custom colors or icons for individual nodes.
- [ ] **Expandable Node Results:** Option to view more of a node's result text directly within the node.
- [ ] **Edge Labeling:** Ability to add labels to edges to clarify data flow.
- [ ] **Help System:** In-app tutorials, documentation links, or tooltips.

## Settings & Configuration

- [ ] **Secure API Key Management:** Encrypted storage for API keys, support for multiple keys/profiles per provider.
- [ ] **Granular Defaults:** Set default configurations (model, temperature, etc.) for newly added nodes of specific types.
- [ ] **Proxy Support:** Configure HTTP/HTTPS proxy settings for API requests.
- [ ] **UI Theme Options:** Additional theme choices or customization beyond light/dark.
- [ ] **Data Storage Configuration:** Allow users to specify where graphs and results are saved.
- [ ] **Application Update Notifications:** Check for and notify users about new application versions.
- [ ] **Import/Export Settings:** Backup and restore application configuration.
