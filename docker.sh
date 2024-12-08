#!/bin/bash

# !!! SOURCE ATTRIBUTION !!!
# This script generated entirely by ChatGPT. It has been vetted to work by... me :)
# Thanks to ChatGPT for the script, lol!

# Define variables
DOCKER_COMPOSE_CMD="docker compose"  # Default to "docker compose"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Help message
usage() {
    echo "Usage: $0 {up|down|restart|rebuild|backup|logs|clean|help}"
    echo ""
    echo "Commands:"
    echo "  up           Start the Docker Compose services."
    echo "  down         Stop the Docker Compose services."
    echo "  restart      Restart the Docker Compose services."
    echo "  rebuild      Rebuild and start the Docker Compose services, including volume cleanup."
    echo "  backup       Backup named volumes used by the Docker Compose."
    echo "  logs         Show logs for Docker Compose services."
    echo "  clean        Stop services and remove associated named volumes."
    echo "  help         Display this help message."
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_COMPOSE_CMD  Set this variable to override the Docker Compose command."
    echo ""
    echo "Examples:"
    echo "  DOCKER_COMPOSE_CMD='docker-compose' $0 up"
}

# Allow overriding the Docker Compose command via an environment variable
DOCKER_COMPOSE_CMD=${DOCKER_COMPOSE_CMD:-"docker compose"}

# Ensure the script is called with a valid argument
if [ $# -lt 1 ]; then
    usage
    exit 1
fi

# Handle the different commands
case "$1" in
    up)
        echo "Starting Docker Compose services..."
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE up -d
        ;;

    down)
        echo "Stopping Docker Compose services..."
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE down
        ;;

    restart)
        echo "Restarting Docker Compose services..."
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE down
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE up -d
        ;;

    rebuild)
        echo "Rebuilding and starting Docker Compose services (with volume cleanup)..."
        echo "Stopping services and removing named volumes..."
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE down -v
        echo "Rebuilding images and starting services..."
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE build
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE up -d
        ;;

    backup)
        echo "Backing up Docker Compose named volumes..."
        mkdir -p $BACKUP_DIR
        VOLUMES=$(docker volume ls --format "{{.Name}}")
        for volume in $VOLUMES; do
            BACKUP_FILE="$BACKUP_DIR/${volume}_${TIMESTAMP}.tar.gz"
            echo "Backing up volume: $volume to $BACKUP_FILE"
            docker run --rm -v $volume:/volume -v $BACKUP_DIR:/backup alpine \
                tar czf /backup/$(basename $BACKUP_FILE) -C /volume .
        done
        echo "Backup completed and stored in $BACKUP_DIR."
        ;;

    logs)
        echo "Showing logs for Docker Compose services..."
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE logs -f
        ;;

    clean)
        echo "Stopping Docker Compose services and removing associated volumes..."
        $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE down -v
        echo "All services stopped, and named volumes removed."
        ;;

    help)
        usage
        ;;

    *)
        echo "Invalid command: $1"
        usage
        exit 1
        ;;
esac
