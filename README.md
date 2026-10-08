# Global Social Media Experiment: secondary analyses site

Information page for collaborators on the [Global Social Media Experiment](https://globalsocialmediastudy.com/): approved secondary analysis projects, the forecasting survey, and how to get the data.

It's a static site served by GitHub Pages, with no build step.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All page text, including the FAQ |
| `data/projects.json` | The approved projects shown in the table |
| `assets/style.css` | Styles |
| `assets/main.js` | Loads the projects table and draws the hero chart |

## Updating the project list

Edit `data/projects.json`. Each project is one entry:

```json
{
  "title": "Project name",
  "researchers": ["First Researcher", "Second Researcher"],
  "description": "One or two sentences about the project.",
  "preregistration": "https://osf.io/abcde"
}
```

List the people tied to the project in `researchers`. Leave `preregistration` as `""` when there isn't one yet, and the table will show "Not yet available". Projects appear in the order they're listed in the file. Check the file is valid JSON (for example with `python3 -m json.tool data/projects.json`) before pushing, because a syntax error stops the whole table from loading.

## Changing the survey link

The survey button currently points to `https://example.com`. Replace every occurrence in `index.html`. Each survey link is marked with `data-survey-link`.

## Content still to confirm

Text that makes assumptions about the process is marked with `<!-- TODO -->` comments in `index.html`.

## Previewing locally

The table is loaded with `fetch`, which doesn't work when you open `index.html` directly from disk. Run a local server instead:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.
