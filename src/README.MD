# src

This folder contains uncompiled client-side `js` and `css` source code.

The task-runner (Gulp) compiles, bundles, and copies this code into the Python-Flask `static` folder, where the Flask application consumes it.

HTML templates are _not_ located here, as Flask handles those. They can be found in `app/templates`.
