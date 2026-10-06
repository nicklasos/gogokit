#!/usr/bin/env bash
#
# Copies the three source projects into this repository:
#
#   gogo        -> backend/
#   gogo-front  -> frontend/
#   backupit    -> backup/
#
# Those folders are generated. Change the code in its own repository, commit there,
# then run this script again. Only committed, tracked files are copied, so local
# secrets (.env files, service account keys) never reach the kit.
#
# Usage:
#   scripts/sync.sh                 copy from the sibling checkouts (../gogo, ../gogo-front, ../backupit)
#   scripts/sync.sh --from-github   copy from fresh clones of the GitHub repositories
#   scripts/sync.sh --working-tree  copy the files as they are on disk, uncommitted changes included
#                                   (ignored files are still left out)
#   scripts/sync.sh --force         overwrite even if backend/, frontend/ or backup/ have uncommitted changes
#
# The sibling paths can be overridden: GOGO_DIR, GOGO_FRONT_DIR, BACKUPIT_DIR.

set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT_DIR="$(dirname "$KIT_DIR")"

GOGO_DIR="${GOGO_DIR:-$PARENT_DIR/gogo}"
GOGO_FRONT_DIR="${GOGO_FRONT_DIR:-$PARENT_DIR/gogo-front}"
BACKUPIT_DIR="${BACKUPIT_DIR:-$PARENT_DIR/backupit}"

GOGO_URL="git@github.com:nicklasos/gogo.git"
GOGO_FRONT_URL="git@github.com:nicklasos/gogo-front.git"
BACKUPIT_URL="git@github.com:nicklasos/backupit.git"

FROM_GITHUB=0
WORKING_TREE=0
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --from-github) FROM_GITHUB=1 ;;
    --working-tree) WORKING_TREE=1 ;;
    --force) FORCE=1 ;;
    -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

info() { printf '%s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }

cd "$KIT_DIR"

# Work done directly in a generated folder would be silently destroyed by the copy.
if [ "$FORCE" -eq 0 ] && [ -n "$(git status --porcelain -- backend frontend backup 2>/dev/null)" ]; then
  fail "backend/, frontend/ or backup/ have uncommitted changes. They are generated: make the change in the
       source repository instead. Commit or discard them here, or pass --force to overwrite."
fi

CLONE_DIR=""
cleanup() { [ -n "$CLONE_DIR" ] && rm -rf "$CLONE_DIR"; return 0; }
trap cleanup EXIT

[ "$FROM_GITHUB" -eq 1 ] && [ "$WORKING_TREE" -eq 1 ] && fail "--from-github and --working-tree cannot be combined"

if [ "$FROM_GITHUB" -eq 1 ]; then
  CLONE_DIR="$(mktemp -d)"
  info "Cloning the sources from GitHub..."
  git clone --quiet --depth 1 "$GOGO_URL" "$CLONE_DIR/gogo"
  git clone --quiet --depth 1 "$GOGO_FRONT_URL" "$CLONE_DIR/gogo-front"
  git clone --quiet --depth 1 "$BACKUPIT_URL" "$CLONE_DIR/backupit"
  GOGO_DIR="$CLONE_DIR/gogo"
  GOGO_FRONT_DIR="$CLONE_DIR/gogo-front"
  BACKUPIT_DIR="$CLONE_DIR/backupit"
fi

SOURCES_FILE="$KIT_DIR/.kit-sources"
: > "$SOURCES_FILE.tmp"

# copy <name> <source dir> <target folder> [paths to leave out...]
copy() {
  local name="$1" source="$2" target="$3"
  shift 3

  [ -d "$source/.git" ] || fail "$name: no git repository at $source"

  local commit dirty=""
  commit="$(git -C "$source" rev-parse HEAD)"
  [ -n "$(git -C "$source" status --porcelain)" ] && dirty=1

  rm -rf "${KIT_DIR:?}/$target"
  mkdir -p "$KIT_DIR/$target"

  if [ "$WORKING_TREE" -eq 1 ]; then
    # Tracked files plus new ones that are not ignored, as they are on disk
    (cd "$source" && git ls-files -z --cached --others --exclude-standard | while IFS= read -r -d '' file; do
      [ -e "$file" ] && printf '%s\0' "$file"
    done | tar --null -T - -cf -) | tar -x -C "$KIT_DIR/$target"
    [ -n "$dirty" ] && commit="$commit+uncommitted"
  else
    [ -n "$dirty" ] && warn "$name has uncommitted changes in $source. Only the last commit is copied (--working-tree copies them too)."
    git -C "$source" archive --format=tar HEAD | tar -x -C "$KIT_DIR/$target"
  fi

  local path
  for path in "$@"; do
    rm -rf "${KIT_DIR:?}/$target/$path"
  done
  find "$KIT_DIR/$target" -name .DS_Store -delete

  printf '%-10s %-11s %s\n' "$target" "$name" "$commit" >> "$SOURCES_FILE.tmp"
  info "  $target/  <- $name @ ${commit:0:7}${dirty:+ (source has uncommitted changes)}"
}

info "Copying..."
# Left out: per-repository CI (the kit has its own), and the old deployment notes that deploy/ replaces.
copy gogo       "$GOGO_DIR"       backend  .github DEPLOYMENT.md app-supervisord.conf
copy gogo-front "$GOGO_FRONT_DIR" frontend .github
copy backupit   "$BACKUPIT_DIR"   backup   .github

# Inside the kit the projects are neighbours under different names. These are the only
# changes made to the copied files.
info "Rewriting paths between the projects..."
text_files() {
  # Skips binaries and lock files, where a rewrite could only do harm
  grep -rIl --exclude='package-lock.json' --exclude='go.sum' --exclude-dir=node_modules -e "$1" "$2" || true
}

text_files '\.\./gogo' frontend | while IFS= read -r file; do
  perl -pi -e 's{\.\./gogo(?![-\w])}{../backend}g' "$file"
done

text_files 'in gogo-front' backend | while IFS= read -r file; do
  perl -pi -e 's{in gogo-front}{in `../frontend`}g' "$file"
done

if grep -rIn --exclude-dir=node_modules -e '\.\./gogo' frontend backend backup >/dev/null 2>&1; then
  grep -rIn --exclude-dir=node_modules -e '\.\./gogo' frontend backend backup >&2
  fail "a path to ../gogo survived the rewrite (listed above). Extend scripts/sync.sh to cover it."
fi

mv "$SOURCES_FILE.tmp" "$SOURCES_FILE"

info ""
info "Done. Sources are recorded in .kit-sources. Review with 'git status', then commit."
