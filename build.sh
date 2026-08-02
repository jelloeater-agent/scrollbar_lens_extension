#!/bin/bash
set -euo pipefail

# Build script for Scrollbar Lens extension
# Produces an .xpi file ready for installation in Firefox/Waterfox

SRC_DIR="$(cd "$(dirname "$0")/src" && pwd)"
OUT_DIR="${1:-dist}"

mkdir -p "$OUT_DIR"

if command -v web-ext &>/dev/null; then
    web-ext build --source-dir "$SRC_DIR" --artifacts-dir "$OUT_DIR" --overwrite-dest --filename scrollbar_lens.xpi
    echo ""
    echo "✅ Built: $OUT_DIR/scrollbar_lens.xpi"
    echo "   Drag this file into Firefox/Waterfox to install."
elif command -v zip &>/dev/null; then
    # Fallback: create ZIP manually
    cd "$SRC_DIR"
    zip -r "../$OUT_DIR/scrollbar_lens.xpi" . -x '*.git*'
    echo ""
    echo "✅ Built (zip fallback): $OUT_DIR/scrollbar_lens.xpi"
else
    # Python fallback
    python3 -c "
import zipfile, os, sys
src = sys.argv[1]
out = sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src):
        for fn in files:
            path = os.path.join(root, fn)
            arcname = os.path.relpath(path, src)
            zf.write(path, arcname)
print('Built:', out)
" "$SRC_DIR" "$OUT_DIR/scrollbar_lens.xpi"
    echo ""
    echo "✅ Built (python fallback): $OUT_DIR/scrollbar_lens.xpi"
fi