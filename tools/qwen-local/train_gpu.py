"""EGITIM-01 entry point: format preparation or CPU tokenization by default.

response_features is the unchanged historical final-turn pilot helper, kept for
old callers/tests. EGITIM-01 uses egitim01_features.prepare_features to supervise
EVERY assistant JSON payload and EOS. The original runner is archived alongside.
"""

def response_features(processor, tokenizer, rows, max_length):
    result = []
    for row in rows:
        if row['messages'][-1]['role'] != 'assistant':
            raise ValueError('Training example must end with the target assistant answer')
        prompt = processor.apply_chat_template(row['messages'][:-1], tokenize=False,
            add_generation_prompt=True, enable_thinking=False)
        prompt_ids = tokenizer(prompt, add_special_tokens=False)['input_ids']
        target_ids = tokenizer(row['messages'][-1]['content'] + tokenizer.eos_token, add_special_tokens=False)['input_ids']
        ids = prompt_ids + target_ids
        if len(ids) > max_length:
            raise ValueError('Context exceeded; split/review long examples instead of silently truncating')
        result.append({'input_ids': ids, 'attention_mask': [1] * len(ids),
                       'labels': [-100] * len(prompt_ids) + target_ids})
    return result



def main():
    from egitim01_runner import main as egitim_main
    return egitim_main()


if __name__ == '__main__':
    raise SystemExit(main())
