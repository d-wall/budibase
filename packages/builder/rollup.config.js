import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import url from 'rollup-plugin-url';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import builtins from 'rollup-plugin-node-builtins';
import nodeglobals from 'rollup-plugin-node-globals';
import copy from 'rollup-plugin-copy';
import browsersync from "rollup-plugin-browsersync";
import proxy from "http-proxy-middleware";
import corePackageJson from "../core/package.json";

const target = 'http://localhost:4001';
const _builderProxy =  proxy('/_builder', {
  target:"http://localhost:3000",
  pathRewrite: {'^/_builder' : ''}
});

const apiProxy =  proxy('/_builder/api', {
	target,
	logLevel: "debug",
	changeOrigin: true,
	cookieDomainRewrite: true,
	onProxyReq(proxyReq) {
	  if (proxyReq.getHeader("origin")) {
		proxyReq.setHeader("origin", target)
	  }
	}
  });

const production = !process.env.ROLLUP_WATCH;

const lodash_fp_exports = ["union", "reduce", "isUndefined", "cloneDeep", "split", "some", "map", "filter", "isEmpty", "countBy", "includes", "last", "find", "constant", 
"take", "first", "intersection", "mapValues", "isNull", "has", "isNumber", "isString", "isBoolean", "isDate", "isArray", "isObject", "clone", "values", "keyBy", 
"keys", "orderBy", "concat", "reverse", "difference", "merge", "flatten", "each", "pull", "join", "defaultCase", "uniqBy", "every", "uniqWith", "isFunction", "groupBy", 
"differenceBy", "intersectionBy", "isEqual", "max", "sortBy", "assign", "uniq", "trimChars", "trimCharsStart", "isObjectLike", "flattenDeep", "indexOf"];

const lodash_exports = ["toNumber", "flow", "isArray", "join", "replace", "trim", "dropRight", "takeRight", "head", "isUndefined", "isNull", "isNaN", "reduce", "isEmpty", 
"constant", "tail", "includes", "startsWith", "findIndex", "isInteger", "isDate", "isString", "split", "clone", "keys", "isFunction", "merge", "has", "isBoolean", "isNumber", 
"isObjectLike", "assign", "some", "each", "find", "orderBy", "union", "cloneDeep"];

const outputpath = "../server/builder";

const coreExternal = [
	"lodash", "lodash/fp", "date-fns",
	"lunr", "safe-buffer", "shortid",
	"@nx-js/compiler-util"
];

const globals = {
    "lodash/fp": "fp",
    lodash: "_",
    lunr: "lunr",
    "safe-buffer": "safe_buffer",
    shortid:"shortid",
    "@nx-js/compiler-util":"compiler_util"
}

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: `${outputpath}/bundle.js`
		//globals
	},
	/*external: [
        "lodash", "lodash/fp", "date-fns",
        "lunr", "safe-buffer", "shortid",
        "@nx-js/compiler-util"
    ],*/
	plugins: [
		copy({
			targets: [
				{ src: 'src/index.html', dest: outputpath },
				{ src: 'src/favicon.png', dest: outputpath }
			  ]
		}),

		svelte({
			// enable run-time checks when not in production
			dev: !production,
			include: 'src/**/*.svelte',
			// we'll extract any component CSS out into
			// a separate file — better for performance
			css: css => {
				css.write(`${outputpath}/bundle.css`);
			}
		}),

		resolve({
			browser: true,
			dedupe: importee => {
				return importee === 'svelte' 
					   || importee.startsWith('svelte/')
					   || coreExternal.includes(importee);
			}
		
		}),
		commonjs({
			namedExports: {
				"lodash/fp": lodash_fp_exports,
				"lodash":lodash_exports,
				"shortid": ["generate"]
			}
		}),
		url({
			limit: 0, 
			include: ["**/*.woff2", "**/*.png"], 
			fileName: "[dirname][name][extname]",
			emitFiles: true
		}),
		url({
			limit: 0, 
			include: ["**/*.css"], 
			fileName: "[name][extname]",
			emitFiles: true
		}),
		builtins(),
		nodeglobals(),

		// Watch the `dist` directory and refresh the
		// browser on changes when not in production
		!production && livereload(outputpath),
		!production && browsersync({
			server: outputpath,
			middleware: [apiProxy,_builderProxy]
		}),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
