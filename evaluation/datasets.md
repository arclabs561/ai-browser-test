# Evaluation Datasets & Methodologies

## Available Datasets

### 1. WebUI Dataset
**Source:** https://uimodeling.github.io/  
**Description:** Dataset for enhancing visual UI understanding with web semantics  
**Features:**
- Visual UI screenshots
- HTML/CSS annotations
- Semantic annotations
- Accessibility metadata

**Usage:**
- Evaluate multi-modal validation accuracy
- Test HTML/CSS extraction
- Validate semantic understanding

### 2. Tabular Accessibility Dataset
**Source:** https://www.mdpi.com/2306-5729/10/9/149  
**Description:** Benchmark for LLM-based web accessibility auditing  
**Features:**
- WCAG compliance annotations
- Accessibility violations
- Ground truth labels
- Multiple evaluation criteria

**Usage:**
- Evaluate accessibility detection
- Test WCAG compliance checking
- Validate contrast detection
- Test keyboard navigation detection

### 3. Web Content Accessibility Guidelines (WCAG) Test Cases
**Source:** W3C WCAG Test Cases  
**Description:** Official WCAG test cases with known pass/fail examples  
**Features:**
- Known accessibility violations
- Expected pass/fail outcomes
- Multiple WCAG levels (A, AA, AAA)

**Usage:**
- Validate accessibility evaluation accuracy
- Test against known good/bad examples
- Benchmark accessibility detection

### 4. Apple Screen Recognition Dataset
**Source:** Apple Research  
**Description:** 77,637 screens from 4,068 iPhone apps with UI element annotations  
**Features:**
- UI element detection
- Accessibility metadata
- Screen annotations

**Usage:**
- Test UI element detection
- Validate accessibility annotations
- Test mobile UI understanding

## Real-World Websites with Known Issues

### Good Examples (High Quality)
1. **GitHub** - Generally good accessibility, clear design
2. **MDN Web Docs** - Excellent accessibility, well-documented
3. **W3C** - WCAG compliant, reference implementation

### Bad Examples (Known Issues)
1. **Websites with low contrast** - Can be found via accessibility audits
2. **Sites with poor keyboard navigation** - Common in older sites
3. **Sites with missing alt text** - Common accessibility issue

## Evaluation Methodology

### 1. Accuracy Evaluation
Compare VLLM judgments against ground truth annotations:
- **True Positives:** Correctly identified issues
- **False Positives:** Incorrectly flagged as issues
- **False Negatives:** Missed actual issues
- **Precision:** TP / (TP + FP)
- **Recall:** TP / (TP + FN)
- **F1 Score:** 2 * (Precision * Recall) / (Precision + Recall)

### 2. Consistency Evaluation
Test inter-judge agreement:
- Run same screenshot through multiple providers
- Compare scores and issues
- Measure agreement (Cohen's kappa)

### 3. Bias Evaluation
Test for systematic biases:
- Position bias (first vs last)
- Length bias (longer = better)
- Verbosity bias (more words = better)
- Use `detectBias()` function

### 4. Cost-Benefit Analysis
Measure cost vs accuracy:
- API costs per evaluation
- Accuracy improvements
- Time savings vs manual review

## Creating Your Own Dataset

### Step 1: Collect Screenshots
- Capture screenshots from real websites
- Include diverse examples (good, bad, mixed)
- Cover different page types (homepage, forms, etc.)

### Step 2: Annotate Ground Truth
- Manually label issues
- Score each screenshot (0-10)
- Document specific problems
- Include WCAG violations

### Step 3: Evaluate
- Run `validateScreenshot()` on each
- Compare results to ground truth
- Calculate metrics (precision, recall, F1)

### Step 4: Iterate
- Identify systematic errors
- Refine prompts
- Adjust rubrics
- Re-evaluate

## Example Evaluation Script

See `evaluation/run-evaluation.mjs` for a complete example.

