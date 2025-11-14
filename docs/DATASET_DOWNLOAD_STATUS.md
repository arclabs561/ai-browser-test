# Dataset Download Status

## Completed Downloads

### ✅ WCAG Test Cases
- **Status**: Downloaded successfully
- **Location**: `evaluation/datasets/human-annotated/wcag-test-cases/testcases.json`
- **Size**: ~20KB
- **Source**: W3C WCAG Test Cases API
- **Next Step**: Convert to our format using `evaluation/utils/convert-dataset.mjs`

## Pending Downloads

### ⚠️ WebUI Dataset
- **Status**: Repository cloned, downloader script available
- **Location**: `evaluation/datasets/human-annotated/visual-ui-understanding/webui-repo/`
- **Requirements**: 
  - `gdown` Python package (for Google Drive downloads)
  - Large storage space (datasets range from 7k to 350k samples)
- **Available Subsets**:
  - `webui-7k` (smallest, recommended for testing)
  - `webui-7k-balanced` (higher quality subset)
  - `webui-70k` (baseline size)
  - `webui-350k` (full training set)
  - `webui-val` (validation set)
  - `webui-test` (test set)
- **Download Method**: 
  ```bash
  cd evaluation/datasets/human-annotated/visual-ui-understanding/webui-repo/downloads
  python3 downloader.py
  # Then uncomment the desired dataset in the __main__ section
  ```
- **Note**: Downloads are large (GBs) and hosted on Google Drive. May require manual intervention or extended time.

## Download Scripts

### Automated Script
- **Location**: `scripts/run-dataset-downloads.mjs`
- **Usage**: `node scripts/run-dataset-downloads.mjs`
- **What it does**:
  - Downloads WCAG test cases
  - Attempts WebUI download (requires gdown)

### Manual Scripts
- **WCAG**: `evaluation/datasets/human-annotated/wcag-test-cases/download.sh`
- **WebUI**: `evaluation/datasets/human-annotated/visual-ui-understanding/webui-repo/downloads/downloader.py`

## Next Steps

1. ✅ WCAG test cases downloaded - ready for conversion
2. ⚠️ WebUI dataset - install gdown and run downloader for desired subset
3. Convert downloaded datasets to our format
4. Validate converted datasets
5. Integrate with evaluation runners

## Installation Notes

To install gdown for WebUI downloads:
```bash
# Option 1: User installation (recommended)
python3 -m pip install --user gdown

# Option 2: System installation (requires --break-system-packages on some systems)
python3 -m pip install --break-system-packages gdown

# Option 3: Virtual environment (best practice)
python3 -m venv venv
source venv/bin/activate
pip install gdown
```

