{
  description = "TODO List Service - Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };


      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            git
            # Node.js & Package Managers
            nodejs_24
            pnpm
          ];

          shellHook = ''
            echo ""
            echo " ======= TODO List Service - Dev Environment ======="
            echo "  System: ${pkgs.stdenv.hostPlatform.system}"
            echo "  Node: $(node --version)"
            echo " ===================================================="
            echo ""

          '';
        };
      }
    );
}
