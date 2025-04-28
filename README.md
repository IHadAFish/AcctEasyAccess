# Acct Easy Access Tool

## Project Overview

An internal tool I made for the Call Center I work for. Intended to improve the workflow of the frontline agents with company internal CRM.

It addresses key issues identified by intergrating essential info and quick access options directly on CRM page via a Violentmonkey plugin, supported by a dedicated backend.

## Problem Solved

- Time-consuming navigation to frequently used functions (billing, credit card updates, usage records).
- Manual checks to identify accounts with open tickets.
- Difficulty quickly extracting key account info(registration/activation/billing dates, contract details) from the English-only CRM interface.
- Needing to remember or manually look up account plan details and CRM tag meanings.
- Challenges in handling specific account types requiring special processing.
- Usability issues within the AIjia interface, such as missing functional account IDs in dropdowns and disruptive blank popups.

This tool was created to streamline these tasks, reduce cognitive load, and free up agent time.

## Features

The tool provides the following core functionalities directly integrated into the CRM interface:

- **Quick Access to Common Functions:** Direct links within the CRM to frequently used CSS functions.
- **Pending Ticket Display:** Automatically retrieves and displays a list of pending tickets for the current account.
- **Clear Account Information:** Presents key account details (registration/activation/billing time, contract period) clearly, often translated or summarized for easier understanding.
- **Detailed Plan Information:** Displays plan ID and name. Clicking the plan name provides detailed information (contract period, fees, discounts, notes) in a popup window fetched from the backend.
- **Configurable Account Reminders:** Displays custom reminders for specific accounts based on tags, market, product, account ID, or phone number. Management can configure these reminders, and agents can mark them as processed.
- **Enhanced AIjia Interface:** Adds functional account IDs directly into the AIjia dropdown menu and removes disruptive blank popups when hovering over account details.

## Architecture

The system is composed of two main parts:

1. **Frontend Browser Plugin:** A JS-based plugin (Violentmonkey) that runs within the agent's browser. It intercepts CRM requests (via XHR interception), extracts relevant data, modifies the CRM interface to display new information (in a sidebar), and communicates with the backend server for additional data (plan details, reminders).
2. **Backend Server:** A Python (Flask) application that handles requests from the browser plugin. It interacts with a MariaDB database to store and retrieve plan and reminder information, uses Redis for caching frequently accessed data to improve performance, and employs Celery for handling asynchronous tasks (like bulk data processing or background cache updates).

Data management interfaces for plans and reminders are hosted separately and interact with the backend API.

## Technology Stack

- **Frontend:** Javascript (Violentmonkey), HTML, CSS
- **Backend:** Python (Flask, Gunicorn), Celery, Redis
- **Database:** MariaDB (shared)
- **Caching:** Redis
- **Deployment:** Ubuntu Server, Docker Compose, Nginx (Reverse Proxy), Honcho
- **Management Interfaces:** HTML/CSS/Javascript (served via backend or embedded)

## Installation and Setup

Setting up the Acct Easy Access Tool involves deploying the backend services and installing the browser plugin on agent machines.

1. **Backend Deployment:** Deploy the Python backend application, MariaDB database, Redis cache, and Celery workers on a server (e.g., using Docker Compose). Configure Nginx as a reverse proxy to manage access.
2. **Browser Plugin Installation:** Agents install the Violentmonkey browser extension and then install the Acct Easy Access Tool script, configured to point to the deployed Nginx reverse proxy.

*Specific configuration details (database connection, Redis URLs, Nginx setup, Violentmonkey script path) are required in .env file, check README_CN.md*

## Usage

Once the browser plugin is installed and the backend is running, the tool automatically activates when the agents views an account page in CRM. New info and interactive elements will appear within the CRM interface, providing access to the tool's features.

Management can access dedicated web interfaces to configure account plans and reminders.

## Management Interfaces

- **Plan Management:** Searching, adding, modifying, and bulk uploading/updating account plan details.
- **Reminder Management:** Searching, adding, modifying, deleting, and managing account reminders, including specifying display conditions (tags, market, product, account list) and viewing processing logs.

## Future Enhancements (TODO)

- Add logging/monitoring for tool usage (CSS quick access, plan detail requests).
- Track requested plan IDs that are not found in the database to identify popular missing plans.
- Implement features to display content differently based on the agent's department.
- Investigate possibilities for direct login or deeper integration with CSS functionalities.
