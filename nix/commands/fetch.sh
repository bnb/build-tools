#!/usr/bin/env bash

set -e

basedir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
source "$basedir/__tools.sh"
ensure_depot_tools
ensure_node_modules

# Get the target directory (default: $PWD/electron)
target_dir="${1-"$PWD/electron"}"
if [[ "$target_dir" != /* ]]; then
  target_dir="$PWD/$target_dir"
fi

if [[ -d "$target_dir" ]]; then
  echo -e "${COLOR_ERR}'${COLOR_DIR}$target_dir${COLOR_ERR}' already exists. Please select a new directory.${COLOR_OFF}"
  exit 1
fi

echo
echo
echo -e "Creating '${COLOR_DIR}$target_dir${COLOR_OFF}' for Electron checkout"
mkdir -p "$target_dir"
cd "$target_dir"

echo
echo
echo -e "Running '${COLOR_CMD}gclient config${COLOR_OFF}' in '${COLOR_DIR}$target_dir${COLOR_OFF}'"
PATH="$DEPOT_TOOLS_PATH:$PATH" gclient config --name 'src/electron' --unmanaged 'https://github.com/electron/electron'

new_config=$(node "$basedir/../../common/new-config-for-fetch.js" "$target_dir")

echo
echo
echo -e "Running '${COLOR_CMD}evm $new_config${COLOR_OFF}'"
evm "$new_config"

source "$basedir/__load-env.sh"

echo
echo
echo -e "Running '${COLOR_CMD}e sync -vv${COLOR_OFF}'"
e sync -vv

echo
echo
echo -e "Running '${COLOR_CMD}e bootstrap${COLOR_OFF}'"
e bootstrap

echo
echo
echo -e "You should be all set! Try running '${COLOR_CMD}e build${COLOR_OFF}' to build Electron now."