# Deploy

Ansible playbooks that turn a fresh Ubuntu server into a running deployment, and update it afterwards.

| Playbook | What it does |
|---|---|
| `provision.yml` | Everything, from an empty server: packages, firewall, PostgreSQL, Redis, Go, Node.js, the application, nginx, TLS, backups. Safe to run again. |
| `deploy.yml` | Releases new code: pull, build, migrate, restart, health check. |

> These playbooks pass Ansible's syntax check and the nginx configuration they generate has been
> validated with `nginx -t` for every TLS mode. They have **not yet been run against a real server**.
> Do the first run on a server you can throw away.

## What ends up on the server

```
/var/www/<app>/
  repo/                        the git checkout
  backend  -> repo/backend     Go API; binaries in backend/bin
  frontend -> repo/frontend    admin panel; nginx serves frontend/dist
  backup   -> repo/backup      backup scripts, run by cron
  shared/uploads/              uploaded files, outside the checkout
/var/log/<app>/                api.log, api-error.log, cron.log, cron-error.log
/var/backups/<app>/            local backups (when backup_storage includes "local")
/etc/supervisor/conf.d/<app>.conf
/etc/nginx/sites-available/<app>.conf
```

- **Processes**: supervisor runs `<app>-api` and, when `enable_scheduler` is true, `<app>-cron`, both as the unprivileged `deploy` user.
- **nginx**: `domain` serves the admin panel and proxies `/api/`, `/health` and `/_pulse` to the API on `127.0.0.1:8181`. An optional `api_domain` proxies everything to the API.
- **PostgreSQL and Redis** listen on localhost only. The firewall allows SSH, 80 and 443.
- **Backups**: cron runs the database and uploaded-files backups every night.

## Requirements

- On your machine: Ansible 2.15 or newer (`brew install ansible` or `pipx install --include-deps ansible`).
- A server with Ubuntu 22.04 or 24.04 that you can reach over SSH as a user who can `sudo`.
- DNS for `domain` (and `api_domain`) pointing at the server **before** provisioning when `tls_mode` is `letsencrypt`: the certificate request needs it.

## First deployment

```bash
cd deploy
ansible-galaxy collection install -r requirements.yml

cp inventory/hosts.example.yml inventory/hosts.yml          # the server's address and SSH user
cp secrets.example.yml group_vars/all/secrets.yml           # generate each value: openssl rand -hex 32
$EDITOR group_vars/all/main.yml                             # app_name, domain, repo_url, tls_mode, ...

ansible-playbook provision.yml
```

Two things the first run will tell you about:

1. **Repository access.** If the clone fails, the playbook prints a public key. Add it to the repository as a read-only deploy key (GitHub: Settings → Deploy keys) and run the playbook again.
2. **The first account.** When the application is up and has no users, the playbook prints the command that creates the first super admin.

`hosts.yml` and `secrets.yml` are ignored by git. To keep the secrets in the repository anyway, encrypt them with `ansible-vault encrypt group_vars/all/secrets.yml` and add `--ask-vault-pass` to the commands.

## Releasing new code

Push to `repo_branch`, then:

```bash
ansible-playbook deploy.yml
```

It rebuilds only what changed, applies new migrations, restarts the API and waits for `/health` to answer. If the API does not come back healthy, the play fails and says so.

## Settings

All in `group_vars/all/main.yml`, each with a comment. The ones you will set for every project:

| Variable | Meaning |
|---|---|
| `app_name` | Short name: database, log folder, supervisor programs, nginx site |
| `repo_url`, `repo_branch` | Where the code comes from |
| `domain`, `api_domain` | Hostnames. `api_domain` is optional |
| `tls_mode` | `letsencrypt`, `cloudflare` or `none` (below) |
| `letsencrypt_email` | Required for `letsencrypt` |
| `mail_host` and friends | SMTP, for password reset and verification emails |
| `backup_storage` | `local`, `gcs` or `local,gcs` |

Secrets (`group_vars/all/secrets.yml`): `db_password`, `jwt_secret`, `pulse_password`, `mail_password`.

### TLS modes

| Mode | What nginx does | Use it when |
|---|---|---|
| `letsencrypt` | certbot gets and renews the certificates; port 80 redirects to 443 | The server faces the internet directly |
| `cloudflare` | Listens on port 80 and restores the visitor's IP from `CF-Connecting-IP` | Cloudflare is in front and terminates TLS |
| `none` | Plain HTTP on port 80 | A test server |

The Cloudflare address ranges are in `roles/nginx/defaults/main.yml`; refresh them from <https://www.cloudflare.com/ips/> when they change.

### Backups to Google Cloud Storage

Set `backup_storage: gcs` (or `local,gcs`), `backup_gcs_bucket`, and `backup_gcs_credentials_file` to the path **on your machine** of the service account key. The playbook installs the Google Cloud CLI and uploads the key to `shared/gcs-sa.json`. See `../backup/GCS_SETUP.md` for creating the bucket and the key.

## Day-to-day on the server

```bash
sudo supervisorctl status                       # is it running
sudo supervisorctl restart <app>-api
sudo tail -f /var/log/<app>/api.log             # application log (JSON)
sudo -u deploy sh -c 'cd /var/www/<app>/backend && ./bin/gogo-cli help'
sudo -u deploy /var/www/<app>/backup/backup_db.sh   # a backup right now
```

The monitoring dashboard is at `https://<domain>/_pulse` (user `admin`, password `pulse_password`).

## What is not handled

- **Several servers.** Everything, database included, is on one machine.
- **Zero-downtime releases.** A deploy restarts the API; requests in flight are finished first, new ones wait a moment.
- **Rollback.** To go back, revert the commit and deploy again. Migrations are not rolled back automatically.
- **Restoring a backup.** The steps are in `../backup/README.md`.
