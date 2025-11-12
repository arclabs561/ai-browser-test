# Real Sites for Testing ai-visual-test

## Quick Test Sites (Fast, Reliable)

1. **Stripe.com** - Payment UI, clean design
2. **Vercel.com** - Developer tools, modern design  
3. **Notion.so** - Rich content, WYSIWYG editor
4. **Shopify.com** - E-commerce, product pages
5. **Medium.com** - Content platform, article layout
6. **MDN Web Docs** - Documentation, excellent accessibility
7. **W3C.org** - Reference implementation, WCAG compliant
8. **play2048.co** - Simple game, clear UI

## Interactive/Complex Sites

9. **CodePen.io** - Code playground, interactive
10. **Excalidraw.com** - Drawing tool, canvas interactions
11. **GitHub.com** - Code interface, complex (may timeout)
12. **Linear.app** - Modern SaaS, complex state (may timeout)

## Test Scripts

- `evaluation/e2e/test-real-sites.mjs` - Simple, fast test of 8 sites
- `evaluation/e2e/e2e-real-websites.mjs` - Comprehensive with games
- `evaluation/runners/evaluate-interactive-experiences.mjs` - Interactive experiences

## Usage

```bash
# Quick test of diverse sites
node evaluation/e2e/test-real-sites.mjs

# Comprehensive test with games
node evaluation/e2e/e2e-real-websites.mjs

# Interactive experiences
node evaluation/runners/evaluate-interactive-experiences.mjs
```
