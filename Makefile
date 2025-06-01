setup:
	@proto use
	@poetry lock
	@poetry install

ai-service:
	@poetry run ai-service

frontend:
	@npm run dev

codegen:
	@npx supabase gen types typescript --local > frontend/src/types/supabase.g.ts

format:
	@poetry run isort .
	@poetry run black .

test:
	@poetry run pytest

.PHONY: setup migrate api frontend format test
