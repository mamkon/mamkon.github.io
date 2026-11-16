# Canadian Oncology Executive · Power BI build guide

Extract **oncology-powerbi-report.zip**, then open **reference-report/Canadian Oncology Executive - Four Pages.pbip** in Power BI Desktop. Use this project as the template when exact appearance matters. Its report definitions carry the original visual positions, per-visual padding, fonts and weights, data bindings, and navigation actions. The accompanying theme is for new reports or visuals. Importing a theme does not reproduce hand-positioned containers or individual formatting overrides.

Reference used for this build: the saved manual Power BI project and the available Canadian Oncology Executive - Four Pages.pdf export. The separately named _2.pdf was unavailable. The template contains the six designed pages from the saved manual project. The empty seventh page is excluded.

On first open, select Refresh now if Desktop reports incomplete data. The archive embeds the simulated quarterly SLA summary used by the report model.

## Canvas and branding

- Use a 1280 × 720 white (#FFFFFF) canvas on each page.
- Use deep berry (#831843) for banners and footer pills. The palette also includes dark maroon (#500021).
- Use soft blush (#FDF2F8) and rose white (#FFF1F2) for card surfaces, with pink borders (#FBCFE8) and soft pink fills (#FCE7F3) where used in the reference project.
- Use emerald (#059669, #10B981) for standard categories and benign points, and magenta and awareness pink (#DB2777, #F57EB6) for malignant and highlighted series where the chart distinguishes them by color.
- Keep the notched pink ribbon in the upper-left banner. Reuse the report's embedded PinkRibbon.png and its per-page scale and placement.
- Use Segoe UI. Preserve the existing bold white banner text and the per-page title sizes. Keep the saved font sizes, weights, background treatments, padding, and corner radii for each card, chart, slicer, and note.
- Keep the five footer pills in the saved order, with their original labels, dimensions and Page navigation destinations. Ctrl+click tests navigation in Desktop edit mode.

## Page content and verification

| Page | Required content |
| --- | --- |
| Executive Overview | Ribbon and banner, cohort slicer, four KPIs (98.44%, 91.01%, 76.7%, 95.8 h), case-level PCA scatter, diagnosis column chart, executive note, footer pills |
| Report Categories | Context banner, cohort slicer, PCA scatter and diagnosis ring, false negatives (1), sensitivity (98.44%), stratified validation table and evaluation note |
| Patient Demographics | Banner and cohort slicer, synthetic age-band donut, biopsy count by simulated cohort |
| Wait Times & Doctor Access | Cohort, age band and diagnosis slicers, 236 cases past 14 days at default filters, consult-days/access combo, measures table, SLA governance note |
| Biopsy & Model Results | Native cards for 569 total, 212 malignant, 357 benign, 95.91% accuracy, 98.44% sensitivity and 94.39% specificity, diagnosis donut (37.26% and 62.74%), holdout notes |
| Biopsy Image Findings | Six median-by-diagnosis charts for nuclear area, border indentations, texture, shape symmetry, border smoothness, and boundary complexity |

## Model and report editing

- Keep Diagnosis, Age Band, and Cohort on the one side of active relationships to Cases. Use single-direction filtering from each dimension to Cases. Preserve the saved benchmark and quarterly summary tables as independent tables.
- In the current report, **Cases[Case ID]** is the biopsy row key. The source export calls this concept **patient_id**. Use the row key in the scatter's **Values / Details** field well (Category in the saved visual definition), PC1 and PC2 on the axes, and recorded diagnosis for the series. The row key must remain at case level.
- Use Average or Median for any numerical patient age field added from a source. The existing demographics page counts cases by simulated age band.
- Maintain the distinction between recorded diagnosis, simulated access/demographic fields, and the internal holdout metrics. Run KPI checks with slicers cleared.
- For exact reproduction, copy a visual from the reference project and inspect the original Format pane, including General → Properties and Effects. Use the layout index below to find the visual. The saved visual definition is authoritative for precision beyond the displayed decimal and for all per-visual styling.
- After changes, clear selections, compare the six pages with the reference at Fit to page, and check that the PDF export has six pages. Inspect subtitles, axis labels, visual edges, and navigation alignment in the export.

## Layout index

Positions and sizes are in canvas units, rounded to 0.1 for readability.

### Executive Overview

| Visual | Type | X | Y | Width | Height |
| --- | --- | ---: | ---: | ---: | ---: |
| f425bc77a74e09769822 | image | 20.2 | 0 | 100 | 85.4 |
| Breast Cancer Analysis | textbox | 117.3 | 0 | 815.7 | 121.1 |
| Simulated cohort | slicer | 932.9 | 14.2 | 300.2 | 96.6 |
| Projected hours per 1,000 cases | cardVisual | 948.4 | 110.8 | 284.8 | 123.7 |
| Malignant sensitivity · internal holdout | cardVisual | 20.6 | 121.1 | 354.4 | 130.1 |
| Feature dimensions removed | cardVisual | 690.7 | 121.1 | 257.7 | 113.4 |
| Standardized variance retained · 7 PCs | cardVisual | 371.1 | 125 | 309.3 | 121.1 |
| Biopsies by recorded diagnosis | columnChart | 680.4 | 234.5 | 579.9 | 360.8 |
| PC1 vs. PC2 by recorded diagnosis | scatterChart | 20.6 | 243.5 | 649.5 | 351.8 |
| 569 FNA cases · 30 measured features · 0 missing values. Holdout detected 63 of… | textbox | 20.7 | 595.2 | 1239.5 | 91.9 |
| Report Categories → | actionButton | 19.4 | 661.1 | 240.6 | 58.2 |
| Patient Demographics → | actionButton | 270.4 | 670.2 | 239.4 | 49.2 |
| Wait Times & Doctor Access → | actionButton | 520.1 | 670.2 | 239.4 | 49.2 |
| Biopsy & Model Results → | actionButton | 769.8 | 670.2 | 240.6 | 49.2 |
| Biopsy Image Findings → | actionButton | 1019.5 | 670.2 | 240.6 | 46.6 |

### Report Categories

| Visual | Type | X | Y | Width | Height |
| --- | --- | ---: | ---: | ---: | ---: |
| 767df957edcb1df94cee | image | 10.1 | 0 | 93.2 | 87.6 |
| Report Categories | textbox | 103.4 | 0 | 1156 | 86.5 |
| Diagnostic labels were held outside PCA fitting. Model evaluation fits pre-proc… | textbox | 20.2 | 86.5 | 895.4 | 74.1 |
| Simulated cohort | slicer | 923.5 | 87.6 | 335.9 | 73 |
| False negatives · internal holdout | cardVisual | 640.4 | 168.5 | 300 | 121.3 |
| Malignant sensitivity · internal holdout | cardVisual | 941.5 | 168.5 | 301.1 | 121.3 |
| PC1 vs. PC2 by recorded diagnosis | scatterChart | 20.2 | 176.4 | 620.2 | 335.9 |
| Five-fold stratified validation · same WDBC cohort | tableEx | 650.5 | 331.4 | 608.9 | 198.9 |
| Biopsies by recorded diagnosis | donutChart | 20.2 | 520.2 | 620.2 | 165.1 |
| Holdout: 63 true positives, 1 false negative, 6 false positives, 101 true negat… | textbox | 650 | 530 | 610 | 155 |
| Biopsy Image Findings → | actionButton | 1020 | 685 | 240 | 32 |
| ← Executive Overview | actionButton | 20 | 689 | 240 | 30 |
| Patient Demographics → | actionButton | 270 | 689 | 240 | 30 |
| Wait Times & Doctor Access → | actionButton | 520 | 689 | 240 | 30 |
| Biopsy & Model Results → | actionButton | 770 | 689 | 240 | 30 |

### Patient Demographics

| Visual | Type | X | Y | Width | Height |
| --- | --- | ---: | ---: | ---: | ---: |
| Patient Demographics | textbox | 105.6 | 13.5 | 1142.6 | 89.9 |
| 5faebf9652395d30bf96 | image | 20.2 | 18 | 85.4 | 80.9 |
| Simulated cohort | slicer | 925 | 113 | 335 | 84 |
| Case mix by simulated age band and cohort. Demographic fields are synthetic. | textbox | 20.2 | 113.5 | 892 | 89.9 |
| Biopsy cases by simulated age band | donutChart | 20.2 | 207.8 | 610 | 457.3 |
| Biopsy cases by simulated cohort | barChart | 650.5 | 207.8 | 610 | 457.3 |
| Biopsy Image Findings → | actionButton | 1020 | 685 | 240 | 32 |
| ← Executive Overview | actionButton | 20 | 689 | 240 | 30 |
| ← Report Categories | actionButton | 270 | 689 | 240 | 30 |
| Wait Times & Doctor Access → | actionButton | 520 | 689 | 240 | 30 |
| Biopsy & Model Results → | actionButton | 770 | 689 | 240 | 30 |

### Wait Times & Doctor Access

| Visual | Type | X | Y | Width | Height |
| --- | --- | ---: | ---: | ---: | ---: |
| 5faebf9652395d30bf96 | image | 20.6 | 0 | 119.8 | 167.5 |
| Wait Times & Doctor Access | textbox | 140.5 | 0 | 1110.8 | 91.5 |
| Synthetic demographic and access data. Cohort patterns demonstrate an audit wor… | textbox | 140.5 | 91.5 | 1110.8 | 73.5 |
| Simulated age band | slicer | 341.5 | 167.5 | 314.4 | 97.9 |
| Cases past 14 days | cardVisual | 994.8 | 167.5 | 265.5 | 104.4 |
| Simulated cohort | slicer | 11.6 | 171.4 | 315.7 | 90.2 |
| Diagnosis | slicer | 673.9 | 171.4 | 314.4 | 94.1 |
| Mean consult days and access score by simulated cohort | lineClusteredColumnComboChart | 20.6 | 278.3 | 684.2 | 313.1 |
| Simulated access measures · minimum cohort size 6 | tableEx | 704.9 | 278.3 | 567 | 313.1 |
| The 14-day SLA is a demonstration rule. For clinical use, trace any flag to ori… | textbox | 20.6 | 591.5 | 1239.6 | 86.3 |
| Biopsy Image Findings → | actionButton | 1020.6 | 668.8 | 239.7 | 47.7 |
| ← Executive Overview | actionButton | 20.6 | 677.8 | 239.7 | 41.2 |
| ← Report Categories | actionButton | 259 | 677.8 | 239.7 | 42.5 |
| ← Patient Demographics | actionButton | 520.6 | 677.8 | 239.7 | 41.2 |
| Biopsy & Model Results → | actionButton | 770.6 | 677.8 | 239.7 | 41.2 |

### Biopsy & Model Results

| Visual | Type | X | Y | Width | Height |
| --- | --- | ---: | ---: | ---: | ---: |
| 0086f2c05f7c75ae7153 | image | 20.6 | 0 | 155.9 | 140.5 |
| Biopsy & Model Results | textbox | 176.5 | 0 | 1083.7 | 140.5 |
| Total biopsy cases | cardVisual | 29.6 | 140.5 | 399.5 | 109.5 |
| Benign biopsy cases | cardVisual | 849.2 | 140.5 | 400.8 | 100.5 |
| Malignant biopsy cases | cardVisual | 438.1 | 146.9 | 400.8 | 97.9 |
| Internal holdout accuracy | cardVisual | 20.6 | 250 | 399.5 | 109.5 |
| Internal holdout sensitivity | cardVisual | 429.1 | 250 | 400.8 | 109.5 |
| Internal holdout specificity | cardVisual | 849.2 | 250 | 400.8 | 108.2 |
| Biopsies by recorded diagnosis | donutChart | 39.9 | 380.1 | 569.6 | 340.2 |
| Internal holdout results | textbox | 610.8 | 380.1 | 650.7 | 163.7 |
| Diagnosis mix covers all 569 cases. Performance figures cover the 171-case inte… | textbox | 609.5 | 554.1 | 650.7 | 108.2 |
| ← Executive Overview | actionButton | 20.6 | 662.3 | 239.7 | 56.7 |
| ← Report Categories | actionButton | 270.6 | 673.9 | 239.7 | 45.1 |
| ← Patient Demographics | actionButton | 520.6 | 673.9 | 239.7 | 45.1 |
| ← Wait Times & Doctor Access | actionButton | 770.6 | 673.9 | 239.7 | 45.1 |
| Biopsy Image Findings → | actionButton | 1020.6 | 673.9 | 239.7 | 42.5 |

### Biopsy Image Findings

| Visual | Type | X | Y | Width | Height |
| --- | --- | ---: | ---: | ---: | ---: |
| d7f924f68bcebaa3a6d9 | image | 20.6 | 0 | 131.4 | 131.4 |
| Biopsy Image Findings | textbox | 152.1 | 0 | 1097.9 | 113.4 |
| Median Nuclear Area by Diagnosis | columnChart | 20 | 114 | 408 | 255 |
| Median Nuclear Border Indentations by Diagnosis | columnChart | 436 | 114 | 408 | 255 |
| Median Nuclear Texture by Diagnosis | columnChart | 852 | 114 | 408 | 255 |
| Median Nuclear Shape Symmetry by Diagnosis | columnChart | 20 | 384 | 408 | 255 |
| Median Nuclear Border Smoothness by Diagnosis | columnChart | 436 | 384 | 408 | 255 |
| Median Nuclear Boundary Complexity by Diagnosis | columnChart | 852 | 384 | 408 | 255 |
| ← Executive Overview | actionButton | 20.6 | 659.8 | 239.7 | 56.7 |
| ← Report Categories | actionButton | 280.9 | 659.8 | 239.7 | 52.8 |
| ← Patient Demographics | actionButton | 520.6 | 659.8 | 239.7 | 56.7 |
| ← Wait Times & Doctor Access | actionButton | 770.6 | 659.8 | 239.7 | 56.7 |
| ← Biopsy & Model Results | actionButton | 1020.6 | 659.8 | 239.7 | 56.7 |


