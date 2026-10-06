.PHONY: help sync up down seed test test-backend test-frontend deploy-setup provision deploy

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-16s %s\n", $$1, $$2}'

sync: ## Copy gogo, gogo-front and backupit into backend/, frontend/ and backup/
	scripts/sync.sh

up: ## Start Postgres, Redis and Mailpit in Docker for local development
	$(MAKE) -C backend up

down: ## Stop them
	$(MAKE) -C backend down

seed: ## Fill an empty development database with accounts and sample data
	$(MAKE) -C backend seed

test: test-backend test-frontend ## Run every test in the kit

test-backend: ## Go unit and integration tests
	$(MAKE) -C backend test

test-frontend: ## Typecheck, lint, unit tests and Playwright
	$(MAKE) -C frontend test

deploy-setup: ## Install the Ansible collections the playbooks need
	cd deploy && ansible-galaxy collection install -r requirements.yml

provision: ## Set up a new server and deploy to it
	cd deploy && ansible-playbook provision.yml

deploy: ## Release the current code to the server
	cd deploy && ansible-playbook deploy.yml

.DEFAULT_GOAL := help
