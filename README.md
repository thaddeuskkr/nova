# Nova

![Workflow Status (amd64)](https://github.com/thaddeuskkr/nova/actions/workflows/build-amd64.yml/badge.svg) ![Workflow Status (arm64)](https://github.com/thaddeuskkr/nova/actions/workflows/build-arm64.yml/badge.svg)

Nova is a simple link shortener built using TypeScript and Bun.

## Features

- A working minimalistic web interface
- An API that is easy to understand and use
- Password-protected short URLs
- Customisable short URLs
- Customisable short URL validity/expiry

## Setup: Production

The following are the recommended ways to run Nova.  
Do note, the Docker configurations are the exact same, but with different methods of running them.

### Docker (CLI)

Run the following command directly. Do replace the environment variables (`-e`) and port mapping (`-p`) with a configuration more relevant to you.

```sh
docker run \
  --name nova \
  --restart unless-stopped \
  -p 80:3000 \
  -e PORT="3000" \
  -e NODE_ENV="production" \
  -e MONGODB_CONNECTION_URL="<YOUR_DATABASE_URL>" \
  -e LOG_LEVEL="info" \
  -e API_AUTH="false" \
  -e RANDOM_SLUG_LENGTH="6" \
  -e BASE_URL_REDIRECT="false" \
  -e PROHIBITED_SLUGS="api" \
  -e EXPIRED_LINK_SCAN_INTERVAL="15" \
  ghcr.io/thaddeuskkr/nova:latest
```

### Docker Compose

Create a `compose.yml` file in a empty directory with the following sample content edited to fit your use case. Then, run `docker compose up`.

```yml
services:
    nova:
        container_name: nova
        image: ghcr.io/thaddeuskkr/nova:latest
        restart: unless-stopped
        ports:
            - '80:3000'
        environment:
            PORT: 3000 # The port to host Nova on,
            NODE_ENV: production # The environment to run Nova in. Set to "production" for production environments.
            MONGODB_CONNECTION_URL: YOUR_CONNECTION_URL # The connection URL to your MongoDB database.
            LOG_LEVEL: info # The level of logging to use. Set to "debug" for more verbose logging.
            API_AUTH: false # The password required to access Nova's API. Can be left empty or set to false to disable authentication.
            RANDOM_SLUG_LENGTH: 6 # The length of the random slugs generated for short URLs.
            BASE_URL_REDIRECT: false # The URL to redirect to when the base URL (/) is visited. Can be left empty or set to false to disable.
            PROHIBITED_SLUGS: api # A comma-separated list of slugs that are prohibited from being used.
            EXPIRED_LINK_SCAN_INTERVAL: 15 # The interval, in seconds, to scan for expired links.
```

## Setup: Development

### Prerequisites

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/)
- [MongoDB](https://www.mongodb.com/) installed locally or an [Atlas](https://www.mongodb.com/products/platform/atlas-database) instance running

### Steps

- Clone this repository

    ```sh
    git clone https://github.com/thaddeuskkr/nova.git && cd nova
    ```

- Install all dependencies using Bun

    ```sh
    bun install
    ```

- Copy `.env.example` to `.env` and fill it in

    ```sh
    cp .env.example .env
    ```

- Run using Bun

    ```sh
    bun .
    ```

## Contributing

**Contributions of all sorts are accepted and greatly appreciated.**

To contribute to this codebase, do the following:

1. [Create a fork](https://github.com/thaddeuskkr/nova/fork) of this repository
2. Follow the [setup process](#setup-development) above, but clone your fork instead
3. Push the modified code to your fork of this repository
4. Create a pull request to the `main` branch

To suggest a new feature or report a bug in Nova, please [create an issue](https://github.com/thaddeuskkr/nova/issues/new/choose).
