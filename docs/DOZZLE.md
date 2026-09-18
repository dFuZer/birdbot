# Dozzle (self-hosted container logs)

Dozzle is a log-only web UI for the Docker Compose stack. It is authenticated, has analytics/actions/shell disabled, and is independent of the website/API/bot health chain.

This guide is the operator-run workflow. Run the commands yourself. None of them were executed when this file was added to the repository.

**Traffic is plain HTTP.** Login stops anonymous access, but it does not encrypt credentials or logs. Restrict the published port to your source IP now. Put Dozzle behind HTTPS later if you keep it reachable from the internet.

## Placeholders

Replace these before running anything:

| Placeholder | Meaning |
| --- | --- |
| `/path/to/birdbot` | Repository directory on the VPS (`$BIRDBOT_PATH` if you already use that) |
| `VPS_PUBLIC_IP` | Public IPv4 address of the VPS |
| `TRUSTED_CLIENT_IP` | Public IPv4 address of the machine you browse from |
| `DOZZLE_PORT` | Host port, default `8080` |
| `admin` | Dozzle username |
| `you@example.com` | Email stored in `users.yml` (optional; used for Gravatar) |

## 1. Development machine — ship the repository changes

From your local clone:

```bash
git status
git add docker-compose.yml .gitignore .env.example scripts/deploy.sh dozzle/users.yml.example docs/DOZZLE.md README.md
git commit -m "Add authenticated Dozzle log viewer"
git push origin main
```

Confirm `dozzle/users.yml` is **not** staged. It is gitignored and must never be committed.

```bash
git check-ignore -v dozzle/users.yml
git ls-files --error-unmatch dozzle/users.yml && echo "ERROR: users.yml is tracked" || echo "OK: users.yml is not tracked"
```

`git check-ignore` should print `.gitignore:dozzle/users.yml`. The second command should print `OK: users.yml is not tracked` (it may also print a `Did not match` error from `git ls-files`; that is expected).

## 2. VPS — pull the changes

SSH in, then:

```bash
cd /path/to/birdbot
git pull origin main
```

## 3. VPS — choose the published port

If `.env` does not already have `DOZZLE_PORT`, append it:

```bash
cd /path/to/birdbot
grep -q '^DOZZLE_PORT=' .env || echo 'DOZZLE_PORT=8080' >> .env
```

Change the value if 8080 is already in use.

## 4. VPS — create `dozzle/users.yml`

Generate a bcrypt user file with the pinned image, then force `roles: none` so the account can view logs but cannot start/stop containers or open a shell (those features are also disabled on the service itself).

```bash
cd /path/to/birdbot
mkdir -p dozzle

docker run --rm amir20/dozzle:v10.9.0 generate admin \
  --password '<choose-a-strong-password>' \
  --email 'you@example.com' \
  --name 'Admin' > dozzle/users.yml

chmod 600 dozzle/users.yml
```

Edit `dozzle/users.yml` and set `roles: none` on the user. The file should look like:

```yaml
users:
  admin:
    email: you@example.com
    name: Admin
    password: <bcrypt hash from generate>
    filter:
    roles: none
```

`dozzle/users.yml.example` is a template only. Do not start the service with the placeholder hash.

Confirm Compose can read the secret:

```bash
test -f dozzle/users.yml && echo "users.yml present"
```

## 5. VPS — validate Compose (does not start containers)

```bash
cd /path/to/birdbot
docker compose config
```

This interpolates env vars and checks that `./dozzle/users.yml` exists. It does not have to recreate running app containers.

## 6. VPS firewall — allow only your IP

Do not open `DOZZLE_PORT` to the world. Pick **one** of the following.

### UFW

```bash
sudo ufw allow from TRUSTED_CLIENT_IP to any port 8080 proto tcp comment 'Dozzle'
sudo ufw status numbered
```

If you changed `DOZZLE_PORT`, use that port instead of `8080`.

### Provider / security-group firewall

Create an inbound TCP rule:

