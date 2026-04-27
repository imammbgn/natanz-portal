const vm = require('vm');

// Load addon — crash-safe, kalau belum ada (dev env) tetap jalan
try {
    global.__runtimeUtils = require('../build/Release/cloud_runtime_monitor.node');
} catch (_) {
    global.__runtimeUtils = null;
}

// === Neutralize global scope ===
// Kenapa: WebAssembly Instance constructor chain bocor reference ke real global scope.
// Tanpa ini, player bisa langsung:
//   process.mainModule.require("child_process").execSync("id")
// → RCE tanpa V8 exploit sama sekali.
//
// Simpan yang kita butuh, hapus yang bahaya.
const _stdin = process.stdin;
const _stdout = process.stdout;
const _exit = process.exit;

global.require = undefined;
if (process.mainModule) {
    process.mainModule.require = undefined;
}

// Baca code dari stdin (pake saved reference)
let input = '';
_stdin.setEncoding('utf8');
_stdin.on('data', (chunk) => { input += chunk; });
_stdin.on('end', () => {
    let code;
    try {
        code = JSON.parse(input).code;
    } catch {
        respond({ output: 'Invalid input', error: true, executionTime: 0 });
        return;
    }

    try {
        const result = runInSandbox(code);
        respond({ output: result.output, error: false, executionTime: result.time });
    } catch (err) {
        respond({ output: `${err.name}: ${err.message}`, error: true, executionTime: 0 });
    }
});

function runInSandbox(code) {
    const logs = [];
    const startTime = Date.now();

    // === Sandbox mechanism: vm.createContext ===
    //
    // Kenapa kita pake vm.createContext + bindFunction trick?
    //
    // vm.createContext() isolasi code di context terpisah.
    // Di Node 22, Function constructor di dalam context cuma return context's global.
    // Di Node 18, behavior-nya beda — bisa return real global.
    //
    // Biar konsisten di semua versi, kita expose satu "bridge" function
    // yang secara gak sengaja bocor reference ke outer scope.
    // Ini simulate real-world vulnerability: native addon yang leak callback.
    //
    // Player flow:
    //   1. Fingerprint → nemu sandbox object + WebAssembly/Buffer
    //   2. `this.constructor` blocked, tapi `({}).constructor` works
    //   3. `({}).constructor.constructor('return this')()` return sandbox context
    //   4. Sandbox context gak punya require/process/addon
    //   5. Nemu sandbox._bindFunction ( kayak native binding leak )
    //   6. _bindFunction(nama) → return reference ke real scope variable
    //   7. Dari situ akses __runtimeUtils → syncObjectLayout → type confusion

    // Sandbox globals
    const sandbox = {
        console: {
            log: (...a) => logs.push(a.map(fmt).join(' ')),
            error: (...a) => logs.push('[ERROR] ' + a.map(fmt).join(' ')),
            warn: (...a) => logs.push('[WARN] ' + a.map(fmt).join(' ')),
            info: (...a) => logs.push('[INFO] ' + a.map(fmt).join(' ')),
            table: (d) => logs.push(JSON.stringify(d, null, 2)),
        },

        // V8 exploit chain requirements
        WebAssembly,
        Buffer: typeof Buffer !== 'undefined' ? Buffer : undefined,
        Uint8Array,
        Int32Array,
        Float64Array,
        ArrayBuffer,
        SharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined,

        // Standard JS globals
        Math,
        Date,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        Number,
        String,
        Boolean,
        Array,
        Object,
        Map,
        Set,
        RegExp,
        Error,
        TypeError,
        RangeError,
        Promise,
        Symbol,
        Proxy,
        Reflect,

        // Sandbox info — hint untuk player
        sandbox: {
            version: '1.0.0',
            runtime: 'V8 v10.2 \u2014 shared prototypes across contexts',
        },
    };

    // === THE LEAK ===
    // Ini simulate native binding yang bocor reference ke outer scope.
    // Di real-world, ini kayak V8 callback yang gak sengaja expose internal reference.
    // Player harus nemu ini lewat Object.getOwnPropertyNames(this)
    //
    // Kenapa non-enumerable? Biar Object.keys() gak keliatan.
    // Player harus pake Object.getOwnPropertyNames() atau similar.
    //
    // _bindFunction(name) — cuma expose __runtimeUtils dari outerScope.
    // process, require, global SUDAH DIHAPUS — gak bisa di-leak lewat sini.
    // Player HARUS lewat __runtimeUtils → syncObjectLayout → V8 type confusion.
    //
    // Ini intended escape path. Gak trivial, tapi achievable.
    const outerScope = {
        __runtimeUtils: global.__runtimeUtils,
    };

    Object.defineProperty(sandbox, '_bindFunction', {
        value: function(name) {
            if (name in outerScope) return outerScope[name];
            return undefined;
        },
        enumerable: false, // Gak keliatan di Object.keys()
        writable: false,
        configurable: false,
    });

    // Block trivial escape
    sandbox.constructor = undefined;

    const context = vm.createContext(sandbox);
    const script = new vm.Script(code, { filename: 'console.js' });
    const result = script.runInContext(context, { timeout: 10000 });

    let output = logs.join('\n');
    if (result !== undefined) {
        if (output) output += '\n';
        output += '\u2192 ' + fmt(result);
    }
    if (!output) output = '(no output)';

    return { output, time: Date.now() - startTime };
}

function respond(data) {
    _stdout.write(JSON.stringify(data));
    _exit(0);
}

function fmt(v) {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'object') {
        try { return JSON.stringify(v, null, 2); } catch { return String(v); }
    }
    return String(v);
}