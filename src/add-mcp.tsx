import { Form, ActionPanel, Action, showToast, Toast, popToRoot, LocalStorage } from "@raycast/api";
import { useState, useEffect } from "react";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

interface MCP {
  name: string;
  type: "npx" | "env";
  path: string;
  options: string;
}

interface MCPConfig {
  mcps: MCP[];
}

const CONFIG_FILE = path.join(os.homedir(), ".config", "claude", "mcp_config.json");
const MCP_MANAGER_PATH = path.join(os.homedir(), ".local", "bin", "mcp-manager");

export default function Command() {
  const [mcpCommand, setMcpCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if mcp-manager exists on mount
  useEffect(() => {
    checkMcpManager();
  }, []);

  async function checkMcpManager() {
    try {
      await fs.access(MCP_MANAGER_PATH);
    } catch {
      showToast({
        style: Toast.Style.Failure,
        title: "MCP Manager not found",
        message: `Please install mcp-manager at ${MCP_MANAGER_PATH}`,
      });
    }
  }

  async function parseMcpCommand(command: string): Promise<MCP | null> {
    // Remove 'claude mcp add' prefix if present
    let cmd = command.trim().replace(/^claude mcp add\s+/, "");

    // Extract name (first part before --)
    const parts = cmd.split(/\s+--\s+/);
    if (parts.length < 2) {
      throw new Error("Invalid MCP command format");
    }

    const name = parts[0].replace(/"/g, "").trim();
    const rest = parts[1];

    let type: "npx" | "env";
    let path = "";
    let options = "";

    if (rest.startsWith("npx")) {
      type = "npx";
      const npxParts = rest.replace(/^npx\s+/, "");
      
      // Handle -y flag
      const cleanedParts = npxParts.replace(/^-y\s+/, "");
      
      // Extract path and options
      const match = cleanedParts.match(/^@?([^\s]+)(\s+(.*))?$/);
      if (match) {
        path = match[1];
        options = match[3] || "";
      }
    } else if (rest.startsWith("env")) {
      type = "env";
      const envParts = rest.replace(/^env\s+/, "");
      
      // Extract environment variable and options
      const match = envParts.match(/^([^=]+=\S+)(\s+(.*))?$/);
      if (match) {
        path = match[1];
        options = match[3] || "";
      }
    } else {
      throw new Error("Unknown MCP type (must be npx or env)");
    }

    return {
      name,
      type,
      path: path.trim(),
      options: options.trim(),
    };
  }

  async function loadConfig(): Promise<MCPConfig> {
    try {
      const configData = await fs.readFile(CONFIG_FILE, "utf-8");
      return JSON.parse(configData);
    } catch {
      // Create config directory if it doesn't exist
      const configDir = path.dirname(CONFIG_FILE);
      await fs.mkdir(configDir, { recursive: true });
      
      // Return empty config
      return { mcps: [] };
    }
  }

  async function saveConfig(config: MCPConfig): Promise<void> {
    const configDir = path.dirname(CONFIG_FILE);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  async function mcpExists(name: string): Promise<boolean> {
    const config = await loadConfig();
    return config.mcps.some(mcp => mcp.name === name);
  }

  async function handleSubmit() {
    if (!mcpCommand.trim()) {
      showToast({
        style: Toast.Style.Failure,
        title: "No command provided",
        message: "Please paste an MCP command",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Parse the command
      const parsedMcp = await parseMcpCommand(mcpCommand);
      if (!parsedMcp) {
        throw new Error("Failed to parse MCP command");
      }

      // Check if MCP already exists
      if (await mcpExists(parsedMcp.name)) {
        showToast({
          style: Toast.Style.Failure,
          title: "MCP already exists",
          message: `'${parsedMcp.name}' is already in your configuration`,
        });
        setIsLoading(false);
        return;
      }

      // Add MCP to config
      const config = await loadConfig();
      config.mcps.push(parsedMcp);
      await saveConfig(config);

      showToast({
        style: Toast.Style.Success,
        title: "MCP added successfully",
        message: `'${parsedMcp.name}' has been added to your configuration`,
      });

      // Store the last successful command for quick re-use
      await LocalStorage.setItem("lastMcpCommand", mcpCommand);

      // Clear the form
      setMcpCommand("");
      
      // Ask if user wants to run add-all
      showToast({
        style: Toast.Style.Success,
        title: "MCP added to config",
        message: "Run 'mcp-manager add-all' to load it in Claude Code",
        primaryAction: {
          title: "Run add-all",
          onAction: async () => {
            try {
              await execAsync(`${MCP_MANAGER_PATH} add-all`);
              showToast({
                style: Toast.Style.Success,
                title: "MCPs loaded",
                message: "All MCPs have been loaded to Claude Code",
              });
            } catch (error) {
              showToast({
                style: Toast.Style.Failure,
                title: "Failed to run add-all",
                message: error instanceof Error ? error.message : "Unknown error",
              });
            }
          },
        },
      });

    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to add MCP",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLastCommand() {
    try {
      const lastCommand = await LocalStorage.getItem<string>("lastMcpCommand");
      if (lastCommand) {
        setMcpCommand(lastCommand);
      }
    } catch {
      // Ignore errors loading last command
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add MCP" onSubmit={handleSubmit} />
          <Action
            title="Load Last Command"
            onAction={loadLastCommand}
            shortcut={{ modifiers: ["cmd"], key: "l" }}
          />
          <Action.OpenInBrowser
            title="View MCP Manager on GitHub"
            url="https://github.com/qdhenry/Claude-Code-MCP-Manager"
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="mcpCommand"
        title="MCP Command"
        placeholder="Paste MCP command here (e.g., claude mcp add supabase -- npx -y @supabase/mcp-server-supabase@latest)"
        value={mcpCommand}
        onChange={setMcpCommand}
        info="Paste a complete MCP command from any website. The extension will parse it and add it to your MCP configuration if it doesn't already exist."
      />
      
      <Form.Description text="Examples:" />
      <Form.Description text="• claude mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer" />
      <Form.Description text="• claude mcp add github -- npx -y @github/mcp-server@latest" />
      <Form.Description text="• claude mcp add digitalocean -- env DIGITALOCEAN_API_TOKEN=your-token npx -y @digitalocean/mcp" />
    </Form>
  );
}