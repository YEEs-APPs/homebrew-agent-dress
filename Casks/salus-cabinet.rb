# Generated from published desktop-release metadata; do not edit by hand.
cask "salus-cabinet" do
  version "0.304.0"
  sha256 "eb16a63cb4d7cf9a79749d12e89856fb36c9dadb4eb99f7bc01e8bae446bd2e1"

  url "https://objectstorage.ap-seoul-1.oraclecloud.com/n/cn8fx3trhyfq/b/agent-dress-releases/o/macos/salus-cabinet/0.304.0/salus-cabinet-desktop-0.304.0-darwin-arm64.pkg"
  name "Salus Cabinet"
  desc "SALUSCARE AI agent desktop runtime"
  homepage "https://cabinet.saluscare.io"

  depends_on arch: :arm64
  conflicts_with cask: "agent-dress"

  pkg "salus-cabinet-desktop-0.304.0-darwin-arm64.pkg"

  # Homebrew also runs uninstall during upgrades. Runtime cleanup is deliberately
  # explicit so upgrades preserve settings, data, MCP registrations and hooks.
  uninstall quit:    "io.saluscare.cabinet.desktop",
            pkgutil: "io.saluscare.cabinet.desktop"

  caveats <<~EOS
    Open Salus Cabinet after installation to provision or update the runtime.
    This developer package is not Apple notarized; macOS may require explicit approval.
    Cask removal removes the desktop app only. To remove the runtime as well,
    first run ~/.cabinet/bin/cabinet uninstall --product salus-cabinet
    as the installing user. Runtime uninstall preserves data and skills.
    Existing .pkg installations can be replaced; back up settings and data first.
  EOS
end
