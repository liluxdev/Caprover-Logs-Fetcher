# CapRover Logs Fetcher

## Overview

The CapRover Logs Fetcher is a Node.js and HTML5 based project designed to securely fetch logs from CapRover instances. This tool is especially useful for development teams who need access to specific application logs without sharing the CapRover root password. It provides a secure and convenient view for developers, offering detailed information about each instance related to a project.

## Features

- **Secure Log Access:** Fetches logs from CapRover securely, allowing selective access to specific application logs.
- **Developer-Friendly Interface:** Provides an easy-to-use interface for developers to view logs and application details.
- **Multiple Instance Deployment:** Can be deployed on multiple instances within CapRover, each fetching logs from specified apps.
- **HTTPS Enforced:** Ensures secure access by enforcing HTTPS on all connections.

## Deployment

This application should be deployed on the CapRover instance from which you wish to export the logs. Follow these steps for deployment:

1. **Deploy on CapRover:** Deploy the application on CapRover where you want to export the logs.
2. **Environment Variables Setup:** Configure the following environment variables:
   - `SECRET`: Use a random SHA-256 string as the secret. This is crucial for securing access.
   - `ALLOWED_APPS`: Comma-separated values of the names of apps whose logs you wish to export.
   - `CAPROVER_PASSWORD`: The root password of your CapRover instance.
   - `CAPROVER_URL`: The base URL of your CapRover instance, ending with a slash (/).

## Usage

Once deployed, the app will be accessible securely at the following URL:

https://<hostname_of_caprover_instance_log_fetcher>?appName=<one_of_the_allowed_apps>&secret=<secret>


Replace `<hostname_of_caprover_instance_log_fetcher>`, `<one_of_the_allowed_apps>`, and `<secret>` with the appropriate values.

## Security Note

- Ensure that the `SECRET` is kept confidential and is known only to authorized personnel.
- Regularly update the `ALLOWED_APPS` list to reflect the current state of your development environment.


Replace `<hostname_of_caprover_instance_log_fetcher>`, `<one_of_the_allowed_apps>`, and `<secret>` with the appropriate values.

## Security Note

- Ensure that the `SECRET` is kept confidential and is known only to authorized personnel.
- Regularly update the `ALLOWED_APPS` list to reflect the current state of your development environment.

## Contributing

Contributions to improve CapRover Logs Fetcher are welcome. Please follow standard GitHub pull request procedures to submit your changes for review.

## License

MIT License

Copyright (c) 2023 Lilux.dev di Stefano Gargiulo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


---

**Note:** This README is for a project that securely fetches and displays logs from CapRover instances. Modify it as needed to suit the specifics of your implementation.



