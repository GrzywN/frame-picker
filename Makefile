build:
	@proto use
	@poetry install

run-profile:
	@poetry run frame-picker video.mp4 --mode profile --output profile.jpg --sample-rate 5 --quality best

run-action:
	@poetry run frame-picker video.mp4 --mode action --output action.jpg --sample-rate 5 --quality best

