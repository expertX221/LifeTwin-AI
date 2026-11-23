"""Local utilities. Inputs and models are paths on the user's computer."""
import argparse
import json
import os
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="task", required=True)
    stt = sub.add_parser("transcribe")
    stt.add_argument("model", type=Path)
    stt.add_argument("audio", type=Path)
    stt.add_argument("--language", choices=["en","hi","te","ta","ml","kn"])
    search = sub.add_parser("retrieve")
    search.add_argument("model", type=Path)
    search.add_argument("records", type=Path)
    search.add_argument("query")
    args = parser.parse_args()
    if not args.model.is_dir():
        parser.error("Supply a downloaded local model directory")
    if args.task == "transcribe":
        from faster_whisper import WhisperModel
        model = WhisperModel(str(args.model), device="cpu", compute_type="int8", local_files_only=True)
        segments, _ = model.transcribe(str(args.audio), language=args.language, vad_filter=True)
        print(" ".join(s.text.strip() for s in segments))
        return
    from sentence_transformers import SentenceTransformer
    rows = json.loads(args.records.read_text(encoding="utf-8"))
    rows = [r for r in rows if r.get("kind") == "memory" and r.get("label")]
    if not rows:
        print("[]")
        return
    model = SentenceTransformer(str(args.model), local_files_only=True)
    embeddings = model.encode(["passage: "+r["label"] for r in rows], normalize_embeddings=True)
    query = model.encode("query: "+args.query, normalize_embeddings=True)
    order = (embeddings @ query).argsort()[::-1][:5]
    print(json.dumps([{"id": rows[i]["id"], "date": rows[i]["date"]} for i in order]))
if __name__ == "__main__":
    main()

