# Real-World Evaluation

This directory contains scripts and datasets for evaluating `ai-browser-test` against real websites with known characteristics.

## Quick Start

```bash
# Run evaluation against real websites
node evaluation/run-evaluation.mjs
```

## Datasets

### 1. Known Good Websites
- **GitHub** - Generally good accessibility
- **MDN Web Docs** - Excellent accessibility
- **W3C** - WCAG compliant reference

### 2. Known Issue Websites
- Add websites with known accessibility issues
- Low contrast examples
- Poor keyboard navigation
- Missing alt text

## Evaluation Metrics

### Accuracy Metrics
- **Score Accuracy:** Percentage of scores within expected range
- **Issues Accuracy:** Percentage of correctly identified issues
- **Precision:** True positives / (True positives + False positives)
- **Recall:** True positives / (True positives + False negatives)
- **F1 Score:** Harmonic mean of precision and recall

### Consistency Metrics
- **Inter-Provider Agreement:** Compare results across providers
- **Inter-Judge Agreement:** Compare multiple evaluations
- **Temporal Consistency:** Same screenshot evaluated multiple times

### Bias Metrics
- **Position Bias:** First vs last evaluation
- **Length Bias:** Longer responses = better scores
- **Verbosity Bias:** More words = better scores

## Adding Test Cases

Edit `evaluation/run-evaluation.mjs` and add to `EVALUATION_DATASET`:

```javascript
{
  name: 'Your Test Case',
  url: 'https://example.com',
  description: 'What to test',
  expectedScore: { min: 7, max: 10 },
  expectedIssues: [],
  knownGood: ['high contrast', 'accessible'],
  knownBad: []
}
```

## Results

Results are saved to `evaluation/results/evaluation-{timestamp}.json` with:
- Individual test results
- Comparison against ground truth
- Accuracy metrics
- Cost and performance data

## Ground Truth Annotation

To create your own ground truth dataset:

1. **Capture Screenshots**
   ```bash
   # Use Playwright or browser devtools
   ```

2. **Annotate Issues**
   - Manually review each screenshot
   - Document accessibility issues
   - Score quality (0-10)
   - Note specific problems

3. **Create Test Cases**
   - Add to `EVALUATION_DATASET`
   - Include expected scores and issues
   - Document known good/bad characteristics

4. **Run Evaluation**
   ```bash
   node evaluation/run-evaluation.mjs
   ```

5. **Analyze Results**
   - Compare VLLM judgments to ground truth
   - Calculate accuracy metrics
   - Identify systematic errors
   - Refine prompts and rubrics

## External Datasets

See `evaluation/datasets.md` for information about:
- WebUI Dataset
- Tabular Accessibility Dataset
- WCAG Test Cases
- Apple Screen Recognition Dataset

## Methodology

1. **Collect Screenshots** - Capture from real websites
2. **Annotate Ground Truth** - Manually label issues
3. **Run Evaluation** - Use `validateScreenshot()`
4. **Compare Results** - Calculate accuracy metrics
5. **Iterate** - Refine based on results

## Example Output

```
🚀 Starting Real-World Evaluation
📊 Dataset: 3 test cases
✅ Using provider: gemini

[1/3] Evaluating: GitHub Homepage
   ✅ Score: 8.50/10
   📋 Issues: 0
   🎯 Score in expected range: ✅
   🔍 Issues match expected: ✅

📊 Evaluation Summary
   Total cases: 3
   Successful: 3
   Score accuracy: 100.00%
   Issues accuracy: 100.00%
```

