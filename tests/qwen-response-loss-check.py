import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('runner', 'tools/qwen-local/train_gpu.py')
runner=importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

class Processor:
    def apply_chat_template(self, messages, **kwargs):
        assert kwargs['enable_thinking'] is False
        assert messages[-1]['role']=='user'
        return 'CUSTOMER REQUEST\nASSISTANT:'

class Tokenizer:
    eos_token='!'
    def __call__(self, text, **kwargs):
        return {'input_ids':[ord(c) for c in text]}

rows=[{'messages':[{'role':'user','content':'CUSTOMER REQUEST'}, {'role':'assistant','content':'{"actions":[]}'}]}]
feature=runner.response_features(Processor(),Tokenizer(),rows,100)[0]
prompt_size=len('CUSTOMER REQUEST\nASSISTANT:')
assert feature['labels'][:prompt_size]==[-100]*prompt_size
assert ''.join(chr(n) for n in feature['labels'][prompt_size:])=='{"actions":[]}!'
assert len(feature['labels'])==len(feature['attention_mask'])==len(feature['input_ids'])
try:
    runner.response_features(Processor(),Tokenizer(),rows,3)
    raise AssertionError('Silently truncated training example')
except ValueError as error:
    assert 'Context exceeded' in str(error)
print('PASS assistant-only loss, target EOS retained, prompt excluded, aligned masks and no silent truncation.')
