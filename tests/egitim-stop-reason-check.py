import importlib.util,pathlib
p=pathlib.Path(__file__).resolve().parents[1]/'tools/egitim/ornekle.py'
s=importlib.util.spec_from_file_location('ornekle_stop',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
for response,want in [({'stop_type':'eos','truncated':False},False),({'stop_type':'limit','truncated':False},True),
 ({'stop_type':'eos','tokens_predicted':512},False),({'stop_type':'limit','tokens_predicted':511},True),
 ({'stop_type':'eos','truncated':True},True),({'stopped_limit':True},True),({},False)]:
 assert m.generation_truncated(response)==want,(response,want)
print('PASS 7 native stop-reason controls: limit != context truncation; exact EOS at budget is not silently labelled cutoff')
