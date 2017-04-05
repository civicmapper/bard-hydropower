# layouts

Contains `head` and footer elements, with some shared body elements such as `Nav`.

Does not extend any templates; is a wrapper for other content ('blocks').

* `main` is the standard page template.
* `carto-ready` is the same as main, but also loads CARTO `css` and `js` files, and uses a `container-fluid` class for the main div for a full-width map.
* `form-narrow` is used to wrap the the small login, register, and forgot forms.