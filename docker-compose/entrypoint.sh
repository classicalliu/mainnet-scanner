#!/bin/bash

set -o errexit

cd /mainnet-scanner

yarn knex migrate:latest

yarn run start
