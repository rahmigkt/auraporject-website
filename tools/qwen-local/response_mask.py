"""Pure label construction test helper; no tokenizer/model/trainer is loaded."""
def labels_for_assistant(input_ids, assistant_mask, attention_mask):
    if not (len(input_ids)==len(assistant_mask)==len(attention_mask)):
        raise ValueError('Tokenizer IDs and exact template masks must align')
    if not input_ids or any(type(x) is not int for x in input_ids):
        raise ValueError('Token IDs must be nonempty integers')
    if any(type(m) is not int or m not in [0,1] for m in assistant_mask+attention_mask):
        raise ValueError('Masks must be binary integer lists')
    if any(a and not m for a,m in zip(assistant_mask,attention_mask)):
        raise ValueError('Assistant mask overlaps padding')
    labels=[token if a and m else -100 for token,a,m in zip(input_ids,assistant_mask,attention_mask)]
    if not any(x!=-100 for x in labels):raise ValueError('No assistant tokens; incompatible chat template')
    return labels
