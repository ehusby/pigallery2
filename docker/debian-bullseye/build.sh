# Download and unzip the latest release
wget https://github.com/bpatrik/pigallery2/releases/download/3.5.2/pigallery2-release.zip
unzip pigallery2-release.zip -d pigallery2-release

# Place your Dockerfile alongside it
# Then build:
docker buildx build \
  --platform linux/arm/v7 \
  --tag pigallery2:debian-bullseye \
  --load \
  --no-cache \
  -f Dockerfile.build \
  .

# Save and compress the image
docker save pigallery2:debian-bullseye | gzip > pigallery2-bullseye.tar.gz
