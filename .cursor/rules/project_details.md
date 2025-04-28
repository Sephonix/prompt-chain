# Prompt-Chain Project Details
**Name:** Prompt Chain
**Overview:** Node-Based Text Generation Environment. Take result of one model, feed it into another model to asses against its own design to find potential improvements, build on top of it, test it, etc.
**Goal:** Create an Electron application that implements a node-based iterative feedback mechanism to text generation.
### **Technologies:**
- Core Framework: Electron
- JS Runtime: Node.js
- Frontend: React
- Node/Graph UI: Either React Flow, Drawflow, or LiteGraph.js
- HTTP Requests: Axios
- Styling: Tailwind CSS, Material UI
### **Features:**
- Chaining API Outputs - managing the graph's state, determining execution order, making API calls, and passing data between nodes.
- Represent the graph structure as data using a list of nodes, each with an ID, type, position, and specific data/settings for the chosen model, prompt template, parameters, etc. A list of edges (connections between nodes, specifying the source node/handle and target node/handle).
- Execution Logic:
	1. Get the graph when the user triggers execution via a "Run" button.
	2. Determine the correct execution order as a Directed Acyclic Graph
	3. Process the nodes sequentially by iterating through the nodes
		- Prep the API request based on the node's type, settings, inputs
		- Make the API call using Axios or the built-in fetch API to call the relevant text generatino API (OpenAI, Cohere, local Ollama instance, etc.) Making sure to securely handle API keys.
		- Store the result of the generated text and relevant data associated with the node's ID (and potentially specific output handles if a node has multiple outputs).
		- Update the UI to display the generated text in each node.
	4. Implement a robust error handling system for API call failures, network issues, invalid graph states, etc.