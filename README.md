# Acct Easy Access Tool

A browser plugin and backend system I made for the Call Center I work for. Designed to enhance efficiency and user experience for call center agents using the internal CRM platform.

## Problem & Motivation

This tool was developed to address several pain points faced by agents during daily CRM interactions [1]:

- Time spent navigating to frequently used CRM sections (billing, usage, etc.).
- Difficulty quickly identifying unresolved support tickets for an account.
- Time required to locate and interpret key account details (registration/activation dates, contract info) within the English CRM interface.
- Need to memorize or manually look up account plan details and CRM tag meanings.
- Challenges in applying specific handling procedures for certain account types without manual tagging or lists.
- UI inconveniences within specific account views that hinder workflow.

## Solution & Features

This tool injects a helper sidebar/panel directly into the CRM account pages via a browser userscript (Violentmonkey), providing [1]:

- **Quick Links:** Direct one-click access to common CRM functions relevant to the current account.
- **Pending Ticket Display:** Automatically fetches and displays a list of open tickets for the account.
- **Clear Account Info:** Extracts and displays key account details (dates, contract) in a clear, localized format (Chinese).
- **Plan Details Lookup:** Displays plan ID/name and allows agents to click to view detailed plan information (contract terms, fees, discounts, notes) fetched from a dedicated backend.
- **Configurable Reminders:** Shows custom, context-aware notifications to agents based on pre-configured rules (account tags, market, product, specific account IDs/numbers). Includes a management interface for creating and managing these reminders.
- **Enhanced UI:** Adds account IDs directly into relevant dropdown menus for easier identification and removes certain disruptive UI popups.
- **Plan Management:** Includes a web interface for managing the plan details served by the backend lookup feature.

## Architecture Overview

- **Frontend:** A Violentmonkey userscript (JavaScript, HTML, CSS) that modifies the CRM frontend, intercepts data, and communicates with the backend [1].
- **Backend:** A Python server (Flask/Gunicorn) handling API requests from the frontend, managing asynchronous tasks (Celery), interacting with the database (MariaDB), and utilizing caching (Redis) for performance [1].
- **Deployment:** Typically deployed using Nginx as a reverse proxy, Docker Compose for database/cache services, running on an Ubuntu Server [1].

## Technology Stack

- **Frontend:** JavaScript (Violentmonkey), HTML, CSS
- **Backend:** Python, Flask, Gunicorn, Celery
- **Database:** MariaDB
- **Cache:** Redis
- **Deployment:** Nginx, Docker Compose, Ubuntu Server
- **Version Control:** Git

[1]

## Status

- Currently in active maintenance (Version 0.3.10 as of 2025/04) [1].
- Core functionality implemented, with ongoing development for new features [1].
