build:
	podman-compose up --build 

reset:
	podman-compose down
	podman-compose up --build