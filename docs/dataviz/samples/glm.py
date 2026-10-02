# ロジスティック回帰の診断値（Python 版の基準値）。data.csv を作り、値を glm.py.json に書く
#   uv run --with numpy,polars,statsmodels,scikit-learn python glm.py
# 図は描かない（図は glm.mjs が Vega-Lite で描く）。matplotlib で描くなら、SVG は文字を文字のまま出す：
#   plt.rcParams["svg.fonttype"] = "none"
import json
import numpy as np, polars as pl, statsmodels.api as sm
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss
from sklearn.model_selection import StratifiedKFold

rng = np.random.default_rng(0)
n = 2000
x1, x2 = rng.normal(size=n), rng.normal(size=n)
eta = -1.5 + 0.8 * x1 + 0.6 * x1**2 - 0.5 * x2   # 真のモデルには x1² がある。当てはめるのは線形の項だけ
y = (rng.random(n) < 1 / (1 + np.exp(-eta))).astype(int)
fold = np.empty(n, int)
for k, (_, te) in enumerate(StratifiedKFold(5, shuffle=True, random_state=0).split(x1, y)):
    fold[te] = k
pl.DataFrame({"x1": x1, "x2": x2, "y": y, "fold": fold}).write_csv("data.csv")

X = sm.add_constant(np.column_stack([x1, x2]))
res = sm.GLM(y, X, family=sm.families.Binomial()).fit()   # 係数は全データで
p = np.empty(n)                                            # 性能の値は out-of-fold の予測で
for k in range(5):
    tr, te = fold != k, fold == k
    p[te] = sm.GLM(y[tr], X[tr], family=sm.families.Binomial()).fit().predict(X[te])
K = 20
order = np.argsort(p, kind="stable"); bins = np.empty(n, int); bins[order] = np.arange(n) * K // n
br = np.array([(y - p)[bins == b].mean() for b in range(K)])
bse = np.array([np.sqrt((p[bins == b] * (1 - p[bins == b])).sum()) / (bins == b).sum() for b in range(K)])
vals = {"b0": res.params[0], "b1": res.params[1], "b2": res.params[2], "se_b1": res.bse[1],
        "auc": roc_auc_score(y, p), "ap": average_precision_score(y, p), "brier": brier_score_loss(y, p),
        "rate": y.mean(), "binned_out": int((np.abs(br) > 2 * bse).sum())}
json.dump({k: round(float(v), 6) for k, v in vals.items()}, open("glm.py.json", "w"), indent=1)
