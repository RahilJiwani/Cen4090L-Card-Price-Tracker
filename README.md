*Last updated 3/22/2026*
# Cen4090L-Card-Price-Tracker
Software engineering Lab project based around making a python program and website that aims to notify users when the price of a Magic The Gathering card falls below a certain $ amount via email using a target price or a % drop in price from the highest price in a user defined window of time prior to addition to the watchlist which is called the lookback period.

## Prerequisites
- Python 3.14+ installed
- NodeJS and npm

## Setup
We have created multiple .ps1 and python scripts to run for workflow automation. All scripts are located in the ```./scripts``` or root directory. To initialize the project run the ```./scripts/bootstrap.ps1```. The boostrap focuses on setting up the project and ensuring you have the prerequisites. Here is a list of its steps:
 - Checks for all prerequisite parts.
 - Creates a .venv file if not already setup.
 - Creates a .env file if not already setup.

NOTE: Original boostrap was a .ps1 and was meant to be ran every fetch, but now it should only be ran at the beginning of the project setup.

## Syncing dependencies
To sync all dependencies and install them to the local machine use the ```./scripts/sync.py```. This script will install all python and npm dependencies for the project. This should be ran every fetch to make sure your installed packages match the current branch versions.

## Running
To run the project we use ```python run.py```. it runs both the flask API and the js frontend from a single console :).

## Maintainance
Dependencies have bugs and they can be exploited. Keeping up with all the latest depencies and what updates is hard so we developed a script for it: ```./scripts/update_deps.ps1```. This script looks at all of the dependencies for both python and for npm and installs the latests version. __This should only be run if you are planning on reading the changelogs to make sure nothing breaks__. While it is nice to update stuff, it can break stuff if developers remove stuff and do whatever so it is important that when you do this you must check if the updates break anything.

Thats all thanks :D!!!!