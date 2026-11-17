# Mamkon Mercy Oyeleke · Data Analytics & BI Portfolio

**Live site:** [mamkon.github.io](https://mamkon.github.io) · **LinkedIn:** [mamkon-mercy-oyeleke](https://www.linkedin.com/in/mamkon-mercy-oyeleke/)

I turn public and organizational data into decisions people can defend. Each project below starts with a business question, runs the full pipeline from raw data to a report, and states its sources and limits plainly.

## Case studies

| Project | The question | Tools | Links |
| --- | --- | --- | --- |
| **Breast Biopsy PCA, with Canadian Context** | Can a team use 7 summary scores instead of 30 measurements and still catch nearly every cancer? Who in Canada waits longest for an answer? | Python, scikit-learn, SQL (SQLite), DAX, Power BI | [Case study](https://mamkon.github.io/breast-cancer-pca/) · [Dashboard](https://mamkon.github.io/breast-cancer-pca/dashboard/) · [Code](breast-cancer-pca/) |
| **Canada Wildfire Intelligence** | How many large fires does each alert policy miss, and how much review work does it create? | Python, scikit-learn, SQLite, Power BI | [Case study](https://mamkon.github.io/wildfire-triage/) · [Dashboard](https://mamkon.github.io/wildfire-triage/dashboard/) |
| **Ontario Air Quality Decision Research** | How does uncertainty in afternoon ozone across 47 Ontario locations change planning decisions? | Python, Power BI | [Case study](https://mamkon.github.io/air-quality-research/) · [Dashboard](https://mamkon.github.io/air-quality-research/dashboard/) |
| **Ontario Analytics** | How do chronic disease rates and procedure wait times vary across Ontario's Public Health Units and health regions? | Python, Power BI, DAX | [Dashboard](https://mamkon.github.io/ontario-analytics/) · [Data and code](ontario-analytics/) |

## How I work

1. **Start with the decision.** Every report answers a question a stakeholder actually has.
2. **Test honestly.** Models are cross-validated with preparation fitted inside each training fold.
3. **Trace every number.** Figures come from my own code or an official source, cited on the page. Numbers I can't trace don't go in.
4. **Say what the data can't tell you.** Limits, missing provinces and data gaps are stated, not hidden.
5. **Use AI tools openly.** I use Claude, Codex and Google Colab to build faster. The questions, analysis and insights are mine, and I check every figure.

## Repository layout

```text
.
├── index.html, styles.css, script.js   # Portfolio home page
├── breast-cancer-pca/                  # Case study, dashboard, SQL, Python, Power BI project
├── wildfire-triage/                    # Case study and dashboard
├── air-quality-research/               # Case study and dashboard
└── ontario-analytics/                  # Dashboard on Public Health Ontario and CIHI data
```

The site is plain HTML, CSS and JavaScript served by GitHub Pages, with no build step. Each project folder has its own README where it needs one.

## Data notices

All case studies in this portfolio use public, openly licensed data from named publishers such as Statistics Canada, Public Health Ontario, CIHI and the UCI Machine Learning Repository. No private, patient-level or confidential data is used. The work is for learning and demonstrating analytical method. It is not clinical advice or official statistics, and every source is credited on its page.

Canadian cancer data is adapted from Statistics Canada. This does not constitute an endorsement by Statistics Canada of this product. Other sources are cited on each project page.
