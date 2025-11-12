# Comprehensive Evaluation Guide

## Overview

This evaluation system provides a complete framework for evaluating `ai-visual-test` against real-world datasets with ground truth annotations.

## Quick Start

```bash
# Run all evaluations
node evaluation/runners/run-all-evaluations.mjs

# Run specific dataset
node evaluation/utils/evaluation-rig.mjs --synthetic --limit=10

# Download datasets
node evaluation/utils/download-datasets.mjs
```

## Components

### 1. Dataset Loaders (`dataset-loaders.mjs`)

Loads datasets from various sources:
- **WebUI Dataset** - Visual UI understanding (HuggingFace)
- **Tabular Accessibility Dataset** - WCAG compliance annotations
- **Synthetic Datasets** - Created from real websites
- **Custom Datasets** - Your own annotated data

### 2. Evaluation Metrics (`metrics.mjs`)

Standard metrics for evaluation:
- **Precision, Recall, F1 Score** - Issue detection accuracy
- **MAE, RMSE** - Score prediction accuracy
- **Correlation** - Score agreement
- **Cohen's Kappa** - Inter-judge agreement
- **Confusion Matrix** - Binary classification metrics

### 3. Evaluation Rig (`evaluation-rig.mjs`)

Main evaluation engine:
- Runs evaluations on datasets
- Calculates comprehensive metrics
- Saves results to JSON
- Generates reports

### 4. Method Comparison (`method-comparison.mjs`)

Compares against other methods:
- Multiple VLLM providers
- Traditional accessibility tools
- Research implementations
- Human evaluators

## Standard Metrics Explained

### Classification Metrics

**Precision:** Of all issues detected, how many were correct?
```
Precision = TP / (TP + FP)
```

**Recall:** Of all actual issues, how many were detected?
```
Recall = TP / (TP + FN)
```

**F1 Score:** Harmonic mean of precision and recall
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

### Regression Metrics

**MAE (Mean Absolute Error):** Average difference between predicted and actual scores
```
MAE = (1/n) * Σ|predicted - actual|
```

**RMSE (Root Mean Squared Error):** Penalizes larger errors more
```
RMSE = √((1/n) * Σ(predicted - actual)²)
```

### Agreement Metrics

**Cohen's Kappa:** Inter-judge agreement accounting for chance
```
κ = (Po - Pe) / (1 - Pe)
```

## Running Evaluations

### Basic Evaluation

```bash
# Evaluate synthetic dataset
node evaluation/utils/evaluation-rig.mjs --synthetic

# Limit number of samples
node evaluation/utils/evaluation-rig.mjs --synthetic --limit=5

# Use specific provider
node evaluation/utils/evaluation-rig.mjs --synthetic --provider=gemini
```

### Comprehensive Evaluation

```bash
# Run all available datasets
node evaluation/runners/run-all-evaluations.mjs
```

### Custom Dataset

1. Create dataset file: `evaluation/datasets/custom-dataset.json`
2. Format:
```json
{
  "name": "My Custom Dataset",
  "samples": [
    {
      "id": "sample-1",
      "name": "Test Case 1",
      "screenshot": "path/to/screenshot.png",
      "groundTruth": {
        "expectedScore": { "min": 7, "max": 10 },
        "expectedIssues": ["contrast", "navigation"]
      }
    }
  ]
}
```

3. Run:
```bash
node evaluation/utils/evaluation-rig.mjs --custom
```

## Results Analysis

Results are saved to `evaluation/results/comprehensive-evaluation-{timestamp}.json`

### Structure:
```json
{
  "timestamp": "2025-01-27T...",
  "config": { ... },
  "datasets": {
    "synthetic": {
      "results": [ ... ],
      "metrics": { ... }
    }
  },
  "overall": {
    "metrics": {
      "scoreMetrics": { "mae": 0.5, "rmse": 0.7 },
      "binaryMetrics": { "precision": 0.85, "recall": 0.80, "f1": 0.82 },
      "issueMetrics": { "precision": 0.75, "recall": 0.70, "f1": 0.72 }
    }
  }
}
```

## Interpreting Results

### Good Results
- **F1 Score > 0.8** - Strong issue detection
- **MAE < 1.0** - Accurate score prediction
- **Precision > 0.8** - Few false positives
- **Recall > 0.8** - Few false negatives

### Areas for Improvement
- **Low Precision** - Too many false positives (over-detection)
- **Low Recall** - Missing real issues (under-detection)
- **High MAE** - Score prediction needs improvement
- **Low Agreement** - Inconsistent judgments

## Research Alignment

Our evaluation aligns with:
- **LLM-as-a-Judge Survey** (arXiv 2412.05579)
- **MLLM-as-a-Judge Benchmark**
- **Image2Struct Evaluation**
- **VLMEvalKit Standards**

See `evaluation/research-review.md` for detailed comparison.

## Next Steps

1. **Download Real Datasets**
   - WebUI from HuggingFace
   - Tabular Accessibility from authors
   - WCAG Test Cases from W3C

2. **Run Evaluations**
   - Start with synthetic dataset
   - Add real datasets as available
   - Compare across providers

3. **Analyze Results**
   - Identify systematic errors
   - Refine prompts and rubrics
   - Improve bias detection

4. **Iterate**
   - Make improvements
   - Re-evaluate
   - Compare with baseline

