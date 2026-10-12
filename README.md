# Global Social Media Experiment: secondary analyses site

Public list of approved secondary analyses of the [Global Social Media Experiment](https://globalsocialmediastudy.com/), with the researchers on each project and links to their preregistrations and papers.

It's a static site served by GitHub Pages, with no build step.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All page text, including the FAQ |
| `data/projects.json` | The approved projects shown in the table |
| `assets/style.css` | Styles |
| `assets/main.js` | Loads the projects table and the summary counts at the top of the page |

## Updating the project list

Edit `data/projects.json`. Each project is one entry:

```json
{
  "title": "Project name",
  "researchers": ["First Researcher", "Second Researcher"],
  "description": "One or two sentences about the project.",
  "preregistration": "https://osf.io/abcde",
  "paper": "https://doi.org/10.xxxx/xxxxx"
}
```

List the people tied to the project in `researchers`. Leave `preregistration` or `paper` as `""` when there isn't one yet, and the table will show "Not yet available". `paper` can point to a preprint or the published paper. Only add projects the leadership team has approved. Projects appear in the order they're listed in the file. Check the file is valid JSON (for example with `python3 -m json.tool data/projects.json`) before pushing, because a syntax error stops the whole table from loading.

## Previewing locally

The table is loaded with `fetch`, which doesn't work when you open `index.html` directly from disk. Run a local server instead:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.
