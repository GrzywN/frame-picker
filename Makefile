build:
	@proto use
	@poetry lock
	@poetry install

run-profile:
	@poetry run frame-picker video.mp4 --mode profile --output profile.jpg --sample-rate 5 --quality best --count 3 --min-interval 3.0

run-action:
	@poetry run frame-picker video.mp4 --mode action --output action.jpg --sample-rate 5 --quality best --count 3 --min-interval 3.0

