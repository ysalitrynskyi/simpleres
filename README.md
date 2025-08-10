# SimpleRes

A minimalist, open-source menu bar utility for macOS to quickly switch screen resolutions. SimpleRes provides access to both user-friendly scaled "Retina" resolutions and advanced hardware display modes.

![SimpleRes Screenshot](https://raw.githubusercontent.com/ysalitrynskyi/simpleres/refs/heads/main/.github/screenshot.png)

## Features

-   **Complete Resolution List:** Access both scaled resolutions (like in System Settings) and raw hardware modes.
-   **Minimalist UI:** A clean, simple dropdown menu that lives in your menu bar.
-   **Lightweight:** Built with Electron and two small, efficient native helper tools.
-   **Open Source:** Free to use, modify, and distribute.

## Installation

SimpleRes relies on two command-line tools. Please follow these steps to get the app running.

### 1. Install Dependencies with Homebrew

This app requires the `displayplacer` utility to manage scaled resolutions. The easiest way to install it is with [Homebrew](https://brew.sh/).

-   **If you don't have Homebrew installed**, open your Terminal and run this command:
    ```bash
    /bin/bash -c "$(curl -fsSL [https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh](https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh))"
    ```

-   **Once Homebrew is ready**, install `displayplacer`:
    ```bash
    brew install displayplacer
    ```

### 2. Use the Included Hardware Tool

The second helper tool, `screenresolution`, is included in this repository as a pre-compiled universal binary, which should work on both Apple Silicon and Intel Macs. You do not need to compile it.

-   **Troubleshooting for Intel Macs:** If you are on an older Intel-based Mac and the included `screenresolution` binary does not work, you may need to compile it from the original source code. To do this:
    1.  Download the source code from the [original repository](https://github.com/williamla/screenresolution/tree/collected).
    2.  Navigate to the downloaded folder in your Terminal and run `make`.
    3.  Replace the `screenresolution` executable in this project's folder with the new one you just compiled.

### 3. Run the App

Once the dependencies are ready, you can run the application.

-   Install Node.js dependencies:
    ```bash
    npm install
    ```
-   Start the app:
    ```bash
    npm start
    ```
-   Build:
    ```bash
    npm run dist
    ```

## Contributing

This is an open-source project, and contributions are welcome! Whether it's a bug report, a feature request, or a code contribution, please feel free to open an issue or submit a pull request on the GitHub repository.

## Support This Project

If you find SimpleRes useful, please consider supporting its development. Donations are greatly appreciated and help me dedicate more time to maintaining and improving this tool.

You can support me on my GitHub page. Thank you!

## Acknowledgements

This application would not be possible without the excellent open-source tools it is built upon.

-   The C code for the `screenresolution` hardware tool was originally created by John Ford and is available on GitHub at [williamla/screenresolution](https://github.com/williamla/screenresolution/tree/collected).
-   The `displayplacer` utility is maintained by the community on GitHub.
