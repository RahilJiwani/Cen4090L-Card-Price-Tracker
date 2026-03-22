*Last updated 3/22/2026*
# Cen4090L-Card-Price-Tracker
Software engineering Lab project based around making a python program and website that aims to notify users when the price of a Magic The Gathering card falls below a certain amount.

## Prerequisites
- Python 3.14+ installed
- NodeJS and npm

## Setup
We have created multiple .ps1 scripts to run for workflow automation. All scripts are located in the ```./scripts``` directory. The first and main one is the ```./scripts/bootstrap.ps1```. The boostrap focuses on 2 parts:
- Initial setup
- Installing dependencies

First it runs checks for all prerequisites. Then it creates a venv for Python (if not already setup). Then it install all dependencies that are used in the project. Then it creates a .env (if not already setup). __Bootstrap should be ran in two cases: when the repo is first added and when dependencies are changed (likely every commit)__.

## Running
To run the project we use ```./scripts/run.ps1```. It will open two consoles: one for back-end and one for front-end. Currently these have to be closed manual, but we are looking for a solution ;(.

## Maintainance
Dependencies have bugs and they can be exploited. Keeping up with all the latest depencies and what updates is hard so we developed a script for it: ```./scripts/update_deps.ps1```. This script looks at all of the dependencies for both python and for npm and installs the latests version. __This should only be run if you are planning on reading the changelogs to make sure nothing breaks__. While it is nice to update stuff, it can break stuff if developers remove stuff and do whatever so it is important that when you do this you must check if the updates break anything.

Thats all thanks :D!!!!