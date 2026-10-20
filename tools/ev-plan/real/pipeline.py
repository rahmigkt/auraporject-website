"""One fresh run from pinned licensed source; no model training, GPU or paid API."""
import argparse
import subprocess
import time
from pathlib import Path
from common import ROOT,DATA,write,digest,sources
from real.fetch import fetch
from real.swiss import stage,convert,sha_file
from real.programs import build_pairs
from real.review import build as build_review
from real.audit import audit
from metrics import fit


def fingerprint():
    paths=list((ROOT/'tools/ev-plan').rglob('*.py'))+[DATA/'plan-program.schema.json',DATA/'real-dataset-registry.json']
    result=sources()
    for f in paths:result[f.relative_to(ROOT).as_posix()]=sha_file(f)
    return result


def run(raw,output,review):
    output=Path(output);review=Path(review)
    if output.exists() or review.exists():raise ValueError('Run and review directories must be new')
    output.mkdir(parents=True);before=fingerprint();started=time.monotonic()
    fetch(raw);stage_report=stage(raw,output/'stage.sqlite');write(output/'stage-manifest.json',stage_report)
    convert(output/'stage.sqlite',output/'converted')
    fit(output/'converted',output/'calibration.json')
    build_pairs(output/'converted',output/'pairs')
    build_review(output/'converted',output/'calibration.json',review)
    result=audit(output/'converted',output/'calibration.json',review,output/'audit.json')
    if before!=fingerprint():raise ValueError('Inputs changed during run; no final success manifest')
    write(output/'run-manifest.json',dict(sources=before,source_fingerprint=digest(before),main_commit=subprocess.check_output(['git','rev-parse','origin/main'],cwd=ROOT,text=True).strip(),
                                        elapsed_seconds=time.monotonic()-started,checks=result['checks'],training_started=False,gpu_gate='closed'))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--raw',required=True);p.add_argument('--output',required=True);p.add_argument('--review',required=True);a=p.parse_args();run(a.raw,a.output,a.review)
