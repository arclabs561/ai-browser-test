/**
 * Run Comprehensive Spec Validation
 * 
 * Validates natural language specs against:
 * - Real-world BDD patterns
 * - Research findings
 * - Error analysis
 * - Quality metrics
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { runErrorAnalysis, analyzeSpecQuality } from '../utils/spec-error-analysis.mjs';
import { createSpecFromTemplate, listTemplates, TEMPLATES } from '../../src/spec-templates.mjs';
import { validateSpec, parseSpec } from '../../src/natural-language-specs.mjs';
import { mapToInterfaces } from '../../src/natural-language-specs.mjs';

/**
 * Load spec dataset
 */
function loadSpecDataset() {
  const datasetPath = join(process.cwd(), 'evaluation', 'datasets', 'natural-language-specs-dataset.json');
  const dataset = JSON.parse(readFileSync(datasetPath, 'utf-8'));
  return dataset.specs;
}

/**
 * Validate spec against real-world patterns
 */
async function validateAgainstPatterns(spec) {
  const specText = typeof spec === 'string' ? spec : (spec.spec || spec.text || '');
  
  // Parse spec
  const parsed = await parseSpec(specText);
  
  // Validate structure
  const validation = validateSpec(specText);
  
  // Analyze quality
  const quality = analyzeSpecQuality(specText);
  
  return {
    parsed,
    validation,
    quality,
    patterns: {
      hasStructure: validation.valid || validation.warnings.length === 0,
      hasContext: parsed.context && Object.keys(parsed.context).length > 0,
      hasInterfaces: parsed.interfaces && parsed.interfaces.length > 0,
      qualityScore: quality.score
    }
  };
}

/**
 * Compare with expected results
 */
function compareWithExpected(spec, result) {
  const comparison = {
    specId: spec.id,
    name: spec.name,
    matches: {},
    discrepancies: []
  };
  
  // Check expected interfaces
  if (spec.expectedInterfaces) {
    const actualInterfaces = result.parsed?.interfaces || [];
    const matchesInterfaces = spec.expectedInterfaces.every(iface => 
      actualInterfaces.includes(iface)
    );
    
    comparison.matches.interfaces = matchesInterfaces;
    if (!matchesInterfaces) {
      comparison.discrepancies.push({
        type: 'interfaces',
        expected: spec.expectedInterfaces,
        actual: actualInterfaces
      });
    }
  }
  
  // Check expected context
  if (spec.expectedContext) {
    const actualContext = result.parsed?.context || {};
    const contextMatches = Object.entries(spec.expectedContext).every(([key, value]) => {
      const actual = actualContext[key];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(actual) === JSON.stringify(value);
      }
      return actual === value;
    });
    
    comparison.matches.context = contextMatches;
    if (!contextMatches) {
      comparison.discrepancies.push({
        type: 'context',
        expected: spec.expectedContext,
        actual: actualContext
      });
    }
  }
  
  // Check quality score
  if (spec.qualityScore !== undefined) {
    const actualScore = result.quality.score;
    const scoreDiff = Math.abs(actualScore - spec.qualityScore);
    comparison.matches.qualityScore = scoreDiff <= 10; // Allow 10 point variance
    if (scoreDiff > 10) {
      comparison.discrepancies.push({
        type: 'qualityScore',
        expected: spec.qualityScore,
        actual: actualScore,
        diff: scoreDiff
      });
    }
  }
  
  // Check expected issues (for negative examples)
  if (spec.expectedIssues) {
    const actualIssues = result.quality.patterns || [];
    const hasExpectedIssues = spec.expectedIssues.every(issue =>
      actualIssues.includes(issue)
    );
    
    comparison.matches.expectedIssues = hasExpectedIssues;
    if (!hasExpectedIssues) {
      comparison.discrepancies.push({
        type: 'expectedIssues',
        expected: spec.expectedIssues,
        actual: actualIssues
      });
    }
  }
  
  return comparison;
}

/**
 * Validate executeSpec call chain without actual execution
 * Tests that specs map correctly to interface calls
 */
async function validateExecuteSpecMapping(spec) {
  const specText = typeof spec === 'string' ? spec : (spec.spec || spec.text || '');
  
  // Parse spec
  const parsed = await parseSpec(specText, { useLLM: false });
  
  // Map to interfaces (without page, so no execution)
  const calls = await mapToInterfaces(parsed, {
    page: null, // No page = no execution
    options: {}
  });
  
  return {
    parsed,
    calls,
    callCount: calls.length,
    interfaces: calls.map(c => c.interface),
    // Validate call structure
    // Note: validateScreenshot doesn't require page in args, and page can be null for validation
    valid: calls.every(call => 
      call.interface && 
      call.args
      // Page validation: some interfaces need page, others don't
      // validateScreenshot doesn't require page, testGameplay/testBrowserExperience do
      // For validation purposes (page=null), we just check interface and args exist
    )
  };
}

