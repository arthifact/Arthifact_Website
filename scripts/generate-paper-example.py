"""Rebuild the illustrative figures with Python, NumPy, and Matplotlib.

These are synthetic data for a layout example, not research results.
Run from the repository root: python scripts/generate-paper-example.py
"""
from pathlib import Path
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
VECTORS = ROOT / "public/images/paper-example"
CONTENT = ROOT / "src/content/post/paper-example"
VECTORS.mkdir(parents=True, exist_ok=True)
CONTENT.mkdir(parents=True, exist_ok=True)
plt.rcParams.update({
    "font.family": "STIXGeneral", "mathtext.fontset": "stix",
    "font.size": 12, "axes.labelsize": 12, "axes.linewidth": 0.7,
    "axes.spines.top": False, "axes.spines.right": False,
    "xtick.major.width": 0.6, "ytick.major.width": 0.6,
    "svg.hashsalt": "paper-example", "savefig.facecolor": "white",
})
BLUE, ORANGE, GRAY = "#266c92", "#c66b35", "#8e8e86"
rng = np.random.default_rng(7)
x = np.sort(rng.uniform(0, 1, 24))
grid = np.linspace(0, 1, 800)
frequencies = np.arange(1, 11)

def truth(t):
    return np.sin(2 * np.pi * t) + 0.45 * np.cos(6 * np.pi * t) + 0.16 * np.sin(12 * np.pi * t)

def basis(t):
    phase = 2 * np.pi * t[:, None] * frequencies
    return np.column_stack((np.ones(len(t)), np.sin(phase), np.cos(phase)))

A, B = basis(x), basis(grid)
y = truth(x) + rng.normal(0, 0.12, len(x))
penalty = np.diag(np.r_[0, frequencies**4, frequencies**4])

def reconstruct(lam):
    coefficients = np.linalg.lstsq(A, y, rcond=None)[0] if lam == 0 else np.linalg.solve(A.T @ A + lam * penalty, A.T @ y)
    return B @ coefficients

strengths = [0, 0.00001, 0.0001, 0.001]
fits = [reconstruct(lam) for lam in strengths]
errors = [float(np.sqrt(np.mean((fit - truth(grid))**2))) for fit in fits]
selected = 0.0001
fit = reconstruct(selected)

fig, ax = plt.subplots(figsize=(10.4, 4.1), layout="constrained")
ax.plot(grid, truth(grid), color=GRAY, lw=1.5, ls="--", label="Known signal")
ax.plot(grid, fit, color=BLUE, lw=2, label=r"Regularized fit ($\lambda=10^{-4}$)")
ax.scatter(x, y, s=25, facecolor="white", edgecolor=ORANGE, lw=1.2, label="Noisy samples", zorder=5)
ax.set(xlim=(0, 1), ylim=(-1.85, 1.85), xlabel="Position, x", ylabel="Signal amplitude")
ax.legend(loc="upper center", ncol=3, frameon=False, fontsize=10, bbox_to_anchor=(0.5, 1.15), columnspacing=1.4)
ax.grid(axis="y", color="#eeeeea", lw=0.6)
fig.savefig(VECTORS / "reconstruction.svg", metadata={"Date": None})
fig.savefig(CONTENT / "reconstruction.png", dpi=180)
plt.close(fig)

fig, ax = plt.subplots(figsize=(5.0, 3.6), layout="constrained")
im = ax.imshow(A, aspect="auto", cmap="RdBu_r", vmin=-1, vmax=1, interpolation="nearest", extent=(-0.5, 20.5, 23.5, -0.5))
ax.set(xlabel="Basis coefficient", ylabel="Sample index", xticks=[0, 5, 10, 15, 20], yticks=[0, 6, 12, 18, 23])
bar = fig.colorbar(im, ax=ax, ticks=[-1, 0, 1], shrink=0.85, pad=0.035)
bar.set_label("Basis value")
fig.savefig(CONTENT / "sampling-matrix.png", dpi=240)
plt.close(fig)

scan = np.logspace(-7, -1, 80)
rmse = [float(np.sqrt(np.mean((reconstruct(lam) - truth(grid))**2))) for lam in scan]
fig, ax = plt.subplots(figsize=(5.0, 3.6), layout="constrained")
ax.semilogx(scan, rmse, color=BLUE, lw=1.8)
ax.axvline(selected, color=ORANGE, lw=1.1, ls="--", label=r"Shown fit: $\lambda=10^{-4}$")
ax.set(xlabel=r"Regularization strength, $\lambda$", ylabel="Reconstruction RMSE")
ax.legend(loc="upper right", frameon=False, fontsize=10)
ax.grid(axis="y", color="#eeeeea", lw=0.6)
fig.savefig(VECTORS / "regularization.svg", metadata={"Date": None})
fig.savefig(CONTENT / "regularization.png", dpi=180)
plt.close(fig)

results = {"seed": 7, "samples": len(x), "coefficients": A.shape[1], "noise_std": 0.12,
           "results": [{"lambda": lam, "rmse": round(error, 4)} for lam, error in zip(strengths, errors)]}
(CONTENT / "results.json").write_text(json.dumps(results, indent=2) + "\n")
for vector in VECTORS.glob("*.svg"):
    vector.write_text("\n".join(line.rstrip() for line in vector.read_text().splitlines()) + "\n")
print(json.dumps(results, indent=2))
