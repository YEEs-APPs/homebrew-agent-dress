# Homebrew tap

Agent Dress and Salus Cabinet desktop installers for Apple Silicon Macs.

## Agent Dress

```sh
brew tap YEEs-APPs/agent-dress
brew install --cask YEEs-APPs/agent-dress/agent-dress
```

Open Agent Dress after installation to provision or update its runtime.
The initial Cask is version 0.286.3. Do not replace a newer manually installed app with this older version.
Homebrew does not replace Apple signing or notarization. These developer packages are not notarized; macOS may require explicit approval.

## Salus Cabinet

Pending public package publication. No installable Salus Cabinet Cask is available yet.
Agent Dress and Salus Cabinet are alternative editions of one local engine; choose one per Mac.

## Updates and removal

```sh
brew upgrade --cask YEEs-APPs/agent-dress/agent-dress
```

Cask removal removes the desktop app only. Runtime settings, data, MCP registrations and hooks remain. To remove the runtime too, run the following as the installing user before removing the Cask:

```sh
~/.dress/bin/agent-dress uninstall --product agent-dress
brew uninstall --cask YEEs-APPs/agent-dress/agent-dress
```

The runtime remover preserves data and skills. No automatic data deletion or quarantine bypass is configured.
