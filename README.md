# Nirikshan 133 --- Setup & Installation Guide

This guide explains how to clone, install, configure, and run the
**Nirikshan 133** project locally from a fresh machine.

## Project Repository

GitHub repository:

https://github.com/AnshumanTiwari2006/nirikshan_133

## Dataset

The project dataset is not stored directly in the GitHub repository
because of its large size.

Download the required `data` folder from Google Drive:

https://drive.google.com/drive/folders/1GhPEXwonaxv0M181pRe5-zOFzXuIbHi3?usp=sharing

After downloading/extracting it, place the complete `data` folder
directly inside the project root.

------------------------------------------------------------------------

# 1. Prerequisites

Before starting, make sure the following are installed:

-   Git
-   Node.js
-   npm
-   Python 3.10 or newer
-   A modern web browser
-   Internet connection

Verify the installations:

``` bash
git --version
node --version
npm --version
python --version
```

------------------------------------------------------------------------

# 2. Clone the Repository

Clone the GitHub repository:

``` bash
git clone https://github.com/AnshumanTiwari2006/nirikshan_133.git
```

Move into the project directory:

``` bash
cd nirikshan_133
```

The project should contain directories/files similar to:

``` text
nirikshan_133/
│
├── backend/
├── frontend/
├── New_Model/
├── models/
├── mplads_pipeline.ipynb
├── mplads_phase2_features.py
├── mplads_etl_phase1.py
├── README.md
├── .gitignore
└── .gitattributes
```

------------------------------------------------------------------------

# 3. Install Frontend Dependencies

Open a terminal in the project root and enter the frontend directory:

``` bash
cd frontend
```

Install the required Node.js packages:

``` bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is used to allow npm to install the
project's dependencies when peer-dependency conflicts are encountered.

After installation, return to the project root:

``` bash
cd ..
```

------------------------------------------------------------------------

# 4. Set Up the Python Backend

Navigate to the backend:

``` bash
cd backend
```

Create a Python virtual environment:

``` bash
python -m venv venv
```

## Windows

Activate the virtual environment:

``` bash
venv\Scripts\activate
```

After activation, your terminal should show something similar to:

``` text
(venv)
```

at the beginning of the command prompt.

------------------------------------------------------------------------

# 5. Install Backend Dependencies

With the virtual environment activated, install the Python dependencies:

``` bash
pip install -r requirements.txt
```

Wait for the installation to finish successfully.

------------------------------------------------------------------------

# 6. Download and Place the Dataset

Download the dataset from the following Google Drive folder:

**Google Drive Dataset:**

https://drive.google.com/drive/folders/1GhPEXwonaxv0M181pRe5-zOFzXuIbHi3?usp=sharing

Download the required `data` folder.

The final project structure must contain:

``` text
nirikshan_133/
│
├── backend/
├── frontend/
├── New_Model/
├── models/
├── data/
│   ├── <dataset files>
│   └── ...
│
├── mplads_pipeline.ipynb
├── mplads_phase2_features.py
├── mplads_etl_phase1.py
└── README.md
```

## Important

The `data` folder must be placed **directly inside the `nirikshan_133`
project root**.

### Correct

``` text
nirikshan_133/data/
```

### Incorrect

``` text
nirikshan_133/backend/data/
```

``` text
nirikshan_133/frontend/data/
```

``` text
nirikshan_133/nirikshan_133/data/
```

The application expects the dataset at the project-root `data/`
location.

------------------------------------------------------------------------

# 7. Start the Frontend

Open a **new terminal**.

Navigate to the project:

``` bash
cd nirikshan_133
```

Then enter the frontend directory:

``` bash
cd frontend
```

Start the frontend development server:

``` bash
npm run dev
```

The terminal should display a local URL, typically similar to:

``` text
http://localhost:5173
```

Open the displayed URL in your browser.

**Keep this terminal running.**

------------------------------------------------------------------------

# 8. Start the Backend

Open a **second terminal**.

Navigate to the backend:

``` bash
cd nirikshan_133/backend
```

Activate the Python virtual environment:

``` bash
venv\Scripts\activate
```

Then start the backend:

``` bash
python main.py
```

**Keep this terminal running as well.**

------------------------------------------------------------------------

# 9. Run the Complete Application

The application requires both the frontend and backend to be running
simultaneously.

## Terminal 1 --- Frontend

``` bash
cd nirikshan_133/frontend
npm run dev
```

## Terminal 2 --- Backend

``` bash
cd nirikshan_133/backend
venv\Scripts\activate
python main.py
```

Once both services are running, open the frontend URL provided by the
frontend development server, for example:

``` text
http://localhost:5173
```

The frontend will communicate with the Python backend and the complete
application should be operational.

------------------------------------------------------------------------

# Quick Setup

For a machine that already has Git, Node.js/npm, and Python installed:

``` bash
git clone https://github.com/AnshumanTiwari2006/nirikshan_133.git
cd nirikshan_133

