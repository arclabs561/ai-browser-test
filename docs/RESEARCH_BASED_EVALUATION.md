# Research-Based Evaluation Methods

## Overview

This document describes evaluation methods based on the WebUI research paper and standard computer vision/UI understanding metrics.

## WebUI Paper Use Cases

The WebUI dataset paper describes three main use cases:

### 1. Element Detection

**Task**: Predict the location of accessibility tree nodes (UI elements)

**Metrics**:
- **IoU (Intersection over Union)**: Measures overlap between predicted and ground truth bounding boxes
- **mAP (mean Average Precision)**: Average precision at different IoU thresholds (0.5, 0.75)
- **Precision/Recall**: At IoU > 0.5 threshold

**Implementation**: `evaluation/utils/iou-element-detection.mjs`

```bash
node evaluation/utils/iou-element-detection.mjs [limit]
```

**Output**:
- mAP at different IoU thresholds
- Precision/Recall at each threshold
- Average IoU for matched boxes

### 2. Screen Classification

**Task**: Classify screens into categories (login, home, product, etc.)

**Metrics**:
- **Accuracy**: Percentage of correctly classified screens
- **Per-Category Accuracy**: Accuracy for each category

**Implementation**: `evaluation/utils/screen-classification-evaluation.mjs`

```bash
node evaluation/utils/screen-classification-evaluation.mjs [limit]
```

**Categories**:
- login, signup, home, product, cart, profile, search, article, about, other

### 3. Screen Similarity

**Task**: Predict relationships between pairs of screens

**Status**: Not yet implemented (requires screen pairs)

## Additional Research-Based Evaluations

### Contrast Validation (Using Computed Styles)

**Task**: Validate color contrast ratios using computed CSS styles

**Metrics**:
- **Pass Rate**: Percentage of elements passing WCAG contrast requirements
- **Average Contrast Ratio**: Mean contrast ratio across elements
- **Violation Count**: Number of elements failing contrast requirements

**Implementation**: `evaluation/utils/style-contrast-validation.mjs`

```bash
node evaluation/utils/style-contrast-validation.mjs [limit]
```

**Uses**:
- Computed styles from `style.json.gz`
- Accessibility tree for element identification
- WCAG 2.1 contrast requirements (4.5:1 for normal text)

### Multi-Viewport Validation

**Task**: Evaluate consistency across different viewports/devices

**Metrics**:
- **Score Variance**: Variance in scores across viewports
- **Consistency**: High/Medium/Low based on standard deviation
- **Average Score**: Mean score across all viewports

**Implementation**: `evaluation/utils/multi-viewport-validation.mjs`

```bash
node evaluation/utils/multi-viewport-validation.mjs [limit]
```

**Viewports Used**:
- Desktop: default_1920-1080, default_1366-768, etc.
- Tablet: iPad-Pro
- Mobile: iPhone-13 Pro

### Element Type Validation

**Task**: Validate element type detection using class annotations

**Metrics**:
- **Type Accuracy**: Accuracy of element type predictions
- **Per-Type Accuracy**: Accuracy for each element type

**Implementation**: `evaluation/utils/element-type-validation.mjs`

```bash
node evaluation/utils/element-type-validation.mjs [limit]
```

**Uses**:
- `class.json.gz` annotations for ground truth element types

## Comprehensive Research Evaluation

Runs all research-based evaluations together:

```bash
node evaluation/utils/comprehensive-webui-research-evaluation.mjs [limit]
```

This implements:
1. Element Detection (IoU-based)
2. Screen Classification
3. Contrast Validation
4. Multi-Viewport Validation

## Metrics Reference

### IoU (Intersection over Union)

```
IoU = (Area of Intersection) / (Area of Union)
```

- Range: 0 to 1
- IoU > 0.5: Generally considered a correct detection
- IoU > 0.75: High precision detection

### mAP (mean Average Precision)

- Calculated using 11-point interpolation
- Average of AP at different IoU thresholds
- Standard metric for object detection tasks

### Precision/Recall

- **Precision**: TP / (TP + FP) - How many detections are correct
- **Recall**: TP / (TP + FN) - How many ground truth elements were found
- **F1 Score**: Harmonic mean of precision and recall

## Best Practices

1. **Use Proper Metrics**: IoU for element detection, accuracy for classification
2. **Multiple Thresholds**: Evaluate at IoU 0.5 and 0.75 for robustness
3. **Cross-Viewport**: Test consistency across different viewports
4. **Ground Truth Integration**: Use programmatic data to ground VLLM evaluation
5. **Statistical Significance**: Run on sufficient samples (20+ for meaningful metrics)

## Research Alignment

These evaluations align with:
- WebUI paper evaluation methodology
- Standard computer vision metrics (IoU, mAP)
- UI understanding research practices
- Accessibility validation standards (WCAG)

