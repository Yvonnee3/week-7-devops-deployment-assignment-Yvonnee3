#!/bin/bash

# MERN Stack Deployment Script
# This script automates the deployment process for the MERN application

set -e  # Exit on any error

# Configuration
APP_NAME="mern-deployment-app"
DOCKER_REGISTRY="your-registry.com"
BACKEND_IMAGE="${DOCKER_REGISTRY}/${APP_NAME}-backend"
FRONTEND_IMAGE="${DOCKER_REGISTRY}/${APP_NAME}-frontend"
VERSION=${1:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    
    log_info "All dependencies are installed."
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t ${BACKEND_IMAGE}:${VERSION} -f ../server/Dockerfile ../server/
    
    # Build frontend image (production build)
    log_info "Building frontend image..."
    docker build -t ${FRONTEND_IMAGE}:${VERSION} -f ../client/Dockerfile.prod ../client/
    
    log_info "Docker images built successfully."
}

# Push images to registry
push_images() {
    if [ "$SKIP_PUSH" != "true" ]; then
        log_info "Pushing images to registry..."
        
        docker push ${BACKEND_IMAGE}:${VERSION}
        docker push ${FRONTEND_IMAGE}:${VERSION}
        
        log_info "Images pushed successfully."
    else
        log_warn "Skipping image push (SKIP_PUSH=true)"
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    cd ../server
    npm test
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd ../client
    npm test
    
    cd ../deployment
    log_info "All tests passed."
}

# Deploy to staging
deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Update docker-compose with new image versions
    export BACKEND_IMAGE_TAG=${VERSION}
    export FRONTEND_IMAGE_TAG=${VERSION}
    export ENVIRONMENT=staging
    
    # Deploy using docker-compose
    docker-compose -f docker-compose.staging.yml down
    docker-compose -f docker-compose.staging.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run health checks
    if ! curl -f http://localhost:5000/api/health; then
        log_error "Backend health check failed"
        exit 1
    fi
    
    if ! curl -f http://localhost:3000; then
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_info "Staging deployment completed successfully."
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production environment..."
    
    # Confirmation prompt
    echo -e "${YELLOW}Are you sure you want to deploy to production? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Production deployment cancelled."
        exit 0
    fi
    
    # Create backup
    log_info "Creating database backup..."
    ./backup.sh
    
    # Update docker-compose with new image versions
    export BACKEND_IMAGE_TAG=${VERSION}
    export FRONTEND_IMAGE_TAG=${VERSION}
    export ENVIRONMENT=production
    
    # Deploy using docker-compose
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run health checks
    if ! curl -f https://your-domain.com/api/health; then
        log_error "Production backend health check failed"
        log_info "Rolling back..."
        rollback_production
        exit 1
    fi
    
    if ! curl -f https://your-domain.com; then
        log_error "Production frontend health check failed"
        log_info "Rolling back..."
        rollback_production
        exit 1
    fi
    
    log_info "Production deployment completed successfully."
}

# Rollback production deployment
rollback_production() {
    log_warn "Rolling back production deployment..."
    
    # Get previous version from backup
    PREVIOUS_VERSION=$(cat .last_version 2>/dev/null || echo "latest")
    
    export BACKEND_IMAGE_TAG=${PREVIOUS_VERSION}
    export FRONTEND_IMAGE_TAG=${PREVIOUS_VERSION}
    export ENVIRONMENT=production
    
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    
    log_info "Rollback completed."
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove old images (keep last 5 versions)
    docker images ${BACKEND_IMAGE} --format "table {{.Tag}}" | tail -n +6 | xargs -r docker rmi ${BACKEND_IMAGE}:
    docker images ${FRONTEND_IMAGE} --format "table {{.Tag}}" | tail -n +6 | xargs -r docker rmi ${FRONTEND_IMAGE}:
    
    # Remove dangling images
    docker image prune -f
    
    log_info "Cleanup completed."
}

# Main deployment function
main() {
    log_info "Starting deployment process for version ${VERSION}..."
    
    check_dependencies
    
    case "${2:-staging}" in
        "test")
            run_tests
            ;;
        "build")
            build_images
            ;;
        "staging")
            run_tests
            build_images
            push_images
            deploy_staging
            ;;
        "production")
            run_tests
            build_images
            push_images
            deploy_production
            # Save current version for potential rollback
            echo ${VERSION} > .last_version
            ;;
        "rollback")
            rollback_production
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 [version] [test|build|staging|production|rollback|cleanup]"
            echo "  version: Docker image version (default: latest)"
            echo "  test: Run tests only"
            echo "  build: Build Docker images only"
            echo "  staging: Deploy to staging environment"
            echo "  production: Deploy to production environment"
            echo "  rollback: Rollback production deployment"
            echo "  cleanup: Clean up old Docker images"
            exit 1
            ;;
    esac
    
    log_info "Deployment process completed successfully!"
}

# Run main function
main "$@"