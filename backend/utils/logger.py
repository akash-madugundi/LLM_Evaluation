# logger.py
import os
import json
from datetime import datetime
from collections import defaultdict

LOG_FILE = "logs/qa_log.jsonl"

def log_interaction(question, answer, metrics=None):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "question": question,
        "answer": answer,
        "metrics": metrics or {},
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

def load_logs():
    entries = []
    if not os.path.exists(LOG_FILE):
        return entries
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            entries.append(json.loads(line))
    return entries

def rank_by_metric(entries, metric_name="ROUGE_L"):
    filtered = [e for e in entries if e.get("metrics") and metric_name in e["metrics"]]
    ranked = sorted(filtered, key=lambda e: e["metrics"][metric_name], reverse=True)
    return ranked

def surface_low_scores(entries, metric_name="ROUGE_L", threshold=0.5):
    return [e for e in entries if e.get("metrics", {}).get(metric_name, 1) < threshold]

def detect_regressions(entries, metric_name="ROUGE_L"):
    question_map = defaultdict(list)
    for e in entries:
        q = e["question"].lower()
        question_map[q].append(e)

    regressions = []
    for q, q_entries in question_map.items():
        sorted_entries = sorted(q_entries, key=lambda x: x["timestamp"])
        for i in range(1, len(sorted_entries)):
            prev = sorted_entries[i - 1]["metrics"].get(metric_name, 1)
            curr = sorted_entries[i]["metrics"].get(metric_name, 1)
            if curr < prev:
                regressions.append({
                    "question": q,
                    "previous_score": prev,
                    "current_score": curr,
                    "timestamp_prev": sorted_entries[i - 1]["timestamp"],
                    "timestamp_curr": sorted_entries[i]["timestamp"],
                    "answer_prev": sorted_entries[i - 1]["answer"],
                    "answer_curr": sorted_entries[i]["answer"],
                })
    return regressions
