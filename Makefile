setup:
	@proto use
	@poetry lock
	@poetry install
	@docker compose up -d

migrate:
	@poetry run alembic upgrade head

api:
	@poetry run frame-picker-api

frontend:
	@npm run dev

format:
	@poetry run isort .
	@poetry run black .

test:
	@poetry run pytest

cli-run-profile:
	@poetry run frame-picker video.mp4 --mode profile --output profile.jpg --sample-rate 5 --quality best --count 3 --min-interval 3.0

cli-run-action:
	@poetry run frame-picker video.mp4 --mode action --output action.jpg --sample-rate 5 --quality best --count 3 --min-interval 3.0

.PHONY: setup migrate api frontend format test cli-run-profile cli-run-action