- Port: `8080` (or `DOZZLE_PORT`)
- Source: `TRUSTED_CLIENT_IP/32`
- Destination: this VPS

Do not add `0.0.0.0/0`.

## 7. VPS — start only Dozzle

First-time start (does not rebuild website/api/bot):

```bash
cd /path/to/birdbot
docker compose up -d dozzle
```

Later, `scripts/deploy.sh` also starts `dozzle` alongside the app services. `dozzle/users.yml` must already exist or that deploy will fail.

## 8. VPS — inspect health and logs

```bash
cd /path/to/birdbot
docker compose ps dozzle
docker compose logs --tail=50 dozzle
docker inspect --format '{{.State.Health.Status}}' "$(docker compose ps -q dozzle)"
```

Expected: container `running`, health `healthy` (after the start period), logs mentioning `users.yml` / simple auth.

## 9. Browser — confirm auth and log visibility

From the machine at `TRUSTED_CLIENT_IP`:

1. Open `http://VPS_PUBLIC_IP:8080` (use your `DOZZLE_PORT` if different).
2. You should get Dozzle’s login page, not a live log stream.
3. A request without a session must not show container logs. From the VPS:

```bash
curl -sI http://127.0.0.1:8080/ | head
```

You should see a redirect or login response, not an unauthenticated log API.

4. Sign in with the username/password from step 4.
5. Confirm logs for `website`, `api`, `bot`, and `db`.
6. Confirm there are no start/stop/restart action controls and no container shell. Those are disabled in Compose (`DOZZLE_ENABLE_ACTIONS=false`, `DOZZLE_ENABLE_SHELL=false`) and the user role is `none`.

## 10. Rotate credentials

On the VPS:

```bash
cd /path/to/birdbot

docker run --rm amir20/dozzle:v10.9.0 generate admin \
  --password '<new-strong-password>' \
  --email 'you@example.com' \
  --name 'Admin' > dozzle/users.yml

# Re-add `roles: none` to the user in dozzle/users.yml
chmod 600 dozzle/users.yml
docker compose up -d --force-recreate dozzle
```

Then sign in with the new password.

## 11. Update the pinned Dozzle version

1. Edit `docker-compose.yml` and `docs/DOZZLE.md` so the image tag matches (currently `amir20/dozzle:v10.9.0`).
2. Commit, push, pull on the VPS.
3. Recreate the service:

```bash
cd /path/to/birdbot
git pull origin main
docker compose up -d dozzle
```

## 12. Stop Dozzle (keep data)

```bash
cd /path/to/birdbot
docker compose stop dozzle
```

## 13. Full rollback

Removes the container, the named volume, and the firewall hole. App services are left running.

```bash
cd /path/to/birdbot
docker compose rm -sf dozzle
docker volume rm birdbot_dozzle_data
```

The volume name is `<compose-project>_dozzle_data`. Confirm with `docker volume ls | grep dozzle` if the project directory is not named `birdbot`.

UFW:

```bash
sudo ufw status numbered
sudo ufw delete <rule-number-for-dozzle>
```

Provider firewall: delete the inbound TCP rule for `DOZZLE_PORT`.

Optionally delete the secret file:

```bash
rm -f /path/to/birdbot/dozzle/users.yml
```

To also drop Dozzle from future deploys, revert the repository changes to `docker-compose.yml` and `scripts/deploy.sh`.

## Security notes

- `/var/run/docker.sock` is mounted read-only. Anyone who can log into Dozzle can still read logs from every container on the Docker host.
- Do not enable `DOZZLE_ENABLE_ACTIONS` or `DOZZLE_ENABLE_SHELL` on a publicly reachable instance.
- Restrict the port to `TRUSTED_CLIENT_IP`. HTTP basic/session auth is not a substitute for TLS.
- Follow-up hardening: terminate TLS on a reverse proxy and switch Dozzle to `DOZZLE_AUTH_PROVIDER=forward-proxy`, or keep simple auth behind the proxy and stop publishing host port 8080.