cd frontend
npm install --legacy-peer-deps
cd ..

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Then download the dataset from:

https://drive.google.com/drive/folders/1GhPEXwonaxv0M181pRe5-zOFzXuIbHi3?usp=sharing

Place the downloaded `data` folder here:

``` text
nirikshan_133/data/
```

Then start the application using two terminals.

### Terminal 1

``` bash
cd nirikshan_133/frontend
npm run dev
```

### Terminal 2

``` bash
cd nirikshan_133/backend
venv\Scripts\activate
python main.py
```

Open the frontend URL shown in Terminal 1.

------------------------------------------------------------------------

# Troubleshooting

## `npm install` dependency errors

Try:

``` bash
npm install --legacy-peer-deps
```

Make sure you are running the command inside:

``` text
nirikshan_133/frontend/
```

------------------------------------------------------------------------

## `python` is not recognized

Verify Python installation:

``` bash
python --version
```

If Python is installed but the command does not work, make sure Python
is added to the system PATH.

------------------------------------------------------------------------

## Virtual environment activation fails

From the backend directory, on Windows run:

``` bash
python -m venv venv
```

Then:

``` bash
venv\Scripts\activate
```

If PowerShell execution policy prevents activation, use Command Prompt
(`cmd`) or configure the PowerShell execution policy appropriately.

------------------------------------------------------------------------

## Backend cannot find the dataset

Verify that the dataset is located exactly at:

``` text
nirikshan_133/data/
```

and not inside `backend/` or `frontend/`.

------------------------------------------------------------------------

# Final Expected Structure

After completing the setup, the project should approximately look like:

``` text
nirikshan_133/
│
├── backend/
│   ├── venv/
│   ├── requirements.txt
│   ├── main.py
│   └── ...
│
├── frontend/
│   ├── node_modules/
│   ├── package.json
│   └── ...
│
├── data/
│   └── <project dataset>
│
├── New_Model/
├── models/
├── mplads_pipeline.ipynb
├── mplads_phase2_features.py
├── mplads_etl_phase1.py
├── README.md
├── .gitignore
└── .gitattributes
```

------------------------------------------------------------------------

# Run Checklist

Before starting the demo, verify:

-   [ ] Repository has been cloned successfully.
-   [ ] Frontend dependencies are installed.
-   [ ] Backend virtual environment has been created.
-   [ ] Backend dependencies are installed.
-   [ ] Dataset has been downloaded from Google Drive.
-   [ ] `data/` is directly inside `nirikshan_133/`.
-   [ ] Frontend is running with `npm run dev`.
-   [ ] Backend is running with `python main.py`.
-   [ ] Frontend URL opens successfully in the browser.

## Repository

https://github.com/AnshumanTiwari2006/nirikshan_133

## Dataset

https://drive.google.com/drive/folders/1GhPEXwonaxv0M181pRe5-zOFzXuIbHi3?usp=sharing
