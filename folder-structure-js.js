const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const outputArea = document.getElementById('outputArea');
const copyButton = document.getElementById('copyButton');
const fileCount = document.getElementById('fileCount');
const successMessage = document.getElementById('successMessage');

    // ドラッグ&ドロップイベント

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const items = e.dataTransfer.items;
        console.log(items);
        if (items && items.length > 0) {
            processDroppedItems(items);
        }
    });
    // ファイル選択イベント
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            processFiles(files);
        }
    });

    // ドロップされたアイテムを処理
    async function processDroppedItems(items) {
        const files = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    await processEntry(entry, files);
                }
            }
        }
        
        if (files.length > 0) {
            processFiles(files);
        }
    }
    // エントリを再帰的に処理
    function processEntry(entry, files, path = '') {
        return new Promise((resolve) => {
            if (entry.isFile) {
                entry.file((file) => {
                    file.fullPath = path + file.name;
                    files.push(file);
                    resolve();
                });
            } else if (entry.isDirectory) {
                const dirReader = entry.createReader();
                dirReader.readEntries(async (entries) => {
                    for (const childEntry of entries) {
                        await processEntry(childEntry, files, path + entry.name + '/');
                    }
                    resolve();
                });
            }
        });
    }
    // ファイルリストを処理
    function processFiles(files) {
        // ローディング表示
        outputArea.innerHTML = '<div style="text-align: center; margin-top: 150px;"><div class="loading"></div>処理中...</div>';
        
        setTimeout(() => {
            const structure = buildFolderStructure(files);
            const treeText = generateTreeText(structure);
            
            outputArea.textContent = treeText;
            copyButton.disabled = false;
            
            // ファイル数を表示
            fileCount.textContent = `${files.length}個のファイルを検出`;
            fileCount.style.display = 'inline-block';
            
            // 成功メッセージを表示
            showSuccessMessage('フォルダ構成を生成しました！');
        }, 500);
    }
    // フォルダ構造を構築
    function buildFolderStructure(files) {
        const root = {};
        
        files.forEach(file => {
            const path = file.webkitRelativePath || file.fullPath || file.name;
            const parts = path.split('/');
            
            let current = root;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    // ファイル
                    if (!current._files) current._files = [];
                    current._files.push(part);
                } else {
                    // ディレクトリ
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            }
        });
        
        return root;
    }
    // ツリー形式のテキストを生成
    function generateTreeText(structure, prefix = '', isRoot = true) {
        let result = '';
        const entries = Object.keys(structure).filter(key => key !== '_files');
        const files = structure._files || [];
        
        if (isRoot && entries.length === 1 && files.length === 0) {
            // ルートフォルダが1つの場合
            const rootName = entries[0];
            result += `/${rootName}\n`;
            return result + generateTreeText(structure[rootName], '', false);
        }
        
        // ディレクトリを先に処理
        entries.sort().forEach((dir, index) => {
            const isLast = index === entries.length - 1 && files.length === 0;
            const connector = isLast ? '└── ' : '├── ';
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            
            result += prefix + connector + dir + '/\n';
            result += generateTreeText(structure[dir], nextPrefix, false);
        });
        
        // ファイルを処理
        files.sort().forEach((file, index) => {
            const isLast = index === files.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            result += prefix + connector + file + '\n';
        });
        
        return result;
    }
    // クリップボードにコピー
    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(outputArea.textContent);
            
            const originalText = copyButton.textContent;
            copyButton.textContent = '✅ コピー完了';
            copyButton.style.background = '#28a745';
            
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.background = '#28a745';
            }, 2000);
            
            showSuccessMessage('クリップボードにコピーしました！');
        } catch (err) {
            console.error('コピーに失敗しました:', err);
            showSuccessMessage('コピーに失敗しました。手動で選択してコピーしてください。');
        }
    }
    // 成功メッセージを表示
    function showSuccessMessage(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
    // クリックでフォルダ選択
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });