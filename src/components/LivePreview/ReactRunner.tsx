
import React, { useEffect, useState, useMemo } from 'react';
import * as Recharts from 'recharts';
import * as LucideReact from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface ReactRunnerProps {
  code: string;
}

const ReactRunnerContent: React.FC<ReactRunnerProps> = ({ code }) => {
  const [Component, setComponent] = useState<React.FC | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    // Use a timeout to avoid blocking the UI during compilation
    const timer = setTimeout(() => {
      try {
        // 1. Transpile JSX to JS using Babel (loaded in index.html)
        // Babel env preset with 'modules: commonjs' converts ES6 modules (export default) to CommonJS (exports.default)
        // @ts-ignore
        const transformed = window.Babel.transform(code, {
          presets: ['react', ['env', { modules: 'commonjs' }]], 
          filename: 'dynamic.js',
        }).code;

        // 2. Prepare Scope
        const scope = {
          React,
          ...React, // Spread React to make hooks available directly if needed
          ...Recharts, // Make Recharts components available globally
          ...LucideReact, // Make Icons available globally
        };

        // 3. Mock Module System
        // Babel transpiles `export default` to `exports.default = ...` or `module.exports = ...`
        const module = { exports: {} as any };
        const exports = module.exports;
        
        // Mock require to return our global libraries if the AI writes `import ...`
        const require = (mod: string) => { 
            if (mod === 'react') return React;
            if (mod === 'recharts') return Recharts;
            if (mod === 'lucide-react') return LucideReact;
            return {}; 
        };

        // 4. Create Function
        const scopeKeys = Object.keys(scope);
        const scopeValues = Object.values(scope);
        
        // Pass 'module', 'exports', 'require' as arguments to the function
        const runCode = new Function('module', 'exports', 'require', ...scopeKeys, `
          ${transformed}
          // Return the exported component
          return module.exports.default || module.exports;
        `);

        // 5. Execute to get the Component
        const GeneratedComponent = runCode(module, exports, require, ...scopeValues);

        if (typeof GeneratedComponent === 'function') {
          setComponent(() => GeneratedComponent);
          setError(null);
        } else {
          // If the AI just wrote JSX at the top level without exporting, it might return the result of the last expression
          // But usually we enforce component structure.
          throw new Error("生成的代码没有导出有效的 React 组件。请确保代码包含 'export default ComponentName;'");
        }

      } catch (err: any) {
        console.error("Compilation/Execution Error:", err);
        setError(err.message);
        setComponent(null);
      }
    }, 100); // 100ms debounce for typing

    return () => clearTimeout(timer);
  }, [code]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 text-sm font-mono whitespace-pre-wrap border-l-4 border-red-400 h-full overflow-auto">
        <strong>Compilation Error:</strong><br/>
        {error}
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
        Compiling React Component...
      </div>
    );
  }

  return <Component />;
};

const ReactRunner: React.FC<ReactRunnerProps> = (props) => {
  return (
    <ErrorBoundary key={props.code}>
      <ReactRunnerContent {...props} />
    </ErrorBoundary>
  );
};

export default ReactRunner;
