#!/usr/bin/env bash
set -euo pipefail

# Cache these pinned assets in Actions; keep large runtime binaries out of Git.
mkdir -p .cache/fonts
if [ ! -s .cache/plantuml.jar ]; then
  curl -L --fail --retry 3 -o .cache/plantuml.jar \
    https://repo.maven.apache.org/maven2/net/sourceforge/plantuml/plantuml/1.2024.8/plantuml-1.2024.8.jar
fi
if [ ! -s .cache/fonts/NotoSansCJKsc-Regular.otf ]; then
  curl -L --fail --retry 3 -o .cache/fonts/NotoSansCJKsc-Regular.otf \
    https://raw.githubusercontent.com/notofonts/noto-cjk/165c01b46ea533872e002e0785ff17e44f6d97d8/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf
fi
# Verify both downloads and cache hits against the pinned contents.
printf '%s  %s\n' \
  2e1f42a9879cd25236b5725ca7db25cb9996e8e37a0a1440b2eb559f259c54aa .cache/plantuml.jar \
  2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b .cache/fonts/NotoSansCJKsc-Regular.otf \
  | sha256sum --check

# Ubuntu runners already provide Java. Install system packages only if missing.
packages=()
command -v java >/dev/null || packages+=(default-jre-headless)
command -v dot >/dev/null || packages+=(graphviz)
command -v fc-cache >/dev/null || packages+=(fontconfig)
if [ "${#packages[@]}" -gt 0 ]; then
  sudo apt-get update
  sudo apt-get install -y "${packages[@]}"
fi
# Register the one cached Simplified Chinese font instead of installing the
# entire fonts-noto-cjk distribution on every build.
font_dir="${XDG_DATA_HOME:-$HOME/.local/share}/fonts/system-design-notes"
mkdir -p "$font_dir"
cp .cache/fonts/NotoSansCJKsc-Regular.otf "$font_dir/"
fc-cache -f "$font_dir"
java -version
dot -V
fc-match 'Noto Sans CJK SC'
