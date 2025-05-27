from bleu.bleu import Bleu
from rouge.rouge import Rouge

def load_textfiles(references, hypothesis):
    combined_ref = " ".join(line.strip() for line in references)
    combined_hypo = " ".join(line.strip() for line in hypothesis)

    # Wrap both in dict format expected by scorers
    refs = {0: [combined_ref]}
    hypo = {0: [combined_hypo]}

    return refs, hypo

def score(ref, hypo):
    scorers = [
        (Bleu(4), ["Bleu_1", "Bleu_2", "Bleu_3", "Bleu_4"]),
        (Rouge(), "ROUGE_L"),
    ]
    final_scores = {}

    for scorer, method in scorers:
        score_val, scores = scorer.compute_score(ref, hypo)
        if isinstance(score_val, list):
            for m, s in zip(method, score_val):
                final_scores[m] = s
        else:
            final_scores[method] = score_val

    return final_scores