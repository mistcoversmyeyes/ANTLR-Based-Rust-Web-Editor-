/**
 * Monaco Editor 集成模块
 * 负责编辑器的初始化、配置和管理
 */

class RustEditor {
    constructor(containerId) {
        this.containerId = containerId;
        this.editor = null;
        this.model = null;
        this.decorations = [];
        this.isInitialized = false;
        this.theme = 'vs-dark';
        this.language = 'rust';
        
        // 编辑器配置
        this.config = {
            value: this.getDefaultCode(),
            language: this.language,
            theme: this.theme,
            automaticLayout: true,
            fontSize: 14,
            fontFamily: 'Fira Code, Cascadia Code, JetBrains Mono, Consolas, monospace',
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            minimap: {
                enabled: true
            },
            scrollBeyondLastLine: false,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            bracketMatching: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            snippetSuggestions: 'top',
            tabCompletion: 'on',
            find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: 'never',
                seedSearchStringFromSelection: 'always'
            },
            scrollbar: {
                useShadows: false,
                verticalHasArrows: true,
                horizontalHasArrows: true,
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            }
        };

        // 事件监听器
        this.changeHandler = null;
        this.cursorHandler = null;
    }

    /**
     * 初始化编辑器
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('编辑器已经初始化');
            return;
        }

        try {
            // 显示加载状态
            const container = Utils.DOM.id(this.containerId);
            const loadingOverlay = Utils.Loading.show(container, '正在加载编辑器...');

            // 等待Monaco Editor加载
            await this.waitForMonaco();
            
            // 配置Monaco环境
            this.configureMonaco();
            
            // 创建编辑器实例
            this.editor = monaco.editor.create(container, this.config);
            this.model = this.editor.getModel();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 隐藏加载状态
            Utils.Loading.hide(loadingOverlay);
            
            this.isInitialized = true;
            
            // 触发初始化完成事件
            Utils.eventBus.emit('editor:initialized', this);
            
            console.log('编辑器初始化完成');
        } catch (error) {
            console.error('编辑器初始化失败:', error);
            Utils.Notification.error('编辑器初始化失败: ' + error.message);
            throw error;
        }
    }

    /**
     * 等待Monaco Editor加载
     */
    async waitForMonaco() {
        return new Promise((resolve, reject) => {
            if (typeof monaco !== 'undefined') {
                resolve();
                return;
            }

            // 设置Monaco路径
            require.config({
                paths: {
                    'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
                }
            });

            // 加载Monaco Editor
            require(['vs/editor/editor.main'], () => {
                resolve();
            }, (error) => {
                reject(new Error('Monaco Editor 加载失败: ' + error.message));
            });
        });
    }

    /**
     * 配置Monaco Editor
     */
    configureMonaco() {
        // 注册Rust语言支持
        if (!monaco.languages.getLanguages().find(lang => lang.id === 'rust')) {
            this.registerRustLanguage();
        }

        // 配置主题
        this.defineCustomThemes();
        
        // 配置诊断
        this.configureDiagnostics();
    }

    /**
     * 注册Rust语言支持
     */
    registerRustLanguage() {
        // 注册语言
        monaco.languages.register({ id: 'rust' });

        // 设置语言配置
        monaco.languages.setLanguageConfiguration('rust', {
            comments: {
                lineComment: '//',
                blockComment: ['/*', '*/']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: '/*', close: '*/' }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            folding: {
                markers: {
                    start: new RegExp('^\\s*//\\s*#?region\\b'),
                    end: new RegExp('^\\s*//\\s*#?endregion\\b')
                }
            }
        });

        // 设置语法高亮
        monaco.languages.setMonarchTokensProvider('rust', {
            keywords: [
                'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
                'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match',
                'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self',
                'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe',
                'use', 'where', 'while', 'async', 'await', 'dyn', 'abstract',
                'become', 'box', 'do', 'final', 'macro', 'override', 'priv',
                'typeof', 'unsized', 'virtual', 'yield', 'try'
            ],
            
            typeKeywords: [
                'bool', 'char', 'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
                'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64',
                'str', 'String', 'Vec', 'Option', 'Result'
            ],

            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
                '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^',
                '%', '<<', '>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
                '%=', '<<=', '>>='
            ],

            // 符号定义
            symbols: /[=><!~?:&|+\-*\/\^%]+/,

            // 转义序列
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

            tokenizer: {
                root: [
                    // 标识符和关键字
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            '@typeKeywords': 'keyword.type',
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    [/[A-Z][\w\$]*/, 'type.identifier'],

                    // 空白字符
                    { include: '@whitespace' },

                    // 分隔符和操作符
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // 数字
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/\d+/, 'number'],

                    // 字符串
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string'],
                    [/'[^\\']'/, 'string'],
                    [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                    [/'/, 'string.invalid']
                ],

                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],
                    ["\\*/", 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],

                string: [
                    [/[^\\"]+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, 'string', '@pop']
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                ]
            }
        });
    }

    /**
     * 定义自定义主题
     */
    defineCustomThemes() {
        // 自定义暗色主题
        monaco.editor.defineTheme('rust-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
                { token: 'keyword.type', foreground: '4ec9b0' },
                { token: 'string', foreground: 'ce9178' },
                { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
                { token: 'number', foreground: 'b5cea8' },
                { token: 'identifier', foreground: '9cdcfe' },
                { token: 'type.identifier', foreground: '4ec9b0' },
                { token: 'operator', foreground: 'd4d4d4' }
            ],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4',
                'editorLineNumber.foreground': '#858585',
                'editorCursor.foreground': '#aeafad',
                'editor.selectionBackground': '#264f78',
                'editor.lineHighlightBackground': '#2a2d2e'
            }
        });
    }

    /**
     * 配置诊断
     */
    configureDiagnostics() {
        // 禁用默认的JavaScript/TypeScript诊断
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 内容变化监听
        this.changeHandler = this.model.onDidChangeContent((e) => {
            Utils.eventBus.emit('editor:contentChanged', {
                editor: this,
                event: e,
                content: this.getValue()
            });
        });

        // 光标位置变化监听
        this.cursorHandler = this.editor.onDidChangeCursorPosition((e) => {
            Utils.eventBus.emit('editor:cursorChanged', {
                editor: this,
                event: e,
                position: e.position
            });
        });

        // 选择变化监听
        this.editor.onDidChangeCursorSelection((e) => {
            Utils.eventBus.emit('editor:selectionChanged', {
                editor: this,
                event: e,
                selection: e.selection
            });
        });

        // 焦点事件
        this.editor.onDidFocusEditorWidget(() => {
            Utils.eventBus.emit('editor:focus', this);
        });

        this.editor.onDidBlurEditorWidget(() => {
            Utils.eventBus.emit('editor:blur', this);
        });
    }

    /**
     * 获取默认代码
     */
    getDefaultCode() {
        return `// Rust Web Editor - ANTLR 编译器前端
// 在这里输入你的 Rust 代码

fn main() {
    println!("Hello, World!");
    
    let x = 42;
    let y = "Rust";
    
    if x > 0 {
        println!("x is positive: {}", x);
    }
    
    for i in 1..=5 {
        println!("Count: {}", i);
    }
}

// 示例函数
fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

// 示例结构体
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self {
        Point { x, y }
    }
    
    fn distance(&self, other: &Point) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
}`;
    }

    /**
     * 获取编辑器内容
     */
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    /**
     * 设置编辑器内容
     */
    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }

    /**
     * 插入文本
     */
    insertText(text, position = null) {
        if (!this.editor) return;

        const pos = position || this.editor.getPosition();
        this.editor.executeEdits('insert-text', [{
            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
            text: text
        }]);
    }

    /**
     * 获取当前光标位置
     */
    getCursorPosition() {
        return this.editor ? this.editor.getPosition() : null;
    }

    /**
     * 设置光标位置
     */
    setCursorPosition(lineNumber, column) {
        if (this.editor) {
            this.editor.setPosition({ lineNumber, column });
        }
    }

    /**
     * 获取选中的文本
     */
    getSelectedText() {
        if (!this.editor) return '';
        
        const selection = this.editor.getSelection();
        return this.model.getValueInRange(selection);
    }

    /**
     * 设置选择范围
     */
    setSelection(startLine, startColumn, endLine, endColumn) {
        if (this.editor) {
            const range = new monaco.Range(startLine, startColumn, endLine, endColumn);
            this.editor.setSelection(range);
        }
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        this.theme = theme;
        if (this.editor) {
            monaco.editor.setTheme(theme);
        }
    }

    /**
     * 设置字体大小
     */
    setFontSize(size) {
        if (this.editor) {
            this.editor.updateOptions({ fontSize: size });
        }
    }

    /**
     * 格式化代码
     */
    async format() {
        if (this.editor) {
            await this.editor.getAction('editor.action.formatDocument').run();
        }
    }

    /**
     * 显示错误标记
     */
    showErrors(errors) {
        if (!this.editor || !Array.isArray(errors)) return;

        const markers = errors.map(error => ({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: error.line,
            startColumn: error.column + 1,
            endLineNumber: error.line,
            endColumn: error.column + 10, // 假设错误长度
            message: error.message
        }));

        monaco.editor.setModelMarkers(this.model, 'rust-analyzer', markers);
    }

    /**
     * 清除错误标记
     */
    clearErrors() {
        if (this.model) {
            monaco.editor.setModelMarkers(this.model, 'rust-analyzer', []);
        }
    }

    /**
     * 高亮指定行
     */
    highlightLines(lines, className = 'editor-error-line') {
        if (!this.editor || !Array.isArray(lines)) return;

        const newDecorations = lines.map(line => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                className: className,
                marginClassName: 'editor-error-margin'
            }
        }));

        this.decorations = this.editor.deltaDecorations(this.decorations, newDecorations);
    }

    /**
     * 清除高亮
     */
    clearHighlights() {
        if (this.editor) {
            this.decorations = this.editor.deltaDecorations(this.decorations, []);
        }
    }

    /**
     * 跳转到指定行
     */
    goToLine(lineNumber) {
        if (this.editor) {
            this.editor.revealLineInCenter(lineNumber);
            this.setCursorPosition(lineNumber, 1);
        }
    }

    /**
     * 销毁编辑器
     */
    dispose() {
        if (this.changeHandler) {
            this.changeHandler.dispose();
        }
        if (this.cursorHandler) {
            this.cursorHandler.dispose();
        }
        if (this.editor) {
            this.editor.dispose();
        }
        this.isInitialized = false;
    }

    /**
     * 调整大小
     */
    resize() {
        if (this.editor) {
            this.editor.layout();
        }
    }
}

// 导出编辑器模块
window.RustEditor = RustEditor;
