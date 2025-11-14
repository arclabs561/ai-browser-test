# Ground Truth Usage Guide

## Overview

This guide explains how to effectively use the ground truth annotations from the WebUI dataset to validate and improve VLLM evaluations.

## Available Ground Truth Data

The WebUI dataset provides rich annotations for each sample:

### 1. Accessibility Trees (`axtree.json.gz`)
- **Structure**: Tree representation of page semantics
- **Contains**: Roles, names, ARIA attributes, element hierarchy
- **Use Cases**:
  - Validate VLLM accessibility claims
  - Extract programmatic accessibility data
  - Compare semantic structure with visual evaluation
  - Identify missing ARIA labels

### 2. Bounding Boxes (`box.json.gz`)
- **Structure**: Element locations with 4 box model levels
- **Contains**: Content, padding, border, margin boxes
- **Use Cases**:
  - Validate element detection accuracy
  - Compare VLLM element counts with actual counts
  - Validate spatial relationships
  - Element localization validation

### 3. Computed Styles (`style.json.gz`)
- **Structure**: Computed CSS properties
- **Contains**: All computed styles for elements
- **Use Cases**:
  - Validate CSS-related claims
  - Contrast ratio validation
  - Style consistency checks

### 4. HTML Source (`html.html`)
- **Structure**: Source HTML
- **Contains**: Original HTML markup
- **Use Cases**:
  - Dual-view validation (code vs visual)
  - Structural validation
  - Semantic HTML checks

## Usage Patterns

### Pattern 1: Ground Truth Validation

Validate VLLM outputs against actual ground truth:

```bash
node evaluation/utils/validate-with-ground-truth.mjs [limit]
```

This compares VLLM accessibility claims (button counts, link counts, etc.) with actual counts from the accessibility tree.

### Pattern 2: Enhanced Evaluation with Context

Use ground truth to enhance prompts with context:

```bash
node evaluation/utils/enhanced-webui-evaluation.mjs [limit]
```

This compares standard evaluation (no context) vs enhanced evaluation (with ground truth context in prompt).

### Pattern 3: Accessibility Tree Validation

Use accessibility trees for programmatic + VLLM hybrid validation:

```bash
node evaluation/utils/accessibility-tree-validator.mjs [limit]
```

This extracts programmatic data from accessibility trees and uses it to ground VLLM evaluation.

## Implementation Details

### Extracting Accessibility Information

```javascript
import { extractAccessibilityInfo } from './evaluation/utils/validate-with-ground-truth.mjs';

const axtreeInfo = extractAccessibilityInfo(sample.annotations.accessibilityTree);

// Returns:
// {
//   totalElements: number,
//   interactiveElements: [...],
//   buttons: [...],
//   links: [...],
//   headings: [...],
//   landmarks: [...],
//   roles: {...},
//   ariaLabels: number,
//   missingLabels: [...]
// }
```

### Extracting Element Locations

```javascript
import { extractElementLocations } from './evaluation/utils/validate-with-ground-truth.mjs';

const boxInfo = extractElementLocations(sample.annotations.boundingBoxes);

// Returns:
// {
//   totalElements: number,
//   elements: [
//     { x, y, width, height, centerX, centerY, area, type }
//   ]
// }
```

### Validating VLLM Claims

```javascript
import { validateAccessibilityClaims } from './evaluation/utils/validate-with-ground-truth.mjs';

const validation = validateAccessibilityClaims(vllmResult, axtreeInfo);

// Returns:
// {
//   validated: true,
//   groundTruth: { buttons: 5, links: 10, ... },
//   vllmClaims: { buttons: 4, links: 9, ... },
//   accuracy: { buttons: 0.8, links: 0.9, ... },
//   averageAccuracy: 0.85
// }
```

## Accuracy Metrics

When validating against ground truth, we calculate:

1. **Element Count Accuracy**: Compare VLLM counts with ground truth counts
2. **Average Accuracy**: Mean accuracy across all element types
3. **Validation Coverage**: Percentage of samples with full ground truth

## Best Practices

1. **Use Ground Truth for Validation**: Don't just report it exists - use it to validate claims
2. **Enhance Prompts**: Include ground truth context in prompts for better accuracy
3. **Hybrid Approach**: Combine programmatic data (from trees) with VLLM semantic evaluation
4. **Calculate Metrics**: Track accuracy over time to measure improvement
5. **Compare Methods**: Test standard vs enhanced evaluation to measure impact

## Example Workflow

```bash
# 1. Convert dataset (if not done)
node evaluation/utils/convert-webui-dataset.mjs 100

# 2. Validate with ground truth
node evaluation/utils/validate-with-ground-truth.mjs 20

# 3. Compare evaluation methods
node evaluation/utils/enhanced-webui-evaluation.mjs 15

# 4. Use accessibility trees
node evaluation/utils/accessibility-tree-validator.mjs 20

# 5. Analyze results
node evaluation/utils/analyze-webui-results.mjs
```

## Research Applications

The ground truth data enables:

1. **Accuracy Measurement**: Quantify how accurate VLLM evaluations are
2. **Bias Detection**: Identify systematic errors in VLLM outputs
3. **Method Comparison**: Compare different evaluation approaches
4. **Prompt Engineering**: Test how ground truth context affects results
5. **Hybrid Validation**: Combine programmatic + VLLM for best results

## Limitations

- Not all samples have complete ground truth
- Accessibility trees may not capture all visual accessibility issues
- Bounding boxes are 2D - don't capture Z-order or occlusions
- Styles may not reflect all rendering differences

## Future Enhancements

- Element detection accuracy (IoU metrics)
- Semantic role accuracy
- ARIA label completeness
- Keyboard navigation path validation
- Contrast ratio validation from styles

