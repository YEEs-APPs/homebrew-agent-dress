# Generated from published desktop-release metadata; do not edit by hand.
cask "agent-dress" do
  version "0.286.3"
  sha256 "15dfba40f43b66b24a07f374d7eac515495901899b4abb031e64c05b447e744c"

  url "https://objectstorage.ap-seoul-1.oraclecloud.com/n/cn8fx3trhyfq/b/agent-dress-releases/o/macos/0.286.3/agent-dress-desktop-0.286.3-darwin-arm64.pkg"
  name "Agent Dress"
  desc "AI agent persona and local runtime"
  homepage "https://dress.yees.kr"

  depends_on arch: :arm64
  conflicts_with cask: "salus-cabinet"

  pkg "agent-dress-desktop-0.286.3-darwin-arm64.pkg"

  # Homebrew also runs uninstall during upgrades. Runtime cleanup is deliberately
  # explicit so upgrades preserve settings, data, MCP registrations and hooks.
  uninstall quit:    "kr.yee.dress.desktop",
            pkgutil: "kr.yee.dress.desktop"

  caveats <<~EOS
    Open Agent Dress after installation to provision or update the runtime.
    This developer package is not Apple notarized; macOS may require explicit approval.
    Cask removal removes the desktop app only. To remove the runtime as well,
    first run ~/.dress/bin/agent-dress uninstall --product agent-dress
    as the installing user. Runtime uninstall preserves data and skills.
    Existing .pkg installations can be replaced; back up settings and data first.
  EOS
end
