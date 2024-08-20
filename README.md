# Link Shortener

This is a simple link shortener created in TypeScript that runs on Node.js.  
***Currently in development, and not ready for production use.***

## Features

* User management
* Password-protected short URLs

## Setup: Production

These instructions will be added later since this repository is not production-ready.

## Setup: Development

### Prerequisites

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (tested with latest LTS)
* [NPM](https://www.npmjs.com/) (bundled with Node.js)

### Steps

* Clone this repository

  ```sh
  git clone https://github.com/thaddeuskkr/ls.git && cd ls
  ```

* Install all dependencies using NPM
  
  ```sh
  npm install
  ```

* Copy `.env.example` to `.env` and fill it in
  
  ```sh
  cp .env.example .env
  ```

* Build and start

  ```sh
  npm run build && npm start
  ```
