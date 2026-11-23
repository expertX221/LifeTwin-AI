"""Translate an approved note locally using a downloaded NLLB checkpoint."""
import argparse
import os
import re
import unicodedata
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
LANGS = dict(en="eng_Latn", hi="hin_Deva", te="tel_Telu", ta="tam_Taml", ml="mal_Mlym", kn="kan_Knda")
def main():
    p = argparse.ArgumentParser()
    p.add_argument("model", type=Path)
    p.add_argument("source", choices=LANGS)
    p.add_argument("target", choices=LANGS)
    p.add_argument("text")
    args = p.parse_args()
    if not args.model.is_dir():
        p.error("Provide a downloaded local checkpoint")
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    from indicnlp.normalize.indic_normalize import IndicNormalizerFactory
    import spacy
    text = unicodedata.normalize("NFKC", args.text)
    if args.source == "en":
        text = spacy.blank("en").make_doc(text).text
    else:
        text = IndicNormalizerFactory().get_normalizer(args.source).normalize(text)
    tokenizer = AutoTokenizer.from_pretrained(args.model, src_lang=LANGS[args.source], local_files_only=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model, local_files_only=True)
    protected = r"(SpO[₂2]|BPM|PPG|ESP32|MAX30102|\d+(?:[.,:/-]\d+)*\s*(?:%|Hz)?)"
    parts = re.split(protected, text, flags=re.I)
    for i in range(0,len(parts),2):
        if not parts[i].strip():
            continue
        inputs = tokenizer(parts[i], return_tensors="pt")
        result = model.generate(**inputs, forced_bos_token_id=tokenizer.convert_tokens_to_ids(LANGS[args.target]), max_new_tokens=256)
        parts[i] = tokenizer.batch_decode(result,skip_special_tokens=True)[0]
    print(" ".join(part.strip() for part in parts if part.strip()))
if __name__ == "__main__":
    main()

