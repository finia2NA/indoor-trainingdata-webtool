# Webtool Specifications

This directory contains technical documentation and flow diagrams for the webtool application.

## Available Diagrams

### Pose Generation and Screenshot Workflow

- **[Pose Generation Flow](./pose-generation-flow.md)** - Complete sequence diagram showing the flow from clicking "Generate Poses" through pose storage, including mesh poses, posttraining poses, wall avoidance validation, and scene management.

- **[Screenshot Generation Flow](./screenshot-generation-flow.md)** - Complete sequence diagram showing the flow from clicking "Take Screenshots" through ZIP file download, including mesh screenshots (shaded/unshaded variants) and 360° screenshots.

### Other Specifications

- **[360° View](./360view.md)** - Documentation for 360° view functionality

## Usage

Each diagram is written in Mermaid format and can be viewed:
- In VS Code with the Mermaid Preview extension
- Online at https://mermaid.live/
- In GitHub/GitLab markdown viewers
- Using the Mermaid CLI for PNG/SVG export

The diagrams show detailed interactions between components, database operations, scene management, progress tracking, and file system operations.