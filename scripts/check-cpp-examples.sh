#!/usr/bin/env bash
set -euo pipefail
build_dir=$(mktemp -d)
trap 'rm -rf "$build_dir"' EXIT
"${CXX:-g++}" -std=c++20 -Wall -Wextra -Werror -pedantic -pthread \
  'content/33. Cpp System Architecture/examples/bounded_thread_pool.cpp' \
  -o "$build_dir/bounded-thread-pool"
timeout 20s "$build_dir/bounded-thread-pool"
