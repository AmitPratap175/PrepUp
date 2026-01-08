build:
	podman-compose up --build 

reset:
	podman-compose down
	podman-compose up --build

reset_cron:
	podman-compose down
	podman-compose up -d