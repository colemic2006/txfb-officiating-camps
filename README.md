# txfb-officiating-camps — not the live site

**This repository does not serve anything at officiatebetter.com.**

The live Officiate Better site is served by GitHub Pages from the user site
repo **[`colemic2006/colemic2006.github.io`](https://github.com/colemic2006/colemic2006.github.io)**,
which owns the `CNAME` for the domain. Make all content edits there:

- Landing page: `index.html`
- Camps & clinics directory: `camps-and-clinics/`

The rules quiz is a separate project repo, `colemic2006/officiate-better-quiz`,
deployed via GitHub Actions and served at the `/officiate-better-quiz/` path.

This repo was used for edits before it was understood that the user site owns
the domain. It is kept only for reference and should not be treated as the
source of the live site. Setting `officiatebetter.com` as its custom domain
fails ("already taken") because `colemic2006.github.io` owns it.
