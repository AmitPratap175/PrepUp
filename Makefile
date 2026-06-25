build:
	podman-compose up --build 

reset:
	podman-compose down
	podman image prune -f
	podman-compose up --build

reset_cron:
	podman-compose down
	podman-compose up -d