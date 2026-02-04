import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import Button from './ui/Button';

interface Component {
  name: string;
  type: string;
  path: string;
  code: string;
  language: string;
}

interface ViteConfig {
  packageJson?: string;
  viteConfig?: string;
  indexHtml?: string;
  mainJs?: string;
  mainJsx?: string;
  styleCss?: string;
}

interface WebsitePreviewProps {
  html?: string;
  css?: string;
  js?: string;
  components?: Component[];
  viteConfig?: ViteConfig;
  websiteName?: string;
  onClose?: () => void;
  isModal?: boolean;
  className?: string;
}

const WebsitePreview = ({ html, css, js, components, viteConfig, websiteName, onClose, isModal = false, className }: WebsitePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to load content into iframe (memoized with useCallback)
  const loadIframeContent = useCallback(() => {
    if (iframeRef.current) {
      // Wait for iframe to be ready
      const iframe = iframeRef.current;
      
      const loadContent = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!doc) return;
          
          let content = '';
          
          // Check if we have component-based structure
          if (components && components.length > 0) {
            // Check if components use React (JSX) or vanilla JS
            const usesReact = components.some(c => 
              c.language === 'jsx' || 
              c.code.includes('import React') || 
              c.code.includes('from \'react\'') ||
              c.code.includes('<') && c.code.includes('className=')
            );
            
            if (usesReact) {
              // React components - use React CDN with Babel
              const styleCss = viteConfig?.styleCss || '';
              const mainJsx = viteConfig?.mainJsx || viteConfig?.mainJs || '';
              
              // Process component code - remove ES6 imports/exports and convert to global scope
              // Fix JSX ${expr} → {'$' + expr} so Babel doesn't treat ${ as template literal (Unterminated template)
              const sanitizeDollarInJsx = (code: string) =>
                code.replace(/>([^<]*?)\$\{([^}]+)\}([^<]*?)</g, (_m: string, before: string, expr: string, after: string) =>
                  `>${before}{'$' + ${expr}}${after}<`
                );

              const processedComponents = components
                .filter(c => c.language === 'jsx' || c.language === 'js' || c.language === 'tsx' || (!c.language && (/\\.(jsx|tsx)$/.test(c.path || '') || (c.code && (c.code.includes('from \'react\'') || c.code.includes('className'))))))
                .map(c => {
                  let code = sanitizeDollarInJsx(c.code);
                  
                  // Remove import statements (we'll provide React and hooks in preamble - do NOT re-declare here to avoid "already been declared")
                  code = code.replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?\s*/g, '');
                  code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?\s*/g, () => '');
                  // Remove other import statements
                  code = code.replace(/import\s+[^;]+;?\s*/g, '');
                  // Strip 'use client' / 'use server' and duplicate "const { ... } = React;" so only our preamble declares hooks
                  code = code.replace(/\s*['"]use\s+(?:client|server)['"]\s*;?\s*/gi, '\n');
                  code = code.replace(/\s*const\s*\{[\s\S]*?\}\s*=\s*React\s*;?\s*/g, '\n');
                  
                  // Remove export default and make function available globally
                  // Must remove exports BEFORE Babel processes the code
                  // Pattern 1: export default function ComponentName() { ... }
                  // Handle with various whitespace patterns
                  code = code.replace(/export\s+default\s+function\s+(\w+)\s*\(/g, 'function $1(');
                  // Pattern 2: export default function() { ... } - need to add name
                  const componentName = c.name.replace(/\s+/g, '');
                  if (!code.includes(`function ${componentName}`)) {
                    code = code.replace(/export\s+default\s+function\s*\(/g, `function ${componentName}(`);
                  }
                  // Pattern 3: const Component = ...; export default Component;
                  code = code.replace(/export\s+default\s+(\w+)\s*;?\s*$/gm, '');
                  // Pattern 4: export default (arrow function or expression)
                  code = code.replace(/export\s+default\s+const\s+(\w+)\s*=/g, 'const $1 =');
                  // Pattern 5: Any remaining export default (catch-all) - be very aggressive
                  // This must catch ALL export default patterns
                  code = code.replace(/export\s+default\s+/g, '');
                  code = code.replace(/export\s+default/g, '');
                  // Also remove any standalone export statements
                  code = code.replace(/^\s*export\s+default\s*;?\s*$/gm, '');
                  // Remove any export statements at all (for safety)
                  code = code.replace(/^\s*export\s+/gm, '');
                  
                  // Add default props handling for components that might receive undefined props
                  // This prevents "Cannot read properties of undefined" errors
                  if (code.includes('function ')) {
                    const funcMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
                    if (funcMatch) {
                      const funcName = funcMatch[1];
                      const params = funcMatch[2];
                      
                      // Handle destructured props like { product } or { product = {} }
                      if (params.includes('{') && params.includes('}')) {
                        // Destructured props - add defaults for common patterns
                        // Pattern: { product } -> { product = {} }
                        if (params.includes('product') && !params.includes('product =')) {
                          code = code.replace(
                            new RegExp(`function\\s+${funcName}\\s*\\(\\s*\\{[^}]*product[^}]*\\}\\s*\\)`, 'g'),
                            (match) => match.replace(/\{([^}]*product)([^}]*)\}/, '{$1 = {}$2}')
                          );
                        }
                        // Pattern: { product, ... } -> { product = {}, ... }
                        if (params.includes('product') && !params.includes('product =')) {
                          code = code.replace(/\{([^}]*)\bproduct\b([^}]*)\}/g, (match) => {
                            if (!match.includes('product =')) {
                              return match.replace(/\bproduct\b/, 'product = {}');
                            }
                            return match;
                          });
                        }
                      } else if (params.includes('props') && !params.includes('props =')) {
                        // Regular props parameter - add default
                        code = code.replace(
                          new RegExp(`function\\s+${funcName}\\s*\\(\\s*props\\s*\\)`, 'g'),
                          `function ${funcName}(props = {})`
                        );
                      }
                    }
                  }
                  
                  // Ensure component is exposed with schema name so App's <Header /> etc. resolve
                  const fnDecl = code.match(/function\s+(\w+)\s*\(/);
                  const constDecl = code.match(/const\s+(\w+)\s*=/);
                  const actualName = fnDecl?.[1] ?? constDecl?.[1];
                  if (actualName && actualName !== componentName) {
                    code = code.replace(new RegExp(`\\bfunction\\s+${actualName}\\s*\\(`, 'g'), `function ${componentName}(`);
                    code = code.replace(new RegExp(`\\bconst\\s+${actualName}\\s*=`, 'g'), `const ${componentName}=`);
                  }
                  
                  return code;
                });
              
              // Extract App component from mainJsx or create it
              let appCode = '';
              let rootElement = 'app';
              
              if (mainJsx) {
                // Process mainJsx - remove imports and convert to inline code
                let processedMain = sanitizeDollarInJsx(mainJsx);
                const componentNamesForImports = components
                  .filter(c => c.language === 'jsx' || c.language === 'js' || c.language === 'tsx')
                  .map(c => c.name.replace(/\s+/g, ''));
                // Case-insensitive set so "Header" and "header" both treated as component (avoid placeholder for either)
                const componentNamesLower = new Set(componentNamesForImports.map((n) => n.toLowerCase()));
                const isComponentName = (name: string) =>
                  componentNamesForImports.includes(name) || (name && componentNamesLower.has(name.toLowerCase()));

                // Remove ALL import statements (including component imports); replace data/utils imports with defaults so variables exist
                // Pattern: import React from 'react';
                processedMain = processedMain.replace(/import\s+React\s+from\s+['"]react['"];?\s*/gm, '');
                // Pattern: import ReactDOM from 'react-dom/client';
                processedMain = processedMain.replace(/import\s+ReactDOM\s+from\s+['"]react-dom\/client['"];?\s*/gm, '');
                // Pattern: import ReactDOM from 'react-dom';
                processedMain = processedMain.replace(/import\s+ReactDOM\s+from\s+['"]react-dom['"];?\s*/gm, '');
                // Pattern: import { useState } from 'react';
                processedMain = processedMain.replace(/import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/gm, '');
                const previewDataNames = ['movieData', 'products', 'productData', 'items', 'listData', 'movies', 'posts', 'courses'];
                // Pattern: import X from '...' - if X is a component, remove; else define X so App doesn't throw (e.g. movieData, products)
                processedMain = processedMain.replace(/import\s+(\w+)\s+from\s+['"][^'"]+['"];?\s*/gm, (_, name) => {
                  if (isComponentName(name)) return '';
                  if (previewDataNames.includes(name)) return ''; // defined by fallback at top of script
                  return `const ${name} = [];`;
                });
                // Pattern: import { a, b } from '...' (named non-React imports - define so not undefined)
                // Do NOT emit const X = [] for component names - they are declared by componentDefinitions below
                processedMain = processedMain.replace(/import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"];?\s*/gm, (_, namesStr) => {
                  const bindings = namesStr.split(',').map((s: string) => {
                    const t = s.trim();
                    const asIdx = t.indexOf(' as ');
                    return asIdx >= 0 ? t.slice(asIdx + 4).trim() : t.split(/\s+/)[0] || t;
                  }).filter(Boolean);
                  if (bindings.length === 0) return '';
                  return bindings
                    .filter((b: string) => !isComponentName(b))
                    .map((b: string) => `const ${b} = [];`)
                    .join(' ') + (bindings.some((b: string) => !isComponentName(b)) ? '\n' : '');
                });
                // Pattern: import * as something from '...';
                processedMain = processedMain.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"][^'"]+['"];?\s*/gm, (_, name) => `const ${name} = {};\n`);
                // Pattern: import './style.css' or any side-effect import
                processedMain = processedMain.replace(/import\s+['"][^'"]+['"];?\s*/gm, '');
                // Final catch-all: any remaining import (default binding) - define so variable exists
                processedMain = processedMain.replace(/import\s+(\w+)\s+from\s+[^;]+;?\s*/gm, (match, name) => {
                  if (isComponentName(name) || previewDataNames.includes(name)) return '';
                  return `const ${name} = [];`;
                });
                // Strip any leftover import line but define default binding so we don't leave refs undefined
                processedMain = processedMain.replace(/^import\s+(\w+)\s+from\s+.*$/gm, (match, name) => {
                  if (isComponentName(name) || previewDataNames.includes(name)) return '';
                  return `const ${name} = [];`;
                });
                processedMain = processedMain.replace(/^import\s+.*$/gm, '');
                // Remove any placeholder "const ComponentName = [];" that would shadow real component declarations
                // (avoids "Identifier 'Header' has already been declared" when componentDefinitions run)
                // Remove both exact and lowercase-first variant (e.g. Header and header)
                componentNamesForImports.forEach((name: string) => {
                  processedMain = processedMain.replace(new RegExp(`const\\s+${name}\\s*=\\s*\\[\\]\\s*;?\\s*`, 'g'), '');
                  const nameLowerFirst = name.charAt(0).toLowerCase() + name.slice(1);
                  if (nameLowerFirst !== name) {
                    processedMain = processedMain.replace(new RegExp(`const\\s+${nameLowerFirst}\\s*=\\s*\\[\\]\\s*;?\\s*`, 'g'), '');
                  }
                });
                // Remove all export statements
                processedMain = processedMain.replace(/export\s+default\s+/g, '');
                processedMain = processedMain.replace(/export\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, '');
                processedMain = processedMain.replace(/export\s+/g, '');
                // Strip 'use client' and duplicate "const { ... } = React;" so only preamble declares hooks (preview isolation)
                processedMain = processedMain.replace(/\s*['"]use\s+(?:client|server)['"]\s*;?\s*/gi, '\n');
                processedMain = processedMain.replace(/\s*const\s*\{[\s\S]*?\}\s*=\s*React\s*;?\s*/g, '\n');
                
                // Always ensure App component is defined as a proper function
                // Get component names
                const componentNames = components
                  .filter(c => c.language === 'jsx' || c.language === 'js')
                  .map(c => c.name.replace(/\s+/g, ''));
                
                // Create App function definition
                const appDefinition = `function App() {
  return (
    <>
      ${componentNames.map(name => `<${name} />`).join('\n      ')}
    </>
  );
}`;
                
                // Preserve the App component from mainJsx if it exists (it has correct props)
                // Only replace if it's an arrow function or doesn't exist
                const hasFunctionApp = processedMain.includes('function App') || /function\s+App\s*\(/.test(processedMain);
                const hasConstApp = /const\s+App\s*=/.test(processedMain);
                
                if (hasConstApp) {
                  // Arrow function - need to extract and convert to function
                  // Find the const App = ... pattern and extract it
                  const constStart = processedMain.indexOf('const App');
                  if (constStart !== -1) {
                    // Try to find the end of the arrow function
                    // Look for semicolon or new statement
                    let constEnd = processedMain.indexOf(';', constStart);
                    if (constEnd === -1) {
                      // No semicolon, try to find next statement (ReactDOM or function)
                      const nextStatement = processedMain.search(/(ReactDOM|function|const|var)\s/, constStart + 10);
                      if (nextStatement !== -1) {
                        constEnd = nextStatement;
                      } else {
                        constEnd = processedMain.length;
                      }
                    } else {
                      constEnd++;
                    }
                    // Replace arrow function with proper function
                    processedMain = processedMain.substring(0, constStart) + appDefinition + '\n\n' + processedMain.substring(constEnd);
                  }
                } else if (!hasFunctionApp) {
                  // No App component - add it before ReactDOM calls
                  const renderIndex = processedMain.search(/ReactDOM\.(render|createRoot)/);
                  if (renderIndex !== -1) {
                    processedMain = processedMain.substring(0, renderIndex).trim() + '\n\n' + appDefinition + '\n\n' + processedMain.substring(renderIndex).trim();
                  } else {
                    // No ReactDOM call found, append at the end
                    processedMain = processedMain.trim() + '\n\n' + appDefinition;
                  }
                }
                // If function App exists, we keep it as-is (it should have correct props from backend)
                
                // Extract root element ID from getElementById calls
                const rootMatch = processedMain.match(/getElementById\(['"]([^'"]+)['"]\)/);
                if (rootMatch) {
                  rootElement = rootMatch[1];
                }
                
                // Keep React 18 createRoot (do not convert to deprecated render) - react-dom@18 UMD supports createRoot
                if (processedMain.includes('createRoot')) {
                  const rootIdMatch = processedMain.match(/getElementById\(['"]([^'"]+)['"]\)/);
                  if (rootIdMatch) {
                    rootElement = rootIdMatch[1];
                  }
                }
                
                // Final verification: Ensure App (or equivalent) exists after all processing
                const finalHasApp = /function\s+App\s*\(/.test(processedMain)
                  || processedMain.includes('function App(')
                  || /\bconst\s+App\s*=/.test(processedMain)
                  || /\blet\s+App\s*=/.test(processedMain);
                if (!finalHasApp) {
                  // Insert App definition before ReactDOM.render or createRoot
                  const renderIndex = processedMain.search(/ReactDOM\.(render|createRoot)/);
                  if (renderIndex !== -1) {
                    processedMain = processedMain.substring(0, renderIndex).trim() + '\n\n' + appDefinition + '\n\n' + processedMain.substring(renderIndex).trim();
                  } else {
                    processedMain = processedMain.trim() + '\n\n' + appDefinition;
                  }
                }
                
                // Debug: log processed main to spot duplicate declarations
                if (import.meta.env?.DEV) {
                  console.log('[WebsitePreview] Processed mainJsx (first 500):', processedMain.substring(0, 500));
                }

                appCode = processedMain;
              } else {
                // Create App component from individual components
                const componentNames = components
                  .filter(c => c.language === 'jsx' || c.language === 'js')
                  .map(c => c.name.replace(/\s+/g, ''));
                
                appCode = `
                  function App() {
                    return (
                      <>
                        ${componentNames.map(name => `<${name} />`).join('\n                        ')}
                      </>
                    );
                  }
                  
                  var rootEl = document.getElementById('${rootElement}');
                  if (rootEl && typeof ReactDOM.createRoot === 'function') {
                    ReactDOM.createRoot(rootEl).render(<App />);
                  } else if (rootEl) {
                    ReactDOM.render(<App />, rootEl);
                  }
                `;
              }
              
              // Component names in same order as processedComponents (for IIFE wrapper)
              const reactComponentNames = components
                .filter(c => c.language === 'jsx' || c.language === 'js' || c.language === 'tsx' || (!c.language && (/\\.(jsx|tsx)$/.test(c.path || '') || (c.code && (c.code.includes('from \'react\'') || c.code.includes('className'))))))
                .map(c => c.name.replace(/\s+/g, ''));
              // Wrap each component in its own IIFE so identifiers (PlayIcon, etc.) don't conflict across components
              const componentDefinitions = processedComponents.map((code, i) => {
                const componentName = reactComponentNames[i] || 'Component' + i;
                return `const ${componentName} = (function() {\n${code}\nreturn typeof ${componentName} !== 'undefined' ? ${componentName} : (function ${componentName}() { return null; });\n})();`;
              }).join('\n\n');
              // Only add fallback declarations for names not already declared in user code (avoids "Identifier has already been declared")
              const reactUserCodeStr = componentDefinitions + '\n\n' + appCode;
              const previewDataNamesList = ['movieData', 'products', 'productData', 'items', 'listData', 'movies', 'posts', 'courses'];
              const reactFallbackLines = previewDataNamesList
                .filter(name => !new RegExp(`\\b(const|let|var)\\s+${name}\\b`).test(reactUserCodeStr))
                .map(name => `if (typeof ${name} === 'undefined') { var ${name} = []; }`)
                .join('\n        ');

              // Debug: before doc.write, verify each component appears once as IIFE, not as placeholder
              if (import.meta.env?.DEV) {
                const scriptContent = componentDefinitions + '\n\n' + appCode;
                reactComponentNames.forEach((name: string) => {
                  const placeholderCount = (scriptContent.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[\\]`, 'g')) || []).length;
                  const iifeCount = (scriptContent.match(new RegExp(`const\\s+${name}\\s*=\\s*\\(function`, 'g')) || []).length;
                  if (placeholderCount > 0 || iifeCount !== 1) {
                    console.warn(`[WebsitePreview] Component "${name}": placeholder count=${placeholderCount}, IIFE count=${iifeCount} (expected 0 and 1)`);
                  }
                });
                console.log('[WebsitePreview] Final iframe script snippet (first 600 chars):', scriptContent.substring(0, 600));
              }

              content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${websiteName || 'Generated Website'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    ${styleCss}
  </style>
</head>
<body>
  <div id="${rootElement}"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" data-presets="react">
    (function() {
      try {
        // Check if React and ReactDOM are loaded
        if (typeof React === 'undefined') {
          throw new Error('React library not loaded');
        }
        if (typeof ReactDOM === 'undefined') {
          throw new Error('ReactDOM library not loaded');
        }
        
        // Make React hooks available
        const { useState, useEffect, useRef, useCallback, useMemo, useContext } = React;
        
        // Define common data variables only if user code does not declare them (avoids "already been declared" errors)
        ${reactFallbackLines}
        
        // Each component in its own scope so duplicate names (PlayIcon, etc.) across files don't conflict
        ${componentDefinitions}
        
        // App initialization
        ${appCode}
        
        // Final check: Ensure App is defined
        if (typeof App === 'undefined') {
          throw new Error('App component is not defined. Available components: ' + Object.keys(window).filter(k => k.match(/^[A-Z]/)).join(', '));
        }
      } catch (error) {
        console.error('React compilation/execution error:', error);
        const container = document.getElementById('${rootElement}');
        if (container) {
          container.innerHTML = '<div style="padding: 20px; color: red; font-family: monospace; background: #fee; border: 2px solid red; margin: 20px;">' +
            '<h3 style="margin-top: 0;">React Error:</h3>' +
            '<p><strong>' + error.message + '</strong></p>' +
            '<pre style="overflow: auto; white-space: pre-wrap; background: #fff; padding: 10px; border-radius: 4px;">' + 
            (error.stack || error.toString()) + '</pre>' +
            '</div>';
        }
      }
    })();
  </script>
</body>
</html>`;
            } else {
              // Vanilla JS components
              const styleCss = viteConfig?.styleCss || '';
              
              // Convert component exports to functions that can be called
              const componentFunctions = components
                .filter(c => c.language === 'js')
                .map(c => {
                // Extract function name - use component name as function name
                const funcName = c.name.replace(/\s+/g, '');
                let funcCode = c.code.trim();
                
                // Handle different export patterns
                // Pattern 1: export default function ComponentName() { ... }
                if (funcCode.includes('export default function')) {
                  // Remove export default and keep function
                  funcCode = funcCode.replace(/export\s+default\s+function\s+(\w+)\s*\(/g, `function ${funcName}(`);
                  funcCode = funcCode.replace(/export\s+default\s+function\s*\(/g, `function ${funcName}(`);
                }
                // Pattern 2: const Component = () => { ... }; export default Component;
                else if (funcCode.includes('const') && funcCode.includes('export default')) {
                  // Extract arrow function or regular function
                  const arrowMatch = funcCode.match(/const\s+\w+\s*=\s*(\([^)]*\)\s*=>\s*\{[^}]*\})/);
                  const regularMatch = funcCode.match(/const\s+\w+\s*=\s*function\s*\([^)]*\)\s*\{[^}]*\}/);
                  
                  if (arrowMatch) {
                    funcCode = `function ${funcName}() { return ${arrowMatch[1]}; }`;
                  } else if (regularMatch) {
                    funcCode = funcCode.replace(/const\s+\w+\s*=\s*/, `function ${funcName}`);
                    funcCode = funcCode.replace(/export\s+default\s+\w+;?/g, '');
                  } else {
                    // Fallback: wrap in function
                    funcCode = `function ${funcName}() { ${funcCode.replace(/export\s+default\s+/g, '')} }`;
                  }
                }
                // Pattern 3: Already a function declaration
                else if (funcCode.startsWith('function') || funcCode.startsWith('export default')) {
                  funcCode = funcCode.replace(/export\s+default\s+/g, '');
                  // Ensure it has the right name
                  if (!funcCode.includes(`function ${funcName}`)) {
                    funcCode = funcCode.replace(/function\s+\w+/, `function ${funcName}`);
                  }
                }
                // Pattern 4: Arrow function or other - wrap it
                else {
                  // Try to extract the actual function body
                  const bodyMatch = funcCode.match(/\{[\s\S]*\}/);
                  if (bodyMatch) {
                    funcCode = `function ${funcName}() ${bodyMatch[0]}`;
                  } else {
                    funcCode = `function ${funcName}() { ${funcCode} }`;
                  }
                }
                
                return { name: funcName, code: funcCode };
              });
            
            // Build main execution code
            const mainJs = viteConfig?.mainJs || '';
            let executionCode = '';
            
            if (mainJs) {
              // Extract component names from main.js imports
              const importMatches = Array.from(mainJs.matchAll(/import\s+(\w+)\s+from\s+['"][^'"]+['"];?/g));
              const componentNames: string[] = [];
              importMatches.forEach(match => {
                componentNames.push(match[1]);
              });
              
              if (componentNames.length > 0) {
                // Build execution code using imported names
                executionCode = `
                  (function() {
                    const app = document.getElementById('app');
                    if (!app) return;
                    ${componentNames.map(name => {
                      // Find the corresponding function name
                      const func = componentFunctions.find(f => 
                        f.code.includes(`function ${name}`) || 
                        f.name.toLowerCase() === name.toLowerCase()
                      );
                      return func ? `app.appendChild(${func.name}());` : '';
                    }).filter(Boolean).join('\n                    ')}
                  })();
                `;
              } else {
                // Fallback: render all components in order
                executionCode = `
                  (function() {
                    const app = document.getElementById('app');
                    if (!app) return;
                    ${componentFunctions.map(c => `app.appendChild(${c.name}());`).join('\n                    ')}
                  })();
                `;
              }
            } else {
              // Fallback: render all components in order
              executionCode = `
                (function() {
                  const app = document.getElementById('app');
                  if (!app) return;
                  ${componentFunctions.map(c => `app.appendChild(${c.name}());`).join('\n                  ')}
                })();
              `;
            }
            
            // JSX helper function
            const jsxHelper = `function jsx(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  
  // Set attributes
  if (props) {
    Object.keys(props).forEach(key => {
      if (key === 'className') {
        element.className = props[key];
      } else if (key.startsWith('on') && typeof props[key] === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, props[key]);
      } else if (key !== 'children') {
        element.setAttribute(key, props[key]);
      }
    });
  }
  
  // Append children
  children.forEach(child => {
    if (child === null || child === undefined) return;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => {
        if (c instanceof Node) {
          element.appendChild(c);
        } else if (typeof c === 'string' || typeof c === 'number') {
          element.appendChild(document.createTextNode(String(c)));
        }
      });
    }
  });
  
  return element;
}`;

            // Build complete HTML
            content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${websiteName || 'Generated Website'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    ${styleCss}
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    ${jsxHelper}
    
    ${componentFunctions.map(c => {
      // Ensure components import jsx if they use it
      let code = c.code;
      // Remove import statements for jsx since we're providing it globally
      code = code.replace(/import\s+\{[^}]*jsx[^}]*\}\s+from\s+['"][^'"]+['"];?\s*/g, '');
      code = code.replace(/import\s+jsx\s+from\s+['"][^'"]+['"];?\s*/g, '');
      return code;
    }).join('\n\n')}
    
    ${executionCode}
  </script>
</body>
</html>`;
            }
          } else {
            // Legacy HTML/CSS/JS format
            const hasFullHtml = html && (html.trim().toLowerCase().includes('<!doctype') || html.trim().toLowerCase().includes('<html'));
            
            if (hasFullHtml && html) {
            content = html;
            if (!html.includes('<style>') && css) {
              content = content.replace('</head>', `<style>${css}</style></head>`);
            }
            if (!html.includes('<script>') && js) {
              content = content.replace('</body>', `<script>${js}</script></body>`);
            }
          } else {
            content = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${websiteName || 'Generated Website'}</title>
              <style>
                * {
                  box-sizing: border-box;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                }
                  ${css || ''}
              </style>
            </head>
            <body>
                ${html || ''}
              <script>
                  ${js || ''}
              </script>
            </body>
            </html>
          `;
            }
          }
          
          // Replace imgur URLs with placeholders sized by context (hero, thumbnail, product, etc.)
          content = content.replace(/https?:\/\/(?:i\.)?imgur\.com\/[^\s"'<>)\]]+/gi, (match, offset) => {
            const idx = typeof offset === 'number' ? offset : content.indexOf(match);
            const start = Math.max(0, idx - 500);
            const ctx = content.slice(start, idx + 100).toLowerCase();
            let w = 400, h = 300;
            if (/\b(hero|banner|header-bg|cover|jumbotron|full-width)\b/.test(ctx)) { w = 1200; h = 600; }
            else if (/\b(thumbnail|thumb|avatar|icon|logo|favicon|profile-pic|user-img)\b/.test(ctx)) { w = 96; h = 96; }
            else if (/\b(card|product|item-img|gallery|grid-item)\b/.test(ctx)) { w = 400; h = 300; }
            const widthMatch = ctx.match(/width\s*[=:]\s*["']?(\d+)/);
            const heightMatch = ctx.match(/height\s*[=:]\s*["']?(\d+)/);
            if (widthMatch) w = Math.min(1200, Math.max(48, parseInt(widthMatch[1], 10)));
            if (heightMatch) h = Math.min(800, Math.max(48, parseInt(heightMatch[1], 10)));
            return `https://picsum.photos/${w}/${h}`;
          });
          
          doc.open();
          doc.write(content);
          doc.close();
        } catch (error) {
          console.error('Error loading iframe content:', error);
        }
      };

      // If iframe is already loaded, write content immediately
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        loadContent();
      } else {
        // Wait for iframe to load
        iframe.onload = loadContent;
        // Also try immediately in case it's already loaded
        setTimeout(loadContent, 100);
      }
    }
  }, [html, css, js, components, viteConfig, websiteName]);

  // Load content when html, css, js, or websiteName changes
  useEffect(() => {
    loadIframeContent();
  }, [loadIframeContent]);

  // Reload content when fullscreen mode changes
  useEffect(() => {
    // Small delay to ensure iframe is mounted in new location
    const timer = setTimeout(() => {
      loadIframeContent();
    }, 100);
    return () => clearTimeout(timer);
  }, [isFullscreen, loadIframeContent]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <h2 className="text-lg font-semibold">{websiteName || 'Website Preview'}</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="gap-2"
            >
              <Minimize2 className="h-4 w-4" />
              Exit Fullscreen
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            )}
          </div>
        </div>
        <iframe
          ref={iframeRef}
          className="flex-1 w-full border-0"
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={loadIframeContent}
        />
      </div>
    );
  }

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col m-4">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{websiteName || 'Website Preview'}</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                Fullscreen
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              )}
            </div>
          </div>
          <iframe
            ref={iframeRef}
            className="flex-1 w-full border-0 rounded-b-lg"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={loadIframeContent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden bg-card flex flex-col ${className || ''}`}>
      <div className="flex items-center justify-between p-3 border-b bg-muted/50 flex-shrink-0">
        <h3 className="text-sm font-medium">{websiteName || 'Preview'}</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 px-2"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={loadIframeContent}
        />
      </div>
    </div>
  );
};

export default WebsitePreview;

