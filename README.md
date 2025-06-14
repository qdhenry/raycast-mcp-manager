# MCP Manager Raycast Extension

A Raycast extension that allows you to quickly add Model Context Protocol (MCP) configurations to your Claude Code setup by simply pasting commands.

## Features

- **Quick Add**: Paste any MCP command from a website and instantly add it to your configuration
- **Duplicate Detection**: Automatically checks if an MCP already exists before adding
- **Command Parsing**: Intelligently parses both `npx` and `env` type MCP commands
- **Last Command Memory**: Quickly reload the last command you used
- **One-Click Loading**: Option to immediately run `mcp-manager add-all` after adding

## Prerequisites

1. **MCP Manager Script**: You must have the MCP Manager installed:
   ```bash
   curl -O https://raw.githubusercontent.com/qdhenry/Claude-Code-MCP-Manager/main/mcp-manager.sh
   chmod +x mcp-manager.sh
   mv mcp-manager.sh ~/.local/bin/mcp-manager
   ```

2. **jq**: Required by MCP Manager for JSON processing
   ```bash
   brew install jq  # macOS
   ```

## Installation

### From Raycast Store (Coming Soon)
Search for "MCP Manager" in the Raycast Store

### Manual Installation

1. Clone this extension:
   ```bash
   git clone https://github.com/qdhenry/raycast-mcp-manager.git
   cd raycast-mcp-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and import to Raycast:
   ```bash
   npm run build
   npx @raycast/api@latest import
   ```

## Usage

1. **Copy an MCP command** from any website or documentation
   
2. **Open Raycast** (⌘+Space by default)

3. **Type "Add MCP"** and select the command

4. **Paste the command** in the text area

5. **Press Enter** to add it to your configuration

6. **Optional**: Click "Run add-all" in the success toast to immediately load all MCPs in Claude Code

## Supported Command Formats

The extension supports all standard MCP command formats:

### NPX Commands
```
claude mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer
claude mcp add github -- npx -y @github/mcp-server@latest --token YOUR_TOKEN
```

### Environment Variable Commands
```
claude mcp add digitalocean -- env DIGITALOCEAN_API_TOKEN=your-token npx -y @digitalocean/mcp
claude mcp add upstash -- env UPSTASH_URL=your-url UPSTASH_TOKEN=your-token npx -y @upstash/mcp
```

## Keyboard Shortcuts

- **⌘+L**: Load last used command
- **⌘+Enter**: Submit and add MCP

## Configuration

The extension uses the same configuration file as MCP Manager:
- Config location: `~/.config/claude/mcp_config.json`
- MCP Manager location: `~/.local/bin/mcp-manager`

To use different paths, modify the constants in `src/add-mcp.tsx`.

## Troubleshooting

### "MCP Manager not found"
Make sure MCP Manager is installed at `~/.local/bin/mcp-manager` or update the path in the extension.

### "Failed to parse MCP command"
Ensure the command follows the standard format:
```
claude mcp add <name> -- <type> <options>
```

### "MCP already exists"
The MCP with that name is already in your configuration. Use a different name or remove the existing one first.

## Development

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Related

- [MCP Manager](https://github.com/qdhenry/Claude-Code-MCP-Manager) - The main MCP management tool
- [Claude Code](https://claude.ai) - Anthropic's AI coding assistant
- [Raycast](https://raycast.com) - Productivity tool for macOS