/**
 * Run comprehensive validation
 */
async function runComprehensiveValidation() {
  console.log('🔬 Running Comprehensive Spec Validation\n');
  
  // Load dataset
  const specs = loadSpecDataset();
  console.log(`Loaded ${specs.length} specs from dataset\n`);
  
  // Validate each spec
  const results = [];
  for (const spec of specs) {
    console.log(`Validating: ${spec.name} (${spec.id})`);
    
    try {
      const validation = await validateAgainstPatterns(spec);
      const comparison = compareWithExpected(spec, validation);
      
      results.push({
        spec,
        validation,
        comparison
      });
      
      // Print quick status
      const allMatch = Object.values(comparison.matches).every(m => m === true);
      console.log(`  ${allMatch ? '✅' : '⚠️'} Quality: ${validation.quality.score}/100`);
      if (!allMatch) {
        console.log(`  Discrepancies: ${comparison.discrepancies.length}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        spec,
        error: error.message
      });
    }
  }
  
  // Run error analysis
  console.log('\n📊 Running Error Analysis...\n');
  const errorAnalysis = await runErrorAnalysis(
    specs.map(s => s.spec),
    { saveReport: true }
  );
  
  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    totalSpecs: specs.length,
    validated: results.filter(r => !r.error).length,
    errors: results.filter(r => r.error).length,
    averageQualityScore: results
      .filter(r => r.validation)
      .reduce((sum, r) => sum + (r.validation.quality.score || 0), 0) /
      results.filter(r => r.validation).length,
    matches: {
      interfaces: results.filter(r => r.comparison?.matches?.interfaces === true).length,
      context: results.filter(r => r.comparison?.matches?.context === true).length,
      qualityScore: results.filter(r => r.comparison?.matches?.qualityScore === true).length
    },
    errorAnalysis: errorAnalysis.summary
  };
  
  console.log('\n📋 Validation Summary\n');
  console.log(`Total Specs: ${summary.totalSpecs}`);
  console.log(`Validated: ${summary.validated}`);
  console.log(`Errors: ${summary.errors}`);
  console.log(`Average Quality Score: ${summary.averageQualityScore.toFixed(1)}/100\n`);
  
  console.log('Matches:');
  console.log(`  Interfaces: ${summary.matches.interfaces}/${summary.validated}`);
  console.log(`  Context: ${summary.matches.context}/${summary.validated}`);
  console.log(`  Quality Score: ${summary.matches.qualityScore}/${summary.validated}\n`);
  
  // Validate executeSpec mapping
  console.log('🔗 Validating executeSpec Mapping...\n');
  const mappingResults = [];
  const mappingTestSpecs = specs.slice(0, Math.min(10, specs.length)); // Test first 10 for now
  
  for (const spec of mappingTestSpecs) {
    try {
      const mapping = await validateExecuteSpecMapping(spec);
      const matchesExpected = spec.expectedInterfaces 
        ? spec.expectedInterfaces.every(iface => mapping.interfaces.includes(iface))
        : true;
      
      mappingResults.push({
        specId: spec.id,
        name: spec.name,
        valid: mapping.valid && matchesExpected,
        interfaces: mapping.interfaces,
        expectedInterfaces: spec.expectedInterfaces,
        matches: matchesExpected,
        callCount: mapping.callCount
      });
    } catch (error) {
      mappingResults.push({
        specId: spec.id,
        name: spec.name,
        error: error.message
      });
    }
  }
  
  const mappingPassCount = mappingResults.filter(r => r.valid).length;
  console.log(`Mapping Validation: ${mappingPassCount}/${mappingResults.length} passed\n`);
  
  // Show any failures
  const mappingFailures = mappingResults.filter(r => !r.valid && !r.error);
  if (mappingFailures.length > 0) {
    console.log('Mapping Failures:');
    for (const failure of mappingFailures.slice(0, 5)) {
      console.log(`  ⚠️ ${failure.name} (${failure.specId})`);
      if (failure.expectedInterfaces && !failure.matches) {
        console.log(`    Expected: ${failure.expectedInterfaces.join(', ')}`);
        console.log(`    Got: ${failure.interfaces.join(', ')}`);
      }
    }
    if (mappingFailures.length > 5) {
      console.log(`  ... and ${mappingFailures.length - 5} more`);
    }
    console.log();
  }
  
  // Add mapping validation to summary
  summary.mappingValidation = {
    tested: mappingResults.length,
    passed: mappingPassCount,
    failed: mappingResults.length - mappingPassCount
  };
  
  // Test templates with full validation
  console.log('🧪 Testing Templates with Examples...\n');
  const templates = listTemplates();
  console.log(`Available templates: ${templates.length}\n`);
  
  const templateResults = [];
  for (const template of templates) {
    const templateName = template.name.toLowerCase().replace(/\s+/g, '_');
    const templateKey = Object.keys(TEMPLATES).find(k => 
      TEMPLATES[k].name === template.name
    ) || templateName;
    
    const templateResult = {
      template: template.name,
      templateKey,
      defaultSpec: null,
      examples: []
    };
    
    // Test 1: Template generates valid spec with defaults
    try {
      const defaultSpec = createSpecFromTemplate(templateKey, {});
      const defaultValidation = validateSpec(defaultSpec);
      const defaultParsed = await parseSpec(defaultSpec, { useLLM: false });
      
      templateResult.defaultSpec = {
        valid: defaultValidation.valid,
        parseable: !!defaultParsed.interfaces.length,
        hasContext: Object.keys(defaultParsed.context || {}).length > 0,
        interfaces: defaultParsed.interfaces,
        errors: defaultValidation.errors,
        warnings: defaultValidation.warnings
      };
    } catch (error) {
      templateResult.defaultSpec = { error: error.message };
    }
    
    // Test 2: Validate all examples
    if (template.examples && template.examples.length > 0) {
      for (const example of template.examples) {
        try {
          const exampleSpec = createSpecFromTemplate(templateKey, example.values);
          const exampleValidation = validateSpec(exampleSpec);
          const exampleParsed = await parseSpec(exampleSpec, { useLLM: false });
          
          // Check context extraction matches example expectations
          let contextMatches = true;
          if (example.values.url) {
            const urlValue = example.values.url.replace(/^https?:\/\//, '');
            contextMatches = exampleParsed.context?.url?.includes(urlValue) || 
                           exampleParsed.context?.url === `https://${urlValue}` ||
                           exampleParsed.context?.url === `http://${urlValue}`;
          }
          
          templateResult.examples.push({
            name: example.name,
            valid: exampleValidation.valid,
            parseable: !!exampleParsed.interfaces.length,
            contextMatches,
            interfaces: exampleParsed.interfaces,
            errors: exampleValidation.errors,
            warnings: exampleValidation.warnings
          });
        } catch (error) {
          templateResult.examples.push({
            name: example.name,
            error: error.message
          });
        }
      }
    }
    
    templateResults.push(templateResult);
  }
  
  // Report template validation results
  console.log('Template Validation Results:\n');
  let templatePassCount = 0;
  let templateTotalCount = 0;
  let examplePassCount = 0;
  let exampleTotalCount = 0;
  
  for (const result of templateResults) {
    const defaultStatus = result.defaultSpec.error ? '❌' : 
      (result.defaultSpec.valid && result.defaultSpec.parseable ? '✅' : '⚠️');
    console.log(`${defaultStatus} ${result.template}`);
    
    if (result.defaultSpec.error) {
      console.log(`  Error: ${result.defaultSpec.error}`);
    } else {
      templateTotalCount++;
      if (result.defaultSpec.valid && result.defaultSpec.parseable) {
        templatePassCount++;
      } else {
        if (result.defaultSpec.errors?.length) {
          console.log(`  Errors: ${result.defaultSpec.errors.join(', ')}`);
        }
        if (result.defaultSpec.warnings?.length) {
          console.log(`  Warnings: ${result.defaultSpec.warnings.length}`);
        }
      }
    }
    
    if (result.examples && result.examples.length > 0) {
      for (const example of result.examples) {
        exampleTotalCount++;
        const exStatus = example.error ? '  ❌' :
          (example.valid && example.parseable && example.contextMatches ? '  ✅' : '  ⚠️');
        console.log(`${exStatus}   ${example.name}`);
        
        if (example.error) {
          console.log(`      Error: ${example.error}`);
        } else {
          if (example.valid && example.parseable && example.contextMatches) {
            examplePassCount++;
          } else {
            if (example.errors?.length) {
              console.log(`      Errors: ${example.errors.join(', ')}`);
            }
            if (!example.contextMatches && example.values?.url) {
              console.log(`      Context mismatch: expected URL extraction`);
            }
          }
        }
      }
    }
  }
  
  console.log(`\nTemplate Summary: ${templatePassCount}/${templateTotalCount} templates pass`);
  console.log(`Example Summary: ${examplePassCount}/${exampleTotalCount} examples pass\n`);
  
  // Add template validation to summary
  summary.templateValidation = {
    totalTemplates: templateResults.length,
    templatesPassed: templatePassCount,
    templatesTotal: templateTotalCount,
    examplesPassed: examplePassCount,
    examplesTotal: exampleTotalCount
  };
  
  return {
    summary,
    results,
    errorAnalysis,
    templateResults
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveValidation().catch(console.error);
}

export { runComprehensiveValidation };

