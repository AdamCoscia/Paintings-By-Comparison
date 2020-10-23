# Paintings by Comparison

[Include logo/demo screenshot etc.]

## About

Explain the project.

## How to Use

Show examples of running the project!

## Installation

_Relax, it won't take that much time to install :)_

First, clone this repo to your local machine, then move ahead.

### 0. Important Notes

- **We do not guarantee that this system will work outside of the versions listed below.**
- If you need to run different versions of Node.js in your local environment, consider installing [Node Version Manager (nvm)](https://github.com/creationix/nvm) or [Node Version Manager (nvm) for Windows](https://github.com/coreybutler/nvm-windows).
  - Install this **BEFORE** your first installation of Node.js!
- We recommend using [pip](https://pip.pypa.io/en/stable/) package installer for Python packages

### 1. Install Node.js, npm and packages

1. Install [Node.js v12.18.4 LTS](https://nodejs.org/en/) and [npm v6.14.6](https://docs.npmjs.com/cli/npm)
   - You can download a Node.js installer for your operating system from <https://nodejs.org/en/download/>
   - By installing Node.js, you also get npm, which is a command line executable for downloading and managing Node.js packages.
     - Check the version of Node.js and npm that you have installed by running `node -v` and `npm -v` from the command line/terminal
   - Be careful of conflicting with existing installations of Node.js on your machine!
2. Open your command line/terminal and navigate to the _app/_ directory of this repo
3. Either run:
   - `npm ci` **(Preferred, ensure that the package-lock.json is not modified from when you cloned the repository)**
     - installs required libraries from _package-lock.json_
   - `npm install` **(Not recommended. Only use if adding a new dependency)**
     - installs required libraries from _package.json._
4. Run `npm start` in the same directory:
   - This should spin up a webpage automatically at <http://localhost:3000/>
   - If you see a landing page for the project, then congrats! You're ready to start working on the app!
5. When you want to close the app, hit `COMMAND/CTRL+C` and type `Y`

### 2. Install Python, venv and packages

1. Install [Python 3.8](https://www.python.org/)
   - You can download a Python installer for your operating system from <https://www.python.org/downloads/release/python-380/>
2. Open your command line/terminal (if not open from installing Node.js) and navigate to the _server/_ directory of this repo
3. Run the following commands based on which operating system you use:

---

#### Windows

- `py -3.8 -m venv venv` - create a python3 virtual environment called _venv_ in the current directory
- `venv\Scripts\activate.bat` - enters the virtual environment
  - **FROM THIS POINT ON: only use `python` command to invoke interpeter, avoid using global command `py`!!**
  - You can check you're using the correct interpreter by running `WHERE python`
    - It should display this path at the top of the list: `C:\> <path-to-repo>\CS7450-F20-Project\server\venv\Scripts\python.exe`
    - This means you are using the interpreter executable specific to the virtual environment
- `python -m pip install -r requirements.txt` - installs required libraries local to this project environment

#### MacOS/Linux

- `python3.8 -m venv venv` - create a python3 virtual environment called _venv_ in the current directory
- `source venv/bin/activate` - enters the virtual environment
  - **FROM THIS POINT ON: only use `python` command to invoke interpeter, avoid using global command `python3.8`!!**
  - You can check you're using the correct interpreter by running `which python`
    - It should display this path: `<path-to-repo>/CS7450-F20-Project/server/venv/bin/python.exe`
    - This means you are using the interpreter executable specific to the virtual environment
- `python -m pip install -r requirements.txt` - installs required libraries local to this project environment

---

4. Navigate to _server/src/_
5. Run `python example.py`
   - If a list of Bach's children comes up, then congrats! You're ready to start working on the server!
6. When you want to exit the virtual environment, run `deactivate` from the command line/terminal

## Acknowledgement

```
Georgia Institute of Technology
CS 7450 Information Visualization
Fall 2020
```

Developed by:

- [Adam Coscia](mailto:acoscia6@gatech.edu) ([Personal Site](https://adamcoscia.github.io))
- [Vijay Marupudi](mailto:vijaymarupudi@gatech.edu)

Thank you to these contributors!

- [Rojin Aliehyaei](mailto:rojin@gatech.edu)
- [Akshay Karthik](mailto:akarthik3@gatech.edu)


## License Information

> Licensed under the Apache License, Version 2.0 ([Link](http://www.apache.org/licenses/LICENSE-2.0))
