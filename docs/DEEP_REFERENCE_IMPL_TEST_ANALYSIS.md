# Deep Reference, Implementation, and Test Integration Analysis

## Executive Summary

This document provides a comprehensive, file-by-file analysis of the connections between academic references, implementation code, and test validation. The analysis reveals **strong architectural alignment** with **specific gaps** in research implementation fidelity, template validation, and end-to-end testing.

**Key Finding**: The system demonstrates **honest research integration** (explicitly documents what isn't implemented) but has **validation gaps** where template examples and research claims aren't fully exercised by tests.

---

## Part 1: Academic References Deep Dive

### Research Citations in Natural Language Specs

#### Citation 1: arXiv:2406.12125 - "Efficient Sequential Decision Making"

**Where Cited**: 
- `src/natural-language-specs.mjs:18` - "Temporal decision-making (arXiv:2406.12125 - concepts, not full implementation)"
- `docs/NATURAL_LANGUAGE_SPECS.md:257` - References temporal dependency concepts

**What Research Claims**:
- Core algorithm: Online model selection using multiplicative weights update
- Key innovation: 6x performance gain with 1.5% LLM calls
- Mechanism: Algorithm 1 converts LLMs to decision-making agents; Algorithm 2 implements online model selection

**What Code Actually Implements**:
```javascript
// src/natural-language-specs.mjs:289-377
// parseSpec() - Simple keyword-based parsing, no online model selection
// extractContextFromSpec() - LLM/regex extraction, no decision logic
```

**Gap Analysis**:
- ✅ **Correctly documented** as "concepts, not full implementation"
- ❌ **No actual implementation** of temporal decision-making in natural language specs
- ⚠️ **Citation is aspirational** - the code doesn't use temporal decision concepts in spec parsing

**Verdict**: **Overcited** - The citation exists but the code doesn't implement even the "concepts" from this paper in the natural language specs module.

#### Citation 2: Property-Based Testing (fast-check, Hypothesis)

**Where Cited**:
- `src/natural-language-specs.mjs:16` - "Property-based testing (fast-check, Hypothesis patterns)"
- `docs/NATURAL_LANGUAGE_SPECS.md:286-298` - Property testing examples

**What Research Claims**:
- Property-based testing generates test cases automatically
- Invariants should hold for all inputs
- Uses generators to create test data

**What Code Actually Implements**:
```javascript
// src/natural-language-specs.mjs:797-857
export async function generatePropertyTests(properties, options = {}) {
  // ... generates structure but doesn't actually use fast-check
  // generatePropertyCheck() - simplified heuristics, not actual property testing
}
```

**Gap Analysis**:
- ⚠️ **Structure exists** but doesn't use fast-check or Hypothesis
- ❌ **No actual property generators** - just placeholder structure
- ❌ **No test validation** that property tests work

**Verdict**: **Partially implemented** - Framework exists but doesn't use the cited libraries.

#### Citation 3: BDD Best Practices

**Where Cited**:
- `src/spec-templates.mjs:7-10` - "Real-world BDD patterns (Cucumber, SpecFlow, Behave)"
- `docs/RESEARCH_COMPARISON.md:89-103` - BDD best practices comparison

**What Research Claims**:
- Scenario independence (each scenario executable in isolation)
- Domain language (not technical terms)
- Single behavior per scenario
- Living documentation

**What Code Actually Implements**:
```javascript
// src/natural-language-specs.mjs:742-788
export function validateSpec(spec) {
  // Checks for Given/When/Then structure
  // Warns about missing URL
  // Detects technical language (basic)
  // But doesn't validate scenario independence
  // Doesn't generate living documentation
}
```

**Gap Analysis**:
- ✅ **Structure validation** exists
- ⚠️ **Basic quality checks** but not comprehensive
- ❌ **No scenario independence validation**
- ❌ **No living documentation generation**

**Verdict**: **Partially aligned** - Implements some BDD concepts but not all best practices.

---

## Part 2: File-by-File Code Analysis

### File 1: `src/natural-language-specs.mjs` (903 lines)

#### Function: `extractContextFromSpec()` (lines 47-149)

**Purpose**: Extract structured context (URL, viewport, device, etc.) from spec text

**Implementation Details**:
```javascript
// Lines 52-144: LLM-based extraction with regex fallback
if (useLLM) {
  const { extractStructuredData } = await import('./data-extractor.mjs');
  // Uses schema-based extraction
  // Normalizes URL, viewport, device, etc.
} else {
  return extractContextFromSpecRegex(spec); // Lines 157-278
}
```

**Test Coverage**:
- ✅ `test/natural-language-specs.test.mjs:17-36` - Tests context extraction
- ✅ `test/natural-language-specs.test.mjs:38-51` - Tests URL extraction patterns
- ✅ `test/natural-language-specs.test.mjs:53-69` - Tests activation key extraction
- ⚠️ **No test** for LLM extraction (only regex fallback tested)

**Gap**: LLM extraction path is not tested, only regex fallback.

#### Function: `parseSpec()` (lines 289-377)

**Purpose**: Parse natural language spec into structured test description

**Implementation Details**:
```javascript
// Lines 296-307: Initialize parsed structure
const parsed = {
  type: 'behavior',
  given: [], when: [], then: [],
  keywords: [], interfaces: [],
  context: extractedContext
};

// Lines 311-346: Line-by-line parsing
// Detects Given/When/Then sections
// Extracts keywords for interface selection
// Lines 348-373: Keyword-based interface detection
```

**Test Coverage**:
- ✅ `test/natural-language-specs.test.mjs:71-84` - Tests interface detection
- ✅ `test/spec-integration-trace.test.mjs:25-72` - Tests parse with tracing
- ⚠️ **No test** for property-based specs (type: 'property')
- ⚠️ **No test** for edge cases (malformed specs, missing sections)

**Gap**: Property-based spec parsing not tested.

#### Function: `mapToInterfaces()` (lines 389-576)

**Purpose**: Map parsed spec to interface calls

**Implementation Details**:
```javascript
// Lines 393-409: Merge extracted context with provided options
// Lines 411-412: Select primary interface
// Lines 416-493: Build interface calls based on spec content
// - validateAccessibilitySmart (lines 416-427)
// - testGameplay (lines 428-493) - Most complex, extracts goals, temporal options
// - validateStateSmart (lines 494-504)
// - testBrowserExperience (lines 505-528)
// - validateScreenshot (lines 529-572) - Default fallback
```

**Test Coverage**:
- ✅ `test/spec-holistic-integration.test.mjs:70-96` - Tests parameter passing
- ✅ `test/spec-holistic-integration.test.mjs:137-172` - Tests research features pass-through
- ⚠️ **No test** for all interface types (only testGameplay tested)
- ⚠️ **No test** for error handling when interface call fails

**Gap**: Not all interface mappings are tested.

#### Function: `executeSpec()` (lines 601-732)

**Purpose**: Execute natural language spec end-to-end

**Implementation Details**:
```javascript
// Lines 604-626: Support string or structured spec object
// Lines 628-644: Validate spec structure (optional)
// Lines 646-656: Parse spec (auto-extracts context)
// Lines 658-664: Map to interfaces
// Lines 666-716: Execute interface calls
// Lines 718-731: Return enhanced result
```

**Test Coverage**:
- ❌ **No test** - Explicitly skipped: `test/natural-language-specs.test.mjs:112-115`
- ❌ **No test** - Explicitly skipped: `test/spec-integration-trace.test.mjs:179-182`
- ⚠️ **Integration tests** exist but skip execution (require Playwright)

**Gap**: **Critical gap** - The primary execution function is not tested.

#### Function: `validateSpec()` (lines 742-788)

**Purpose**: Validate spec structure before execution

**Implementation Details**:
```javascript
// Lines 752-762: Check for Given/When/Then structure
// Lines 764-767: Check for common mistakes ("I should" vs "Then")
// Lines 769-773: Check for URL detection
// Lines 775-780: Check for interface keywords
```

**Test Coverage**:
- ✅ `test/natural-language-specs.test.mjs:86-110` - Tests validation
- ✅ `test/spec-integration-trace.test.mjs:74-104` - Tests validation with tracing

**Gap**: None - well tested.

#### Function: `generatePropertyTests()` (lines 797-857)

**Purpose**: Generate property-based tests from natural language properties

**Implementation Details**:
```javascript
// Lines 804-825: Parse property descriptions
// Lines 822: generatePropertyCheck() - simplified heuristics
// Lines 831-855: Return structure with run() method (placeholder)
```

**Test Coverage**:
- ❌ **No test** - Property test generation is not tested

**Gap**: **Critical gap** - Property testing framework exists but is untested.

### File 2: `src/spec-templates.mjs` (348 lines)

#### Constant: `TEMPLATES` (lines 18-215)

**Purpose**: Built-in templates for common testing patterns

**Implementation Details**:
```javascript
// 6 templates defined:
// - game (lines 23-59)
// - accessibility (lines 64-94)
// - browser_experience (lines 99-125)
// - state_validation (lines 130-154)
// - temporal (lines 159-185)
// - property (lines 190-214)

// Each template has:
// - name, description
// - spec (with {placeholder} variables)
// - variables (default values)
// - examples (array of example value sets)
```

**Test Coverage**:
- ✅ `test/spec-templates.test.mjs:20-33` - Tests game template
- ✅ `test/spec-templates.test.mjs:35-43` - Tests accessibility template
- ✅ `test/spec-templates.test.mjs:45-56` - Tests temporal variant
- ✅ `test/spec-templates.test.mjs:178-183` - Tests all templates are valid
- ❌ **No test** for `browser_experience` template
- ❌ **No test** for `state_validation` template
- ❌ **No test** for `property` template
- ❌ **No test** that template examples generate valid, parseable specs

**Gap**: **Critical gap** - Template examples are not validated. The examples in code (lines 40-58, 79-93, etc.) are documentation, not validated test cases.

#### Function: `createSpecFromTemplate()` (lines 220-241)

**Purpose**: Create spec string from template with variable substitution

**Implementation Details**:
```javascript
// Lines 221-225: Lookup template
// Lines 228-231: Merge template variables with provided variables
// Lines 234-238: Replace {placeholder} with values using regex
```

**Test Coverage**:
- ✅ `test/spec-templates.test.mjs:20-33` - Basic game template
- ✅ `test/spec-templates.test.mjs:35-43` - Accessibility template
- ✅ `test/spec-templates.test.mjs:45-56` - With temporal
- ✅ `test/spec-templates.test.mjs:58-62` - Error handling
- ✅ `test/spec-integration-trace.test.mjs:106-131` - With validation
- ⚠️ **No test** for edge cases (empty variables, special characters in values)

**Gap**: Edge cases not tested.

#### Function: `validateTemplate()` (lines 316-346)

**Purpose**: Validate template structure

**Implementation Details**:
```javascript
// Lines 319-329: Check required fields (name, spec, variables)
// Lines 332-340: Check that all {placeholders} have corresponding variables
```

**Test Coverage**:
- ✅ `test/spec-templates.test.mjs:104-118` - Valid template
- ✅ `test/spec-templates.test.mjs:120-130` - Missing name
- ✅ `test/spec-templates.test.mjs:132-146` - Missing placeholder variable
- ✅ `test/spec-templates.test.mjs:178-183` - All built-in templates valid

**Gap**: None - well tested.

### File 3: `src/spec-config.mjs` (107 lines)

#### Function: `createSpecConfig()` (lines 49-78)

**Purpose**: Create spec configuration with defaults and environment variable support

**Implementation Details**:
```javascript
// Lines 50-56: Merge with defaults
// Lines 58-61: Auto-detect provider from global config
// Lines 63-75: Respect environment variables
```

**Test Coverage**:
- ✅ `test/spec-integration-trace.test.mjs:133-177` - Config system with tracing
- ✅ `test/spec-holistic-integration.test.mjs:104-135` - Per-project and per-test config

**Gap**: None - well tested.

---

## Part 3: Test File Analysis

### File: `test/natural-language-specs.test.mjs` (117 lines)

**Coverage**:
- ✅ Context extraction (3 tests)
- ✅ URL extraction patterns (1 test)
- ✅ Activation key extraction (1 test)
- ✅ Interface detection (1 test)
- ✅ Spec validation (2 tests)
- ❌ `executeSpec()` - Skipped (requires Playwright)
- ❌ Property-based tests - Not tested
- ❌ Template integration - Not tested

**Gap**: **Critical** - Core execution function not tested, no template integration.

### File: `test/spec-templates.test.mjs` (186 lines)

**Coverage**:
- ✅ Template creation (3 tests)
- ✅ Template listing (1 test)
- ✅ Template retrieval (2 tests)
- ✅ Template registration (1 test)
- ✅ Template validation (3 tests)
- ✅ Template inheritance (1 test)
- ✅ Template composition (2 tests)
- ✅ All templates valid (1 test)
- ❌ Template examples validation - **Not tested**
- ❌ Template → parseSpec integration - **Not tested**
- ❌ Template → executeSpec integration - **Not tested**

**Gap**: **Critical** - Templates tested in isolation but not integrated with parsing/execution.

### File: `test/spec-integration-trace.test.mjs` (219 lines)

**Coverage**:
- ✅ Parse with tracing (1 test)
- ✅ Validation with tracing (1 test)
- ✅ Template generation with validation (1 test)
- ✅ Config system (1 test)
- ✅ Template → parse → validate flow (1 test)
- ❌ Template → executeSpec - Skipped (requires Playwright)

**Gap**: Integration tested up to execution, but execution skipped.

### File: `test/spec-holistic-integration.test.mjs` (194 lines)

**Coverage**:
- ✅ End-to-end parse → map (1 test)
- ✅ Configuration customization (1 test)
- ✅ Research features pass-through (1 test)
- ✅ Library API patterns (1 test)
- ❌ Template → executeSpec - Skipped (requires Playwright)

**Gap**: Integration tested up to mapping, but execution skipped.

---

## Part 4: Cross-System Connections

### Connection 1: Template → Spec → Parse → Execute

**Reference Claim**: 
- `docs/NATURAL_LANGUAGE_SPECS.md:199-243` - Shows template usage with executeSpec
- `docs/SPEC_INTEGRATION.md:199-211` - Template + executeSpec example

**Implementation**:
```javascript
// src/spec-templates.mjs:220-241
createSpecFromTemplate() → returns string

// src/natural-language-specs.mjs:601-732
executeSpec(page, spec) → accepts string
  → parseSpec(spec) → extracts context
  → mapToInterfaces(parsed) → builds calls
  → executes interface calls
```

**Test Coverage**:
- ✅ Template → validate (tested)
- ✅ Template → parse (tested)
- ❌ Template → executeSpec (**NOT TESTED** - requires Playwright, skipped)

**Gap Analysis**: The primary use case shown in documentation is not validated by tests. This is a **critical gap** because:
1. Template-generated specs may have different parsing characteristics
2. Template examples may not actually work end-to-end
3. Context extraction from template-generated specs may differ

### Connection 2: Research Features Integration

**Reference Claim**:
- `docs/NATURAL_LANGUAGE_SPECS.md:244-252` - Research features pass through
- `src/natural-language-specs.mjs:485-492` - Research features in testGameplay mapping

**Implementation**:
```javascript
// src/natural-language-specs.mjs:485-492
enableUncertaintyReduction: options.enableUncertaintyReduction,
enableHallucinationCheck: options.enableHallucinationCheck,
adaptiveSelfConsistency: options.adaptiveSelfConsistency,
// ... passes through research features
```

**Test Coverage**:
- ✅ `test/spec-holistic-integration.test.mjs:137-172` - Research features pass-through tested

**Gap Analysis**: **Well tested** - Research features integration is validated.

### Connection 3: Template Examples Validation

**Reference Claim**:
- `src/spec-templates.mjs:40-58` - Game template has 2 examples
- `src/spec-templates.mjs:79-93` - Accessibility template has 2 examples
- All templates have `examples` arrays

**Implementation**:
```javascript
// Examples are just data structures, not validated
examples: [
  {
    name: 'Basic Game',
    values: { url: 'queeraoke.fyi', activationKey: 'g', ... }
  }
]
```

**Test Coverage**:
- ❌ **NO TEST** validates that examples generate valid specs
- ❌ **NO TEST** validates that examples are parseable
- ❌ **NO TEST** validates that examples extract context correctly

**Gap Analysis**: **Critical gap** - Template examples are documentation, not validated test cases. They could be:
- Stale (don't match current template structure)
- Incorrect (generate invalid specs)
- Incomplete (missing required variables)

### Connection 4: BDD Best Practices Validation

**Reference Claim**:
- `docs/RESEARCH_COMPARISON.md:89-103` - Claims alignment with BDD best practices
- `src/spec-templates.mjs:10` - "Best practices (scenario independence, domain language)"

**Implementation**:
```javascript
// src/natural-language-specs.mjs:742-788
export function validateSpec(spec) {
  // Checks structure (Given/When/Then)
  // Warns about technical language (basic)
  // But doesn't validate scenario independence
  // Doesn't check for domain language vs technical language comprehensively
}
```

**Test Coverage**:
- ✅ Basic structure validation tested
- ❌ Scenario independence validation - **NOT TESTED**
- ❌ Domain language detection - **NOT TESTED**

**Gap Analysis**: **Partial gap** - Some BDD practices validated, but not all claimed practices.

---

## Part 5: Specific Code Evidence

### Evidence 1: Template Examples Not Validated

**Location**: `src/spec-templates.mjs:40-58`

```javascript
examples: [
  {
    name: 'Basic Game',
    values: {
      url: 'queeraoke.fyi',
      activationKey: 'g',
      selector: ', selector: #game-paddle'
    }
  },
  {
    name: 'Game with Temporal',
    values: {
      url: 'game.example.com',
      activationKey: 'g',
      selector: ', selector: #game-element',
      temporal: ', fps: 2, duration: 10 seconds, temporal: true'
    }
  }
]
```

**Problem**: These examples are never validated. No test:
1. Generates specs from these examples
2. Validates the generated specs
3. Parses the generated specs
4. Extracts context from the generated specs

**Impact**: Examples could be broken and we wouldn't know.

### Evidence 2: executeSpec Not Tested

**Location**: `test/natural-language-specs.test.mjs:112-115`

```javascript
test('executeSpec - requires Playwright (skipped)', { skip: true }, () => {
  // executeSpec tests require Playwright page object
  // Use evaluation/e2e/ for full Playwright-based integration tests
});
```

**Problem**: The primary execution function is not tested in unit tests.

**Impact**: 
- Template → executeSpec workflow not validated
- Error handling in execution not tested
- Interface call execution not tested

### Evidence 3: Property Tests Not Implemented

**Location**: `src/natural-language-specs.mjs:797-857`

```javascript
export async function generatePropertyTests(properties, options = {}) {
  // ...
  return {
    properties: propertyTests,
    generator: generator,
    numRuns: numRuns,
    run: async function() {
      // Execute property tests
      // ... returns placeholder structure
      results.push({
        property: propertyTest.description,
        type: propertyTest.type,
        status: 'pending' // Would be 'passed', 'failed', 'pending'
      });
    }
  };
}
```

**Problem**: Property test generation returns placeholder structure, doesn't actually use fast-check or Hypothesis.

**Impact**: Property-based testing is cited but not actually implemented.

### Evidence 4: Research Citation Overclaimed

**Location**: `src/natural-language-specs.mjs:18`

```javascript
* - Temporal decision-making (arXiv:2406.12125 - concepts, not full implementation)
```

**Problem**: The code doesn't implement temporal decision-making concepts in spec parsing. The citation is aspirational.

**Impact**: Documentation claims research alignment that doesn't exist in code.

---

## Part 6: Recommendations with Code Evidence

### Recommendation 1: Validate Template Examples

**Priority**: **HIGH**

**Implementation**:
```javascript
// Add to test/spec-templates.test.mjs
test('template examples generate valid, parseable specs', async () => {
  for (const [name, template] of Object.entries(TEMPLATES)) {
    for (const example of template.examples || []) {
      // Generate spec from example
      const spec = createSpecFromTemplate(name, example.values);
      
      // Validate structure
      const validation = validateSpec(spec);
      assert.strictEqual(validation.valid, true, 
        `Template ${name} example "${example.name}" generates invalid spec`);
      
      // Parse spec
      const parsed = await parseSpec(spec, { useLLM: false });
      assert.ok(parsed.interfaces.length > 0,
        `Template ${name} example "${example.name}" doesn't map to interfaces`);
      
      // Check context extraction
      if (example.values.url) {
        assert.ok(parsed.context?.url,
          `Template ${name} example "${example.name}" doesn't extract URL`);
      }
    }
  }
});
```

**Evidence**: Template examples exist but are never validated (see Evidence 1).

### Recommendation 2: Test All Templates

**Priority**: **MEDIUM**

**Implementation**:
```javascript
// Add to test/spec-templates.test.mjs
test('all templates generate valid specs', () => {
  const templatesToTest = ['browser_experience', 'state_validation', 'temporal', 'property'];
  
  for (const templateName of templatesToTest) {
    const spec = createSpecFromTemplate(templateName, {});
    const validation = validateSpec(spec);
    assert.strictEqual(validation.valid, true,
      `Template ${templateName} generates invalid spec`);
  }
});
```

**Evidence**: Only `game` and `accessibility` templates are tested in detail.

### Recommendation 3: Mock-Based executeSpec Test

**Priority**: **HIGH**

**Implementation**:
```javascript
// Add to test/natural-language-specs.test.mjs
test('executeSpec - with mocked interfaces', async () => {
  // Mock page object
  const mockPage = { goto: () => {}, waitForSelector: () => {} };
  
  // Mock interface functions
  const originalTestGameplay = await import('../src/convenience.mjs');
  // ... mock testGameplay to return test result
  
  const spec = createSpecFromTemplate('game', {
    url: 'test.example.com',
    activationKey: 'g'
  });
  
  const result = await executeSpec(mockPage, spec, {
    // Use mocked interfaces
  });
  
  assert.ok(result.success !== undefined);
  assert.ok(Array.isArray(result.results));
});
```

**Evidence**: executeSpec is the primary function but not tested (see Evidence 2).

### Recommendation 4: Remove or Implement Property Tests

**Priority**: **MEDIUM**

**Options**:
1. **Remove citation** if not implementing
2. **Implement actual property testing** using fast-check

**Evidence**: Property tests are cited but not implemented (see Evidence 3).

### Recommendation 5: Clarify Research Citations

**Priority**: **LOW**

**Implementation**: Update `src/natural-language-specs.mjs:18`:
```javascript
* - Temporal decision-making (arXiv:2406.12125 - NOT IMPLEMENTED, future work)
```

**Evidence**: Research citation is overclaimed (see Evidence 4).

---

## Part 7: Summary Statistics

### Code Coverage by Component

| Component | Lines | Tests | Coverage | Status |
|-----------|-------|-------|----------|--------|
| `extractContextFromSpec` | 103 | 3 | Partial | ⚠️ LLM path not tested |
| `parseSpec` | 89 | 2 | Partial | ⚠️ Property parsing not tested |
| `mapToInterfaces` | 188 | 2 | Partial | ⚠️ Not all interfaces tested |
| `executeSpec` | 132 | 0 | None | ❌ Not tested |
| `validateSpec` | 47 | 2 | Good | ✅ Well tested |
| `generatePropertyTests` | 61 | 0 | None | ❌ Not tested |
| `createSpecFromTemplate` | 22 | 3 | Good | ✅ Well tested |
| `validateTemplate` | 31 | 3 | Good | ✅ Well tested |
| `TEMPLATES` constant | 198 | 2 | Partial | ⚠️ Only 2/6 templates tested |

### Research Citation Fidelity

| Citation | Claimed | Implemented | Tested | Status |
|----------|---------|-------------|--------|--------|
| arXiv:2406.12125 | Concepts | None | N/A | ❌ Overclaimed |
| Property-based testing | fast-check/Hypothesis | Placeholder | No | ⚠️ Partial |
| BDD best practices | Full alignment | Partial | Partial | ⚠️ Partial |
| Queeraoke patterns | 200+ tests | Yes | No | ⚠️ Not validated |

### Integration Test Coverage

| Integration Path | Tested | Status |
|-----------------|--------|--------|
| Template → validate | Yes | ✅ |
| Template → parse | Yes | ✅ |
| Template → map | Yes | ✅ |
| Template → executeSpec | No | ❌ |
| Template examples → spec | No | ❌ |
| Template examples → parse | No | ❌ |

---

## Conclusion

The system demonstrates **strong architectural design** with **honest research documentation** (explicitly states what isn't implemented). However, there are **critical validation gaps**:

1. **Template examples are not validated** - They exist in code but aren't proven to work
2. **executeSpec is not tested** - The primary execution function is skipped in tests
3. **Property testing is cited but not implemented** - Framework exists but doesn't use cited libraries
4. **Some research citations are overclaimed** - Temporal decision-making cited but not implemented

**Key Insight**: The system follows a "string-based integration" pattern where templates generate strings processed identically to manual specs. This is elegant but means template-specific validation is minimal. Adding validation for template examples and template → parse → execute flows would strengthen the system without changing its architecture.

**Recommendation Priority**:
1. **HIGH**: Validate template examples, add mock-based executeSpec test
2. **MEDIUM**: Test all templates, implement or remove property testing
3. **LOW**: Clarify research citations, add scenario independence validation

