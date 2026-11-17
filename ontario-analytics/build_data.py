import pandas as pd, json, sys
# Builds ontario-public-data.json from the Public Health Ontario and CIHI workbooks.
# Usage: python build_data.py ontario-public-data.json <folder holding the two publisher .xlsx files>
import os
src=os.path.join(sys.argv[2] if len(sys.argv)>2 else '.','')
p=pd.read_excel(src+'PHO_Chronic_Disease_Inc_Prev_Snapshot_2014_2023.xlsx',header=2)
p.columns=['Indicator','Measure','Year','Geography','Rate','CI','Cases','Population','Sig','Flag']
p=p[p.Measure=='Age-standardized rate (both sexes)']
regions={'Central East','Central West','East','North East','North West','South West','Toronto'}
def num(v): return None if pd.isna(v) else round(float(v),1)
def flag(v): return '' if pd.isna(v) else 'Suppressed (1 to 4 cases)'
phu=p[~p.Geography.isin(regions|{'Ontario'})]
assert phu.Geography.nunique()==29, phu.Geography.nunique()
pho=[{'Indicator':r.Indicator,'Year':int(r.Year),'Geography':r.Geography,'Rate':num(r.Rate),'ConfidenceInterval':'' if pd.isna(r.CI) else str(r.CI),'SuppressionFlag':flag(r.Flag)} for r in phu.itertuples()]
on=p[p.Geography=='Ontario']
prov=[{'Indicator':r.Indicator,'Year':int(r.Year),'Rate':num(r.Rate),'ConfidenceInterval':'' if pd.isna(r.CI) else str(r.CI),'SuppressionFlag':flag(r.Flag)} for r in on.itertuples()]
inds=[]
for i in p.Indicator.unique():
    stat,dis=i.split(' of ',1); inds.append({'Indicator':i,'Disease':dis.replace(' in adults 20+',''),'Statistic':stat})
c=pd.read_excel(src+'CIHI_Wait_Times_Priority_Procedures_2025.xlsx',sheet_name='Table 1',header=1)
c=c[(c.Province=='Ontario')]
c=c[c['Data year'].astype(str).str.fullmatch(r'\d{4}')]
c['Year']=c['Data year'].astype(int)
c['Val']=pd.to_numeric(c['Indicator result'],errors='coerce')
key={'50th Percentile':'MedianDays','90th Percentile':'P90Days','% Meeting Benchmark':'BenchmarkPct','Volume':'Volume'}
def build(df,procs,cols):
    out=[]
    df=df[df.Indicator.isin(procs)]
    dup=df.duplicated(cols+['Metric']).sum(); assert dup==0, ('dups',dup)
    for k,g in df.groupby(cols):
        k=k if isinstance(k,tuple) else (k,)
        r=dict(zip([{'Indicator':'Procedure','Region':'Region','Year':'Year'}[x] for x in cols],k))
        for m,v in zip(g.Metric,g.Val): r[key[m]]=None if pd.isna(v) else (int(v) if m=='Volume' else round(float(v),1))
        for kk in key.values(): r.setdefault(kk,None)
        r['Year']=int(r['Year']); out.append(r)
    return out
pw=build(c[c['Reporting level']=='Provincial'],['Hip Replacement','Knee Replacement','MRI Scan'],['Indicator','Year'])
rw=build(c[c['Reporting level']=='Regional'],['Hip Replacement','Knee Replacement'],['Indicator','Region','Year'])
D={'pho':pho,'province':prov,'indicators':inds,'provinceWait':pw,'regionWait':rw}
print({k:len(v) for k,v in D.items()}); print(pw[-1], rw[-1], pho[0], prov[0], sep='\n')
json.dump(D,open(sys.argv[1],'w',encoding='utf-8'),ensure_ascii=False)
