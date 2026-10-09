# Gogokit – Agent Guide

A full-stack starter in one repository: a Go API, a React admin panel, backups and server provisioning.

## Layout

| Folder | What it is | Source of truth |
|---|---|---|
| `backend/` | Go API: Gin, PostgreSQL through sqlc, Redis, JWT auth with roles | [gogo](https://github.com/nicklasos/gogo) |
| `frontend/` | Admin panel: React, TypeScript, Ant Design, TanStack Query | [gogo-front](https://github.com/nicklasos/gogo-front) |
| `backup/` | Shell scripts that back up the database and uploaded files | [backupit](https://github.com/nicklasos/backupit) |
| `deploy/` | Ansible: provision a server or install on an existing one, deploy and update the application | this repository |

Each folder has its own `AGENTS.md` (or README) with its conventions. Read the one for the folder you are working in.

## Where to make a change

- **In the kit itself** (the upstream template): `backend/`, `frontend/` and `backup/` are **generated**
  by `scripts/sync.sh` and are overwritten on the next sync. Change the source repository, commit there,
  then run `make sync` here. Only `deploy/`, `scripts/`, `docs/`, `.github/` and the root files are edited here.
- **In a project created from the kit**: the project owns all four folders. Edit them directly and do not
  run `make sync`, which would replace your code with the template's.

`.kit-sources` records which commit of each source the folders were built from.

## Working across the folders

- The contract between `backend/` and `frontend/` is the OpenAPI file: after changing request or response
  types run `make swagger` in `backend/`, then `make api-types` in `frontend/`.
- A feature that touches both follows `frontend/docs/recipes/full-stack-feature.md`. The backend recipes
  are in `backend/docs/recipes/`.
- The frontend's E2E suite starts the API from `../backend`, so `make test` in `frontend/` tests both halves together.
- `deploy/` reads nothing from the other folders except their structure: `backend/cmd/{api,cron,cli}`,
  `backend/migrations`, `frontend/dist`, `backup/backup_db.sh` and `backup/backup_images.sh`. Renaming
  any of those means updating `deploy/roles/`.

## Commands

```bash
make help            # everything below
make sync            # refresh backend/, frontend/, backup/ from their source repositories
make up              # local Postgres, Redis and Mailpit
make cli migrate up  # a console command; flags go after -- (make cli -- create-user --email a@b.c --password secret123)
make test            # backend tests, then frontend typecheck, lint, unit and Playwright
make provision       # set up a new server (see deploy/README.md)
make install-remote  # add the app to a server that already has everything (deploy/install.yml)
make deploy-remote   # release the current code to the server with Ansible
make deploy          # run on the server (install.yml or by hand): pull, build, migrate, restart
```

## Rules

- No narrating comments. A comment says why, not what.
- Do not start dev servers; the owner runs them.
- Finish a change with the tests of the folder it touched, and `ansible-playbook --syntax-check`
  for anything under `deploy/`.
- Never commit `deploy/inventory/hosts.yml`, `deploy/group_vars/all/secrets.yml` or any `.env`.
