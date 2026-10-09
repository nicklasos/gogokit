# Manual install

Installing by hand on a server that already has Go, Node.js, nginx, PostgreSQL, Redis and supervisor,
and usually other applications too. `ansible-playbook install.yml` does exactly this for you (see
[README.md](README.md)); this page is for doing it, or checking it, without Ansible.

The files to copy are in [`examples/`](examples): `backend.env`, `supervisor.conf` and `nginx.conf`.
Create the database first.

Once, as root:

```bash
git clone git@github.com:your-account/your-project.git /var/www/myapp
cd /var/www/myapp

mkdir -p shared/uploads /var/log/myapp
chown www-data: shared/uploads

cp backend/.env.example backend/.env        # then apply deploy/examples/backend.env
chgrp www-data backend/.env && chmod 640 backend/.env
printf 'VITE_API_BASE_URL=\nVITE_APP_NAME="MyApp"\n' > frontend/.env

make deploy SUPERVISOR_PROGRAM=             # first build and migrations; nothing to restart yet

cp deploy/examples/supervisor.conf /etc/supervisor/conf.d/myapp.conf
supervisorctl update

cp deploy/examples/nginx.conf /etc/nginx/sites-available/myapp.conf
ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

cd backend && ./bin/gogo-cli create-user --email you@example.com --password "a-long-password"
```

The empty `VITE_API_BASE_URL` makes the panel call its own origin, where nginx forwards `/api` to the API.
The examples assume the API on port 8181, the user `www-data` and Cloudflare in front; change the port in
both `backend/.env` and `nginx.conf`.

## Releasing

```bash
cd /var/www/myapp && make deploy
```

It pulls, builds the API and the CLI, applies new migrations, builds the panel and restarts `myapp-api`.
There is no cron program: with `ENABLE_SCHEDULER=true` in `backend/.env` the API runs the scheduled jobs itself.
