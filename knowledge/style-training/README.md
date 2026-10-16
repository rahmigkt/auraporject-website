# Style knowledge and training preparation

Five source profiles remain detailed, uncalibrated knowledge documents. The 21
planned headings now have editorial starting notes in `style-directions.js`.
Those notes are not full ontology profiles, historical certification, geometry
builders or trained model weights. Streamliner remains related to Streamline
Moderne and should be consolidated during expert review.

The assistant retrieves selected profile descriptions and principles into its
prompt. This is context grounding, not fine-tuning. A customer's explicit
dislikes are kept separately from positive preferences, and model suggestions
only become selected preferences when accepted by the customer.

`candidates.jsonl` contains 52 synthetic editorial examples: a preference and an
explicit rejection for each direction. Targets are the bounded
intent/style/avoid/question extraction schema, not free generated prose. Every record is unreviewed. No customer
chat, contact details or uploaded photographs are collected for training.

Export requires a real reviewer and an explicit `approved` record status:

    node services/design/style-training.mjs --export INPUT.jsonl OUTPUT.jsonl

With the current unreviewed file, export is refused. Editing a flag is not a
substitute for reviewing the style accuracy, unsupported geometry, multilingual
behaviour and customer preference interpretation. Fine-tuning has not run.

Before any training release: create an expert-reviewed corpus, keep held-out
examples, test negation and mixed preferences, compare against the untrained
grounded model, then verify gains before changing serving weights. Five source
profiles and 21 outlines are not enough evidence to claim expert furniture AI.
