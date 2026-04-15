---
id: getting-started
title: Getting Started
sidebar_position: 2
---

# Getting Started

## Prerequisites

- Java 21 (Eclipse Temurin or Amazon Corretto)
- Gradle 8.5+
- Docker Desktop
- kubectl configured for our staging cluster

## New service

```bash
eng-bootstrap new --lang java --template service
```

This scaffolds a Gradle project with our standard dependencies, CI config, and Dockerfile.

## Useful links

Check the [Tech Radar](/radar) for our approved technologies and their current status.
