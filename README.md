# Prompt Chain

A node-based text generation environment for experimenting with chaining language model prompts together. This Electron application allows you to create complex flows of text generation, feedback, and refinement.

## Features

- Visual node-based interface for creating text generation workflows
- Supports multiple language models
- Chain outputs from one model to another
- Create feedback loops and refinement processes
- Drag-and-drop interface for easy workflow creation
- Parameter controls for each model (temperature, max tokens, etc.)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Building

To build the application for production:

```bash
npm run build
npm start
```

## Usage

### Node Types

- **Input Nodes**: Starting points that provide initial prompts
- **Model Nodes**: AI text generation nodes that call language models
- **Output Nodes**: Final results of your workflow
- **Custom Nodes**: Special processing nodes for custom logic

### Workflow

1. Drag nodes from the sidebar onto the canvas
2. Connect nodes by dragging from one handle to another
3. Configure each node with appropriate settings
4. Click "Run Flow" to execute the entire workflow
5. View results in each node

### Example Workflow

A basic workflow might consist of:
1. An input node with your initial prompt
2. A model node (like GPT-4) that generates a response
3. A feedback model that analyzes the response
4. A refinement model that improves the response based on feedback
5. An output node that shows the final result

## Technology Stack

- Electron
- React
- ReactFlow
- Material UI
- Tailwind CSS
- Node.js

## API Integration

The application includes a flexible API service that can be connected to various language model providers:

- OpenAI (GPT-3.5, GPT-4)
- Anthropic (Claude)
- Local models (via Ollama)
- Custom endpoints

To use your own API keys, you'll need to securely configure them in the application (more details in the settings section).

## Development

### Project Structure

```
prompt-chain/
├── src/
│   ├── components/     # React components
│   │   ├── nodes/      # Custom node components
│   │   ├── App.jsx
│   │   ├── FlowEditor.jsx
│   │   └── Sidebar.jsx
│   ├── utils/          # Utility functions
│   │   └── apiService.js
│   ├── styles/         # CSS styles
│   │   └── index.css
│   ├── main.js         # Electron main process
│   ├── preload.js      # Electron preload script
│   └── renderer.js     # React entry point
├── index.html
├── package.json
└── ...config files
```

### Adding New Features

#### New Node Types

To add a new node type:

1. Create a new component in `src/components/nodes/`
2. Register it in the `nodeTypes` object in `FlowEditor.jsx`
3. Add processing logic in `apiService.js`

## License

ISC 